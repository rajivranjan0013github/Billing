import express from 'express';
import {Inventory} from '../models/Inventory.js';
import { verifyToken, checkPermission } from '../middleware/authMiddleware.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { StockTimeline } from '../models/StockTimeline.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create or update inventory
router.post('/manage-inventory', async (req, res) => {
    const {_id , ...details} = req.body;
    try {
        if (_id) {
            // Update existing inventory
            const updatedItem = await Inventory.findByIdAndUpdate(_id, details, {new : true});
            res.status(200).json(updatedItem);
        } else {
            // Create new inventory
            const newInventoryItem = new Inventory(details);
            const savedItem = await newInventoryItem.save();
            res.status(201).json(savedItem);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// creating or updating batch
router.post('/manage-batch', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const {_id, inventoryId, ...details} = req.body; // _id is batch id
    
    try {
        const inventoryDetails = await Inventory.findById(inventoryId).session(session);
        if(!inventoryDetails) throw new Error('Item not found');
        
        // Force quantity to be a number
        inventoryDetails.quantity = Number(inventoryDetails.quantity || 0);
        details.quantity = Number(details.quantity);
        
        // creating timeline for the batch
        const timeline = new StockTimeline({
            inventoryId: inventoryId,
            type: 'Adjustment',
            batchNumber: details.batchNumber,
            expiry: details.expiry,
        });

        if (_id) {
            const batchDetails = await InventoryBatch.findById(_id).session(session);
            if(!batchDetails) throw new Error('Batch not found');
            
            const oldQuantity = Number(batchDetails.quantity || 0);
            const newQuantity = Number(details.quantity || 0);
            
            if(newQuantity > oldQuantity){
                timeline.credit = newQuantity - oldQuantity;
                inventoryDetails.quantity += timeline.credit;
            } else {
                timeline.debit = oldQuantity - newQuantity;
                inventoryDetails.quantity -= timeline.debit;
            }
            Object.assign(batchDetails, details);
            inventoryDetails.NewBatchOperation(details);
            await batchDetails.save({session});
        } else {
            const newBatch = new InventoryBatch({inventoryId: inventoryId, ...details});
            await newBatch.save({session});
            inventoryDetails.batch.push(newBatch._id);
            inventoryDetails.NewBatchOperation(details);
            inventoryDetails.quantity += Number(details.quantity);
            timeline.credit = Number(details.quantity);
        }
        
        timeline.balance = Number(inventoryDetails.quantity);
        await timeline.save({session});
        await inventoryDetails.save({session});
        const updatedItem = await Inventory.findById(inventoryId).populate('batch').session(session);
        await session.commitTransaction();
        res.status(200).json(updatedItem);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// deleting batch
router.delete('/delete-batch/:batchId', async (req, res) => {
    const {batchId} = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const batch = await InventoryBatch.findByIdAndDelete(batchId).session(session);
        if(!batch) throw new Error('Batch not found');
        const inventoryDetails = await Inventory.findById(batch.inventoryId).session(session);
        inventoryDetails.quantity -= Number(batch.quantity);
        // Remove the batch ID from the inventoryDetails.batch array
        inventoryDetails.batch = inventoryDetails.batch.filter(id => id.toString() !== batchId);
        const timeline = new StockTimeline({
            inventoryId: batch.inventoryId,
            type: 'Adjustment',
            batchNumber: batch.batchNumber,
            expiry: batch.expiry,
            debit: Number(batch.quantity),
            balance: Number(inventoryDetails.quantity),
        });
        await timeline.save({session});
        await inventoryDetails.save({session});
        const updatedItem = await Inventory.findById(batch.inventoryId).populate('batch').session(session);
        await session.commitTransaction();
        res.status(200).json(updatedItem);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

router.get('/timeline/:inventoryId', async (req, res) => {
    const {inventoryId} = req.params;
    const {type} = req.query;
    const queryValue = {inventoryId};
    if(type === 'purchase' || type === 'sale') {
       queryValue.type = type.toUpperCase();
    }
    try {
        const timeline = await StockTimeline.find(queryValue).sort({createdAt: -1});
        res.status(200).json(timeline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all batches..by inventory id
router.get('/batches/:inventoryId', verifyToken, async (req, res) => {
    try {
        const {inventoryId} = req.params;
        const batches = await InventoryBatch.find({inventoryId});
        res.status(200).json(batches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all inventory items
router.get('/', verifyToken, async (req, res) => {
    try {
        const items = await Inventory.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a specific inventory item by ID
router.get('/:inventoryId', verifyToken, async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.inventoryId).populate('batch');
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




export default router;
