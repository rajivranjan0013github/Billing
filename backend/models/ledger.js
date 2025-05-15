import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";
const LedgerSchema = new mongoose.Schema(
  {
    distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "distributor" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "customer" },
    balance: { type: Number, default: 0 },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    invoiceNumber: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

LedgerSchema.plugin(pharmacyPlugin);
export const Ledger = mongoose.model("Ledger", LedgerSchema);
