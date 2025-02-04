import express from "express";
import { PurchaseBill } from "../models/PurchaseBill.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import { Party } from "../models/Party.js";
import AccountDetails from "../models/AccountDetails.js";
import { Payment } from "../models/Payment.js";
import { DebitNoteNumber } from "../models/PurchaseReturn.js";
import { PurchaseReturn } from "../models/PurchaseReturn.js";

const router = express.Router();

// Create new purchase bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceType, partyId, payment, ...details } = req.body;
    if (!mongoose.isValidObjectId(partyId)) {
      throw Error("Party Id is not valid");
    }

    // Fetching party to update current balance of party
    const partyDetails = await Party.findById(partyId).session(session);

    // Create the invoice
    const newInvoice = new InvoiceSchema({
      ...req.body,
      createdBy: req.user._id,
      mob: partyDetails.mob,
    });

    // Handle payment if provided
    if (payment && payment.amount > 0) {
      // Create payment record
      const paymentDoc = new Payment({
        amount: payment.amount,
        payment_type: "Payment Out",
        payment_method: payment.payment_method,
        payment_date: payment.chequeDate || new Date(),
        party_id: partyId,
        partyName: partyDetails.name,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.payment_method === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        bills: [newInvoice._id],
      });

      // For cheque payments, we don't need to validate account
      if (payment.payment_method === "CHEQUE") {
        // Update party balance since it's still a payment promise
        partyDetails.currentBalance =
          (partyDetails.currentBalance || 0) - payment.amount;
        await partyDetails.save({ session });
      } else {
        // For non-cheque payments, validate and update account
        if (!payment.accountId) {
          throw new Error("Account ID is required for non-cheque payments");
        }

        // Validate account exists
        const account = await AccountDetails.findById(
          payment.accountId
        ).session(session);
        if (!account) {
          throw new Error("Account not found");
        }

        // Update account balance
        account.balance -= payment.amount;

        // Add transaction details
        account.transactions.push({
          transactionNumber: payment.transactionNumber,
          amount: payment.amount,
          date: new Date(),
          type: "DEBIT",
          paymentId: paymentDoc._id,
          partyName: partyDetails.name,
          remarks: payment.remarks,
          balance: account.balance,
        });

        await account.save({ session });

        // Update party balance
        partyDetails.currentBalance =
          (partyDetails.currentBalance || 0) - payment.amount;
        await partyDetails.save({ session });
      }

      await paymentDoc.save({ session });
    }

    // Process inventory updates
    for (const product of req.body.products) {
      const {
        inventoryId,
        batchNumber,
        batchId,
        expiry,
        quantity,
        pack,
        purchaseRate,
        ptr,
        gstPer,
        HSN,
        mrp,
      } = product;

      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found : ${inventoryId}`);
      }

      const batch = await InventoryBatch.findById(batchId).session(session);
      if (batch) {
        Object.assign(batch, { expiry, pack, purchaseRate, gstPer, HSN });
        batch.quantity += quantity;
        await batch.save({ session });
      } else {
        // creating new batch
        const newBatch = new InventoryBatch({
          inventoryId: inventoryId,
          ...product,
        });
        await newBatch.save({ session });
        inventorySchema.NewBatchOperation(newBatch);
        inventorySchema.batch.push(newBatch._id);
      }

      inventorySchema.quantity += quantity;

      // recording timelines
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newInvoice._id,
        type: "PURCHASE",
        invoiceNumber: details.invoiceNumber,
        credit: quantity,
        balance: inventorySchema.quantity,
        batchNumber,
        expiry: expiry,
        mrp,
        purchaseRate,
        gstPer,
        ptr,
        pack,
        user: req.user._id,
        userName: req?.user?.name,
        partyName: partyDetails.name,
        partyMob: partyDetails.mob,
      });
      await timeline.save({ session });
      await inventorySchema.save({ session });
    }

    // Save the invoice
    const savedInvoice = await newInvoice.save({ session });

    await session.commitTransaction();
    res.status(201).json(savedInvoice);
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Error creating purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// edit invoice -> do it later
router.post("/edit", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceType, partyId, _id, ...details } = req.body; // _id => invoice id
    if (!mongoose.isValidObjectId(partyId)) {
      throw Error("Party Id is not valid");
    }
    // fetching party to update current balance of party
    const partyDetails = await Party.findById(partyId).session(session);
    const newInvoice = new InvoiceSchema({
      ...req.body,
      createdBy: req.user._id,
    });
    for (const product of req.body.products) {
      const {
        inventoryId,
        batchNumber,
        batchId,
        expiry,
        quantity,
        pack,
        purchaseRate,
        ptr,
        gstPer,
        HSN,
        mrp,
      } = product;
      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found : ${inventoryId}`);
      }
      const batch = await InventoryBatch.findById(batchId).session(session);
      if (batch) {
        Object.assign(batch, { expiry, pack, purchaseRate, gstPer, HSN });
        batch.quantity += quantity;
        await batch.save({ session });
      } else {
        // cteating new batch
        const newBatch = new InventoryBatch({
          inventoryId: inventoryId,
          ...product,
        });
        await newBatch.save({ session });
        inventorySchema.NewBatchOperation(newBatch);
        inventorySchema.batch.push(newBatch._id);
      }
      inventorySchema.quantity += quantity;
      // recording timelines
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newInvoice._id,
        type: "PURCHASE",
        invoiceNumber: details.invoiceNumber,
        credit: quantity,
        balance: inventorySchema.quantity,
        batchNumber,
        expiry: expiry,
        mrp,
        purchaseRate,
        gstPer,
        ptr,
        pack,
        user: req.user._id,
        userName: req?.user?.name,
        partyName: partyDetails.name,
        partyMob: partyDetails.mob,
      });
      await timeline.save({ session });
      await inventorySchema.save({ session });
    }
    const ans = await newInvoice.save({ session });

    await session.commitTransaction();

    res.status(201).json(ans);
  } catch (error) {
    await session.abortTransaction();

    res
      .status(500)
      .json({ message: "Error creating purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all purchase bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      invoiceType: "PURCHASE",
    };

    // Add date range to query if provided
    if (startDate && endDate) {
      query.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const bills = await InvoiceSchema.find(query).sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchase bills",
      error: error.message,
    });
  }
});

