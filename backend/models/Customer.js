import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";
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
  openBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
customerSchema.plugin(hospitalPlugin);
export const Customer = mongoose.model("Customer", customerSchema);
