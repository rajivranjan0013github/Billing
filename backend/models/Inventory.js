import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit : String,
  secondary_unit : {
    unit : String,
    conversion_rate : Number,
  },
  expiry_date: { type: Date, },
  mrp: Number,
  quantity: { type: Number, default: 0 },
  gst_percentage:Number,
  hsn_code:String,
  batch_number:String,
  item_category : String,
  company_name : String,
  manufacturer_name: String,
  pack : String,
  sales_info : {
    is_tax_included : {type : Boolean, default : false},
    price_per_unit : Number,
  },
  purchase_info : {
    is_tax_included : {type : Boolean, default : false},
    price_per_unit : Number,
  }
});

inventorySchema.plugin(hospitalPlugin)

// Method to update total quantity
inventorySchema.methods.updateTotalQuantity = function() {
  this.totalQuantity = this.quantityNotFromOrders + this.quantityFromOrders;
  return this.save();
};

export const Inventory = mongoose.model('Inventory', inventorySchema);