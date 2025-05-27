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
import { Ledger } from "../models/ledger.js";

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
        status: "draft",
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
    res.status(500).json({
      message: "Error creating/updating draft purchase bill",
      error: error.message,
    });
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
    res.status(500).json({
      message: "Error fetching draft purchase bill",
      error: error.message,
    });
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
    res
      .status(200)
      .json({ message: "Draft purchase bill deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting draft purchase bill",
      error: error.message,
    });
  }
});

// Create new purchase bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let paymentDoc; // Hoist paymentDoc declaration

  try {
    const { _id, invoiceType, distributorId, payment, ...details } = req.body;
    if (!mongoose.isValidObjectId(distributorId)) {
      throw Error("distributor Id is not valid");
    }
 
    // Fetching distributor to update current balance of distributor
    const distributorDetails = await Distributor.findById(
      distributorId
    ).session(session);

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
        createdByName: req?.user?.name,
        mob: distributorDetails.mob,
        paymentStatus: dueAmount > 0 ? "due" : "paid",
        paymentDueDate: dueAmount > 0 ? details.paymentDueDate : null,
      });
    } else {
      newInvoice = new InvoiceSchema({
        ...req.body,
        createdBy: req.user._id,
        createdByName: req.user.name,
        mob: distributorDetails.mob,
        paymentStatus: dueAmount > 0 ? "due" : "paid",
        paymentDueDate: dueAmount > 0 ? details.paymentDueDate : null,
      });
    }

    // Handle payment if provided
    if (payment && payment.amount > 0) {
      const paymentNumber = await Payment.getNextPaymentNumber(session);
      // Create payment record
      const account = await AccountDetails.findById(payment?.accountId).session(
        session
      );
      if (!account) {
        throw new Error("Account not found");
      }

      // Update account balance and get NEW balance
      account.balance -= payment?.amount || 0;
      await account.save({ session });

      // Create payment record WITH account balance
      paymentDoc = new Payment({
        paymentNumber,
        amount: payment.amount,
        paymentType: "Payment Out",
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.chequeDate || new Date(),
        distributorId: distributorId,
        distributorName: distributorDetails.name,
        accountId: payment.accountId,
        accountBalance: account.balance,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        bills: [newInvoice._id],
        createdBy: req.user._id,
        createByName: req.user.name,
      });

      // For cheque payments, we don't need to validate account
      if (payment?.paymentMethod === "CHEQUE") {
        await paymentDoc.save({ session });
      } else {
        // For non-cheque payments, validate and update account
        if (!payment?.accountId) {
          throw new Error("Account ID is required for non-cheque payments");
        }
        await paymentDoc.save({ session });
      }

      newInvoice.payments.push(paymentDoc._id);
    }

    // Update distributor balance - MOVED HERE after all payment processing
    const previousBalance = distributorDetails.currentBalance || 0;
    distributorDetails.currentBalance =
      previousBalance - (details.grandTotal - (payment?.amount || 0));

    const ledgerEntry = new Ledger({
      distributorId: distributorId,
      balance: distributorDetails.currentBalance,
      debit: payment?.amount || 0,
      credit: details.grandTotal,
      invoiceNumber: newInvoice.invoiceNumber,
      description: "Purchase Bill",
    });
    await ledgerEntry.save({ session });

    // Push all relevant IDs to distributorDetails
    if (newInvoice?._id) {
      distributorDetails.invoices.push(newInvoice._id);
    }
    if (paymentDoc?._id) {
      distributorDetails.payments.push(paymentDoc._id);
    }
    if (ledgerEntry?._id) {
      distributorDetails.ledger.push(ledgerEntry._id);
    }
    await distributorDetails.save({ session });

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
        saleRate,
        gstPer,
        HSN,
        mrp,
        free,
        discount,
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
        batch.quantity += quantity + free;
        await batch.save({ session });
      } else {
        // creating new batch
        const newBatch = new InventoryBatch({
          inventoryId: inventoryId,
          ...product,
          saleRate: mrp,
          quantity: quantity + free,
        });

        await newBatch.save({ session });
        inventorySchema.batch.push(newBatch._id);

        // Update the batchId in the invoice's products array
        const productIndex = newInvoice.products.findIndex(
          (p) =>
            p.inventoryId.toString() === inventoryId.toString() &&
            p.batchNumber === batchNumber
        );
        if (productIndex !== -1) {
          newInvoice.products[productIndex].batchId = newBatch._id;
        }
      }

      inventorySchema.quantity += quantity + free;
      // Add invoice reference to inventory's purchases array
      if (!inventorySchema.purchases.includes(newInvoice._id)) {
        inventorySchema.purchases.push(newInvoice._id);
      }

      // Update HSN if provided
      if (HSN) {
        inventorySchema.HSN = HSN;
      }

      // Record timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newInvoice._id,
        type: "PURCHASE",
        invoiceNumber: details.invoiceNumber,
        credit: quantity + free,
        balance: inventorySchema.quantity,
        batchNumber,
        pack,
        createdBy: req.user._id,
        createdByName: req.user.name,
        name: distributorDetails ? distributorDetails.name : "N/A",
        mob: distributorDetails ? distributorDetails.mob : "N/A",
      });
      await timeline.save({ session });

      // Store timeline reference in product and inventory
      const productIndex = newInvoice.products.findIndex(
        (p) =>
          p.inventoryId.toString() === inventoryId.toString() &&
          p.batchNumber === batchNumber
      );
      if (productIndex !== -1) {
        newInvoice.products[productIndex].timeline = timeline._id;
      }
      inventorySchema.timeline.push(timeline._id);
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

