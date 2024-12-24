import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const stockTimelineSchema = new mongoose.Schema({
  inventoryId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  invoiceId : {type : mongoose.Schema.Types.ObjectId, ref : 'Invoice'},
  type: {
    type: String, 
    enum: ['Adjustment', 'PURCHASE', 'SALE']
  },
  invoiceNumber: String,
  credit : Number,
  debit : Number,
  pack : Number,
  balance : Number,
  batchNumber: String,
  expiry: String,
  mrp : Number,
  purchaseRate : Number,
  ptr : Number, // sale rate also
  gstPer : Number,
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
  },
  userName : String,
  partyName: String,
  partyMob: String,
  remarks: String
}, {timestamps : true});

stockTimelineSchema.plugin(hospitalPlugin);

export const StockTimeline = mongoose.model('StockTimeline', stockTimelineSchema); 