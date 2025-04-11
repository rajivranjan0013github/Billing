import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
const router = express.Router();
import { Settings } from "../models/Settings.js";

router.post('/', verifyToken, async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




export default router;