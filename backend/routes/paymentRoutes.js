import express from "express";
import { Payment } from "../models/Payment.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { SalesBill } from "../models/SalesBill.js";
import { Distributor } from "../models/Distributor.js";
import AccountDetails from "../models/AccountDetails.js";
import { Customer } from "../models/Customer.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { Ledger } from "../models/ledger.js";
const router = express.Router();

// Get current payment number
router.get("/payment-number", async (req, res) => {
  const paymentNumber = await Payment.getCurrentPaymentNumber();
  res.json({ paymentNumber });
});

// Get all payments
router.get("/", async (req, res) => {
  try {
    const { paymentType, startDate, endDate } = req.query;

    // Build query object
    const query = {};
    if (paymentType) {
      query.paymentType = paymentType;
    }

    // Add date range filter if provided with proper date formatting
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        // Convert start date to beginning of day
        const formattedStartDate = new Date(startDate);
        formattedStartDate.setHours(0, 0, 0, 0);
        query.paymentDate.$gte = formattedStartDate;
      }
      if (endDate) {
        // Convert end date to end of day
        const formattedEndDate = new Date(endDate);
        formattedEndDate.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = formattedEndDate;
      }
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res
      .status(500)
      .json({ message: "Error fetching payments", error: error.message });
  }
});

// Search payments
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = {
      $or: [
        { paymentNumber: { $regex: query, $options: "i" } },
        { distributorName: { $regex: query, $options: "i" } },
        { customerName: { $regex: query, $options: "i" } },
      ],
    };

    const payments = await Payment.find(searchQuery)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Error searching payments",
      error: error.message,
    });
  }
});

// Get pending invoices for a distributor
router.get("/pending-invoices/:distributorId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { distributorId } = req.params;
    const { bill_type } = req.query;

    if (!mongoose.Types.ObjectId.isValid(distributorId)) {
      return res.status(400).json({ message: "Invalid distributor ID format" });
    }

    let pendingInvoices = [];

    if (bill_type === "purchase") {
      pendingInvoices = await InvoiceSchema.find(
        {
          distributorId: new mongoose.Types.ObjectId(distributorId),
          paymentStatus: "due",
          status: "active", // Only get active invoices
        },
        {
          _id: 1,
          invoiceNumber: 1,
          invoiceDate: 1,
          paymentDueDate: 1,
          grandTotal: 1,
          amountPaid: 1,
          paymentStatus: 1,
        }
      )
        .sort({ invoiceDate: -1 })
        .session(session);
    } else if (bill_type === "sales") {
      pendingInvoices = await SalesBill.find({
        distributor: new mongoose.Types.ObjectId(distributorId),
        paymentStatus: "due",
      }).session(session);
    }

    await session.commitTransaction();
    res.status(200).json(pendingInvoices);
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({
        message: "Error fetching pending invoices",
        error: error.message,
      });
  } finally {
    session.endSession();
  }
});