// Get single purchase bill by ID
router.get("/invoice/:invoiceId", verifyToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const bill = await InvoiceSchema.findById(invoiceId);
    res.status(200).json(bill);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching purchase bill", error: error.message });
  }
});

// Update this route
router.get("/next-bill-number", verifyToken, async (req, res) => {
  try {
    const lastBill = await PurchaseBill.findOne({
      hospital: req.user.hospital,
    }).sort({ createdAt: -1 });

    const nextCounter = lastBill ? (lastBill.invoice_counter || 0) + 1 : 1;

    res.json({
      success: true,
      nextBillNumber: nextCounter.toString().padStart(6, "0"),
      nextCounter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting next bill number",
      error: error.message,
    });
  }
});

// Add new search route
router.get("/search", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;

    const searchQuery = {
      invoiceType: "PURCHASE",
      invoiceNumber: { $regex: query, $options: "i" },
    };

    // Add date range to query if provided

    const bills = await InvoiceSchema.find(searchQuery).sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    res.status(500).json({
      message: "Error searching purchase bills",
      error: error.message,
    });
  }
});

// Add new search route for purchase returns
router.post("/search-by-invoice", verifyToken, async (req, res) => {
  try {
    const { partyId, invoiceNumber, invoiceDate } = req.body;

    const searchQuery = {
      invoiceType: "PURCHASE",
    };

    if (partyId) {
      searchQuery.partyId = partyId;
    }

    if (invoiceNumber) {
      searchQuery.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }
    if (invoiceDate) {
      searchQuery.invoiceDate = new Date(invoiceDate);
    }

    const invoice = await InvoiceSchema.findOne(searchQuery)
      .populate("products.inventoryId")
      .lean();

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Format the response to match the frontend requirements
    // const formattedProducts = invoice.products.map(product => ({
    //   id: product._id,
    //   itemName: product.inventoryId.name,
    //   batchNo: product.batchNumber,
    //   pack: product.pack,
    //   expiry: product.expiry,
    //   mrp: product.mrp,
    //   qty: product.quantity,
    //   pricePerItem: product.purchaseRate,
    //   effPurRate: product.purchaseRate * (1 - (product.discount || 0) / 100),
    //   gst: product.gstPer,
    //   amount: (product.quantity *( product.purchaseRate * (1 - (product.discount || 0) / 100)) * (1 + product.gstPer / 100)).toFixed(2)
    // }));

    res.json({
      invoiceDetails: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        partyName: invoice.partyName,
        partyId: invoice.partyId,
      },
      products: invoice.products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error searching purchase invoice",
      error: error.message,
    });
  }
});

