import mongoose from 'mongoose';
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const supplierSchema = new mongoose.Schema({  
  name: { type: String, required: true },
  address : String,
  phone : String,
  email : String,
  lastPurchased : {type : Date, default : Date.now},
  amountPaid : {type : Number, default : 0},
  amountDue : {type : Number, default : 0},
  orders : [{type : mongoose.Schema.Types.ObjectId, ref : 'Order'}],
  items : [{type : mongoose.Schema.Types.ObjectId, ref : 'Inventory'}],
  payments : [{type : mongoose.Schema.Types.ObjectId, ref : 'Payment'}],
});

supplierSchema.plugin(hospitalPlugin);
export const Supplier = mongoose.model('Supplier', supplierSchema);