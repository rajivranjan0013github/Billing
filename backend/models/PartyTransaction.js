import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const PartyTransactionSchema = new mongoose.Schema({
  party_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Party',
    required: true
  },
  date: { type: Date, default: Date.now },
  amount: Number,
  amount_paid : Number,
  type: {
    type: String, 
    enum: ["Opening Balance", "Purchase Invoice", "Sell Invoice", "Payment In", "Payment Out"]
  },
  bill_number: String,
  invoice_id : String,
});

PartyTransactionSchema.plugin(hospitalPlugin);

export const PartyTransaction = mongoose.model('PartyTransaction', PartyTransactionSchema); 