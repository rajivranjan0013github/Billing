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
      ],
    },
    invoiceNumber: String,
    credit: Number,
    debit: Number,
    pack: Number,
    balance: Number,
    batchNumber: String,
    expiry: String,
    mrp: Number,
    purchaseRate: Number, // net purchase rate =
    saleRate: Number, // sale rate also
    gstPer: Number,
    discount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: String,
    distributorName: String,
    distributorMob: String,
    customerName: String,
    customerMob: String,

    remarks: String,
  },
  { timestamps: true }
);

stockTimelineSchema.plugin(pharmacyPlugin);

export const StockTimeline = mongoose.model(
  "StockTimeline",
  stockTimelineSchema
);
