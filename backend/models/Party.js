import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  mob: { type: String },
  email: { type: String },
  openBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  gstin: { type: String },
  panNumber: { type: String },
  DLNumber: { type: String },
  partyType: { type: String, enum: ['customer', 'supplier'], required: true },
  address: { type: String },
  shipping_address: { type: String },
  credit_period: { type: Number, default: 30 },
  credit_limit: { type: Number, default: 0 },
});

partySchema.plugin(hospitalPlugin);
export const Party = mongoose.model("Party", partySchema);