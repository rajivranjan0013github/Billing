import express from 'express';
import { Distributor } from '../models/Distributor.js';
import {verifyToken} from '../middleware/authMiddleware.js';
import { Inventory } from '../models/Inventory.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { Customer } from '../models/Customer.js';
import { StockTimeline } from '../models/StockTimeline.js';
import mongoose from 'mongoose';
const router = express.Router();

router.post('/import-distributors', verifyToken, async (req, res) => {
    try {
        const { distributors } = req.body;
        await Distributor.insertMany(distributors);
        res.status(200).json({ message: 'Distributors imported successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Error importing distributors', error: error.message });
    }
});

router.post('/import-customers', verifyToken, async (req, res) => {
    try {
        const { customers } = req.body;
        await Customer.insertMany(customers);
        res.status(200).json({ message: 'Customers imported successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Error importing customers', error: error.message });
    }
});

router.post('/import-inventory', verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { inventory } = req.body;
        
        for (const item of inventory) {
            if(!item?.name) continue;
            
            // Find inventory
            let inventoryItem = await Inventory.findOne({ name: item?.name, code: item?.code }).session(session);
            
            if (!inventoryItem) {
                // For new inventory, create with all details
                inventoryItem = new Inventory({
                    ...item,
                    quantity:  0
                });
            } else {
                // For existing inventory, update everything except quantity
                const { quantity, ...updateData } = item;
                Object.assign(inventoryItem, updateData);
            }

            if(!item?.batchNumber) {
                await inventoryItem.save({ session });
                continue;
            }

            // Handle batch
            let batch = await InventoryBatch.findOne({
                inventoryId: inventoryItem._id,
                batchNumber: item?.batchNumber
            }).session(session);

            if (!batch) {
                batch = new InventoryBatch({...item, inventoryId: inventoryItem._id});
                inventoryItem.batch.push(batch._id);
            } else {
                Object.assign(batch, {...item, quantity : batch.quantity + item.quantity});
            }
            
            inventoryItem.quantity = inventoryItem.quantity + item.quantity;

            // Save batch first
            await batch.save({ session });

            // Create and save timeline entry
            const timeline = new StockTimeline({
                inventoryId: inventoryItem._id,
                invoiceId: null,
                type: "IMPORT",
                invoiceNumber: null,
                credit: item.quantity,
                balance: inventoryItem.quantity,
                batchNumber: item.batchNumber,
                expiry: item.expiry,
                mrp: item.mrp,
                purchaseRate: item.purchaseRate,
                gstPer: item.gstPer,
                saleRate: item.saleRate,
                pack: item.pack,
                HSN: item.HSN || null,
                createdBy: req.user._id,
                createdByName: req.user.name,
            });
            await timeline.save({ session });

            // Update inventory timeline array and save
            // inventoryItem.timeline = inventoryItem.timeline || [];
            // inventoryItem.batch = inventoryItem.batch || [];
            inventoryItem.timeline.push(timeline._id);
            await inventoryItem.save({ session });
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Inventory imported successfully' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Error importing inventory', error: error.message });
    } finally {
        session.endSession();
    }
});

router.post('/export-inventory', verifyToken, async (req, res) => {
    try {
        // Fetch all inventory batches with populated inventory details
        const inventoryBatches = await InventoryBatch.find()
            .populate({
                path: 'inventoryId',
                model: 'Inventory',
                select: 'name pack category mfcName composition location HSN quantity'
            }).lean();

        // Format the data for export
        const formattedInventory = inventoryBatches.map(batch => ({
            // Inventory details
            name: batch.inventoryId?.name || '',
            pack: batch.pack || batch.inventoryId?.pack || 1,
            category: batch.inventoryId?.category || '',
            mfcName: batch.inventoryId?.mfcName || '',
            composition: batch.inventoryId?.composition || '',
            location: batch.inventoryId?.location || '',
            
            // Batch specific details
            batchNumber: batch.batchNumber || '',
            HSN: batch.HSN || batch.inventoryId?.HSN || '',
            quantity: batch.quantity || 0,
            expiry: batch.expiry || '',
            mrp: batch.mrp || 0,
            gstPer: batch.gstPer || 0,
            purchaseRate: batch.purchaseRate || 0,
            discount: batch.discount || 0,
            saleRate: batch.saleRate || 0,
            
            // Additional metadata
            inventoryId: batch.inventoryId?._id || '',
            batchId: batch._id || '',
        }));

        res.status(200).json(formattedInventory);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error exporting inventory', 
            error: error.message 
        });
    }
});

export default router;