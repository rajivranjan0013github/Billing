import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const stockTimelineSchema = new mongoose.Schema({
  inventory_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Inventory',
    required: true
  },
  type: {
    type: String, 
    enum: ['Adjustment', 'Purchase', 'Sale']
  },
  invoice_number: String,
  credit : Number,
  debit : Number,
  balance : Number,
  batch_number: String,
  batch_expiry: String,
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
  },
  party_name: String,
  party_mobile: String,
  remarks: String
}, {timestamps : true});

stockTimelineSchema.plugin(hospitalPlugin);

export const StockTimeline = mongoose.model('StockTimeline', stockTimelineSchema); 