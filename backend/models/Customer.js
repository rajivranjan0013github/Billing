import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";
const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mob: {
    type: String,
  },
  address: {
    type: String,
  },
  invoices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesBill",
    },
  ],
  payments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  ],
  ledger: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger",
    },
  ],
  openBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
customerSchema.plugin(pharmacyPlugin);
export const Customer = mongoose.model("Customer", customerSchema);
