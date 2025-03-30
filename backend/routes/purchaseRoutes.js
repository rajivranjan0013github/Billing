import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import { Distributor } from "../models/Distributor.js";
import AccountDetails from "../models/AccountDetails.js";
import { Payment } from "../models/Payment.js";
import { PurchaseReturn } from "../models/PurchaseReturn.js";

const router = express.Router();

// draft purchase bill - create or update
router.post("/draft", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { distributorId, _id } = req.body;
    if (!mongoose.isValidObjectId(distributorId)) {
      throw Error("distributor Id is not valid");
    }

    let newInvoice;
    if (_id) {
      // Update existing draft
      newInvoice = await InvoiceSchema.findById(_id).session(session);
      if (!newInvoice) {
        throw new Error("Draft invoice not found");
      }
      if (newInvoice.status !== "draft") {
        throw new Error("Can only update draft invoices");
      }
      Object.assign(newInvoice, {
        ...req.body,
        createdBy: req.user._id,
        status: "draft"
      });
    } else {
      // Create new draft
      newInvoice = new InvoiceSchema({
        ...req.body,
        createdBy: req.user._id,
        status: "draft",
      });
    }

    await newInvoice.save({ session });

    await session.commitTransaction();
    res.status(201).json(newInvoice);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Error creating/updating draft purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// fetch draft purchase bill
router.get("/draft", verifyToken, async (req, res) => {
  try {
    const draftInvoice = await InvoiceSchema.find({
      status: "draft",
    });
    res.status(200).json(draftInvoice);
  } catch (error) {
    res.status(500).json({ message: "Error fetching draft purchase bill", error: error.message });
  }
});

// delete draft purchase bill
router.delete("/draft/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      throw Error("Invalid invoice ID");
    } 
    await InvoiceSchema.findByIdAndDelete(id);
    res.status(200).json({ message: "Draft purchase bill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting draft purchase bill", error: error.message });
  }
});

