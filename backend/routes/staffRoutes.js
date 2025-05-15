import express from "express";
import { Staff } from "../models/Staff.js";
import { checkPermission, verifyToken } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const router = express.Router();

// Create a new staff member (Admin only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const staffData = { ...req.body };

    // Hash password if provided
    if (staffData.password) {
      const salt = await bcrypt.genSalt(10);
      staffData.password = await bcrypt.hash(staffData.password, salt);
    }

    const staff = new Staff(staffData);
    await staff.save();

    res.status(201).json({
      staff: staff.toObject({
        versionKey: false,
        transform: (doc, ret) => {
          delete ret.password;
          return ret;
        },
      }),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all staff members (Admin and Manager)
router.get("/", verifyToken, async (req, res) => {
  try {
    const staffMembers = await Staff.find().select("-password");
    res.json(staffMembers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.user._id).select("-password");
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific staff member by ID (Admin, Manager, and Self)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select("-password");
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const staffData = { ...req.body };

    // Hash password if provided
    if (staffData.password) {
      const salt = await bcrypt.genSalt(10);
      staffData.password = await bcrypt.hash(staffData.password, salt);
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      staffData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json(updatedStaff);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a staff member (Admin only)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    res.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
