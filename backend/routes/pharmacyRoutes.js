import express from "express";
import { verifySuperAdmin } from "../middleware/SuperAdminMiddleWare.js";
import { Pharmacy } from "../models/Pharmacy.js";
import mongoose from "mongoose";
import cookie from "cookie";
import { identifyPharmacy } from "../middleware/pharmacyMiddleware.js";
import { presignedUrl } from "../s3.js";
import AccountDetails from "../models/AccountDetails.js";

const router = express.Router();

router.post("/create", verifySuperAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingPharmacy = await Pharmacy.findOne({
      pharmacyId: req.body.pharmacyId,
    }).session(session);
    if (existingPharmacy) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "A pharmacy with this ID already exists" });
    }

    const newPharmacy = new Pharmacy({
      ...req.body,
    });

    const savedPharmacy = await newPharmacy.save({ session });

    // Create default accounts for the pharmacy
    const currentDate = new Date();

    // Create Cash Account
    const cashAccount = new AccountDetails({
      accountType: "CASH",
      balance: 0,
      cashDetails: {
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
    });
    await cashAccount.save({ session });

    // Create Bank Account
    const bankAccount = new AccountDetails({
      accountType: "BANK",
      balance: 0,
      bankDetails: {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        type: "SAVINGS",
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
    });
    await bankAccount.save({ session });

    // Create UPI Account
    const upiAccount = new AccountDetails({
      accountType: "UPI",
      balance: 0,
      upiDetails: {
        upiId: "",
        upiName: "",
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
    });
    await upiAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Pharmacy created successfully with default accounts",
      pharmacy: savedPharmacy,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
});

// New route to fetch pharmacy details
router.get("/getPharmacy", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const pharmacyId = cookies?.pharmacyId;
    if (!pharmacyId) {
      return res.status(400).json({ error: "pharmacy not specified" });
    }

    const pharmacy = await Pharmacy.findOne({ pharmacyId });
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }
    res.status(200).json(pharmacy);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching pharmacy details",
      error: error.message,
    });
  }
});

// New route to update pharmacy information
router.post("/:pharmacyId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const pharmacy = await Pharmacy.findOne({
      pharmacyId: req.params.pharmacyId,
    }).session(session);
    if (!pharmacy) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // Update all fields, including the new category fields
    Object.assign(pharmacy, req.body);

    const updatedPharmacy = await pharmacy.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Pharmacy updated successfully",
      pharmacy: updatedPharmacy,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(400)
      .json({ message: "Error updating pharmacy", error: error.message });
  }
});

router.get("/getUploadUrl", identifyPharmacy, async (req, res) => {
  try {
    const data = await presignedUrl();
    res.status(200).json(data);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error fetching upload url", error: error.message });
  }
});

export default router;
