import express from "express";
import { Distributor } from "../models/Distributor.js";
import mongoose from "mongoose";
import {InvoiceSchema} from '../models/InvoiceSchema.js'
import {Payment} from '../models/Payment.js'
import {Ledger} from '../models/ledger.js'

const router = express.Router();

router.post("/create", async (req, res) => {
    // Start a session
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const distributorData = req.body;
        // Use session for all database operations
        const distributor = new Distributor({...distributorData, currentBalance: distributorData.openBalance});
        await distributor.save({ session });

        const ledger = new Ledger({
            distributorId : distributor._id,
            balance : distributorData.openBalance,
            description : "Opening Balance",
        });
        if(distributorData.openBalance > 0){
            ledger.debit = distributorData.openBalance;
        }else{
            ledger.credit = distributorData.openBalance * -1;
        }  
        await ledger.save({ session });

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
            Payment.find({ distributorId: req.params.distributorId })
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

router.put("/update/:id", async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const distributorData = req.body;
        
        const distributor = await Distributor.findByIdAndUpdate(
            id,
            distributorData,
            { new: true, session }
        );
        
        if (!distributor) {
            throw new Error("Distributor not found");
        }

        await session.commitTransaction();
        res.status(200).json(distributor);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

router.get("/ledger/:distributorId", async (req, res) => {
    try {
        const id = req.params.distributorId;
        const ledger = await Ledger.find({ 
            $or: [
                { distributorId: id },
                { customerId: id }
            ]
        });
        res.status(200).json(ledger);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;