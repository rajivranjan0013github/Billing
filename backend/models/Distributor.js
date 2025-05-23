import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const DistributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mob: { type: String },
  email: { type: String },
  openBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  gstin: { type: String },
  state: { type: String },
  district: { type: String },
  stateCode: { type: String },
  DLNumber: { type: String },
  address: { type: String },
  invoices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
  ],
  ledger: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger",
    },
  ],
  payments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  ],
  bankDetails: {
    name: String,
    accountNumber: String,
    ifsc: String,
  },
  credit_period: { type: Number, default: 30 },
  credit_limit: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

DistributorSchema.plugin(pharmacyPlugin);
export const Distributor = mongoose.model("distributor", DistributorSchema);