// Create new purchase bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {_id,  invoiceType, distributorId, payment, ...details } = req.body;
    if (!mongoose.isValidObjectId(distributorId)) {
      throw Error("distributor Id is not valid");
    }

    // Fetching distributor to update current balance of distributor
    const distributorDetails = await Distributor.findById(distributorId).session(session);

    // Create or update the invoice
    let newInvoice;
    const dueAmount = Number(details.grandTotal) - Number(details.amountPaid);
    if (_id) {
      newInvoice = await InvoiceSchema.findById(_id).session(session);
      if (!newInvoice) {
        throw new Error("Invoice not found");
      }
      Object.assign(newInvoice, {
        ...req.body,
        createdBy: req.user._id,
        mob: distributorDetails.mob,
        paymentStatus: dueAmount > 0 ? "due" : "paid",
        paymentDueDate: dueAmount > 0 ? details.paymentDueDate : null,
      });
    } else {
      newInvoice = new InvoiceSchema({
        ...req.body,
        createdBy: req.user._id,
        createByName : req.user.name,
        mob: distributorDetails.mob,
        paymentStatus: dueAmount > 0 ? "due" : "paid",
        paymentDueDate: dueAmount > 0 ? details.paymentDueDate : null,
      });
    }

    // Handle payment if provided
    if (payment && payment.amount > 0) {
      const paymentNumber = await Payment.getNextPaymentNumber(session);
      // Create payment record
      const paymentDoc = new Payment({
        paymentNumber,
        amount: payment.amount,
        paymentType: "Payment Out",
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.chequeDate || new Date(),
        distributorId: distributorId,
        distributorName: distributorDetails.name,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        bills: [newInvoice._id],
        createdBy: req.user._id,
        createByName : req.user.name,
      });

      // For cheque payments, we don't need to validate account
      if (payment.paymentMethod === "CHEQUE") {
        // Update distributor balance since it's still a payment promise
        distributorDetails.currentBalance = (distributorDetails.currentBalance || 0) - dueAmount;
        await distributorDetails.save({ session });
      } else {
        // For non-cheque payments, validate and update account
        if (!payment.accountId) {
          throw new Error("Account ID is required for non-cheque payments");
        }

        // Validate account exists
        const account = await AccountDetails.findById(payment.accountId).session(session);

        if (!account) {
          throw new Error("Account not found");
        }

        // Update account balance
        account.balance -= payment.amount;
        await account.save({ session });
      }

      await paymentDoc.save({ session });
      newInvoice.payments.push(paymentDoc._id);
    }

    // Update distributor balance
    distributorDetails.currentBalance = (distributorDetails.currentBalance || 0) - dueAmount;
    await distributorDetails.save({ session });

    // Process inventory updates
    for (const product of req.body.products) {
      const { inventoryId, batchNumber, batchId, expiry, quantity, pack, purchaseRate, saleRate, gstPer, HSN, mrp} = product;

      const inventorySchema = await Inventory.findById(inventoryId).session(session);

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
          saleRate : product?.mrp
        });
        
        await newBatch.save({ session });
        inventorySchema.batch.push(newBatch._id);
        
        // Update the batchId in the invoice's products array
        const productIndex = newInvoice.products.findIndex(p => 
          p.inventoryId.toString() === inventoryId.toString() && 
          p.batchNumber === batchNumber
        );
        if (productIndex !== -1) {
          newInvoice.products[productIndex].batchId = newBatch._id;
        }
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
        saleRate,
        pack,
        createdBy: req.user._id,
        createByName : req.user.name,
        distributorName: distributorDetails.name,
        distributorMob: distributorDetails.mob,
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
    res.status(500).json({ message: "Error creating purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Edit purchase invoice
router.post("/edit", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { invoiceType, distributorId, _id, payment, ...details } = req.body;
    
    if (!mongoose.isValidObjectId(distributorId) || !mongoose.isValidObjectId(_id)) {
      throw Error("Invalid distributor ID or invoice ID");
    }

    // Find existing invoice
    const existingInvoice = await InvoiceSchema.findById(_id).session(session);
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }

    if (existingInvoice.status !== "draft" && existingInvoice.status !== "active") {
      throw new Error("Cannot edit invoice in current status");
    }

    // Fetch distributor details
    const distributorDetails = await Distributor.findById(distributorId).session(session);
    if (!distributorDetails) {
      throw new Error("Distributor not found");
    }

    // Calculate due amount
    const dueAmount = Number(details.grandTotal) - Number(details.amountPaid);

    // First, reverse the old inventory quantities
    for (const oldProduct of existingInvoice.products) {
      const inventorySchema = await Inventory.findById(oldProduct.inventoryId).session(session);
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${oldProduct.inventoryId}`);
      }

      const batch = await InventoryBatch.findById(oldProduct.batchId).session(session);
      if (batch) {
        // Reverse the old quantity
        batch.quantity -= oldProduct.quantity;
        await batch.save({ session });
      }

      // Reverse the inventory quantity
      inventorySchema.quantity -= oldProduct.quantity;
      await inventorySchema.save({ session });

      // Record reversal timeline
      const reversalTimeline = new StockTimeline({
        inventoryId: oldProduct.inventoryId,
        invoiceId: _id,
        type: "PURCHASE_EDIT",
        invoiceNumber: existingInvoice.invoiceNumber,
        debit: oldProduct.quantity,
        balance: inventorySchema.quantity,
        batchNumber: oldProduct.batchNumber,
        expiry: oldProduct.expiry,
        mrp: oldProduct.mrp,
        purchaseRate: oldProduct.purchaseRate,
        gstPer: oldProduct.gstPer,
        saleRate: oldProduct.saleRate,
        pack: oldProduct.pack,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: distributorDetails.name,
        distributorMob: distributorDetails.mob,
      });
      await reversalTimeline.save({ session });
    }

    // Update the invoice with new details
    Object.assign(existingInvoice, {
      ...req.body,
      mob: distributorDetails.mob,
      paymentStatus: dueAmount > 0 ? "due" : "paid",
      paymentDueDate: dueAmount > 0 ? details.paymentDueDate : null,
    });

    // Handle new payment if provided
    if (payment && payment.amount > 0) {
      const paymentNumber = await Payment.getNextPaymentNumber(session);
      
      const paymentDoc = new Payment({
        paymentNumber,
        amount: payment.amount,
        paymentType: "Payment Out",
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.chequeDate || new Date(),
        distributorId: distributorId,
        distributorName: distributorDetails.name,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        bills: [existingInvoice._id],
      });

      if (payment.paymentMethod === "CHEQUE") {
        distributorDetails.currentBalance = (distributorDetails.currentBalance || 0) - dueAmount;
        await distributorDetails.save({ session });
      } else {
        if (!payment.accountId) {
          throw new Error("Account ID is required for non-cheque payments");
        }

        const account = await AccountDetails.findById(payment.accountId).session(session);
        if (!account) {
          throw new Error("Account not found");
        }

        account.balance -= payment.amount;
        await account.save({ session });

        distributorDetails.currentBalance = (distributorDetails.currentBalance || 0) - dueAmount;
        await distributorDetails.save({ session });
      }

      await paymentDoc.save({ session });
      existingInvoice.payments.push(paymentDoc._id);
    }

    // Process new inventory updates
    for (const product of req.body.products) {
      const { inventoryId, batchNumber, batchId, expiry, quantity, pack, purchaseRate, saleRate, gstPer, HSN, mrp } = product;

      const inventorySchema = await Inventory.findById(inventoryId).session(session);
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      const batch = await InventoryBatch.findById(batchId).session(session);
      if (batch) {
        Object.assign(batch, { expiry, pack, purchaseRate, gstPer, HSN });
        batch.quantity += quantity;
        await batch.save({ session });
      } else {
        // Create new batch
        const newBatch = new InventoryBatch({
          inventoryId: inventoryId,
          ...product,
        });
        await newBatch.save({ session });
        inventorySchema.batch.push(newBatch._id);

        // Update the batchId in the invoice's products array
        const productIndex = existingInvoice.products.findIndex(p => 
          p.inventoryId.toString() === inventoryId.toString() && 
          p.batchNumber === batchNumber
        );
        if (productIndex !== -1) {
          existingInvoice.products[productIndex].batchId = newBatch._id;
        }
      }

      inventorySchema.quantity += quantity;

      // Record new timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: existingInvoice._id,
        type: "PURCHASE_EDIT",
        invoiceNumber: details.invoiceNumber,
        credit: quantity,
        balance: inventorySchema.quantity,
        batchNumber,
        expiry: expiry,
        mrp,
        purchaseRate,
        gstPer,
        saleRate,
        pack,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: distributorDetails.name,
        distributorMob: distributorDetails.mob,
      });
      await timeline.save({ session });
      await inventorySchema.save({ session });
    }

    // Save the updated invoice
    const updatedInvoice = await existingInvoice.save({ session });

    await session.commitTransaction();
    res.status(200).json(updatedInvoice);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Error updating purchase invoice", error: error.message });
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
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        // Convert start date to beginning of day
        const formattedStartDate = new Date(startDate);
        formattedStartDate.setHours(0, 0, 0, 0);
        query.invoiceDate.$gte = formattedStartDate;
      }
      if (endDate) {
        // Convert end date to end of day
        const formattedEndDate = new Date(endDate);
        formattedEndDate.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = formattedEndDate;
      }
    }

    const bills = await InvoiceSchema.find(query).sort({ createdAt: -1 }).lean();

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
    const bill = await InvoiceSchema.findById(invoiceId).populate("payments");
    res.status(200).json(bill);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching purchase bill", error: error.message });
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
    const { distributorId, invoiceNumber, invoiceDate } = req.body;

    const searchQuery = {
      invoiceType: "PURCHASE",
    };

    if (distributorId) {
      searchQuery.distributorId = distributorId;
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
        distributorName: invoice.distributorName,
        distributorId: invoice.distributorId,
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
    const { returnDate, distributorId, originalInvoice, originalInvoiceNumber, originalInvoiceDate, products, claimGSTInReturn, adjustRateForDisc, billSummary} = req.body;

    if (!mongoose.isValidObjectId(distributorId)) {
      throw Error("distributor Id is not valid");
    }

    // Fetch distributor details
    const distributorDetails = await Distributor.findById(distributorId).session(session);
    if (!distributorDetails) {
      throw new Error("distributor not found");
    }

    const nextDebitNoteNumber = await PurchaseReturn.getNextDebitNoteNumber(session);

    // Create purchase return document
    const purchaseReturn = new PurchaseReturn({
      debitNoteNumber: nextDebitNoteNumber,
      returnDate,
      distributorId,
      distributorName: distributorDetails.name,
      mob: distributorDetails.mob,
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
      const { inventoryId, batchId, quantity, pack, purchaseRate, gstPer, HSN, mrp, batchNumber, expiry} = product;

      // Find inventory and batch
      const inventorySchema = await Inventory.findById(inventoryId).session( session);
      
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
        distributorName: distributorDetails.name,
        distributorMob: distributorDetails.mob,
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

// Delete purchase invoice
router.delete("/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      throw Error("Invalid invoice ID");
    }

    // Find and verify the invoice exists
    const invoice = await InvoiceSchema.findById(id).session(session);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check if invoice has associated purchase returns
    const hasReturns = await PurchaseReturn.exists({ originalInvoice: id });
    if (hasReturns) {
      throw new Error("Cannot delete invoice with associated purchase returns");
    }

    // Reverse inventory quantities for each product
    for (const product of invoice.products) {
      const inventorySchema = await Inventory.findById(product.inventoryId).session(session);
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${product.inventoryId}`);
      }

      const batch = await InventoryBatch.findById(product.batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found: ${product.batchId}`);
      }

      // Reverse the quantities
      batch.quantity -= product.quantity;
      inventorySchema.quantity -= product.quantity;

      // Record reversal timeline
      const timeline = new StockTimeline({
        inventoryId: product.inventoryId,
        invoiceId: id,
        type: "PURCHASE_DELETE",
        invoiceNumber: invoice.invoiceNumber,
        debit: product.quantity,
        balance: inventorySchema.quantity,
        batchNumber: product.batchNumber,
        expiry: product.expiry,
        mrp: product.mrp,
        purchaseRate: product.purchaseRate,
        gstPer: product.gstPer,
        saleRate: product.saleRate,
        pack: product.pack,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: invoice.distributorName,
        distributorMob: invoice.mob,
      });

      await timeline.save({ session });
      await batch.save({ session });
      await inventorySchema.save({ session });
    }

    // Handle associated payments
    if (invoice.payments && invoice.payments.length > 0) {
      // Find all payments before deleting them
      const payments = await Payment.find({ _id: { $in: invoice.payments } }).session(session);
      
      // Process each payment
      for (const payment of payments) {
        // For non-cheque payments, update account balance
        if (payment.paymentMethod !== "CHEQUE" && payment.accountId) {
          const account = await AccountDetails.findById(payment.accountId).session(session);
          if (account) {
            // Add the payment amount back to the account balance
            account.balance += payment.amount;
            await account.save({ session });
          }
        }
      }

      // Delete all associated payments
      await Payment.deleteMany({ _id: { $in: invoice.payments } }).session(session);

      // Update distributor balance
      const distributor = await Distributor.findById(invoice.distributorId).session(session);
      const dueAmount = Number(invoice.grandTotal) - Number(invoice.amountPaid);
      if (distributor) {
        distributor.currentBalance = (distributor.currentBalance || 0) + dueAmount;
        await distributor.save({ session });
      }
    }

    // Finally delete the invoice
    await InvoiceSchema.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Purchase invoice deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Error deleting purchase invoice", error: error.message });
  } finally {
    session.endSession();
  }
});

export default router;
