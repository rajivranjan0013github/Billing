import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    trim: true,
  },
  email: {
    // Keeping email as per your modification, very basic
    type: String,
    unique: true, // Typically, email should be unique
    sparse: true, // Allows null/undefined, but unique if value exists
    trim: true,
    lowercase: true,
    // required: true, // Consider if email should be strictly required
  },
  password: {
    type: String,
    trim: true,
    // required: true, // Consider if password should be strictly required
  },
  mobileNumber: {
    type: String,
    trim: true,
    // We could add a regex validator here if needed
  },
  role: {
    type: String,
    enum: ["user", "doctor"],
    default: "user",
  },
  // All other fields like pharmacy, employeeID, roles, contactNumber, address, etc., will be removed
  // isActive field will also be removed for minimality
});

staffSchema.plugin(pharmacyPlugin);
export const Staff = mongoose.model("Staff", staffSchema);
