import express from 'express';
import {Inventory} from '../models/Inventory.js';
import { verifyToken, checkPermission } from '../middleware/authMiddleware.js';
import { StockDetail } from '../models/StockDetail.js';
import mongoose from 'mongoose';

const router = express.Router();

// New route to add new inventory item
router.post("/create", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { itemsDetails } = req.body;
  
      const newInventoryItem = new Inventory(itemsDetails);
      const savedItem = await newInventoryItem.save({ session });

      if(itemsDetails.quantity > 0){
        const stockDetail = new StockDetail({
          inventory_id: savedItem._id,
          quantity: itemsDetails.quantity,
          type: "Opening Stock",
          closing_stock: itemsDetails.quantity,
        });
        await stockDetail.save({ session });
      }
  
      await session.commitTransaction();
  
      res.status(201).json(savedItem);
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ error: error.message });
    } finally {
      session.endSession();
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
        const item = await Inventory.findById(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Adjust stock quantity
router.post('/:itemId/adjust-stock', verifyToken, async (req, res) => {
    try {
        const { adjustmentType, quantity, remarks } = req.body;
        const itemId = req.params.itemId;

        const item = await Inventory.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Calculate new quantity
        const adjustmentAmount = parseInt(quantity);
        const newQuantity = adjustmentType === 'add' 
            ? item.quantity + adjustmentAmount 
            : item.quantity - adjustmentAmount;

        // Create stock detail record
        const stockDetail = new StockDetail({
            inventory_id: itemId,
            date: new Date(),
            quantity: adjustmentAmount,
            type: adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock',
            closing_stock: newQuantity,
            remarks: remarks
        });
        await stockDetail.save();

        // Update inventory quantity
        item.quantity = newQuantity;
        await item.save();

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:itemId/stock-history', verifyToken, async (req, res) => {
    try {
        const stockHistory = await StockDetail.find({ inventory_id: req.params.itemId })
            .sort({ date: -1 }) // Sort by date in descending order

        res.status(200).json(stockHistory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
