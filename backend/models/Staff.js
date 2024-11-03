import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  password: {
    type: String,
    trim: true,
  },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  employeeID: { type: String, unique: true, sparse: true },
  roles: [
    {
      type: String,
      enum: [
        "admin",
        "pharmacist",
        "cashier",
      ],
    },
  ],
  contactNumber: { type: String }, // Add this new field
  address: {
    type: String,
  },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
});

staffSchema.plugin(hospitalPlugin);
export const Staff = mongoose.model("Staff", staffSchema);
