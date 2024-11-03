import express from "express";
import { PharmacyBill } from "../models/PharmacyBill.js";
import { Payment } from "../models/Payment.js";
import { Inventory } from "../models/Inventory.js";
import { Supplier } from "../models/Supplier.js";
import mongoose from "mongoose";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-sales-bill", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { patientInfo, buyerName, items, paymentMethod, totals } = req.body;
    const user = req.user;

    // Create pharmacy bill
    const newPharmacyBill = new PharmacyBill({
      patientInfo,
      buyerName,
      items,
      createdBy: user._id,
      ...totals,
    });

    if (paymentMethod === "Due") {
      newPharmacyBill.amountPaid = 0;
    } else {
      // Create payment
      const payment = new Payment({
        amount: totals.totalAmount,
        paymentMethod,
        paymentType: { name: "Pharmacy", id: newPharmacyBill._id },
        type: "Income",
        createdBy: user._id,
      });
      await payment.save({ session });
      newPharmacyBill.payment = payment._id;
      newPharmacyBill.amountPaid = totals.totalAmount;
    }

    await newPharmacyBill.save({ session });

    // Update inventory quantities
    for (const item of items) {
      await Inventory.findByIdAndUpdate(
        item.item,
        { $inc: { quantity: -item.quantity } },
        { session, new: true }
      );
    }

    await session.commitTransaction();

    // Populate the newPharmacyBill before sending the response
    const populatedBill = await PharmacyBill.findById(newPharmacyBill._id)
      .populate("payment", "amount paymentMethod status")
      .populate("items.item", "name type");

    res.status(201).json(populatedBill);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// New route to get all sales bills
router.get("/sales-bills", async (req, res) => {
  try {
    const salesBills = await PharmacyBill.find()
      .sort({ createdAt: -1 }) // Sort in descending order
      .populate("payment", "amount paymentMethod status")
      .populate("items.item", "name type");
    res.status(200).json(salesBills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New route to edit inventory items
router.post("/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await Inventory.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("supplier", "name"); // Populate the supplier field with the name

    if (!updatedItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New route to add new inventory item
router.post("/inventory", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { itemsDetails } = req.body;

    const newInventoryItem = new Inventory(itemsDetails);
    const savedItem = await newInventoryItem.save({ session });

    await session.commitTransaction();

    res.status(201).json(savedItem);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// New route to delete inventory item
router.delete("/inventory/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    // Find the inventory item
    const inventoryItem = await Inventory.findById(id);
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Remove the item from the supplier's items array if it has a supplier
    if (inventoryItem.supplier) {
      await Supplier.findByIdAndUpdate(
        inventoryItem.supplier,
        { $pull: { items: id } },
        { session }
      );
    }

    // Delete the inventory item
    await Inventory.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    res.status(200).json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Route to get daily bills count, revenue, and payment methods between two dates
router.get("/dashboard-data", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Both startDate and endDate are required" });
    }

    const salesBills = await PharmacyBill.hospitalAwareAggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "payment",
          foreignField: "_id",
          as: "paymentInfo",
        },
      },
      {
        $unwind: "$paymentInfo",
      },
      {
        $addFields: {
          localDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            date: "$localDate",
            paymentMethod: "$paymentInfo.paymentMethod",
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          totalCount: { $sum: "$count" },
          totalRevenue: { $sum: "$revenue" },
          paymentMethods: {
            $push: {
              method: "$_id.paymentMethod",
              count: "$count",
              amount: "$revenue",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json(salesBills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
