import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const PaymentCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
  },
  payment_number: {
    type: Number,
    default: 0,
  },
});
PaymentCounterSchema.plugin(pharmacyPlugin);

const PaymentCounter = mongoose.model("PaymentCounter", PaymentCounterSchema);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    paymentNumber: {
      type: String,
    },

    paymentType: {
      type: String,
      enum: ["Payment In", "Payment Out"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CHEQUE", "CARD", "BANK"],
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "distributor",
    },
    distributorName: {
      type: String,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountDetails",
    },
    accountBalance: {
      type: Number,
      default: 0,
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
    salesBills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SalesBill",
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    createdByName: String,
  },
  { timestamps: true }
);

paymentSchema.plugin(pharmacyPlugin);

paymentSchema.statics.getNextPaymentNumber = async function (session) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await PaymentCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { payment_number: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `PAY/${yearSuffix}/${counter.payment_number}`;
};

paymentSchema.statics.getCurrentPaymentNumber = async function (session) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await PaymentCounter.findOneAndUpdate(
    { year: currentYear },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `PAY/${yearSuffix}/${counter.payment_number + 1}`;
};

export const Payment = mongoose.model("Payment", paymentSchema);
