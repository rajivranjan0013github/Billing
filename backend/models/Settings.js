import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  adjustment : {type : Boolean, default : false},
  doctors : [String]
});

export const Settings = mongoose.model("Settings", SettingsSchema);