// only for payment out
router.post("/make-payment", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      bills,
      distributorId,
      remarks,
      paymentType,
      paymentMethod,
      amount,
      paymentDate,
      chequeNumber,
      chequeDate,
      micrCode,
      transactionNumber,
      accountId,
    } = req.body;

    // Enhanced validation
    if (!paymentType || !paymentMethod || !distributorId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate payment method specific fields
    if (paymentMethod === "CHEQUE" && (!chequeNumber || !chequeDate)) {
      return res
        .status(400)
        .json({
          message: "Cheque number and date required for cheque payments",
        });
    }

    // Fetch distributor
    const model = paymentType === "Payment Out" ? Distributor : Customer;
    const distributorDoc = await model.findById(distributorId).session(session);
    if (!distributorDoc) {
      return res.status(404).json({ message: "Distributor not found" });
    }

    const paymentNumber1 = await Payment.getNextPaymentNumber(session);

    // Create payment record
    const payment = new Payment({
      paymentNumber: paymentNumber1,
      paymentType,
      paymentMethod,
      distributorId,
      distributorName: distributorDoc.name,
      remarks,
      amount,
      paymentDate: paymentDate || new Date(),
      chequeNumber,
      chequeDate,
      micrCode,
      transactionNumber,
      accountId,
      status: paymentMethod === "CHEQUE" ? "PENDING" : "COMPLETED",
      createdBy: req.user._id,
      createByName: req.user.name,
    });

    // Handle account updates based on payment method
    if (paymentMethod === "CHEQUE") {
      // For cheque payments, we only update distributor balance as it's a payment promise
      distributorDoc.currentBalance +=
        paymentType === "Payment Out" ? amount : -amount;
    } else {
      // For non-cheque payments (CASH, BANK, UPI), validate and update account
      if (!accountId) {
        throw new Error("Account ID is required for non-cheque payments");
      }

      // Validate account exists
      const account = await AccountDetails.findById(accountId).session(session);

      if (!account) {
        throw new Error("Account not found");
      }

      // Update account balance
      const transactionAmount =
        paymentType === "Payment Out" ? -amount : amount;
      account.balance += transactionAmount;

      await account.save({ session });

      // Update distributor balanceArrowLeft
      distributorDoc.currentBalance +=
        paymentType === "Payment Out" ? amount : -amount;
    }

    const ledgerEntry = new Ledger({
      distributorId: distributorId,
      customerId: distributorDoc._id,
      balance: distributorDoc.currentBalance,
      invoiceNumber: payment.paymentNumber,
      description: paymentType,
    });

    let remainingAmount = amount;
    let description = "";
    // Update bills
    for (const bill of bills) {
      if (remainingAmount <= 0) break;

      const BillModel =
        paymentType === "Payment Out" ? InvoiceSchema : SalesBill;
      const billDoc = await BillModel.findById(bill.billId).session(session);

      if (!billDoc) {
        throw new Error(`Bill not found: ${bill.billId}`);
      }

      const dueAmount = billDoc.grandTotal - billDoc.amountPaid;

      if (dueAmount > remainingAmount) {
        billDoc.amountPaid += remainingAmount;
        billDoc.paymentStatus = "due";
        remainingAmount = 0;
      } else {
        billDoc.amountPaid += dueAmount;
        billDoc.paymentStatus = "paid";
        remainingAmount -= dueAmount;
      }

      billDoc.payments.push(payment._id);
      if (paymentType === "Payment Out") {
        payment.bills.push(bill.billId);
      } else {
        payment.salesBills.push(bill.billId);
      }
      description += !description? " - " : ',' + bill.invoiceNumber;
      await billDoc.save({ session });
    }

    await payment.save({ session });
    distributorDoc.payments.push(payment._id);
   
    ledgerEntry.description += description;
    if (paymentType === "Payment Out") {
      ledgerEntry.debit = payment.amount;
    } else {
      ledgerEntry.credit = payment.amount;
    }
    await ledgerEntry.save({ session });
    distributorDoc.ledger.push(ledgerEntry._id);
    
    await distributorDoc.save({ session });

    await session.commitTransaction();
    res.status(201).json(payment);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating payment:", error);
    res.status(500).json({
      message: "Error creating payment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

//
router.get("/details/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate("bills").populate("salesBills").lean();
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({
        message: "Error fetching payment details",
        error: error.message,
      });
  }
});

// Delete payment
router.delete("/:paymentId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId } = req.params;

    // Find and verify payment exists
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const model = payment.paymentType === "Payment Out" ? Distributor : Customer;
    let ledgerEntry = null;
    // Find distributor and revert balance
    const distributor = await model.findById(payment.distributorId).session(session);
    if (distributor) {
      distributor.currentBalance -= payment.paymentType === "Payment Out" ? payment.amount : -payment.amount;
      ledgerEntry = new Ledger({
        distributorId: distributor._id,
        customerId: distributor._id,
        balance: distributor.currentBalance,
        description: payment.paymentType + " Deleted",
        invoiceNumber: payment.paymentNumber,
      });
      if (payment.paymentType === "Payment Out") {
        ledgerEntry.credit = payment.amount;
      } else {
        ledgerEntry.debit = payment.amount;
      }
      distributor.ledger.push(ledgerEntry._id);
      await distributor.save({ session });
    }

    // Revert account balance if it's not a pending cheque payment
    if (payment.paymentMethod !== "CHEQUE" || payment.status === "COMPLETED") {
      const account = await AccountDetails.findById(payment.accountId).session(
        session
      );
      if (account) {
        // Reverse the original transaction
        const transactionAmount = payment.paymentType === "Payment Out"   ? payment.amount   : -payment.amount;
        account.balance -= transactionAmount;
        await account.save({ session });
      }
    }

    // Update bills
    let description = "";
    if (payment.paymentType === "Payment Out") {
      for (const billId of payment.bills) {
        const bill = await InvoiceSchema.findById(billId).session(session);
        if (bill) {
          bill.amountPaid -= payment.amount;
          bill.paymentStatus = bill.amountPaid >= bill.grandTotal ? "paid" : "due";
          bill.payments = bill.payments.filter(
            (pid) => pid.toString() !== paymentId
          );
          description += !description? " - " : ',' + bill.invoiceNumber;
          await bill.save({ session });
        }
      }
    } else {
      for (const billId of payment.salesBills) {
        const bill = await SalesBill.findById(billId).session(session);
        if (bill) {
          bill.amountPaid -= payment.amount;
          bill.paymentStatus =
            bill.amountPaid >= bill.grandTotal ? "paid" : "due";
          bill.payments = bill.payments.filter(
            (pid) => pid.toString() !== paymentId
          );
          description += !description? " - " : ',' + bill.invoiceNumber;
          await bill.save({ session });
        }
      }
    }
    if(ledgerEntry){
      ledgerEntry.description += description;
      await ledgerEntry.save({ session });
    }
    // Delete the payment
    await Payment.findByIdAndDelete(paymentId).session(session);

    await session.commitTransaction();
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting payment:", error);
    res.status(500).json({
      message: "Error deleting payment",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
});

export default router;
