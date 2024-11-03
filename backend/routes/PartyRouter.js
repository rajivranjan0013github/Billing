import express from "express";
import { Party } from "../models/Party.js";

const router = express.Router();

router.post("/create", async (req, res) => {
    try {
        const party = await Party.create(req.body);
        res.status(201).json(party);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const parties = await Party.find();
        res.status(200).json(parties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;