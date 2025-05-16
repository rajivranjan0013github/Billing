import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const InventoryBatchSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    batchNumber: String,
    HSN: String,
    quantity: { type: Number, default: 0 },
    expiry: String, // mm/yy
    mrp: Number,
    gstPer: Number,
    purchaseRate: Number, // excl gst
    discount: { type: Number, default: 0 },
    saleRate: Number, // without gst
    pack: { type: Number, default: 1 },
  },
  { timestamps: true }
);

InventoryBatchSchema.plugin(pharmacyPlugin);

export const InventoryBatch = mongoose.model(
  "InventoryBatch",
  InventoryBatchSchema
);
