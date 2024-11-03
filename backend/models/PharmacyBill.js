import mongoose from 'mongoose';
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const PharmacyBillSchema = new mongoose.Schema({
  patient : {type : mongoose.Schema.Types.ObjectId, ref : 'Patient'},
  patientInfo: {
    name: String,
    phone: String
  },
  buyerName: String,
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', },
    quantity: Number,
    MRP : { type: Number, required: true },
    discount : { type: Number, default : 0 },
  }],
  totalAmount: { type: Number},
  subtotal: { type: Number},
  amountPaid : { type: Number},
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  createdBy : {type : mongoose.Schema.Types.ObjectId,ref : "Staff",required : true},
}, { timestamps: true });

PharmacyBillSchema.plugin(hospitalPlugin);
export const PharmacyBill = mongoose.model('PharmacyBill', PharmacyBillSchema);

