import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import { Party } from '../models/Party.js';

const router = express.Router();

// Create new sell bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {invoiceType, partyId, _id, ...details} = req.body;
    if(!mongoose.isValidObjectId(partyId)) {
      throw Error('Party Id is not valid');
    }

    // Fetch party details
    const partyDetails = await Party.findById(partyId).session(session);
    const newInvoice = new InvoiceSchema({...req.body, createdBy: req.user._id});

    // Process each product in the sale
    for(const product of req.body.products) {
      const {inventoryId, batchNumber, batchId, quantity, pack} = product;
      
      // Find inventory and validate
      const inventorySchema = await Inventory.findById(inventoryId).session(session);
      if(!inventorySchema) {
        throw new Error(`Inventory not found: ${inventoryId}`);
      }

      // Find batch and update quantity
      const batch = await InventoryBatch.findById(batchId).session(session);
      if(!batch) {
        throw new Error(`Batch not found: ${batchId}`);
      }

      // Check if sufficient stock exists
      if(batch.quantity < quantity) {
        throw new Error(`Insufficient stock for ${inventorySchema.name} in batch ${batchNumber}`);
      }

      // Update batch quantity
      batch.quantity -= quantity;
      await batch.save({session});

      // Update inventory quantity
      inventorySchema.quantity -= quantity;
      await inventorySchema.save({session});

      // Record timeline
      const timeline = new StockTimeline({
        inventoryId: inventoryId,
        invoiceId: newInvoice._id,
        type: 'SALE',
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
        partyName: partyDetails.name,
        partyMob: partyDetails.mob
      });
      await timeline.save({session});
    }

    const savedInvoice = await newInvoice.save({session});
    await session.commitTransaction();
    res.status(201).json(savedInvoice);

  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    res.status(500).json({ message: "Error creating sell bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all sell bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const bills = await InvoiceSchema.find({ invoiceType: 'SALE' })
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sell bills", error: error.message });
  }
});

// Get single sell bill by ID
router.get("/invoice/:invoiceId", verifyToken, async (req, res) => {
  try {
    const {invoiceId} = req.params;
    const bill = await InvoiceSchema.findById(invoiceId);
    if (!bill) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sell bill", error: error.message });
  }
});

// Get next bill number
router.get("/next-bill-number", verifyToken, async (req, res) => {
  try {
    const lastBill = await InvoiceSchema.findOne(
      { hospital: req.user.hospital, invoiceType: 'sales' }
    ).sort({ createdAt: -1 });
    
    const nextCounter = lastBill ? (parseInt(lastBill.invoiceNumber) || 0) + 1 : 1;
    
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