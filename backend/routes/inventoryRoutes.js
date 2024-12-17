import express from 'express';
import {Inventory} from '../models/Inventory.js';
import { verifyToken, checkPermission } from '../middleware/authMiddleware.js';
import { ItemBatch } from '../models/ItemBatch.js';
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
    const {_id, inventory_id, ...details} = req.body; // _id is batch id
    
    try {
        const itemDetails = await Inventory.findById(inventory_id).session(session);
        if(!itemDetails) throw new Error('Item not found');
        
        // Force quantity to be a number
        itemDetails.quantity = Number(itemDetails.quantity || 0);
        details.quantity = Number(details.quantity);
        
        // creating timeline for the batch
        const timeline = new StockTimeline({
            inventory_id: inventory_id,
            type: 'Adjustment',
            batch_number: details.batch_number,
            batch_expiry: details.expiry,
        });

        if (_id) {
            const batchDetails = await ItemBatch.findById(_id).session(session);
            if(!batchDetails) throw new Error('Batch not found');
            
            const oldQuantity = Number(batchDetails.quantity || 0);
            const newQuantity = Number(details.quantity || 0);
            
            if(newQuantity > oldQuantity){
                timeline.credit = newQuantity - oldQuantity;
                itemDetails.quantity += timeline.credit;
            } else {
                timeline.debit = oldQuantity - newQuantity;
                itemDetails.quantity -= timeline.debit;
            }
            Object.assign(batchDetails, details);
            itemDetails.NewBatchOperation(details);
            await batchDetails.save({session});
        } else {
            const newBatch = new ItemBatch({inventory_id: inventory_id, ...details});
            await newBatch.save({session});
            itemDetails.batch.push(newBatch._id);
            itemDetails.NewBatchOperation(details);
            itemDetails.quantity += Number(details.quantity);
            timeline.credit = Number(details.quantity);
        }
        
        timeline.balance = Number(itemDetails.quantity);
        await timeline.save({session});
        await itemDetails.save({session});
        const updatedItem = await Inventory.findById(inventory_id).populate('batch').session(session);
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
        const batch = await ItemBatch.findByIdAndDelete(batchId).session(session);
        if(!batch) throw new Error('Batch not found');
        const itemDetails = await Inventory.findById(batch.inventory_id).session(session);
        itemDetails.quantity -= Number(batch.quantity);
        // Remove the batch ID from the itemDetails.batch array
        itemDetails.batch = itemDetails.batch.filter(id => id.toString() !== batchId);
        const timeline = new StockTimeline({
            inventory_id: batch.inventory_id,
            type: 'Adjustment',
            batch_number: batch.batch_number,
            batch_expiry: batch.expiry,
            debit: Number(batch.quantity),
            balance: Number(itemDetails.quantity),
        });
        await timeline.save({session});
        await itemDetails.save({session});
        const updatedItem = await Inventory.findById(batch.inventory_id).populate('batch').session(session);
        await session.commitTransaction();
        res.status(200).json(updatedItem);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

router.get('/timeline/:inventory_id', async (req, res) => {
    const {inventory_id} = req.params;
    try {
        const timeline = await StockTimeline.find({inventory_id: inventory_id}).sort({createdAt: -1});
        res.status(200).json(timeline);
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
router.get('/:itemId', verifyToken, async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.itemId).populate('batch');
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




export default router;
