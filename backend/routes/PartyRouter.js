import express from "express";
import { Party } from "../models/Party.js";
import { PartyTransaction } from "../models/PartyTransaction.js";

const router = express.Router();

router.post("/create", async (req, res) => {
    try {
        const partyData = { ...req.body };
        
        // Adjust opening_balance based on balance_type
        if (partyData.balance_type === 'collect') {
            partyData.opening_balance = Math.abs(partyData.opening_balance);
        } else if (partyData.balance_type === 'pay') {
            partyData.opening_balance = -Math.abs(partyData.opening_balance);
        }
        
        // Set current_balance equal to opening_balance for new party
        partyData.current_balance = partyData.opening_balance;
        
        const party = await Party.create(partyData);
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

router.get("/details/:partyId", async (req, res) => {
    try {
        const party = await Party.findById(req.params.partyId);
        res.status(200).json(party);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/transactions/:partyId", async (req, res) => {
    try {
        const transactions = await PartyTransaction.find({ party_id: req.params.partyId });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;