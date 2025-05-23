import express from "express";
import { Distributor } from "../models/Distributor.js";
import mongoose from "mongoose";
import { Ledger } from "../models/ledger.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  // Start a session
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const distributorData = req.body;
    // Use session for all database operations
    const distributor = new Distributor({
      ...distributorData,
      currentBalance: distributorData.openBalance,
    });
    await distributor.save({ session });

    const ledger = new Ledger({
      distributorId: distributor._id,
      balance: distributorData.openBalance,
      description: "Opening Balance",
    });
    if (distributorData.openBalance > 0) {
      ledger.debit = distributorData.openBalance;
    } else {
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
    const details = await Distributor.findById(req.params.distributorId);
    if (!details) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    // We will no longer fetch invoices and payments here.
    // These will be fetched by separate dedicated routes.
    res.status(200).json({
      details,
      // invoices and payments removed from here
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New route to fetch invoices for a distributor
router.get("/invoices/:distributorId", async (req, res) => {
  try {
    const distributor = await Distributor.findById(
      req.params.distributorId
    ).populate({
      path: "invoices",
    });

    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    // The distributor.invoices field will now contain the actual invoice documents (or be filtered by status)
    res.status(200).json(distributor.invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New route to fetch payments for a distributor
router.get("/payments/:distributorId", async (req, res) => {
  try {
    const distributor = await Distributor.findById(
      req.params.distributorId
    ).populate("payments");

    if (!distributor) {
      return res.status(404).json({ message: "Distributor not found" });
    }
    // The distributor.payments field will now contain the actual payment documents
    res.status(200).json(distributor.payments);
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
    const ledger = await Distributor.findById(id).populate("ledger");
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }
    res.status(200).json(ledger.ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Distributor.findByIdAndDelete(id);
    res.status(200).json({ message: "Distributor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
