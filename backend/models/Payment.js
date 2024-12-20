import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    payment_number: {
        type: String,
    },
    payment_type: { 
        type: String, 
        enum: ["Payment In", "Payment Out", "Sell Invoice", "Purchase Invoice"],
    },
    payment_method: {
        type: String, 
        enum: ["cash", "upi", "cheque", "card", "bank_transfer"],
    },
    party_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party',
    },
    partyName: {
        type: String,
    },
    remarks: {
        type: String,
        trim: true
    },
    bills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseBill'
    }],
    sales_bills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalesBill'
    }]
}, {
    timestamps: true
});

paymentSchema.plugin(hospitalPlugin);

export const Payment = mongoose.model('Payment', paymentSchema); 