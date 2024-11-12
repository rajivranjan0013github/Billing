import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const ledgerSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    credit: { type: Number},
    debit: { type: Number},
    balance: { type: Number},
    type: {
        type: String, 
        enum: ["Opening Balance", "Purchase Invoice", "Sell Invoice", "Payment In", "Payment Out"]
    },
    bill_number: String,
    bill_id : String,
    party_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party',
    },
    description: String,
});

ledgerSchema.plugin(hospitalPlugin);

export const Ledger = mongoose.model("Ledger", ledgerSchema);

