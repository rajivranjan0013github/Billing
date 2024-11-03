import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Supplier } from "../models/Supplier.js";
import { Inventory } from "../models/Inventory.js";
import { Payment } from "../models/Payment.js";

const router = express.Router();

// create order or purchase order or create supplier
router.post("/create", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { supplierInfo, items, total } = req.body;

    // Find or create supplier
    let supplierDoc;
    if (supplierInfo) {
      supplierDoc = await Supplier.findOne({
        name: { $regex: new RegExp(`^${supplierInfo.name}$`, "i") },
      }).session(session);
      if (!supplierDoc) {
        supplierDoc = new Supplier(supplierInfo);
        await supplierDoc.save({ session });
      }
    }

    // Create payment
    const payment = new Payment({
      amount: total.paidAmount,
      paymentMethod: "Cash", // You might want to make this dynamic
      paymentType: { name: "Pharmacy", id: supplierDoc?._id },
      type: "Expense",
      status: total.paidAmount === total.totalAmount ? "paid" : "due",
      description: `Payment for order ${new mongoose.Types.ObjectId()}`,
    });
    await payment.save({ session });

    // Create order (without saving)
    const order = new Order({
      supplier: supplierDoc?._id,
      items: [],
      totalAmount: total.totalAmount,
      paidAmount: total.paidAmount,
      subtotal: total.subtotal,
      payment: payment._id,
    });

    // Check inventory and update items
    for (let item of items) {
      let inventoryItem = await Inventory.findOne({
        name: { $regex: new RegExp(`^${item.name}$`, "i") },
        supplier: supplierDoc?._id,
      }).session(session);

      if (!inventoryItem) {
        inventoryItem = new Inventory({
          name: item.name,
          type: item.type,
          expiryDate: item.expiryDate,
          CP: item.MRP * (1 - item.discount / 100),
          MRP: item.MRP,
          quantity: item.quantity,
          supplier: supplierDoc?._id,
          orders: [{ order: order._id, quantity: item.quantity }],
        });
      } else {
        inventoryItem.quantity += item.quantity;
        inventoryItem.orders.unshift({
          order: order._id,
          quantity: item.quantity,
        });
        if (supplierDoc && !inventoryItem.supplier.equals(supplierDoc._id)) {
          inventoryItem.supplier = supplierDoc._id;
        }
        // Update other fields if necessary
        ["type", "expiryDate", "MRP"].forEach((field) => {
          if (item[field] && item[field] !== inventoryItem[field]) {
            inventoryItem[field] = item[field];
          }
        });
        // we have taken discount in frontend, so we are updating CP
        if (item.discount) {
          if (
            item.MRP &&
            item.MRP * (1 - item.discount / 100) !== inventoryItem.CP
          ) {
            inventoryItem.CP = item.MRP * (1 - item.discount / 100);
          }
        }
      }
      await inventoryItem.save({ session });

      if (supplierDoc && !supplierDoc.items.includes(inventoryItem._id)) {
        supplierDoc.items.unshift(inventoryItem._id);
      }

      order.items.unshift({
        item: inventoryItem._id,
        quantity: item?.quantity,
        MRP : item?.MRP,
        discount : item?.discount,
        expiryDate : item?.expiryDate,
      });
    }

    // Update supplier
    if (supplierDoc) {
      supplierDoc.orders.unshift(order._id);
      supplierDoc.payments.unshift(payment._id);
      supplierDoc.amountDue = (Number(supplierDoc.amountDue) + Number(total.totalAmount - total.paidAmount)).toFixed(2);
      supplierDoc.amountPaid = (Number(supplierDoc.amountPaid) + Number(total.paidAmount)).toFixed(2);
      supplierDoc.lastPurchased = new Date();
      await supplierDoc.save({ session });
    }

    // Save the order
    await order.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(400)
      .json({ message: "Error creating order", error: error.message });
  } finally {
    session.endSession();
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "orderDate",
      order = "desc",
    } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortBy]: order === "asc" ? 1 : -1 },
      populate: [
        { path: "supplier", select: "name" },
        { path: "items.item", select: "name" },
      ],
    };

    const orders = await Order.paginate({}, options);

    res.status(200).json({
      orders: orders.docs,
      totalPages: orders.totalPages,
      currentPage: orders.page,
      totalOrders: orders.totalDocs,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

// get all supplier 
router.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await Supplier.find().select("name lastPurchased amountDue amountPaid");
    res.status(200).json(suppliers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching suppliers", error: error.message });
  }
});


// Get a specific supplier by ID
router.get("/supplier/:supplierId", async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await Supplier.findById(supplierId)
      .select("-hospital -payments")
      .populate({
        path: 'orders',
        select: '-hospital -supplier',
        populate: [
          {
            path: 'payment',
            select: 'amount createdAt'
          },
          {
            path: 'items.item',
            select: 'name type'
          }
        ]
      })
      .populate('items', 'name type MRP CP');

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.status(200).json(supplier);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching supplier", error: error.message });
  }
});

// Get all items (inventory)
router.get("/items", async (req, res) => {
  try {
    const items = await Inventory.find();
    res.status(200).json(items);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching items", error: error.message });
  }
});

export default router;

