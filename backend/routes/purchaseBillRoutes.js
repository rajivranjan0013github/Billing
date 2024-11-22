import express from "express";
import { PurchaseBill } from "../models/PurchaseBill.js";
import { Inventory } from "../models/Inventory.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { StockDetail } from "../models/StockDetail.js";
import { PartyTransaction } from "../models/PartyTransaction.js";
import { Party } from "../models/Party.js";
import { Payment } from "../models/Payment.js";
import { Ledger } from "../models/Ledger.js";
import mongoose from "mongoose";

const router = express.Router();

// Create new purchase bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { supplier, supplier_name, supplier_invoice_number, items, bill_discount, payment, grand_total, tax_summary, is_round_off } = req.body;

    // Validate supplier
    if (!supplier) {
      return res.status(400).json({ message: "Supplier is required for purchase bills" });
    }

    const partyDoc = await Party.findById(supplier).session(session);

    const payment_status = payment.amount_paid === grand_total ? "paid" : "pending";

    partyDoc.current_balance = partyDoc.current_balance + (payment.amount_paid - grand_total);
    await partyDoc.save({ session });

    // Create new purchase bill with invoice details
    const newBill = new PurchaseBill({
      supplier,
      supplier_name,
      payment_status,
      supplier_invoice_number,
      items: items.map(item => ({
        item: item._id,
        batch_number: item.batchNo,
        expiry_date: item.expDate,
        quantity: item.qty,
        unit: item.unit,
        secondary_unit: item.secondary_unit,
        mrp: item.mrp,
        purchase_price: item.purchasePrice,
        discount_percentage: item.discount,
        gst_percentage: item.tax,
        hsn_code: item.hsn
      })),
      bill_discount,
      payment,
      grand_total,
      tax_summary,
      is_round_off,
      created_by: req.user._id,
      hospital: req.user.hospital
    });

     // Create payment
    if(payment.amount_paid > 0){
      const paymentDoc = new Payment({
        amount: payment.amount_paid,
        payment_type: "Purchase Invoice",
        payment_method: payment.payment_method,
        party_id: supplier,
        party_name: supplier_name,
        bill_number: newBill.bill_number,
        bill_id: newBill._id,
      });
      await paymentDoc.save({ session });
      newBill.payment_details.push(paymentDoc._id);
    }

    const savedBill = await newBill.save({ session });

    // Update inventory quantities and create stock details
    for (const item of items) {
      const inventory = await Inventory.findById(item._id);
      const newQuantity = Number(inventory.quantity) + Number(item.qty);
      
      // Create stock detail entry
      await StockDetail.create([{
        inventory_id: item._id,
        quantity: item.qty,
        unit: item.unit,
        secondary_unit: item.secondary_unit,
        type: "Purchase Invoice",
        bill_number: savedBill.bill_number,
        closing_stock: newQuantity,
      }], { session });

      await Inventory.findByIdAndUpdate(item._id, { quantity: newQuantity }, { session });
    }

    // Create party transaction
    await PartyTransaction.create([{
      party_id: supplier,
      amount: grand_total,
      type: "Purchase Invoice",
      bill_number: savedBill.bill_number,
      invoice_id: savedBill._id,
      amount_paid: payment.amount_paid,
    }], { session });

    // Create ledger entry
    await Ledger.create([{
      credit: grand_total,
      debit: payment.amount_paid,
      party_id: supplier,
      type: "Purchase Invoice",
      bill_number: savedBill.bill_number,
      bill_id: savedBill._id,
      balance : partyDoc.current_balance
    }], { session });

   
    await session.commitTransaction();

    res.status(201).json(savedBill);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating purchase bill:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: "Error creating purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all purchase bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const bills = await PurchaseBill.find({ hospital: req.user.hospital })
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error('Error fetching purchase bills:', error);
    res.status(500).json({ message: "Error fetching purchase bills", error: error.message });
  }
});

// Get single purchase bill by ID
router.get("/purchase-bill/:id", verifyToken, async (req, res) => {
  try {
    const bill = await PurchaseBill.findById(req.params.id)
      .populate('supplier')
      .populate('items.item')
      .populate('created_by');
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: "Error fetching purchase bill", error: error.message });
  }
});

// Update this route
router.get("/next-bill-number", verifyToken, async (req, res) => {
    try {
      const lastBill = await PurchaseBill.findOne(
        { hospital: req.user.hospital }
      ).sort({ createdAt: -1 });
      
      const nextCounter = lastBill ? (lastBill.invoice_counter || 0) + 1 : 1;
      
      res.json({ 
        success: true,
        nextBillNumber: nextCounter.toString().padStart(6, '0'),
        nextCounter 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Error getting next bill number", 
        error: error.message 
      });
    }
});

export default router; 