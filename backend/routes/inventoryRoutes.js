import express from 'express';
import {Inventory} from '../models/Inventory.js';
import { verifyToken, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new inventory item or update quantity if it exists
router.post('/', verifyToken, checkPermission('write:inventory'), async (req, res) => {
    try {
        const { name, quantityNotFromOrders, ...otherFields } = req.body;
        
        let item = await Inventory.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });

        if (item) {
            item.quantityNotFromOrders += quantityNotFromOrders;
            await item.updateTotalQuantity();
        } else {
            item = new Inventory({ name, quantityNotFromOrders, ...otherFields });
            await item.updateTotalQuantity();
        }

        const savedItem = await item.save();
        res.status(item ? 200 : 201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all inventory items
router.get('/', verifyToken, checkPermission('read:inventory'), async (req, res) => {
    try {
        const items = await Inventory.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a specific inventory item by ID
router.get('/:id', verifyToken, checkPermission('read:inventory'), async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an inventory item
router.put('/:id', verifyToken, checkPermission('write:inventory'), async (req, res) => {
    try {
        const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an inventory item
router.delete('/:id', verifyToken, checkPermission('write:inventory'), async (req, res) => {
    try {
        const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search inventory items by name or generic name
router.get('/search/:query', verifyToken, checkPermission('read:inventory'), async (req, res) => {
    try {
        const items = await Inventory.find({
            $or: [
                { name: { $regex: req.params.query, $options: 'i' } },
                { genericName: { $regex: req.params.query, $options: 'i' } }
            ]
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get low stock items (quantity below a certain threshold)
router.get('/low-stock/:threshold', verifyToken, checkPermission('read:inventory'), async (req, res) => {
    try {
        const threshold = parseInt(req.params.threshold);
        const items = await Inventory.find({ quantity: { $lt: threshold } });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get items expiring soon (within the next 30 days)
router.get('/expiring-soon', verifyToken, checkPermission('read:inventory'), async (req, res) => {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const items = await Inventory.find({
            expirationDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update quantity of an item (for restocking or sales)
router.patch('/:id/update-quantity', verifyToken, checkPermission('write:inventory'), async (req, res) => {
    try {
        const { quantity } = req.body;
        const updatedItem = await Inventory.findByIdAndUpdate(
            req.params.id,
            { $inc: { quantity: quantity } },
            { new: true }
        );
        if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;
