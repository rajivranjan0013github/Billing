import express from "express";
import { PurchaseBill } from "../models/PurchaseBill.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import { Inventory } from "../models/Inventory.js";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { StockTimeline } from "../models/StockTimeline.js";
import {Party} from '../models/Party.js'

const router = express.Router();

// Create new purchase bill
router.post("/", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {invoiceType, partyId, _id, ...details} = req.body; // _id => invoice id
    if(!mongoose.isValidObjectId(partyId)) {
      throw Error('Party Id is not valid');
    }
    // fetching party to update current balance of party
    const partyDetails = await Party.findById(partyId).session(session);
    const newInvoice = new InvoiceSchema({...req.body, createdBy : req.user._id});
    for(const product of req.body.products) {
      const {inventoryId , batchNumber, batchId, expiry, quantity, pack, purchaseRate, ptr, gstPer, HSN,mrp} = product;
      const inventorySchema = await Inventory.findById(inventoryId).session(session);
      if(!inventorySchema) {
        throw new Error(`Inventory not found : ${inventoryId}`)
      }
      const batch = await InventoryBatch.findById(batchId).session(session);
      if(batch) {
        Object.assign(batch, {expiry, pack, purchaseRate, gstPer, HSN });
        batch.quantity += quantity;
        await batch.save({session});
      } else {
        // cteating new batch
        const newBatch = new InventoryBatch({inventoryId : inventoryId, ...product});
        await newBatch.save({session});
        inventorySchema.NewBatchOperation(newBatch);
        inventorySchema.batch.push(newBatch._id);
      }
      inventorySchema.quantity += quantity;
      // recording timelines
      const timeline = new StockTimeline({
        inventoryId : inventoryId,
        invoiceId : newInvoice._id,
        type : 'PURCHASE',
        invoiceNumber : details.invoiceNumber,
        credit : quantity,
        balance : inventorySchema.quantity,
        batchNumber,
        expiry : expiry,
        mrp, purchaseRate, gstPer, ptr,
        user : req.user._id,
        userName : req?.user?.name,
        partyName : partyDetails.name,
        partyMob : partyDetails.mob
      });
      await timeline.save({session});
      await inventorySchema.save({session});
    }
    const ans = await newInvoice.save({session});

    await session.commitTransaction();

    res.status(201).json(ans);
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    
    res.status(500).json({ message: "Error creating purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// edit invoice -> do it later
router.post("/edit", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {invoiceType, partyId, _id, ...details} = req.body; // _id => invoice id
    if(!mongoose.isValidObjectId(partyId)) {
      throw Error('Party Id is not valid');
    }
    // fetching party to update current balance of party
    const partyDetails = await Party.findById(partyId).session(session);
    const newInvoice = new InvoiceSchema({...req.body, createdBy : req.user._id});
    for(const product of req.body.products) {
      const {inventoryId , batchNumber, batchId, expiry, quantity, pack, purchaseRate, ptr, gstPer, HSN,mrp} = product;
      const inventorySchema = await Inventory.findById(inventoryId).session(session);
      if(!inventorySchema) {
        throw new Error(`Inventory not found : ${inventoryId}`)
      }
      const batch = await InventoryBatch.findById(batchId).session(session);
      if(batch) {
        Object.assign(batch, {expiry, pack, purchaseRate, gstPer, HSN });
        batch.quantity += quantity;
        await batch.save({session});
      } else {
        // cteating new batch
        const newBatch = new InventoryBatch({inventoryId : inventoryId, ...product});
        await newBatch.save({session});
        inventorySchema.NewBatchOperation(newBatch);
        inventorySchema.batch.push(newBatch._id);
      }
      inventorySchema.quantity += quantity;
      // recording timelines
      const timeline = new StockTimeline({
        inventoryId : inventoryId,
        invoiceId : newInvoice._id,
        type : 'PURCHASE',
        invoiceNumber : details.invoiceNumber,
        credit : quantity,
        balance : inventorySchema.quantity,
        batchNumber,
        expiry : expiry,
        mrp, purchaseRate, gstPer, ptr,
        user : req.user._id,
        userName : req?.user?.name,
        partyName : partyDetails.name,
        partyMob : partyDetails.mob
      });
      await timeline.save({session});
      await inventorySchema.save({session});
    }
    const ans = await newInvoice.save({session});

    await session.commitTransaction();

    res.status(201).json(ans);
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    
    res.status(500).json({ message: "Error creating purchase bill", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all purchase bills
router.get("/", verifyToken, async (req, res) => {
  try {
    const bills = await InvoiceSchema.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching purchase bills", error: error.message });
  }
});

// Get single purchase bill by ID
router.get("/invoice/:invoiceId", verifyToken, async (req, res) => {
  try {
    const {invoiceId} = req.params;
    const bill = await InvoiceSchema.findById(invoiceId);
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