// Create purchase return
router.post("/return", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      returnDate,
      partyId,
      originalInvoice,
      originalInvoiceNumber,
      originalInvoiceDate,
      products,
      claimGSTInReturn,
      adjustRateForDisc,
      billSummary,
    } = req.body;

    if (!mongoose.isValidObjectId(partyId)) {
      throw Error("Party Id is not valid");
    }

    // Fetch party details
    const partyDetails = await Party.findById(partyId).session(session);
    if (!partyDetails) {
      throw new Error("Party not found");
    }

    // Generate debit note number
    const lastDebitNote = await DebitNoteNumber.findOne().sort({
      debitNoteNumber: -1,
    });
    const nextDebitNoteNumber = lastDebitNote
      ? lastDebitNote.debitNoteNumber + 1
      : 1;
    await new DebitNoteNumber({ debitNoteNumber: nextDebitNoteNumber }).save({
      session,
    });

    // Create purchase return document
    const purchaseReturn = new PurchaseReturn({
      debitNoteNumber: nextDebitNoteNumber.toString().padStart(6, "0"),
      returnDate,
      partyId,
      partyName: partyDetails.name,
      mob: partyDetails.mob,
      originalInvoice,
      originalInvoiceNumber,
      originalInvoiceDate,
      products,
      claimGSTInReturn,
      adjustRateForDisc,
      billSummary,
      createdBy: req.user._id,
    });

    // Process inventory updates for returned items
    for (const product of products) {
      const {
        inventoryId,
        batchId,
        quantity,
        pack,
        purchaseRate,
        gstPer,
        HSN,
        mrp,
        batchNumber,
        expiry,
      } = product;

      // Find inventory and batch
      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      const batch = await InventoryBatch.findById(batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found: ${batchId}`);
      }

      // Update batch quantity
      batch.quantity -= quantity;
      await batch.save({ session });

      // Update inventory quantity
      inventorySchema.quantity -= quantity;
      await inventorySchema.save({ session });

      // Record timeline
      const timeline = new StockTimeline({
        inventoryId,
        type: "PURCHASE_RETURN",
        debitNoteNumber: purchaseReturn.debitNoteNumber,
        debit: quantity,
        balance: inventorySchema.quantity,
        batchNumber,
        expiry,
        mrp,
        purchaseRate,
        gstPer,
        pack,
        user: req.user._id,
        userName: req?.user?.name,
        partyName: partyDetails.name,
        partyMob: partyDetails.mob,
      });
      await timeline.save({ session });
    }

    // Save purchase return
    const savedPurchaseReturn = await purchaseReturn.save({ session });

    await session.commitTransaction();
    res.status(201).json(savedPurchaseReturn);
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({
      message: "Error creating purchase return",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Get next debit note number
router.get("/next-debit-note", verifyToken, async (req, res) => {
  try {
    const lastDebitNote = await DebitNoteNumber.findOne({
      hospital: req.user.hospital,
    }).sort({ debitNoteNumber: -1 });

    const nextNumber = lastDebitNote ? lastDebitNote.debitNoteNumber + 1 : 1;

    res.json({
      success: true,
      nextDebitNoteNumber: nextNumber.toString().padStart(6, "0"),
      nextNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting next debit note number",
      error: error.message,
    });
  }
});

// Get all purchase returns
router.get("/returns", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    // Add date range to query if provided
    if (startDate && endDate) {
      query.returnDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const returns = await PurchaseReturn.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json(returns);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchase returns",
      error: error.message,
    });
  }
});

// Get single purchase return
router.get("/return/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseReturn = await PurchaseReturn.findById(id)
      .populate("createdBy", "name")
      .populate("products.inventoryId");

    if (!purchaseReturn) {
      return res.status(404).json({ message: "Purchase return not found" });
    }

    res.json(purchaseReturn);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchase return",
      error: error.message,
    });
  }
});

export default router;
