import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit : String,
  pack : Number,
  secondary_unit : String,
  quantity : {type : Number, default : 0}, // always in loose value
  category : String,
  mfcName: String,
  imgUri : String,
  mrp : Number,
  purchaseRate : Number,
  gstPer : Number,
  ptr : Number,
  expiry : String,
  composition : String,
  location : String,
  HSN : String,
  batch : [{type : mongoose.Schema.Types.ObjectId, ref : 'InventoryBatch'}],
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
      this.purchaseRate = batchDetails.purchaseRate;
      this.gstPer = batchDetails.gstPer;
      this.ptr = batchDetails.ptr;
      this.HSN = batchDetails.HSN
    }
  } else {
    this.expiry = batchDetails.expiry;
    this.mrp = batchDetails.mrp;
    this.purchaseRate = batchDetails.purchaseRate;
    this.gstPer = batchDetails.gstPer;
    this.ptr = batchDetails.ptr;
    this.HSN = batchDetails.HSN
  }
};

export const Inventory = mongoose.model('Inventory', inventorySchema);