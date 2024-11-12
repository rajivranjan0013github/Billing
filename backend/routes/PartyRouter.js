import express from "express";
import { Party } from "../models/Party.js";
import { PartyTransaction } from "../models/PartyTransaction.js";
import { Ledger } from "../models/Ledger.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/create", async (req, res) => {
    // Start a session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const partyData = { ...req.body };
        // Create opening balance in ledger
        const ledgerDoc = new Ledger({
            type: "Opening Balance"
        });
        
        // Adjust opening_balance based on balance_type
        if (partyData.balance_type === 'collect') {
            ledgerDoc.debit = partyData.opening_balance;
            partyData.opening_balance = Math.abs(partyData.opening_balance);
        } else if (partyData.balance_type === 'pay') {
            ledgerDoc.credit = partyData.opening_balance;
            partyData.opening_balance = -Math.abs(partyData.opening_balance);
        }
   
        // Set current_balance equal to opening_balance for new party
        ledgerDoc.balance = partyData.current_balance = partyData.opening_balance;        
        
        // Use session for all database operations
        const party = new Party(partyData);
        await party.save({ session });
        ledgerDoc.party_id = party._id;
        await ledgerDoc.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        res.status(201).json(party);
    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        // End session
        session.endSession();
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

router.get("/ledger/:partyId", async (req, res) => {
    try {
        const ledger = await Ledger.find({ party_id: req.params.partyId });
        res.status(200).json(ledger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;