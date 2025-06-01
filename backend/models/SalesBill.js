import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const SalesBillCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
  },
  invoice_number: {
    type: Number,
    default: 0,
  },
});

SalesBillCounterSchema.plugin(pharmacyPlugin);
const SalesBillCounter = mongoose.model(
  "SalesBillCounter",
  SalesBillCounterSchema
);

const salesBillSchema = new mongoose.Schema(
  {
    saleType: {
      type: String,
      enum: ["invoice", "deliveryChallan", "quotation", "return"],
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
    },
    returnInvoiceNumber: {
      type: String,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: function () {
        return !this.is_cash_customer;
      },
    },
    is_cash_customer: {
      type: Boolean,
      default: true,
    },
    customerName: String,
    mob: String,
    doctorName: String,
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    paymentDueDate: Date,
    products: [
      {
        types: {
          type: String,
          enum: ["sale", "return"],
          default: "sale",
        },
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
        productName: String,
        batchNumber: String,
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryBatch",
        },
        expiry: String,
        HSN: String,
        mrp: Number,
        quantity: Number,
        pack: Number,
        purchaseRate: Number,
        saleRate: Number,
        discount: Number,
        gstPer: Number,
        mfcName: String,
        amount: Number,
      },
    ],
    grandTotal: Number,
    withGst: {
      type: Boolean,
      default: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "due"],
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
    status: {
      type: String,
      enum: ["active", "cancelled", "returned"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    createdByName: String,
    billSummary: {
      subtotal: { type: Number, required: true },
      discountAmount: { type: Number, required: true },
      taxableAmount: { type: Number, required: true },
      gstAmount: { type: Number, required: true },
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
      returnAmount: { type: Number },
      adjustment: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

salesBillSchema.statics.getNextInvoiceNumber = async function (session) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await SalesBillCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { invoice_number: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `INV/${yearSuffix}/${counter.invoice_number}`;
};

salesBillSchema.statics.getCurrentInvoiceNumber = async function (session) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await SalesBillCounter.findOneAndUpdate(
    { year: currentYear },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `INV/${yearSuffix}/${counter.invoice_number + 1}`;
};
// Apply pharmacy plugin
salesBillSchema.plugin(pharmacyPlugin);

export const SalesBill = mongoose.model("SalesBill", salesBillSchema);
