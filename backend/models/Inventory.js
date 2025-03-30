import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit : String,
  pack : Number,
  secondary_unit : String,
  quantity : {type : Number, default : 0},
  category : String,
  mfcName: String,
  imgUri : String,
  composition : String,
  location : String,
  HSN : String,
  batch : [{type : mongoose.Schema.Types.ObjectId, ref : 'InventoryBatch'}],
}, {timestamps : true});

inventorySchema.plugin(hospitalPlugin)

export const Inventory = mongoose.model('Inventory', inventorySchema);