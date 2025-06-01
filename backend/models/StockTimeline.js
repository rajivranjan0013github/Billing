import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const stockTimelineSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    type: {
      type: String,
      enum: [
        "Adjustment",
        "PURCHASE",
        "SALE",
        "PURCHASE_RETURN",
        "SALE_EDIT",
        "SALE_RETURN",
        "PURCHASE_EDIT",
        "SALE_DELETE",
        "PURCHASE_DELETE",
        "IMPORT",
        "SALE_EDIT_REVERSE",
        "PURCHASE_EDIT_REVERSE",
      ],
    },
    invoiceNumber: String,
    credit: Number,
    debit: Number,
    pack: Number,
    balance: Number,
    batchNumber: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    createdByName: String,
    name: String, // name of the customer or distributor
    mob: String, // mobile number of the customer or distributor
    remarks: String,
  },
  { timestamps: true }
);

stockTimelineSchema.plugin(pharmacyPlugin);

export const StockTimeline = mongoose.model(
  "StockTimeline",
  stockTimelineSchema
);
