import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const debitNoteCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
  },
  debit_note_number: {
    type: Number,
    default: 0,
  },
});

const DebitNoteCounter = mongoose.model(
  "DebitNoteCounter",
  debitNoteCounterSchema
);

const purchaseReturnSchema = new mongoose.Schema(
  {
    // Basic Info
    debitNoteNumber: {
      type: String,
      required: true,
    },

    returnDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // distributor Details
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "distributor",
    },
    distributorName: {
      type: String,
    },
    mob: String,

    // Original Invoice Reference
    originalInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    originalInvoiceNumber: {
      type: String,
    },
    originalInvoiceDate: {
      type: Date,
    },

    // Return Items
    products: [
      {
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
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
        schemeInput1: Number,
        schemeInput2: Number,
        discount: Number,
        gstPer: Number,
        amount: Number,
        reason: {
          type: String,
          enum: ["damaged", "expired", "wrong_item", "excess_stock", "other"],
        },
      },
    ],

    // Return Settings
    claimGSTInReturn: {
      type: Boolean,
      default: true,
    },
    adjustRateForDisc: {
      type: Boolean,
      default: true,
    },

    // Bill Summary
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
    },

    // Payment Details
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
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

    // Metadata
    status: {
      type: String,
      enum: ["draft", "final", "cancelled"],
      default: "final",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  { timestamps: true }
);

// Apply pharmacy plugin
purchaseReturnSchema.plugin(pharmacyPlugin);

purchaseReturnSchema.statics.getNextDebitNoteNumber = async function (session) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await DebitNoteCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { debit_note_number: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `DBN/${yearSuffix}/${counter.debit_note_number}`;
};

purchaseReturnSchema.statics.getCurrentDebitNoteNumber = async function (
  session
) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await DebitNoteCounter.findOneAndUpdate(
    { year: currentYear },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `DBN/${yearSuffix}/${counter.debit_note_number + 1}`;
};

export const PurchaseReturn = mongoose.model(
  "PurchaseReturn",
  purchaseReturnSchema
);
