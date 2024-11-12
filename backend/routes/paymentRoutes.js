import express from 'express';
import { Payment } from '../models/Payment.js';
import mongoose from 'mongoose';
import { PurchaseBill } from "../models/PurchaseBill.js";
import { SalesBill } from "../models/SalesBill.js";
import { Ledger } from "../models/Ledger.js";
import { Party } from "../models/Party.js";
import { PartyTransaction } from "../models/PartyTransaction.js";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { payment_type } = req.query;
    const payments = await Payment.find({ payment_type }).sort({ createdAt: -1 }).lean();
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
        .select('bill_number payment payment_status bill_date grand_total');
    } else if (bill_type === "sales") {
      pendingInvoices = await SalesBill.find({ party: partyId, payment_status: "pending" }, session)
        .select('bill_number payment payment_status bill_date grand_total');
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

// only for payment out
router.post("/make-payment", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {bills, party_id, remarks, payment_type, payment_method, amount, payment_date, payment_out_number} = req.body;

    let payment_amount = amount;
    
    // Validate required fields
    if (!payment_type || !payment_method || !party_id || !amount) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // updating party balance
    const partyDoc = await Party.findById(party_id).session(session);
    partyDoc.current_balance += amount;

    // Create payment record
    const payment = new Payment({
      payment_number : payment_out_number,
      payment_type : "Payment Out", 
      payment_method, 
      party_id, 
      party_name : partyDoc.name,
      remarks, 
      amount, 
      payment_date 
    });

    // creat party ledger
    const ledger = new Ledger({
      party_id, 
      type: "Payment Out",
      debit: amount,
      description: remarks,
      bill_number: payment_out_number,
      amount : partyDoc.current_balance
    });

    await ledger.save({ session });

    // creating party transaction
    const partyTransaction = new PartyTransaction({
      party_id,
      type: "Payment Out",
      amount,
      description: remarks,
      bill_number: payment_out_number,
      invoice_id: payment._id 
    });
    await partyTransaction.save({ session });
    // updating bills
    for(const bill of bills){
      if(payment_amount === 0) break;
      const billDoc = await PurchaseBill.findById(bill.bill_id).session(session);
      if(!billDoc){
        return res.status(400).json({ message: "Bill not found" });
      }
      const due_amount = billDoc.grand_total - billDoc.payment.amount_paid;
      if(due_amount > payment_amount){
        billDoc.payment.amount_paid += payment_amount;
        payment_amount = 0;
      }else{
        billDoc.payment.amount_paid += due_amount;
        billDoc.payment_status = "paid";
        payment_amount -= due_amount;
      }
      billDoc.payment_details.push(payment._id);
      payment.bills.push(bill.bill_id);
      await billDoc.save({ session });
    }

    await payment.save({ session });
    await partyDoc.save({ session });
    
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

router.get("/details/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate("bills").lean();
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment details", error: error.message });
  }
});

router.get("/ledger", async (req, res) => {
  const { party_id } = req.query;
  const ledger = await Ledger.find({ party_id });
  res.status(200).json(ledger);
});





export default router;