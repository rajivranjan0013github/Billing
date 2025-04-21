import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const DistributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mob: { type: String },
  email: { type: String },
  openBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  gstin: { type: String },
  panNumber: { type: String },
  DLNumber: { type: String },
  address: { type: String },
  bankDetails : { 
    name : String,
    accountNumber : String,
    ifsc : String
  },
  credit_period: { type: Number, default: 30 },
  credit_limit: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

DistributorSchema.plugin(hospitalPlugin);
export const Distributor = mongoose.model("distributor", DistributorSchema);