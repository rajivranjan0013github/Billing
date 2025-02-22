import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  transactionNumber: String,
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["CREDIT", "DEBIT"],
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  distributorName: String,
  remarks: String,
  balance: Number,
});

const accountDetailsSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      required: true,
      enum: ["CASH", "BANK", "UPI", "OTHERS"],
      uppercase: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [transactionSchema],
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      type: {
        type: String,
        enum: ["SAVINGS", "CURRENT"],
        default: "SAVINGS",
      },
      openingBalance: {
        type: Number,
        default: 0,
      },
      openingBalanceDate: {
        type: Date,
        default: Date.now,
      },
    },
    upiDetails: {
      upiId: String,
      upiName: String,
      openingBalance: {
        type: Number,
        default: 0,
      },
      openingBalanceDate: {
        type: Date,
        default: Date.now,
      },
    },
    cashDetails: {
      openingBalance: {
        type: Number,
        default: 0,
      },
      openingBalanceDate: {
        type: Date,
        default: Date.now,
      },
    },
    otherDetails: {
      openingBalance: {
        type: Number,
        default: 0,
      },
      openingBalanceDate: {
        type: Date,
        default: Date.now,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const AccountDetails = mongoose.model("AccountDetails", accountDetailsSchema);
export default AccountDetails;
