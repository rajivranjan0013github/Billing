import express from "express";
const router = express.Router();
import { Customer } from "../models/Customer.js";

// Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single customer
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "invoices"
    );
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
  const customer = new Customer({
    name: req.body.name,
    mobileNumber: req.body.mobileNumber,
    address: req.body.address,
  });

  try {
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
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

    if (req.body.name) customer.name = req.body.name;
    if (req.body.mobileNumber) customer.mobileNumber = req.body.mobileNumber;
    if (req.body.address) customer.address = req.body.address;

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
    await customer.deleteOne();
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
