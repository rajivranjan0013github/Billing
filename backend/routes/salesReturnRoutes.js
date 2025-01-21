const express = require("express");
const router = express.Router();
const SalesReturn = require("../models/SalesReturn");
const { isAuthenticated } = require("../middleware/auth");
const Inventory = require("../models/Inventory");
const Batch = require("../models/Batch");

// Get return number
router.get("/return-number", isAuthenticated, async (req, res) => {
  try {
    const lastReturn = await SalesReturn.findOne().sort({ createdAt: -1 });
    let nextNumber = "RET-0001";

    if (lastReturn) {
      const lastNumber = parseInt(lastReturn.returnNumber.split("-")[1]);
      nextNumber = `RET-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    res.json({ returnNumber: nextNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create sales return
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    const returnData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const salesReturn = new SalesReturn(returnData);
    await salesReturn.save();

    // Update inventory for returned items
    for (const product of returnData.products) {
      // Find the batch
      const batch = await Batch.findById(product.batchId);
      if (!batch) {
        throw new Error(`Batch not found for product: ${product.productName}`);
      }

      // Update batch quantity
      batch.quantity += product.quantity;
      await batch.save();

      // Update inventory total quantity
      const inventory = await Inventory.findById(product.inventoryId);
      if (!inventory) {
        throw new Error(
          `Inventory not found for product: ${product.productName}`
        );
      }
      inventory.totalQuantity += product.quantity;
      await inventory.save();
    }

    res.status(201).json(salesReturn);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all sales returns
router.get("/list", isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.returnDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      query.status = status;
    }

    const salesReturns = await SalesReturn.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json(salesReturns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single sales return
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("partyId", "name address");

    if (!salesReturn) {
      return res.status(404).json({ message: "Sales return not found" });
    }

    res.json(salesReturn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update sales return status
router.patch("/:id/status", isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    const salesReturn = await SalesReturn.findById(req.params.id);

    if (!salesReturn) {
      return res.status(404).json({ message: "Sales return not found" });
    }

    salesReturn.status = status;
    await salesReturn.save();

    res.json(salesReturn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
