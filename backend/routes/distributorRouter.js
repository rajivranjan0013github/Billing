import express from "express";
import { Distributor } from "../models/Distributor.js";
import mongoose from "mongoose";
import {InvoiceSchema} from '../models/InvoiceSchema.js'
import {Payment} from '../models/Payment.js'

const router = express.Router();

router.post("/create", async (req, res) => {
    // Start a session
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const distributorData = req.body;;

        // Use session for all database operations
        const distributor = new Distributor(distributorData);
        await distributor.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        res.status(201).json(distributor);
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
        const parties = await Distributor.find();
        res.status(200).json(parties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/details/:distributorId", async (req, res) => {
    try {
        const [details, invoices, payments] = await Promise.all([
            Distributor.findById(req.params.distributorId),
            InvoiceSchema.find({ distributorId: req.params.distributorId, status: 'active' }),
            Payment.find({ distributor_id: req.params.distributorId })
        ]);

        res.status(200).json({
            details,
            invoices,
            payments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


export default router;