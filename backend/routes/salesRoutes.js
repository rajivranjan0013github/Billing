import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import { SalesBill } from "../models/SalesBill.js";
import { Customer } from "../models/Customer.js";
import AccountDetails from "../models/AccountDetails.js";
import { Payment } from "../models/Payment.js";
import { Ledger } from "../models/ledger.js";
import { deepEqualObject } from "../utils/Helper.js";

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
      const { inventoryId, batchNumber, batchId, quantity, types } = product;

      const inventorySchema = await Inventory.findById(inventoryId).session(session);
      if (!inventorySchema) throw new Error(`Inventory not found : ${inventoryId}`);

      const batch = await InventoryBatch.findById(batchId).session(session);
      if (!batch) throw new Error(`Batch not found : ${batchId}`);

      // Record timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newSalesBill._id,
        type: types === "return" ? "SALE_RETURN" : "SALE",
        invoiceNumber: invoiceNumber,
        batchNumber,
        pack : batch.pack,
        createdBy: req?.user._id,
        createdByName: req?.user?.name,
        name: details.customerName,
        mob: details.mob || "",
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
      inventorySchema.sales.push(newSalesBill._id);
      
      inventorySchema.timeline.push(timeline._id);
      await inventorySchema.save({ session });
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
      customerDetails.ledger.push(ledgerEntry._id);
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
    const { payments, ...details } = req.body;
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
      customerDetails = await Customer.findById(details.customerId).session(session);
      if (!customerDetails) {
        throw Error("Customer not found");
      }
    }

    const oldProductBatchMap = new Map();
    existingInvoice.products.forEach((product, index) => {
      oldProductBatchMap.set(String(product.batchId), index);
    });

    // product changes
    for(const product of details.products){
      const { inventoryId, batchId, quantity,types } = product;
      // Find inventory and validate
      const inventorySchema = await Inventory.findById(inventoryId).session(session); // new inventory schema
      if (!inventorySchema) throw new Error(`Inventory not found: ${inventoryId}`); 
      // Find batch and validate
      const batch = await InventoryBatch.findById(batchId).session(session); // new batch schema
      if (!batch) throw new Error(`Batch not found: ${batchId}`);

      const reverseTimeline = new StockTimeline({
        inventoryId: product.inventoryId,
        invoiceId: existingInvoice._id,
        type: "SALE_EDIT_REVERSE",
        invoiceNumber: existingInvoice.invoiceNumber,
        batchNumber: batch.batchNumber,
        pack : batch.pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: details.customerName,
        mob: customerDetails?.mob || "",
      });

      const newTimeline = new StockTimeline({
        inventoryId: product.inventoryId,
        invoiceId: existingInvoice._id,
        type: "SALE_EDIT",
        invoiceNumber: existingInvoice.invoiceNumber,
        batchNumber: batch.batchNumber,
        pack : batch.pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: details.customerName,
        mob: customerDetails?.mob || "",
      });

      if(oldProductBatchMap.has(String(product.batchId))){
        const oldProduct = existingInvoice.products[oldProductBatchMap.get(String(product.batchId))];
        if(deepEqualObject(JSON.parse(JSON.stringify(oldProduct)), JSON.parse(JSON.stringify(product)), ["_id", "timeline", "batchId", "inventoryId", "purchaseRate", "mfcName"])){
        
          oldProductBatchMap.delete(String(product.batchId));
          continue;
        } else {
          if(product.quantity === oldProduct.quantity && product.pack === oldProduct.pack && product.types === oldProduct.types){
            newTimeline.balance = inventorySchema.quantity;
            await newTimeline.save({ session });
            inventorySchema.timeline.push(newTimeline._id);
          } else {
            // reverse the old timeline
            inventorySchema.quantity += oldProduct.quantity;
            batch.quantity += oldProduct.quantity;
            reverseTimeline.credit = oldProduct.quantity;
            reverseTimeline.balance = inventorySchema.quantity;
            await reverseTimeline.save({ session });
            inventorySchema.timeline.push(reverseTimeline._id);

            //create new timeline
            inventorySchema.quantity -= product.quantity;
            batch.quantity -= product.quantity;
            newTimeline.debit = product.quantity;
            newTimeline.balance = inventorySchema.quantity;
            await newTimeline.save({ session });
            inventorySchema.timeline.push(newTimeline._id);
          }
        }
        oldProductBatchMap.delete(String(product.batchId));
      } else {
        // Check if sufficient stock exists for sales
        if (types !== "return" && batch.quantity < quantity) throw new Error(
          `Insufficient stock for ${inventorySchema.name} in batch ${product.batchNumber}`
        );

        // Update quantities based on sale or return type
        if (types === "return") {
          batch.quantity += quantity;
          inventorySchema.quantity += quantity;
        } else {
          batch.quantity -= quantity;
          inventorySchema.quantity -= quantity;
        }
        newTimeline.debit = types === "return" ? 0 : quantity;
        newTimeline.credit = types === "return" ? quantity : 0;
        newTimeline.balance = inventorySchema.quantity;

        // Record new timeline
        await newTimeline.save({ session });
        inventorySchema.timeline.push(newTimeline._id);

        // Add sales bill reference to inventory's sales array if not already present
        if (!inventorySchema.sales.includes(existingInvoice._id)) {
          inventorySchema.sales.push(existingInvoice._id);
        }
      }
      await inventorySchema.save({ session });
      await batch.save({ session });
    }

    // reverse the old timeline
    for(const [batchId, oldProductIndex] of oldProductBatchMap.entries()){
      const oldProduct = existingInvoice.products[oldProductIndex];
      const oldBatch = await InventoryBatch.findById(batchId).session(session);
      const oldInventorySchema = await Inventory.findById(oldBatch.inventoryId).session(session);
      oldInventorySchema.quantity += oldProduct.quantity;
      oldBatch.quantity += oldProduct.quantity;
      
      const reverseTimeline = new StockTimeline({
        inventoryId: oldBatch.inventoryId,
        invoiceId: existingInvoice._id,
        type: "SALE_EDIT_REVERSE",
        invoiceNumber: existingInvoice.invoiceNumber,
        batchNumber: oldBatch.batchNumber,
        credit: oldProduct.quantity,
        balance: oldInventorySchema.quantity,
        pack : oldBatch.pack,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: existingInvoice.customerName,
        mob: existingInvoice.mob,
      });
      oldInventorySchema.timeline.push(reverseTimeline._id);
      oldInventorySchema.sales = oldInventorySchema.sales.filter(saleId => saleId.toString() !== existingInvoice._id.toString());
      await oldInventorySchema.save({ session });
      await oldBatch.save({ session });
      await reverseTimeline.save({ session });
    }

    // Save customer changes if any
    if (customerDetails && !(existingInvoice.customerId.toString() === customerDetails._id.toString() && existingInvoice.amountPaid === details.amountPaid)) {
      const oldCustomer = await Customer.findById(existingInvoice.customerId).session(session);
      const newDue = (details.grandTotal || 0) - (details.amountPaid || 0);
      const oldDue = (existingInvoice.grandTotal || 0) - (existingInvoice.amountPaid || 0);
      oldCustomer.currentBalance -= oldDue;
      // Ledger entry reverse transaction
      const ledgerEntryForOldCustomer = new Ledger({
        customerId: oldCustomer._id,
        balance: oldCustomer.currentBalance,
        credit : existingInvoice.grandTotal || 0, 
        debit: existingInvoice.amountPaid || 0, // New sales amount
        invoiceNumber: existingInvoice.invoiceNumber,
        description: "Sales invoice edit - Reverse Transaction",
      });
      await ledgerEntryForOldCustomer.save({ session });
      oldCustomer.ledger.push(ledgerEntryForOldCustomer._id);
      await oldCustomer.save({ session });

      // new ledger entry
      const ledgerEntry = new Ledger({
        customerId: customerDetails._id,
        balance: customerDetails.currentBalance + newDue,
        credit: details.amountPaid || 0, // New payment received
        debit: details.grandTotal || 0, // New sales amount
        invoiceNumber: details.invoiceNumber,
        description: "Sales invoice edit - New Transaction",
      });
      customerDetails.currentBalance += newDue;
      await ledgerEntry.save({ session });
      customerDetails.ledger.push(ledgerEntry._id);
      await customerDetails.save({ session });
    }

    // Handle payment if provided -- payment changes
    if (payments && payments.length > 0) {
     
      for (const payment of payments) {
        const existingPayment = await Payment.findById(payment._id).session(session);
        if (!existingPayment) {
          throw new Error(`Payment not found: ${payment._id}`);
        }
        existingPayment.amount = payment.amount;
        await existingPayment.save({ session });
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
    await session.endSession();
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
        pack : batch.pack,
        invoiceNumber: invoice.invoiceNumber,
        credit: quantity,
        balance: inventory.quantity,
        batchNumber: batch.batchNumber,
        createdBy: req.user._id,
        createdByName: req?.user?.name,
        name: invoice.customerName,
        mob: invoice.mob,
      });

      // Remove sales bill reference from inventory's sales array
      inventory.sales = inventory.sales.filter(
        (saleId) => saleId.toString() !== id.toString()
      );

      await timeline.save({ session });
    }

    // delete payments
    for(const payment of invoice.payments){
      await Payment.findByIdAndDelete(payment._id).session(session);
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
          description: "Sales Bill Deleted - " + invoice.invoiceNumber,
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
        const product = sale.products.find(p => p.inventoryId && p.inventoryId.toString() === inventoryId.toString());
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
