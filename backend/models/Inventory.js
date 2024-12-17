import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit : String,
  pack : Number,
  secondary_unit : String,
  quantity : {type : Number, default : 0}, // always in loose value
  item_category : String,
  mfc_name: String,
  img_url : String,
  mrp : Number,
  purchase_rate : Number,
  gst_percentage : Number,
  ptr : Number,
  expiry : String,
  composition : String,
  location : String,
  batch : [{type : mongoose.Schema.Types.ObjectId, ref : 'ItemBatch'}],
}, {timestamps : true});

inventorySchema.plugin(hospitalPlugin)

inventorySchema.methods.NewBatchOperation = async function(batchDetails) {
  if(this.expiry) {
    const oldExpiry = this.expiry.split('/').map(Number);
    const newExpiry = batchDetails.expiry.split('/').map(Number);
    if(newExpiry[2] < oldExpiry[2] || 
      (newExpiry[2] === oldExpiry[2] && newExpiry[1] < oldExpiry[1])) {
      this.expiry = batchDetails.expiry;
      this.mrp = batchDetails.mrp;
      this.purchase_rate = batchDetails.purchase_rate;
      this.gst_percentage = batchDetails.gst_percentage;
      this.ptr = batchDetails.ptr;
    }
  } else {
    this.expiry = batchDetails.expiry;
    this.mrp = batchDetails.mrp;
    this.purchase_rate = batchDetails.purchase_rate;
    this.gst_percentage = batchDetails.gst_percentage;
    this.ptr = batchDetails.ptr;
  }
};

export const Inventory = mongoose.model('Inventory', inventorySchema);