import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import { SalesBill } from "../models/SalesBill.js";
import { SalesReturn } from "../models/SalesReturn.js";
import { Distributor } from "../models/Distributor.js";
import { Customer } from "../models/Customer.js";
import AccountDetails from "../models/AccountDetails.js";
import { Payment } from "../models/Payment.js";

const router = express.Router();

router.get("/invoice-number", verifyToken, async (req, res) => {
  const invoiceNumber = await SalesBill.getCurrentInvoiceNumber();
  res.json({ invoiceNumber });
});
router.get("/return-number", verifyToken, async (req, res) => {
  const returnNumber = await SalesReturn.getCurrentReturnNumber();
  res.json({ returnNumber });
});
// Create new sell bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { payment, ...details } = req.body;
    let distributorDetails = null;

    // If not a cash customer, validate and fetch distributor details
    if (!details.is_cash_customer) {
      if (!mongoose.isValidObjectId(details.distributorId)) {
        throw Error("distributor Id is not valid");
      }
      distributorDetails = await Customer.findById(details.distributorId).session(session);
      if (!distributorDetails) {
        throw Error("distributor not found");
      }
    }

    // Get next invoice number
    const invoiceNumber = await SalesBill.getNextInvoiceNumber(session);

    // Create the sales bill
    const newSalesBill = new SalesBill({
      ...details,
      invoiceNumber,
      createdBy: req.user._id,
      mob: distributorDetails?.mob || "",
    });

    // Handle payment if provided
    if (payment && payment.amount > 0) {
      // Create payment record
      const paymentDoc = new Payment({
        amount: payment.amount,
        payment_type: "Payment In",
        payment_method: payment.payment_method,
        payment_date: payment.chequeDate || new Date(),
        distributor_id: details.distributorId,
        distributorName: details.distributorName,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.payment_method === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
        bills: [newSalesBill._id],
      });

      // For cheque payments, we don't need to validate account
      if (payment.payment_method === "CHEQUE") {
        // Update distributor balance since it's still a payment promise
        if (distributorDetails) {
          distributorDetails.currentBalance =
            (distributorDetails.currentBalance || 0) + payment.amount;
          await distributorDetails.save({ session });
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

        // Add transaction details
        account.transactions.push({
          transactionNumber: payment.transactionNumber,
          amount: payment.amount,
          date: new Date(),
          type: "CREDIT",
          paymentId: paymentDoc._id,
          distributorName: details.distributorName,
          remarks: payment.remarks,
          balance: account.balance,
        });

        await account.save({ session });

        // Update distributor balance if not cash customer
        if (distributorDetails) {
          distributorDetails.currentBalance =
            (distributorDetails.currentBalance || 0) + payment.amount;
          await distributorDetails.save({ session });
        }
      }

      await paymentDoc.save({ session });
      newSalesBill.payments.push(paymentDoc._id);
      newSalesBill.payment = payment;
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

      // Update batch quantity
      batch.quantity -= quantity;
      await batch.save({ session });

      // Update inventory quantity
      inventorySchema.quantity -= quantity;
      await inventorySchema.save({ session });

      // Record timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newSalesBill._id,
        type: "SALE",
        invoiceNumber: invoiceNumber,
        debit: quantity,
        balance: inventorySchema.quantity,
        batchNumber,
        expiry: expiry,
        mrp,
        purchaseRate,
        saleRate,
        gstPer,
        pack,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: details.distributorName,
        distributorMob: details.mob || "",
      });
      await timeline.save({ session });
    }

    // Save the sales bill
    const savedSalesBill = await newSalesBill.save({ session });

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
    const bill = await SalesBill.findById(invoiceId);
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
    const { invoiceType, distributorId, _id, ...details } = req.body;

    // Validate distributor ID
    if (
      !mongoose.isValidObjectId(distributorId) &&
      distributorId !== "Cash/Counter" &&
      distributorId !== undefined &&
      distributorId !== "" &&
      distributorId !== null
    ) {
      throw Error("distributor Id is not valid");
    }

    // Find existing invoice
    const existingInvoice = await SalesBill.findById(id).session(session);
    if (!existingInvoice) {
      throw new Error("Invoice not found");
    }

    // Fetch distributor details
    const distributorDetails =
      distributorId === "Cash/Counter" ||
      distributorId == undefined ||
      distributorId == "" ||
      distributorId == null
        ? { name: "Cash/Counter", mob: "--" }
        : await Distributor.findById(distributorId).session(session);
    // First, reverse the old inventory changes
    for (const oldProduct of existingInvoice.products) {
      const { inventoryId, batchId, quantity, pack } = oldProduct;

      // Find inventory and batch
      const inventory = await Inventory.findById(inventoryId).session(session);
      const batch = await InventoryBatch.findById(batchId).session(session);

      if (!inventory || !batch) {
        throw new Error(
          `Original inventory or batch not found for product ${oldProduct.productName}`
        );
      }

      // Restore quantities (add back the sold quantity)
      inventory.quantity += quantity;
      batch.quantity += quantity;

      await inventory.save({ session });
      await batch.save({ session });

      // Add reversal timeline entry
    }

    // Now process the new products
    for (const product of req.body.products) {
      const { inventoryId, batchId, quantity, pack } = product;

      // Find inventory and validate
      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      // Find batch and update quantity
      const batch = await InventoryBatch.findById(batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found: ${batchId}`);
      }

      // Check if sufficient stock exists
      if (batch.quantity < quantity) {
        throw new Error(
          `Insufficient stock for ${inventorySchema.name} in batch ${product.batchNumber}`
        );
      }

      // Update batch quantity
      batch.quantity -= quantity;
      await batch.save({ session });

      // Update inventory quantity
      inventorySchema.quantity -= quantity;
      await inventorySchema.save({ session });

      // Record new timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: existingInvoice._id,
        type: "SALE_EDIT",
        pack,
        invoiceNumber: details.invoiceNumber,
        debit: quantity,
        balance: inventorySchema.quantity,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: batch.mrp,
        purchaseRate: batch.purchaseRate,
        gstPer: batch.gstPer,
        ptr: batch.ptr,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: distributorDetails.name,
        distributorMob: distributorDetails.mob,
      });
      await timeline.save({ session });
    }

    // Update the invoice with new details
    const updatedInvoice = await SalesBill.findByIdAndUpdate(
      id,
      {
        ...details,
        distributorId: distributorId === "Cash/Counter" ? null : distributorId,
        distributorName: distributorDetails.name,
        is_cash_customer: distributorId === "Cash/Counter",
        createdBy: req.user._id,
        hospital: req.user.hospital,
      },
      { new: true, session }
    );

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
        ptr: batch.ptr,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: invoice.distributorName,
      });
      await timeline.save({ session });
    }

    // Delete the invoice
    await SalesBill.findByIdAndDelete(id).session(session);

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
      invoiceNumber: { $regex: query, $options: "i" },
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

// Create new sell bill
router.post("/return", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      distributorName,
      returnDate,
      products,
      billSummary,
      originalInvoiceNumber,
      payment,
    } = req.body;

    // Get next return number
    const nextReturnNumber = await SalesReturn.getNextReturnNumber(session);

    // Create new sales return document
    const newReturn = new SalesReturn({
      returnNumber: nextReturnNumber,
      originalInvoiceNumber,
      distributorName,
      returnDate,
      products,
      billSummary,
      createdBy: req.user._id,
    });

    // Handle payment if provided
    if (payment && payment.amount > 0) {
      // Create payment record
      const paymentDoc = new Payment({
        amount: payment.amount,
        payment_type: "Payment Out", // Since we're paying out for returns
        payment_method: payment.paymentMethod,
        payment_date: payment.chequeDate || new Date(),
        distributorName: distributorName,
        accountId: payment.accountId,
        transactionNumber: payment.transactionNumber,
        chequeNumber: payment.chequeNumber,
        chequeDate: payment.chequeDate,
        micrCode: payment.micrCode,
        status: payment.payment_method === "CHEQUE" ? "PENDING" : "COMPLETED",
        remarks: payment.remarks,
      });

      // For cheque payments, we don't need to validate account
      if (payment.payment_method === "CHEQUE") {
        // Update distributor balance if distributor exists
        if (req.body.distributorId) {
          const distributorDetails = await Distributor.findById(req.body.distributorId).session(
            session
          );
          if (distributorDetails) {
            distributorDetails.currentBalance =
              (distributorDetails.currentBalance || 0) - payment.amount;
            await distributorDetails.save({ session });
          }
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

        // Update account balance (decrease since we're paying out)
        account.balance -= payment.amount;

        // Add transaction details
        account.transactions.push({
          transactionNumber: payment.transactionNumber,
          amount: payment.amount,
          date: new Date(),
          type: "DEBIT",
          paymentId: paymentDoc._id,
          distributorName: distributorName,
          remarks: payment.remarks,
          balance: account.balance,
        });

        await account.save({ session });

        // Update distributor balance if distributor exists
        if (req.body.distributorId) {
          const distributorDetails = await Distributor.findById(req.body.distributorId).session(
            session
          );
          if (distributorDetails) {
            distributorDetails.currentBalance =
              (distributorDetails.currentBalance || 0) - payment.amount;
            await distributorDetails.save({ session });
          }
        }
      }

      await paymentDoc.save({ session });
      newReturn.payments.push(paymentDoc._id);
    }

    // Process inventory updates for returned items
    for (const product of products) {
      const { inventoryId, batchId, quantity, pack } = product;

      // Find inventory and validate
      const inventorySchema = await Inventory.findById(inventoryId).session(
        session
      );
      if (!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      // Find batch and update quantity
      const batch = await InventoryBatch.findById(batchId).session(session);
      if (!batch) {
        throw new Error(`Batch not found: ${batchId}`);
      }

      // Update batch quantity (add back returned quantity)
      batch.quantity += quantity;
      await batch.save({ session });

      // Update inventory quantity
      inventorySchema.quantity += quantity;
      await inventorySchema.save({ session });

      // Record timeline entry for return
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newReturn._id,
        type: "SALE_RETURN",
        pack,
        invoiceNumber: nextReturnNumber,
        credit: quantity,
        balance: inventorySchema.quantity,
        batchNumber: batch.batchNumber,
        expiry: batch.expiry,
        mrp: batch.mrp,
        purchaseRate: batch.purchaseRate,
        gstPer: batch.gstPer,
        ptr: batch.ptr,
        user: req.user._id,
        userName: req?.user?.name,
        distributorName: distributorName,
      });
      await timeline.save({ session });
    }

    const savedReturn = await newReturn.save({ session });
    await session.commitTransaction();
    res.status(201).json(savedReturn);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: "Error creating sales return",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

// Get all sales returns
router.get("/returns", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.returnDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const returns = await SalesReturn.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json(returns);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching sales returns",
      error: error.message,
    });
  }
});

// Search sales returns
router.get("/returns/search", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = {
      returnNumber: { $regex: query, $options: "i" },
    };

    const returns = await SalesReturn.find(searchQuery)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json(returns);
  } catch (error) {
    res.status(500).json({
      message: "Error searching sales returns",
      error: error.message,
    });
  }
});

export default router;
