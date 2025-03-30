import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const InventoryBatchSchema = new mongoose.Schema({
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inventory',
        required : true,
    },
    batchNumber: String,
    HSN : String,
    quantity: {type : Number, default : 0}, 
    expiry : String, // mm/yy
    mrp: Number,
    gstPer: Number,
    purchaseRate: Number, // excl gst
    netRate:Number,  // purchase rate + gst
    saleRate:Number, // without gst
    pack:Number
}, {timestamps : true});

InventoryBatchSchema.plugin(hospitalPlugin);

export const InventoryBatch = mongoose.model("InventoryBatch", InventoryBatchSchema);