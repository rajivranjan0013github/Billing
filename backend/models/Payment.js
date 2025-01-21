import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    payment_type: {
      type: String,
      enum: ["Payment In", "Payment Out"],
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["CASH", "UPI", "CHEQUE", "CARD", "BANK"],
      required: true,
    },
    payment_date: {
      type: Date,
      default: Date.now,
    },
    party_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
    },
    partyName: {
      type: String,
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountDetails",
    },
    transactionNumber: String,
    chequeNumber: String,
    chequeDate: Date,
    micrCode: String,
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "COMPLETED",
    },
    remarks: {
      type: String,
      trim: true,
    },
    bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    sales_bills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesBill",
      },
    ],
  },
  {
    timestamps: true,
  }
);

paymentSchema.plugin(hospitalPlugin);

export const Payment = mongoose.model("Payment", paymentSchema);