// Edit purchase invoice
router.post("/edit", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let paymentDoc; // Hoist paymentDoc declaration

  try {
    const { invoiceType, distributorId, _id, payment, ...details } = req.body;

    if (
      !mongoose.isValidObjectId(distributorId) ||
      !mongoose.isValidObjectId(_id)
    ) {
      throw Error("Invalid distributor ID or invoice ID");
    }

    // Find existing invoice
    const existingInvoice = await InvoiceSchema.findById(_id).session(session);
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }

    if (
      existingInvoice.status !== "draft" &&
      existingInvoice.status !== "active"
    ) {
      throw new Error("Cannot edit invoice in current status");
    }

    // Fetch distributor details
    const distributorDetails = await Distributor.findById(
      distributorId
    ).session(session);
    if (!distributorDetails) {
      throw new Error("Distributor not found");
    }

    // Calculate due amount
    const dueAmount = Number(details.grandTotal) - Number(details.amountPaid);

    // First, reverse the old inventory quantities
    for (const oldProduct of existingInvoice.products) {
      const inventorySchema = await Inventory.findById(
        oldProduct.inventoryId
      ).session(session);
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${oldProduct.inventoryId}`);
      }

      const batch = await InventoryBatch.findById(oldProduct.batchId).session(
        session
      );
      if (batch) {
        // Reverse the old quantity
        batch.quantity -= oldProduct.quantity + (oldProduct.free || 0);
        await batch.save({ session });
      }

      // Reverse the inventory quantity
      inventorySchema.quantity -= oldProduct.quantity + (oldProduct.free || 0);

      // Record reversal timeline (reverse the old purchase)
      const reversalTimeline = new StockTimeline({
        inventoryId: oldProduct.inventoryId,
        invoiceId: _id,
        type: "PURCHASE_EDIT",
        invoiceNumber: existingInvoice.invoiceNumber,
        debit: oldProduct.quantity + (oldProduct.free || 0),
        balance: inventorySchema.quantity,
        batchNumber: oldProduct.batchNumber,
        pack: oldProduct.pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: distributorDetails.name,
        mob: distributorDetails.mob,
        remarks: "Reversal of original purchase for edit",
      });
      await reversalTimeline.save({ session });
      inventorySchema.timeline.push(reversalTimeline._id);
      await inventorySchema.save({ session });

      // Store reversal timeline in the old product
      oldProduct.timeline = reversalTimeline._id;

      // Recalculate timeline balances starting from this reversal
    }

    // Process new inventory updates
    for (const product of req.body.products) {
      const {
        inventoryId,
        batchNumber,
        batchId,
        expiry,
        quantity,
        free,
        pack,
        purchaseRate,
        saleRate,
        gstPer,
        HSN,
        mrp,
      } = product;

      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      let batch = await InventoryBatch.findById(batchId).session(session);
      if (batch) {
        // Update existing batch
        Object.assign(batch, { expiry, pack, purchaseRate, gstPer, HSN });
        batch.quantity += quantity + (free || 0);
        await batch.save({ session });
      } else {
        // Create new batch if not found
        batch = new InventoryBatch({
          inventoryId: inventoryId,
          ...product,
          quantity: quantity + (free || 0),
        });
        await batch.save({ session });
        inventorySchema.batch.push(batch._id);

        // Update the batchId in the product
        product.batchId = batch._id;
      }

      // Update inventory quantity
      inventorySchema.quantity += quantity + (free || 0);

      // Update HSN if provided
      if (HSN) {
        inventorySchema.HSN = HSN;
      }

      // Add invoice reference to inventory's purchases array if not already present
      if (!inventorySchema.purchases.includes(existingInvoice._id)) {
        inventorySchema.purchases.push(existingInvoice._id);
      }

      // Create new timeline entry
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: existingInvoice._id,
        type: "PURCHASE_EDIT",
        invoiceNumber: details.invoiceNumber,
        credit: quantity + (free || 0),
        balance: inventorySchema.quantity,
        batchNumber,
        pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: distributorDetails.name,
        mob: distributorDetails.mob,
        remarks: "New purchase entry after edit",
      });
      await timeline.save({ session });
      inventorySchema.timeline.push(timeline._id);
      await inventorySchema.save({ session });

      // Store timeline reference in the product
      product.timeline = timeline._id;
      // Recalculate timeline balances after this new entry
      // await Inventory.recalculateTimelineBalancesAfter(
      //   inventoryId,
      //   timeline.createdAt,
      //   session
      // );
    }

    // Update the invoice with new details
    Object.assign(existingInvoice, {
      ...req.body,
      mob: distributorDetails.mob,
      paymentStatus: dueAmount > 0 ? "due" : "paid",
      paymentDueDate: dueAmount > 0 ? details.paymentDueDate : null,
    });

    // Handle new payment if provided
    let distributorNeedsSave = false;
    if (payment && payment.amount > 0) {
      const paymentNumber = await Payment.getNextPaymentNumber(session);

      const account = await AccountDetails.findById(payment?.accountId).session(
        session
      );
      if (!account) {
        throw new Error("Account not found");
      }

      // Update account balance and get NEW balance
      account.balance -= payment?.amount || 0;
      await account.save({ session });

      // Create payment record WITH account balance
      paymentDoc = new Payment({
        paymentNumber,
        amount: payment.amount,
        paymentType: "Payment Out",
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.chequeDate || new Date(),
        distributorId: distributorId,
        distributorName: distributorDetails.name,
        accountId: payment.accountId,
        accountBalance: account.balance,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        bills: [existingInvoice._id],
      });

      await paymentDoc.save({ session });
      existingInvoice.payments.push(paymentDoc._id);

      if (paymentDoc?._id) {
        distributorDetails.payments.push(paymentDoc._id);
        distributorNeedsSave = true;
      }

      // Original logic for distributor balance update
      if (payment.paymentMethod === "CHEQUE") {
        distributorDetails.currentBalance =
          (distributorDetails.currentBalance || 0) - dueAmount; // Note: dueAmount from invoice, not payment.amount. Review if this is intended.
        distributorNeedsSave = true;
      } else {
        if (!payment.accountId) {
          throw new Error("Account ID is required for non-cheque payments");
        }
        distributorDetails.currentBalance =
          (distributorDetails.currentBalance || 0) - dueAmount; // Note: dueAmount
        distributorNeedsSave = true;
      }
    }

    if (distributorNeedsSave) {
      await distributorDetails.save({ session });
    }

    // Save the updated invoice
    const updatedInvoice = await existingInvoice.save({ session });

    await session.commitTransaction();
    res.status(200).json(updatedInvoice);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Error updating purchase invoice",
      error: error.message,
    });
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
      query.createdAt = {};
      if (startDate) {
        // Convert start date to beginning of day
        const formattedStartDate = new Date(startDate);
        formattedStartDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = formattedStartDate;
      }
      if (endDate) {
        // Convert end date to end of day
        const formattedEndDate = new Date(endDate);
        formattedEndDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = formattedEndDate;
      }
    }

    const bills = await InvoiceSchema.find(query)
      .sort({ createdAt: -1 })
      .lean();

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
    const { query, searchType } = req.query;

    const searchQuery = {
      invoiceType: "PURCHASE",
      $or: [
        { invoiceNumber: { $regex: query, $options: "i" } },
        { distributorName: { $regex: query, $options: "i" } },
      ],
    };

    // If searchType is specified, narrow down the search
    if (searchType === "invoice") {
      delete searchQuery.$or;
      searchQuery.invoiceNumber = { $regex: query, $options: "i" };
    } else if (searchType === "distributor") {
      delete searchQuery.$or;
      searchQuery.distributorName = { $regex: query, $options: "i" };
    }

    const bills = await InvoiceSchema.find(searchQuery)
      .sort({ createdAt: -1 })
      .lean();

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
  let refundPayment; // Hoist refundPayment

  try {
    const {
      returnDate,
      distributorId,
      originalInvoice,
      originalInvoiceNumber,
      originalInvoiceDate,
      products,
      claimGSTInReturn,
      adjustRateForDisc,
      billSummary,
      refundDetails,
    } = req.body;

    let distributorDetails = null;

    if (distributorId) {
      if (!mongoose.isValidObjectId(distributorId)) {
        throw Error("Provided distributor Id is not valid");
      }
      distributorDetails = await Distributor.findById(distributorId).session(
        session
      );
      if (!distributorDetails) {
        throw new Error("Distributor not found with the provided ID");
      }
    }

    const nextDebitNoteNumber = await PurchaseReturn.getNextDebitNoteNumber(
      session
    );

    // Create purchase return document
    const purchaseReturn = new PurchaseReturn({
      debitNoteNumber: nextDebitNoteNumber,
      returnDate,
      distributorId: distributorDetails ? distributorDetails._id : null,
      distributorName: distributorDetails ? distributorDetails.name : "N/A",
      mob: distributorDetails ? distributorDetails.mob : "N/A",
      originalInvoice,
      originalInvoiceNumber,
      originalInvoiceDate,
      products,
      claimGSTInReturn,
      adjustRateForDisc,
      billSummary,
      createdBy: req.user._id,
      createdByName: req.user.name,
      payments: [],
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
        invoiceNumber: purchaseReturn.debitNoteNumber,
        debit: quantity,
        balance: inventorySchema.quantity,
        batchNumber,
        pack,
        createdBy: req.user._id,
        createdByName: req.user.name,
        name: distributorDetails ? distributorDetails.name : "N/A",
        mob: distributorDetails ? distributorDetails.mob : "N/A",
      });
      await timeline.save({ session });
      inventorySchema.timeline.push(timeline._id);
      await inventorySchema.save({ session });
    }

    // Handle Distributor Balance & Ledger for the return value itself

    // Handle Refund (Payment In from Distributor or Unspecified Source)
    if (refundDetails && refundDetails.amount > 0) {
      const refundAmount = Number(refundDetails.amount);

      // Pharmacy's account update (always happens if refund details are valid)
      if (refundDetails.method !== "CHEQUE") {
        if (!refundDetails.accountId) {
          throw new Error(
            "Account ID is required for non-cheque refunds to update pharmacy balance."
          );
        }
        const account = await AccountDetails.findById(
          refundDetails.accountId
        ).session(session);
        if (!account) {
          throw new Error("Refund account (pharmacy's) not found.");
        }
        account.balance += refundAmount;
        await account.save({ session });
      }

      const paymentNumber = await Payment.getNextPaymentNumber(session);
      refundPayment = new Payment({
        paymentNumber,
        amount: refundAmount,
        paymentType: "Payment In",
        paymentMethod: refundDetails.method,
        paymentDate: refundDetails.chequeDetails?.date || returnDate,
        distributorId: distributorDetails ? distributorDetails._id : null,
        distributorName: distributorDetails
          ? distributorDetails.name
          : "N/A - Unspecified Source",
        accountId: refundDetails.accountId,
        transactionNumber: refundDetails.transactionNumber,
        chequeNumber: refundDetails.chequeDetails?.number,
        chequeDate: refundDetails.chequeDetails?.date,
        status: refundDetails.method === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks:
          refundDetails.remarks ||
          `Refund for PR ${purchaseReturn.debitNoteNumber}`,
        createdBy: req.user._id,
        createdByName: req.user.name,
      });

      await refundPayment.save({ session });
      purchaseReturn.payments.push(refundPayment._id);

      // Update distributor balance and create ledger entry for refund
      if (distributorDetails) {
        distributorDetails.currentBalance -= refundAmount;
        distributorDetails.payments.push(refundPayment._id);

        const ledgerEntryForRefund = new Ledger({
          distributorId: distributorDetails._id,
          balance: distributorDetails.currentBalance,
          debit: 0,
          credit: refundAmount,
          invoiceNumber: refundPayment.paymentNumber,
          description: `Refund payment for Debit Note ${purchaseReturn.debitNoteNumber}`,
        });
        await ledgerEntryForRefund.save({ session });
        distributorDetails.ledger.push(ledgerEntryForRefund._id);
        await distributorDetails.save({ session });
      }
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

// Get all purchase returns
router.get("/returns", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    // Add date range to query if provided
    if (startDate && endDate) {
      query.returnDate = {
        // Set start date to beginning of day (00:00:00)
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        // Set end date to end of day (23:59:59.999)
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
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
    const purchaseReturn = await PurchaseReturn.findById(id).populate(
      "createdBy",
      "name"
    );

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
      const inventorySchema = await Inventory.findById(
        product.inventoryId
      ).session(session);
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${product.inventoryId}`);
      }

      const batch = await InventoryBatch.findById(product.batchId).session(
        session
      );
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
        pack: product.pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: invoice.distributorName,
        mob: invoice.mob,
      });

      // Remove invoice reference from inventory's purchases array
      inventorySchema.purchases = inventorySchema.purchases.filter(
        (purchaseId) => purchaseId.toString() !== id.toString()
      );

      await timeline.save({ session });
      inventorySchema.timeline.push(timeline._id);
      await batch.save({ session });
      await inventorySchema.save({ session });
    }

    // Handle associated payments
    if (invoice.payments && invoice.payments.length > 0) {
      // Find all payments before deleting them
      const payments = await Payment.find({
        _id: { $in: invoice.payments },
      }).session(session);

       // Update distributor balance
       const distributor = await Distributor.findById(
        invoice.distributorId
      ).session(session);

      // Process each payment
      for (const payment of payments) {
        // For non-cheque payments, update account balance
        if (payment.paymentMethod !== "CHEQUE" && payment.accountId) {
          const account = await AccountDetails.findById(
            payment.accountId
          ).session(session);
          if (account) {
            // Add the payment amount back to the account balance
            account.balance += payment.amount;
            await account.save({ session });
          }
        }
        if (distributor) {
          // Ensure distributor exists before pulling
          distributor.payments.pull(payment._id); // Remove payment ID from distributor
        }
      }

      // Delete all associated payments
      await Payment.deleteMany({ _id: { $in: invoice.payments } }).session(
        session
      );

     
      if (distributor) {
        const previousBalance = distributor.currentBalance || 0;
        const dueAmount =
          Number(invoice.grandTotal) - Number(invoice.amountPaid);
        distributor.currentBalance = previousBalance + dueAmount;
      }

      // Add a ledger entry for the deletion
      const ledgerEntryForDeletion = new Ledger({
        distributorId: distributor._id,
        balance: distributor.currentBalance,
        debit: invoice.grandTotal,
        credit: invoice.amountPaid,
        invoiceNumber: invoice.invoiceNumber,
        description: `Purchase invoice ${invoice.invoiceNumber} deleted`,
      });
      await ledgerEntryForDeletion.save({ session });
    } else {
      // Case where there were no payments, but invoice is deleted
      const distributor = await Distributor.findById(
        invoice.distributorId
      ).session(session);
      if (distributor) {
        const previousBalance = distributor.currentBalance || 0;
        distributor.currentBalance =
          previousBalance + Number(invoice.grandTotal);
        const ledgerEntryForDeletion = new Ledger({
          distributorId: distributor._id,
          balance: distributor.currentBalance,
          debit: invoice.grandTotal,
          credit: 0,
          invoiceNumber: invoice.invoiceNumber,
          description: `Purchase invoice ${invoice.invoiceNumber} deleted (no prior payments)`,
        });
        await ledgerEntryForDeletion.save({ session });
      }
    }

    const distributorToSave = await Distributor.findById(
      invoice.distributorId
    ).session(session);
    if (distributorToSave) {
      distributorToSave.invoices.pull(invoice._id);

      // Find the ledger entry for deletion that was just created
      // This assumes invoiceNumber and description make it unique enough for this context
      const deletionLedgerCriteria = {
        invoiceNumber: invoice.invoiceNumber,
        description: { $regex: `${invoice.invoiceNumber} deleted` },
      };
      const ledgerEntryForDeletionJustSaved = await Ledger.findOne(
        deletionLedgerCriteria
      ).session(session);

      if (ledgerEntryForDeletionJustSaved?._id) {
        distributorToSave.ledger.push(ledgerEntryForDeletionJustSaved._id);
      }

      await distributorToSave.save({ session });
    }

    // Finally delete the invoice
    await InvoiceSchema.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Purchase invoice deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Error deleting purchase invoice",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Get purchase history for an inventory item
