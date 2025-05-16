import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import AccountDetails from "../models/AccountDetails.js";
import { Payment } from "../models/Payment.js";
import mongoose from "mongoose";

const router = express.Router();

// Get all accounts
router.get("/", verifyToken, async (req, res) => {
  try {
    const accounts = await AccountDetails.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions for an account
router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const { accountId, page = 1 } = req.query;
    const limit = 30;
    const skip = (page - 1) * limit;

    // Validate accountId format
    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({ message: "Invalid account ID format" });
    }

    // Fetch total count of transactions
    const totalCount = await Payment.countDocuments({
      accountId: new mongoose.Types.ObjectId(accountId),
    });

    // Fetch paginated transactions for the specified account
    const transactions = await Payment.find({
      accountId: new mongoose.Types.ObjectId(accountId),
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!transactions) {
      return res.status(404).json({ message: "No transactions found" });
    }

    res.status(200).json({
      transactions,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        limit,
      },
    });
  } catch (error) {
    console.error("Transaction fetch error:", error);
    res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
});

// Get account by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const account = await AccountDetails.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new account
router.post("/", verifyToken, async (req, res) => {
  try {
    const { accountType, bankDetails, upiDetails, cashDetails, otherDetails } =
      req.body;

    let accountData = {
      accountType,
      lastUpdated: new Date(),
    };

    // Set specific details based on account type
    switch (accountType) {
      case "BANK":
        accountData.bankDetails = {
          ...bankDetails,
          openingBalance: bankDetails.openingBalance,
          openingBalanceDate: bankDetails.openingBalanceDate || new Date(),
        };
        accountData.balance = bankDetails.openingBalance;
        break;
      case "UPI":
        accountData.upiDetails = {
          ...upiDetails,
          openingBalance: upiDetails.openingBalance,
          openingBalanceDate: upiDetails.openingBalanceDate || new Date(),
        };
        accountData.balance = upiDetails.openingBalance;
        break;
      case "CASH":
        accountData.cashDetails = {
          ...cashDetails,
          openingBalance: cashDetails.openingBalance,
          openingBalanceDate: cashDetails.openingBalanceDate || new Date(),
        };
        accountData.balance = cashDetails.openingBalance;
        break;
      case "OTHERS":
        accountData.otherDetails = {
          ...otherDetails,
          openingBalance: otherDetails.openingBalance,
          openingBalanceDate: otherDetails.openingBalanceDate || new Date(),
        };
        accountData.balance = otherDetails.openingBalance;
        break;
    }

    const account = new AccountDetails(accountData);
    const savedAccount = await account.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update account
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const account = await AccountDetails.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Update only allowed fields based on account type
    const { accountType, bankDetails, upiDetails, balance } = req.body;

    if (accountType && accountType !== account.accountType) {
      return res.status(400).json({ message: "Cannot change account type" });
    }

    switch (account.accountType) {
      case "BANK":
        if (bankDetails) {
          Object.assign(account.bankDetails, bankDetails);
        }
        break;
      case "UPI":
        if (upiDetails) {
          Object.assign(account.upiDetails, upiDetails);
        }
        break;
      case "CASH":
      case "OTHERS":
        if (balance !== undefined) {
          account.balance = balance;
        }
        break;
    }

    account.lastUpdated = new Date();
    const updatedAccount = await account.save();
    res.json(updatedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Initialize default accounts
router.post("/initialize", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentDate = new Date();

    // Create Cash Account
    const cashAccount = new AccountDetails({
      accountType: "CASH",
      balance: 0,
      cashDetails: {
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
      lastUpdated: currentDate,
    });
    await cashAccount.save({ session });

    // Create Bank Account
    const bankAccount = new AccountDetails({
      accountType: "BANK",
      balance: 0,
      bankDetails: {
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        type: "SAVINGS",
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
      lastUpdated: currentDate,
    });
    await bankAccount.save({ session });

    // Create UPI Account
    const upiAccount = new AccountDetails({
      accountType: "UPI",
      balance: 0,
      upiDetails: {
        upiId: "",
        upiName: "",
        openingBalance: 0,
        openingBalanceDate: currentDate,
      },
      lastUpdated: currentDate,
    });
    await upiAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Default accounts initialized successfully",
      accounts: {
        cash: cashAccount,
        bank: bankAccount,
        upi: upiAccount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
});

export default router;
