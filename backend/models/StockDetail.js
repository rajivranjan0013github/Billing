import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const stockDetailSchema = new mongoose.Schema({
  inventoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Inventory',
    required: true
  },
  date: { type: Date, default: Date.now },
  quantity: Number,
  type: {
    type: String, 
    enum: ["Opening Stock", "Purchase Invoice", "Sell Invoice", "Add Stock", "Remove Stock"]
  },
  bill_number: String,
  closing_stock: Number,
  remarks: String
});

stockDetailSchema.plugin(hospitalPlugin);

export const StockDetail = mongoose.model('StockDetail', stockDetailSchema); 