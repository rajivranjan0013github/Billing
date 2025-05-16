import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";
const SettingsSchema = new mongoose.Schema({
  adjustment: { type: Boolean, default: false },
});

SettingsSchema.plugin(pharmacyPlugin);
export const Settings = mongoose.model("Settings", SettingsSchema);