router.get("/inventory/:inventoryId", verifyToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Validate inventory ID
    if (!mongoose.isValidObjectId(inventoryId)) {
      throw new Error("Invalid inventory ID");
    }

    // Find inventory and populate purchase details
    const inventory = await Inventory.findById(inventoryId).populate({
      path: "purchases",
      match: {
        invoiceType: "PURCHASE", // Only get purchase invoices
        status: { $ne: "draft" }, // Exclude draft invoices
      },
      options: {
        sort: { createdAt: -1 },
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
      // Populate only necessary fields
      select: "invoiceNumber distributorName mob createdAt products",
      populate: {
        path: "products",
        match: { inventoryId: inventoryId },
        select:
          "inventoryId batchNumber expiry mrp purchaseRate gstPer discount quantity free pack batchId",
      },
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    // Get total count from the purchases array
    const totalPurchases = inventory.purchases.length;
    const totalPages = Math.ceil(totalPurchases / limit);

    // Format the response data
    const purchaseHistory = inventory.purchases
      .map((purchase) => {
        // const product = purchase.products[0]; // Since we filtered for specific inventory
        const product = purchase.products.find(p => p.inventoryId && p.inventoryId.toString() === inventoryId.toString());
        if (!product) return null;

        // Calculate the total quantity including free items
        const totalQuantity = (product.quantity || 0) + (product.free || 0);
        
        // Calculate net purchase rate (after GST and discount)
        const baseRate = product.purchaseRate || 0;
        const discount = product.discount || 0;
        const gstPer = product.gstPer || 0;
        const discountedRate = baseRate * (1 - discount / 100);
        const netPurchaseRate = discountedRate * (1 + gstPer / 100);

        return {
          _id: purchase._id,
          createdAt: purchase.createdAt,
          invoiceId: purchase._id,
          invoiceNumber: purchase.invoiceNumber,
          distributorName: purchase.distributorName,
          distributorMob: purchase.mob,
          batchNumber: product.batchNumber,
          batchId: product.batchId,
          expiry: product.expiry,
          mrp: product.mrp,
          purchaseRate: baseRate,
          gstPer: gstPer,
          discount: discount,
          netPurchaseRate: netPurchaseRate,
          credit: totalQuantity, // Total quantity including free items
          pack: product.pack,
          margin: product.mrp
            ? ((product.mrp - netPurchaseRate) / product.mrp) * 100
            : 0,
        };
      })
      .filter(Boolean); // Remove null entries

    res.status(200).json({
      purchases: purchaseHistory,
      totalPages,
      currentPage: parseInt(page),
      totalPurchases,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching purchase history",
      error: error.message,
    });
  }
});

export default router;
