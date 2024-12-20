import express from "express";
import { SalesBill } from "../models/SalesBill.js";
import { Inventory } from "../models/Inventory.js";
import { StockDetail } from "../models/StockDetail.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { PartyTransaction } from "../models/PartyTransaction.js";
import { Party } from "../models/Party.js";
import { Payment } from "../models/Payment.js";
import { Ledger } from "../models/Ledger.js";
import mongoose from "mongoose";

const router = express.Router();

// Create new bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { party, is_cash_customer, partyName, items, bill_discount, payment, grand_total, tax_summary, is_round_off } = req.body;

    // Validate party for non-cash customers
    if (!is_cash_customer && !party) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Party is required for non-cash bills" });
    }

    let partyDoc;
    if (!is_cash_customer) {
      partyDoc = await Party.findById(party).session(session);
    }

    // Determine payment status
    const payment_status = payment.amount_paid === grand_total ? "paid" : "pending";

    // Create new bill
    const newBill = new SalesBill({
      party: is_cash_customer ? null : party,
      is_cash_customer,
      partyName,
      payment_status,
      items: items.map((item) => ({
        item: item._id,
        batchNumber: item.batchNo,
        expiry_date: item.expDate,
        quantity: parseFloat(item.qty),
        unit: item.unit,
        secondary_unit: item.secondary_unit,
        mrp: parseFloat(item.mrp),
        price_per_unit: parseFloat(item.pricePerItem),
        discount_percentage: parseFloat(item.discount),
        gstPer: parseFloat(item.tax),
        HSN: item.hsn,
      })),
      bill_discount,
      payment,
      grand_total,
      tax_summary,
      is_round_off,
      createdBy: req.user._id,
    });

    // Create payment record if payment was made
    if (payment.amount_paid > 0) {
      const paymentDoc = new Payment({
        amount: payment.amount_paid,
        payment_type: "Sell Invoice",
        payment_method: payment.payment_method,
        party_id: is_cash_customer ? null : party,
        partyName: partyName,
        bill_number: newBill.bill_number,
        bill_id: newBill._id,
      });
      await paymentDoc.save({ session });
      newBill.payment_details.push(paymentDoc._id);
    }

    const savedBill = await newBill.save({ session });

    // Update inventory and create stock details
    for (const item of items) {
      const inventory = await Inventory.findById(item._id);
      const newQuantity = parseFloat(inventory.quantity) - parseFloat(item.qty);

      await StockDetail.create(
        [{
          inventoryId: item._id,
          quantity: -parseFloat(item.qty),
          type: "Sell Invoice",
          bill_number: savedBill.bill_number,
          closing_stock: newQuantity,
          secondary_unit: item.secondary_unit,
          bill_number: savedBill.bill_number,
        }],
        { session }
      );

      await Inventory.findByIdAndUpdate(item._id, { quantity: newQuantity }, { session });
    }

    // Handle party transactions for non-cash customers
    if (!is_cash_customer) {
      // Update party balance
      partyDoc.currentBalance += grand_total - parseFloat(payment.amount_paid);
      await partyDoc.save({ session });

      // Create party transaction
      await PartyTransaction.create(
        [{
          party_id: party,
          amount: grand_total,
          type: "Sell Invoice",
          bill_number: savedBill.bill_number,
          invoice_id: savedBill._id,
          amount_paid: parseFloat(payment.amount_paid),
        }],
        { session }
      );

      // Create ledger entry
      await Ledger.create(
        [{
          party_id: party,
          type: "Sell Invoice",
          bill_number: savedBill.bill_number,
          bill_id: savedBill._id,
          debit: grand_total,
          credit: parseFloat(payment.amount_paid),
          balance: partyDoc.currentBalance,
        }],
        { session }
      );
    }

    await session.commitTransaction();
    res.status(201).json(savedBill);
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating bill:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        error: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({ message: "Error creating bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const bills = await SalesBill.find({ hospital: req.user.hospital }).sort({
      createdAt: -1,
    });
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res
      .status(500)
      .json({ message: "Error fetching bills", error: error.message });
  }
});

router.get("/sales-bill/:id", verifyToken, async (req, res) => {
  try {
    const bill = await SalesBill.findById(req.params.id)
      .populate("party")
      .populate("items.item")
      .populate("payment_details");
    res.status(200).json(bill);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching bill", error: error.message });
  }
});

// Add this new route after existing routes
router.get("/next-invoice-number", verifyToken, async (req, res) => {
  try {
    // Find the last bill for this hospital, sorted by creation date
    const lastBill = await SalesBill.findOne({
      hospital: req.user.hospital,
    }).sort({ createdAt: -1 });

    const nextCounter = lastBill ? (lastBill.invoice_counter || 0) + 1 : 1;

    const today = new Date();
    const fiscalYear =
      today.getMonth() >= 3
        ? `${today.getFullYear()}-${(today.getFullYear() + 1)
            .toString()
            .slice(2)}`
        : `${today.getFullYear() - 1}-${today
            .getFullYear()
            .toString()
            .slice(2)}`;

    const nextBillNumber = `INV/${fiscalYear}/${nextCounter
      .toString()
      .padStart(6, "0")}`;
    res.json({ nextBillNumber, nextCounter });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error getting next invoice number",
        error: error.message,
      });
  }
});

export default router;
