import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile_number: { type: String },
  email: { type: String },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  gstin: { type: String },
  pan_number: { type: String },
  drug_license_number: { type: String },
  party_type: { type: String, enum: ['customer', 'supplier'], required: true },
  party_category: { type: String },
  billing_address: { type: String },
  shipping_address: { type: String },
  credit_period: { type: Number, default: 30 },
  credit_limit: { type: Number, default: 0 },
});

partySchema.plugin(hospitalPlugin);
export const Party = mongoose.model("Party", partySchema);
