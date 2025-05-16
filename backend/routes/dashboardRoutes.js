import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { SalesBill } from "../models/SalesBill.js";
import { Payment } from "../models/Payment.js";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/metrics", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date calculations
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // --- Sales Calculations ---
    const salesPipeline = [
      {
        $match: {
          invoiceDate: { $gte: start, $lte: end },
          status: "active",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalAmountReceived: { $sum: "$amountPaid" },
          totalSales: { $sum: 1 },
          totalItems: { $sum: "$billSummary.totalQuantity" },
          dueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "due"] },
                { $subtract: ["$grandTotal", "$amountPaid"] },
                0,
              ],
            },
          },
          dueInvoicesCount: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "due"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: { $ifNull: ["$totalRevenue", 0] },
          totalAmountReceived: { $ifNull: ["$totalAmountReceived", 0] },
          totalSales: { $ifNull: ["$totalSales", 0] },
          totalItems: { $ifNull: ["$totalItems", 0] },
          totalAmountDue: { $ifNull: ["$dueAmount", 0] },
          dueInvoicesCount: { $ifNull: ["$dueInvoicesCount", 0] },
        },
      },
    ];

    const salesSummaryResult = await SalesBill.pharmacyAwareAggregate(salesPipeline);
    const salesSummary =
      salesSummaryResult[0] || {
        totalRevenue: 0,
        totalAmountReceived: 0,
        totalSales: 0,
        totalItems: 0,
        totalAmountDue: 0,
        dueInvoicesCount: 0,
      };

    // --- Purchase Calculations ---
    const purchasePipeline = [
       {
        $match: {
          invoiceDate: { $gte: start, $lte: end },
          status: "active",
          invoiceType: "PURCHASE",
        },
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$grandTotal" },
          totalAmountPaid: { $sum: "$amountPaid" },
          totalPurchases: { $sum: 1 },
          dueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "due"] },
                { $subtract: ["$grandTotal", "$amountPaid"] },
                0,
              ],
            },
          },
          dueInvoicesCount: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "due"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalCost: { $ifNull: ["$totalCost", 0] },
          totalAmountPaid: { $ifNull: ["$totalAmountPaid", 0] },
          totalPurchases: { $ifNull: ["$totalPurchases", 0] },
          totalAmountDue: { $ifNull: ["$dueAmount", 0] },
          dueInvoicesCount: { $ifNull: ["$dueInvoicesCount", 0] },
        },
      },
    ];

    const purchaseSummaryResult = await InvoiceSchema.pharmacyAwareAggregate(purchasePipeline);
    const purchaseSummary =
      purchaseSummaryResult[0] || {
        totalCost: 0,
        totalAmountPaid: 0,
        totalPurchases: 0,
        totalAmountDue: 0,
        dueInvoicesCount: 0,
      };


    // --- Payment Calculations ---
    const paymentInPipeline = [
        {
            $match: {
                paymentDate: { $gte: start, $lte: end },
                paymentType: "Payment In",
                status: "COMPLETED",
            },
        },
        {
            $facet: {
                totalCollection: [
                    { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
                    { $project: { _id: 0, totalAmount: { $ifNull: ["$totalAmount", 0] } } }
                ],
                accountWiseCollection: [
                    {
                        $group: {
                             _id: "$accountId",
                             totalAmount: { $sum: "$amount" }
                        }
                    },
                     { $sort: { _id: 1 } },
                ],
                methodWiseCollection: [
                     { $group: { _id: "$paymentMethod", totalAmount: { $sum: "$amount" } } },
                     { $project: { _id: 0, method: "$_id", totalAmount: 1 } },
                     { $sort: { method: 1 } },
                ]
            }
        }
    ];

    const paymentOutPipeline = [
        {
            $match: {
                paymentDate: { $gte: start, $lte: end },
                paymentType: "Payment Out",
                status: "COMPLETED",
            },
        },
        {
            $facet: {
                totalPayment: [
                    { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
                    { $project: { _id: 0, totalAmount: { $ifNull: ["$totalAmount", 0] } } }
                ],
                 methodWisePayment: [
                     { $group: { _id: "$paymentMethod", totalAmount: { $sum: "$amount" } } },
                     { $project: { _id: 0, method: "$_id", totalAmount: 1 } },
                     { $sort: { method: 1 } },
                 ],
                 accountWisePayment: [
                    {
                        $group: {
                             _id: "$accountId",
                             totalAmount: { $sum: "$amount" }
                        }
                    },
                     { $sort: { _id: 1 } },
                 ]
            }
        }
    ];

    const [paymentInResult, paymentOutResult] = await Promise.all([
      Payment.pharmacyAwareAggregate(paymentInPipeline),
      Payment.pharmacyAwareAggregate(paymentOutPipeline),
    ]);

    const totalPaymentIn = paymentInResult[0]?.totalCollection[0]?.totalAmount || 0;
    const accountWiseCollection = paymentInResult[0]?.accountWiseCollection || [];
    const methodWiseCollectionIn = paymentInResult[0]?.methodWiseCollection || [];

    const totalPaymentOut = paymentOutResult[0]?.totalPayment[0]?.totalAmount || 0;
    const methodWiseCollectionOut = paymentOutResult[0]?.methodWisePayment || [];
    const accountWisePaymentOut = paymentOutResult[0]?.accountWisePayment || [];

    const paymentSummary = {
        totalPaymentIn,
        totalPaymentOut,
        netCashFlow: totalPaymentIn - totalPaymentOut,
        accountWiseCollection: accountWiseCollection.map(acc => ({ accountId: acc._id, totalAmount: acc.totalAmount })),
        paymentInMethods: methodWiseCollectionIn,
        paymentOutMethods: methodWiseCollectionOut,
        accountWisePayment: accountWisePaymentOut.map(acc => ({ accountId: acc._id, totalAmount: acc.totalAmount })),
    };


    // --- Financial Metrics (Strictly based on sales/purchases within the range) ---
    const financialMetrics = {
        totalReceivables: salesSummary.totalAmountDue, // Receivables from sales made in the period
        totalPayables: purchaseSummary.totalAmountDue, // Payables from purchases made in the period
    };

    // --- Final Response (Only range-bound metrics) ---
    res.json({
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      salesSummary, 
      purchaseSummary,
      paymentSummary,
      financialMetrics, // Contains only range-relevant receivables/payables
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
