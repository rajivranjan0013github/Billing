import mongoose from "mongoose";
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const invoiceShema = new mongoose.Schema({
    invoiceType : {type : String}, // sales oe purchase
    invoiceNumber : {type : String, required : true},
    partyId : {type : mongoose.Schema.Types.ObjectId, ref : 'Party'},
    partyName : String,
    mob : String,
    invoiceDate : {type : Date, default : Date.now},
    paymentDueDate : Date,
    products : [{
        inventoryId : {type:mongoose.Schema.Types.ObjectId, ref:'Inventory'},
        productName : String,
        batchNumber : String,
        batchId : {type:mongoose.Schema.Types.ObjectId, ref : 'InventoryBatch'},
        expiry : String,
        HSN : String,
        mrp : Number,
        quantity : Number,
        free : Number,
        pack : Number,
        purchaseRate : Number,
        ptr : Number,
        schemeInput1 : Number,
        schemeInput2 : Number,
        discount : Number,
        gstPer : Number,
        amount : Number
    }],
    grandTotal : Number,
    withGst : {type : Boolean, default : true},
    gstSummary : {type : Object},
    paymentStatus : {type : String, enum : ['paid', 'due']},
    amountPaid : {type : Number, default : 0},
    payments : [{type : mongoose.Schema.Types.ObjectId, ref : 'Payment'}],
    status : {type : String, },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Staff'},
}, {timestamps:true});

invoiceShema.plugin(hospitalPlugin);

export const InvoiceSchema = mongoose.model('Invoice', invoiceShema);