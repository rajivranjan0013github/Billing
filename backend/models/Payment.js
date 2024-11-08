import mongoose from 'mongoose';
import {hospitalPlugin} from '../plugins/hospitalPlugin.js'

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    payment_type: { 
        type: String, 
        enum: ["Income", "Expense"],
        required: true,
    },
    payment_method: {
        type: String, 
        enum: ["Cash", "UPI", "Cheque", "Card", "Bank Transfer"],
        required: true
    },
    party_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party',
        required: true,
    },
    party_name: {
        type: String,
        required: true,
    },
    remarks: {
        type: String,
        trim: true
    },
    bill_number: {
        type: String,
        trim: true,
    },
    bill_id: {
        type: String,
        trim: true,
        sparse: true
    }
}, {
    timestamps: true
});

paymentSchema.plugin(hospitalPlugin);

export const Payment = mongoose.model('Payment', paymentSchema); 