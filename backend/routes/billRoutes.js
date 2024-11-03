import express from "express";
import { SalesBill } from "../models/SalesBill.js";
import { Inventory } from "../models/Inventory.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create new bill
router.post("/", verifyToken, async (req, res) => {
  try {
    const { 
      party, 
      is_cash_customer, 
      party_name, 
      items, 
      bill_discount, 
      payment, 
      grand_total, 
      tax_summary, 
      is_round_off 
    } = req.body;

    // Validate party for non-cash customers
    if (!is_cash_customer && !party) {
      return res.status(400).json({ 
        message: "Party is required for non-cash bills" 
      });
    }

    // Create new bill
    const newBill = new SalesBill({
      party: is_cash_customer ? null : party,
      is_cash_customer,
      party_name,
      items: items.map(item => ({
        item: item._id,
        batch_number: item.batchNo,
        expiry_date: item.expDate,
        quantity: item.qty,
        unit: item.unit,
        price_per_unit: item.pricePerItem,
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

    // Save the bill
    const savedBill = await newBill.save();

    // Update inventory quantities
    for (const item of items) {
      await Inventory.findByIdAndUpdate(
        item._id,
        { $inc: { quantity: -item.qty } }
      );
    }

    // Populate necessary fields and return
    const populatedBill = await SalesBill.findById(savedBill._id)
      .populate('party')
      .populate('items.item')
      .populate('created_by');

    res.status(201).json(populatedBill);
  } catch (error) {
    console.error('Error creating bill:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: "Error creating bill", 
      error: error.message 
    });
  }
});

// Get all bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const bills = await SalesBill.find({ hospital: req.user.hospital })
      .populate('party')
      .populate('items.item')
      .populate('created_by')
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ 
      message: "Error fetching bills", 
      error: error.message 
    });
  }
});

router.get("/sales-bill/:id", verifyToken, async (req, res) => {
  try {
    const bill = await SalesBill.findById(req.params.id)
      .populate('party')
      .populate('items.item')
      .populate('created_by');
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bill", error: error.message });
  }
});

// Add this new route after existing routes
router.get("/next-invoice-number", verifyToken, async (req, res) => {
  try {
    // Find the latest bill for this hospital
    const lastBill = await SalesBill.findOne(
      { hospital: req.user.hospital },
      { invoice_counter: 1, bill_number: 1 }
    ).sort({ createdAt: -1 });

    // Calculate next counter
    const nextCounter = lastBill ? lastBill.invoice_counter + 1 : 1;

    // Generate next bill number
    const today = new Date();
    const fiscalYear = today.getMonth() >= 3 ? 
      `${today.getFullYear()}-${(today.getFullYear() + 1).toString().slice(2)}` : 
      `${today.getFullYear() - 1}-${today.getFullYear().toString().slice(2)}`;
    
    const nextBillNumber = `INV/${fiscalYear}/${nextCounter.toString().padStart(6, '0')}`;

    res.json({ nextBillNumber });
  } catch (error) {
    res.status(500).json({ 
      message: "Error getting next invoice number", 
      error: error.message 
    });
  }
});

export default router;