import mongoose from "mongoose";

const LedgerSchema = new mongoose.Schema({
  distributorId : {type : mongoose.Schema.Types.ObjectId, ref : "distributor"},
  customerId : {type : mongoose.Schema.Types.ObjectId, ref : "customer"},
  balance : {type : Number, default : 0},
  debit : {type : Number, default : 0},
  credit : {type : Number, default : 0},
  invoiceNumber : {type : String},
  description : {type : String},
}, {timestamps : true});

export const Ledger = mongoose.model("Ledger", LedgerSchema);