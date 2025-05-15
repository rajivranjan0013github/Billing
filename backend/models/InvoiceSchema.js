import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const invoiceShema = new mongoose.Schema(
  {
    invoiceType: { type: String, enum: ["SALE", "PURCHASE"] }, // sales or purchase
    invoiceNumber: { type: String, required: true },
    distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "distributor" },
    distributorName: String,
    mob: String,
    invoiceDate: { type: Date, default: Date.now },
    paymentDueDate: Date,
    products: [
      {
        inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        productName: String,
        batchNumber: String,
        mfcName: String,
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryBatch",
        },
        expiry: String,
        HSN: String,
        mrp: Number,
        quantity: Number,
        free: Number,
        pack: Number,
        purchaseRate: Number,
        saleRate: Number,
        saleRate: Number,
        schemeInput1: Number,
        schemeInput2: Number,
        discount: Number,
        gstPer: Number,
        amount: Number,
        timeline: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "StockTimeline",
        },
      },
    ],
    grandTotal: Number,
    withGst: { type: Boolean, default: true },
    gstSummary: { type: Object },
    paymentStatus: { type: String, enum: ["paid", "due"] },
    amountPaid: { type: Number, default: 0 },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],

    status: {
      type: String,
      enum: ["active", "cancelled", "returned", "draft"],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    createdByName: String,
    billSummary: {
      subtotal: { type: Number, required: true },
      discountAmount: { type: Number, required: true },
      taxableAmount: { type: Number, required: true },
      gstAmount: { type: Number, required: true },
      adjustment: { type: Number, default: 0 },
      gstSummary: {
        0: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        5: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        12: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        18: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        28: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
      },
      totalQuantity: { type: Number, required: true },
      productCount: { type: Number, required: true },
      grandTotal: { type: Number, required: true },
    },
    amountCalculationType: {
      type: String,
      enum: ["exclusive", "inclusive_gst", "inclusive_all"],
      required: true,
    },
  },
  { timestamps: true }
);

invoiceShema.plugin(pharmacyPlugin);

export const InvoiceSchema = mongoose.model("Invoice", invoiceShema);
