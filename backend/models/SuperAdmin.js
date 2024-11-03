import mongoose from "mongoose";

const SuperAdminSchema = new mongoose.Schema({
    email:String,
    password:String,
    role:{type:String,default:"superAdmin"}
});

export const SuperAdmin = mongoose.model("SuperAdmin",SuperAdminSchema);