import express from "express";
const router = express.Router();
import { Customer } from "../models/Customer.js";
import { Ledger } from "../models/ledger.js";

// Get all customers
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || "";
    const searchType = req.query.searchType || "name";

    let query = {};
    if (searchQuery) {
      if (searchType === "name") {
        query.name = { $regex: searchQuery, $options: "i" };
      } else if (searchType === "mobile") {
        query.mob = { $regex: searchQuery, $options: "i" };
      }
    }

    const [customers, totalCount] = await Promise.all([
      Customer.find(query).skip(skip).limit(limit),
      Customer.countDocuments(query),
    ]);

    res.json({
      customers,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single customer
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("invoices")
      .populate("payments");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create customer
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    customer.currentBalance = customer.openBalance;
    const ledgerEntry = new Ledger({
      customerId: customer._id,
      balance: customer.openBalance,
      description: "Opening Balance",
    });
    if (customer.openBalance > 0) {
      ledgerEntry.debit = customer.openBalance;
    } else {
      ledgerEntry.credit = customer.openBalance * -1;
    }
    await ledgerEntry.save();
    customer.ledger.push(ledgerEntry._id);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.patch("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    Object.assign(customer, req.body);
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await Ledger.deleteMany({ customerId: customer._id });
    await customer.deleteOne();
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer ledger
router.get("/ledger/:customerId", async (req, res) => {
  try {
    const id = req.params.customerId;
    const customer = await Customer.findById(id).populate("ledger");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer.ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
