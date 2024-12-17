import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const itemBatchSchema = new mongoose.Schema({
    inventory_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inventory',
        required : true,
    },
    batch_number: String,
    hsn_code : String,
    quantity: {type : Number, default : 0}, // always in loose value
    expiry : String, // mm/yy
    mrp: Number,
    gst_percentage: Number,
    purchase_rate: Number, // excl gst
    net_purchase_rate:Number,  // purchase rate + gst
    ptr:Number, // without gst
    pack:Number
}, {timestamps : true});

itemBatchSchema.plugin(hospitalPlugin);


export const ItemBatch = mongoose.model("ItemBatch", itemBatchSchema);