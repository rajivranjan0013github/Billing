import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import { SalesBill } from "../models/SalesBill.js";
import { Distributor } from "../models/Distributor.js";
import { Customer } from "../models/Customer.js";
import AccountDetails from "../models/AccountDetails.js";
import { Payment } from "../models/Payment.js";
import { Ledger } from "../models/ledger.js";

const router = express.Router();

router.get("/invoice-number", verifyToken, async (req, res) => {
  const invoiceNumber = await SalesBill.getCurrentInvoiceNumber();
  res.json({ invoiceNumber });
});

// Create new sell bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payment, ...details } = req.body;
    let customerDetails = null;

    // If not a cash customer, validate and fetch distributor details
    if (!details.is_cash_customer) {
      if (!mongoose.isValidObjectId(details.customerId)) {
        throw Error("Customer Id is not valid");
      }
      customerDetails = await Customer.findById(details.customerId).session(
        session
      );
      if (!customerDetails) {
        throw Error("Customer not found");
      }
    }

    // Get next invoice number
    const invoiceNumber = await SalesBill.getNextInvoiceNumber(session);

    // Create the sales bill
    const newSalesBill = new SalesBill({
      ...details,
      invoiceNumber,
      createdBy: req?.user._id,
      createdByName: req?.user?.name,
      mob: customerDetails?.mob || "",
      address: customerDetails?.address,
    });

    if (customerDetails) {
      customerDetails.invoices.push(newSalesBill._id);
    }

    // Handle payment if provided
    if (payment && payment.amount !== 0) {
      // Create payment record
      const paymentNumber = await Payment.getNextPaymentNumber(session);
      const paymentDoc = new Payment({
        amount: payment.amount,
        paymentNumber,
        paymentType: payment?.amount > 0 ? "Payment In" : "Payment Out",
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.chequeDate || new Date(),
        customerId: details.customerId,
        customerName: details.customerName,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        salesBills: [newSalesBill._id],
        createdBy: req?.user._id,
        createdByName: req?.user?.name,
      });

      // For cheque payments, we don't need to validate account
      if (payment.paymentMethod === "CHEQUE") {
        // No balance update here - will be done at the end
        if (customerDetails) {
          customerDetails.payments.push(paymentDoc._id);
        }
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
        account.balance += payment.amount;
        paymentDoc.accountBalance = account.balance;
        await account.save({ session });

        // Update customer payments array if not cash customer
        if (customerDetails) {
          customerDetails.payments.push(paymentDoc._id);
        }
      }

      await paymentDoc.save({ session });
      newSalesBill.payments.push(paymentDoc._id);
    }
    // Process inventory updates
    for (const product of details.products) {
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
        types,
      } = product;

      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );

      if (!inventorySchema) {
        throw new Error(`Inventory not found : ${inventoryId}`);
      }

      const batch = await InventoryBatch.findById(batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found : ${batchId}`);
      }

      // Record timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newSalesBill._id,
        type: types === "return" ? "SALE_RETURN" : "SALE",
        invoiceNumber: invoiceNumber,
        expiry: expiry,
        batchNumber,
        mrp,
        purchaseRate,
        saleRate,
        gstPer,
        pack,
        createdBy: req?.user._id,
        createdByName: req?.user?.name,
        customerName: details.customerName,
        customerMob: details.mob || "",
      });

      // Update batch & inventory quantity
      if (types === "return") {
        batch.quantity += quantity;
        inventorySchema.quantity += quantity;
        timeline.credit = quantity;
      } else {
        inventorySchema.quantity -= quantity;
        batch.quantity -= quantity;
        timeline.debit = quantity;
      }
      timeline.balance = inventorySchema.quantity;
      await batch.save({ session });
      await timeline.save({ session });

      // Add sales bill reference to inventory's sales array
      if (!inventorySchema.sales.includes(newSalesBill._id)) {
        inventorySchema.sales.push(newSalesBill._id);
      }

      // Store timeline reference in product and inventory
      const productIndex = newSalesBill.products.findIndex(
        (p) =>
          p.inventoryId.toString() === inventoryId.toString() &&
          p.batchNumber === batchNumber
      );
      if (productIndex !== -1) {
        newSalesBill.products[productIndex].timeline = timeline._id;
      }
      inventorySchema.timeline.push(timeline._id);
      await inventorySchema.save({ session });

      // Recalculate timeline balances after this new entry
      await Inventory.recalculateTimelineBalancesAfter(
        inventoryId,
        timeline.createdAt,
        session
      );
    }

    // Save the sales bill
    const savedSalesBill = await newSalesBill.save({ session });

    if (customerDetails) {
      const previousBalance = customerDetails.currentBalance || 0;
      // For sales: balance increases by grand total and decreases by payment
      customerDetails.currentBalance =
        previousBalance + details.grandTotal - (payment?.amount || 0);

      const ledgerEntry = new Ledger({
        customerId: customerDetails._id,
        balance: customerDetails.currentBalance,
        credit: payment?.amount || 0, // Payment received reduces balance
        debit: details.grandTotal, // Sales amount increases balance
        invoiceNumber: newSalesBill.invoiceNumber,
        description: "Sales Bill",
      });
      await ledgerEntry.save({ session });
      if (ledgerEntry?._id) {
        customerDetails.ledger.push(ledgerEntry._id);
      }
      await customerDetails.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(savedSalesBill);
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Error creating sales bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all sell bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      invoiceDate: {},
    };

    if (startDate) {
      query.invoiceDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.invoiceDate.$lte = new Date(endDate);
    }

    const bills = await SalesBill.find(query).sort({
      createdAt: -1,
    });

    res.json(bills);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching sell bills", error: error.message });
  }
});

// Get single sell bill by ID
router.get("/invoice/:invoiceId", verifyToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const bill = await SalesBill.findById(invoiceId).populate("payments");
    if (!bill) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(bill);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching sell bill", error: error.message });
  }
});

// Get next bill number
router.get("/next-bill-number", verifyToken, async (req, res) => {
  try {
    const lastBill = await InvoiceSchema.findOne({
      hospital: req.user.hospital,
      invoiceType: "sales",
    }).sort({ createdAt: -1 });

    const nextCounter = lastBill
      ? (parseInt(lastBill.invoiceNumber) || 0) + 1
      : 1;

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

// Edit existing sell bill
router.post("/invoice/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { payment, ...details } = req.body;
    let customerDetails = null;

    // Find existing invoice
    const existingInvoice = await SalesBill.findById(id).session(session);
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }

    // If not a cash customer, validate and fetch customer details
    if (!details.is_cash_customer) {
      if (!mongoose.isValidObjectId(details.customerId)) {
        throw Error("Customer Id is not valid");
      }
      customerDetails = await Customer.findById(details.customerId).session(
        session
      );
      if (!customerDetails) {
        throw Error("Customer not found");
      }
    }

    // First, reverse the old inventory changes
    for (const oldProduct of existingInvoice.products) {
      const { inventoryId, batchId, quantity, pack, types } = oldProduct;

      // Find inventory and batch
      const inventory = await Inventory.findById(inventoryId).session(session);
      const batch = await InventoryBatch.findById(batchId).session(session);

      if (!inventory || !batch) {
        throw new Error(
          `Original inventory or batch not found for product ${oldProduct.productName}`
        );
      }

      // Restore quantities based on sale or return type
      if (types === "return") {
        inventory.quantity -= quantity;
        batch.quantity -= quantity;
      } else {
        inventory.quantity += quantity;
        batch.quantity += quantity;
      }

      // Create reversal timeline entry
      const reversalTimeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: existingInvoice._id,
        type: "SALE_EDIT",
        invoiceNumber: existingInvoice.invoiceNumber,
        credit: types === "return" ? 0 : quantity,
        debit: types === "return" ? quantity : 0,
        balance: inventory.quantity,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: oldProduct.mrp,
        purchaseRate: oldProduct.purchaseRate,
        gstPer: oldProduct.gstPer,
        saleRate: oldProduct.saleRate,
        pack: oldProduct.pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        customerName: details.customerName,
        customerMob: customerDetails?.mob || "",
        remarks: "Reversal of old quantity during edit",
      });
      await reversalTimeline.save({ session });

      // Store reversal timeline in the old product
      oldProduct.timeline = reversalTimeline._id;

      inventory.timeline.push(reversalTimeline._id);
      await inventory.save({ session });
      await batch.save({ session });

      // Recalculate timeline balances after this reversal
      await Inventory.recalculateTimelineBalancesAfter(
        inventoryId,
        reversalTimeline.createdAt,
        session
      );
    }

    // Now process the new products
    for (const product of details.products) {
      const { inventoryId, batchId, quantity, pack, types } = product;

      // Find inventory and validate
      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      // Find batch and validate
      const batch = await InventoryBatch.findById(batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found: ${batchId}`);
      }

      // Check if sufficient stock exists for sales
      if (types !== "return" && batch.quantity < quantity) {
        throw new Error(
          `Insufficient stock for ${inventorySchema.name} in batch ${product.batchNumber}`
        );
      }

      // Update quantities based on sale or return type
      if (types === "return") {
        batch.quantity += quantity;
        inventorySchema.quantity += quantity;
      } else {
        batch.quantity -= quantity;
        inventorySchema.quantity -= quantity;
      }

      // Record new timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: existingInvoice._id,
        type: "SALE_EDIT",
        invoiceNumber: details.invoiceNumber,
        credit: types === "return" ? quantity : 0,
        debit: types === "return" ? 0 : quantity,
        balance: inventorySchema.quantity,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: batch.mrp,
        purchaseRate: batch.purchaseRate,
        gstPer: batch.gstPer,
        saleRate: batch.saleRate,
        pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        customerName: details.customerName,
        customerMob: customerDetails?.mob || "",
        remarks: "New quantity after edit",
      });
      await timeline.save({ session });

      // Store timeline reference in the product
      product.timeline = timeline._id;

      inventorySchema.timeline.push(timeline._id);
      await batch.save({ session });
      await inventorySchema.save({ session });

      // Recalculate timeline balances after this new entry
      await Inventory.recalculateTimelineBalancesAfter(
        inventoryId,
        timeline.createdAt,
        session
      );

      // Add sales bill reference to inventory's sales array if not already present
      if (!inventorySchema.sales.includes(existingInvoice._id)) {
        inventorySchema.sales.push(existingInvoice._id);
      }
    }

    // Update the existing invoice with new details
    Object.assign(existingInvoice, {
      ...details,
      mob: customerDetails?.mob || "",
      address: customerDetails?.address,
      createdBy: req.user._id,
      createdByName: req?.user?.name,
    });

    // Handle payment if provided
    if (payment && payment.amount !== 0) {
      // Create payment record
      const paymentNumber = await Payment.getNextPaymentNumber(session);
      const paymentDoc = new Payment({
        amount: payment.amount,
        paymentNumber,
        paymentType: payment?.amount > 0 ? "Payment In" : "Payment Out",
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.chequeDate || new Date(),
        customerId: details.customerId,
        customerName: details.customerName,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        salesBills: [existingInvoice._id],
        createdBy: req?.user._id,
        createdByName: req?.user?.name,
      });

      // For cheque payments, we don't need to validate account
      if (payment.paymentMethod === "CHEQUE") {
        // No balance update here - will be done at the end
        if (customerDetails) {
          customerDetails.payments.push(paymentDoc._id);
        }
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
        account.balance += payment.amount;
        paymentDoc.accountBalance = account.balance;
        await account.save({ session });

        // Update customer payments array if not cash customer
        if (customerDetails) {
          customerDetails.payments.push(paymentDoc._id);
        }
      }

      await paymentDoc.save({ session });
      existingInvoice.payments.push(paymentDoc._id);
    } else {
      if (customerDetails) {
        customerDetails.currentBalance =
          (customerDetails.currentBalance || 0) + (details.grandTotal || 0);
      }
    }

    // Save customer changes if any
    if (customerDetails) {
      if (!customerDetails.invoices.includes(existingInvoice._id)) {
        customerDetails.invoices.push(existingInvoice._id);
      }

      const previousBalance = customerDetails.currentBalance || 0;
      // For edited sales: balance calculation follows same principle
      customerDetails.currentBalance =
        previousBalance + details.grandTotal - (payment?.amount || 0);

      const ledgerEntry = new Ledger({
        customerId: customerDetails._id,
        balance: customerDetails.currentBalance,
        credit: payment?.amount || 0, // New payment received
        debit: details.grandTotal, // New sales amount
        invoiceNumber: existingInvoice.invoiceNumber,
        description: "Sales Bill Edit",
      });
      await ledgerEntry.save({ session });
      if (ledgerEntry?._id) {
        customerDetails.ledger.push(ledgerEntry._id);
      }
      await customerDetails.save({ session });
    }

    // Save the updated invoice
    const updatedInvoice = await existingInvoice.save({ session });

    await session.commitTransaction();
    res.status(200).json(updatedInvoice);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in edit sale invoice:", error);
    res.status(500).json({
      message: "Error updating sell bill",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Delete sale invoice
router.delete("/invoice/:id", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Find the invoice
    const invoice = await SalesBill.findById(id).session(session);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Reverse inventory changes
    for (const product of invoice.products) {
      const { inventoryId, batchId, quantity, pack } = product;

      // Find inventory and batch
      const inventory = await Inventory.findById(inventoryId).session(session);
      const batch = await InventoryBatch.findById(batchId).session(session);

      if (!inventory || !batch) {
        throw new Error(
          `Inventory or batch not found for product ${product.productName}`
        );
      }

      // Restore quantities
      inventory.quantity += quantity;
      batch.quantity += quantity;

      await inventory.save({ session });
      await batch.save({ session });

      // Record deletion in timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: invoice._id,
        type: "SALE_DELETE",
        pack,
        invoiceNumber: invoice.invoiceNumber,
        credit: quantity,
        balance: inventory.quantity,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: batch.mrp,
        purchaseRate: batch.purchaseRate,
        gstPer: batch.gstPer,
        saleRate: batch.saleRate,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: invoice.distributorName,
      });

      // Remove sales bill reference from inventory's sales array
      inventory.sales = inventory.sales.filter(
        (saleId) => saleId.toString() !== id.toString()
      );

      await timeline.save({ session });
    }

    // Delete the invoice
    await SalesBill.findByIdAndDelete(id).session(session);

    // Add ledger entry for deletion
    if (!invoice.is_cash_customer && invoice.customerId) {
      const customerDetails = await Customer.findById(
        invoice.customerId
      ).session(session);
      if (customerDetails) {
        // Remove invoice ID from customer invoices array
        customerDetails.invoices.pull(invoice._id);

        const previousBalance = customerDetails.currentBalance || 0;
        // For deletion: reverse the original sale's effect on balance
        customerDetails.currentBalance =
          previousBalance - (invoice.grandTotal - (invoice.amountPaid || 0));

        const ledgerEntry = new Ledger({
          customerId: customerDetails._id,
          balance: customerDetails.currentBalance,
          debit: invoice.grandTotal, // Full amount is debited as sale is cancelled
          credit: invoice.amountPaid, // Any payments made are credited back
          invoiceNumber: invoice.invoiceNumber,
          description: "Sales Bill Deleted",
        });
        await ledgerEntry.save({ session });
        if (ledgerEntry?._id) {
          customerDetails.ledger.push(ledgerEntry._id);
        }
        await customerDetails.save({ session });
      }
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in delete sale invoice:", error);
    res.status(500).json({
      message: "Error deleting invoice",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Search sale invoices
router.get("/search", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = {
      $or: [
        { invoiceNumber: { $regex: query, $options: "i" } },
        { customerName: { $regex: query, $options: "i" } },
      ],
    };

    const bills = await SalesBill.find(searchQuery).sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({
      message: "Error searching sales bills",
      error: error.message,
    });
  }
});

// Search sales by invoice number (POST route)
router.post("/search/invoice", verifyToken, async (req, res) => {
  try {
    const { invoiceNumber } = req.body;

    if (!invoiceNumber) {
      return res.status(400).json({
        message: "Invoice number is required",
      });
    }

    const bill = await SalesBill.findOne({
      invoiceNumber: invoiceNumber,
      status: "active", // Only find active invoices
    });

    if (!bill) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({
      message: "Error searching invoice",
      error: error.message,
    });
  }
});

// Get sales history for an inventory item
router.get("/inventory/:inventoryId", verifyToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Validate inventory ID
    if (!mongoose.isValidObjectId(inventoryId)) {
      throw new Error("Invalid inventory ID");
    }

    // Find inventory and populate sales details
    const inventory = await Inventory.findById(inventoryId).populate({
      path: "sales",
      options: {
        sort: { createdAt: -1 },
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
      populate: {
        path: "products",
        match: { inventoryId: inventoryId },
      },
    });

    if (!inventory) {
      throw new Error("Inventory not found");
    }

    // Get total count from the sales array
    const totalSales = inventory.sales.length;
    const totalPages = Math.ceil(totalSales / limit);

    // Format the response data
    const salesHistory = inventory.sales
      .map((sale) => {
        const product = sale.products[0]; // Since we filtered for specific inventory
        if (!product) return null;

        return {
          _id: sale._id,
          createdAt: sale.createdAt,
          invoiceId: sale._id,
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customerName,
          distributorName: sale.distributorName || sale.customerName,
          distributorMob: sale.mob,
          batchNumber: product.batchNumber,
          batchId: product.batchId,
          expiry: product.expiry,
          mrp: product.mrp,
          saleRate: product.saleRate,
          purchaseRate: product.purchaseRate,
          gstPer: product.gstPer,
          debit: product.quantity, // For sales, we use debit
          pack: product.pack,
          types: product.types || "sale",
        };
      })
      .filter(Boolean); // Remove null entries

    res.status(200).json({
      sales: salesHistory,
      totalPages,
      currentPage: parseInt(page),
      totalSales,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching sales history",
      error: error.message,
    });
  }
});

export default router;
