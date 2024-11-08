import express from 'express';
import { Payment } from '../models/Payment.js';
import mongoose from 'mongoose';
import { PurchaseBill } from "../models/PurchaseBill.js";
import { SalesBill } from "../models/SalesBill.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { payment_type } = req.query;
    const payments = await Payment.find({ payment_type });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
});

// Get pending invoices for a party
router.get("/pending-invoices/:partyId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { partyId } = req.params;
    const { bill_type } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({ message: "Invalid party ID format" });
    }

    let pendingInvoices = [];
    
    if (bill_type === "purchase") {
      pendingInvoices = await PurchaseBill.find(
        { 
          supplier: new mongoose.Types.ObjectId(partyId), 
          payment_status: "pending" 
        }
      ).session(session)
        .select('current_balance bill_number payment payment_status bill_date grand_total');
    } else if (bill_type === "sales") {
      pendingInvoices = await SalesBill.find({ party: partyId, payment_status: "pending" }, session)
        .select('current_balance bill_number payment payment_status bill_date grand_total');
    }
    
    await session.commitTransaction();
    res.status(200).json(pendingInvoices);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Error fetching pending invoices", error: error.message });
  } finally {
    session.endSession();
  }
});

router.post("/make-payment", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { payment_type, payment_method, party_id, party_name, remarks, bill_number, bill_id, amount, payment_date } = req.body;

    // Validate required fields
    if (!payment_type || !payment_method || !party_id || !amount) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // Create payment record
    const payment = new Payment({ payment_type, payment_method, party_id, party_name, remarks, bill_number, bill_id, amount, payment_date });
    await payment.save({ session });

    // Update bill payment status and current balance
    const Bill = payment_type === 'purchase' ? PurchaseBill : SalesBill;
    const bill = await Bill.findById(bill_id).session(session);
    
    if (!bill) {
      throw new Error('Bill not found');
    }

    // Update payment details array
    bill.payment_details.push(payment._id);
    
    // Update payment amount based on bill type
    if (payment_type === 'purchase') {
      bill.payment.amount_paid = (bill.payment.amount_paid || 0) + amount;
    } else {
      bill.payment.amount_received = (bill.payment.amount_received || 0) + amount;
    }

    // Calculate remaining balance
    const totalAmount = bill.grand_total;
    const paidAmount = payment_type === 'purchase' ? 
      bill.payment.amount_paid : 
      bill.payment.amount_received;
    
    // Update payment status
    bill.payment_status = paidAmount >= totalAmount ? 'paid' : 'pending';

    await bill.save({ session });

    await session.commitTransaction();
    res.status(201).json(payment);

  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating payment:", error);
    res.status(500).json({ 
      message: "Error creating payment", 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});



export default router;