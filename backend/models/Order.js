import mongoose from 'mongoose';
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const orderSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', },
    quantity: { type: Number, required: true },
    MRP : { type: Number, required: true },
    discount : { type: Number, default : 0 },
    expiryDate : { type: Date},
  }],
  totalAmount: { type: Number},
  paidAmount: { type: Number},
  subtotal: { type: Number},
  orderDate: { type: Date, default: Date.now },
  payment : {type : mongoose.Schema.Types.ObjectId, ref : 'Payment'}
});

orderSchema.plugin(hospitalPlugin);
export const Order = mongoose.model('Order', orderSchema);