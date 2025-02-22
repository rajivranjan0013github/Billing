import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { SalesBill } from "../models/SalesBill.js";
import { Payment } from "../models/Payment.js";
import { Inventory } from "../models/Inventory.js";
import { StockTimeline } from "../models/StockTimeline.js";

const router = express.Router();

router.get("/metrics", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date calculations
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonthStart = new Date(
      start.getFullYear(),
      start.getMonth() - 1,
      1
    );
    const lastMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);

    // Get sales for the selected period
    const periodSales = await SalesBill.find({
      invoiceDate: {
        $gte: start,
        $lte: end,
      },
      status: "active",
    });

    // Calculate period metrics
    const todayMetrics = periodSales.reduce(
      (acc, sale) => {
        acc.totalRevenue += sale.grandTotal || 0;
        acc.totalSales += 1;
        acc.totalItems += sale.billSummary.totalQuantity || 0;
        return acc;
      },
      { totalRevenue: 0, totalSales: 0, totalItems: 0 }
    );

    // Get payment methods distribution for the period
    const periodPayments = await Payment.find({
      payment_date: {
        $gte: start,
        $lte: end,
      },
      payment_type: "Payment In",
      status: "COMPLETED",
    });

    const paymentMethodsDistribution = periodPayments.reduce((acc, payment) => {
      acc[payment.payment_method] =
        (acc[payment.payment_method] || 0) + payment.amount;
      return acc;
    }, {});

    // Monthly metrics
    const thisMonthSales = await SalesBill.find({
      invoiceDate: { $gte: monthStart, $lte: end },
      status: "active",
    });

    const lastMonthSales = await SalesBill.find({
      invoiceDate: { $gte: lastMonthStart, $lt: lastMonthEnd },
      status: "active",
    });

    const thisMonthRevenue = thisMonthSales.reduce(
      (acc, sale) => acc + (sale.grandTotal || 0),
      0
    );
    const lastMonthRevenue = lastMonthSales.reduce(
      (acc, sale) => acc + (sale.grandTotal || 0),
      0
    );

    const revenueGrowth =
      lastMonthRevenue === 0
        ? 100
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    // Customer metrics
    const thirtyDaysAgo = new Date(start);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = await SalesBill.distinct("distributorId", {
      invoiceDate: { $gte: thirtyDaysAgo },
      status: "active",
      is_cash_customer: false,
    });

    // Inventory metrics
    const inventoryItems = await Inventory.find().populate("batch");
    const lowStockThreshold = 10; // Configure based on your needs

    const inventoryMetrics = {
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringSoonItems: 0,
    };

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    inventoryItems.forEach((item) => {
      if (item.quantity === 0) {
        inventoryMetrics.outOfStockItems++;
      } else if (item.quantity <= lowStockThreshold) {
        inventoryMetrics.lowStockItems++;
      }

      // Check expiring batches
      item.batch.forEach((batch) => {
        if (batch.expiry) {
          const [month, year] = batch.expiry.split("/");
          const expiryDate = new Date(
            2000 + parseInt(year),
            parseInt(month) - 1
          );
          if (expiryDate <= thirtyDaysFromNow) {
            inventoryMetrics.expiringSoonItems++;
          }
        }
      });
    });

    // Financial metrics
    const dueSales = await SalesBill.find({
      paymentStatus: "due",
      status: "active",
    });

    const duePayments = await Payment.find({
      payment_type: "Payment Out",
      status: "PENDING",
    });

    const financialMetrics = {
      totalReceivables: dueSales.reduce(
        (acc, sale) => acc + (sale.grandTotal - sale.amountPaid),
        0
      ),
      overdueReceivables: dueSales
        .filter(
          (sale) => sale.paymentDueDate && new Date(sale.paymentDueDate) < start
        )
        .reduce((acc, sale) => acc + (sale.grandTotal - sale.amountPaid), 0),
      totalPayables: duePayments.reduce(
        (acc, payment) => acc + payment.amount,
        0
      ),
      dueThisWeek: duePayments
        .filter((payment) => {
          const dueDate = new Date(payment.payment_date);
          const weekFromNow = new Date(start);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return dueDate <= weekFromNow;
        })
        .reduce((acc, payment) => acc + payment.amount, 0),
    };

    // Recent transactions
    const recentTransactions = await StockTimeline.find({
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("type invoiceNumber credit debit createdAt");

    const formattedTransactions = recentTransactions.map((t) => ({
      type: t.type.toLowerCase(),
      date: t.createdAt,
      amount: t.credit || t.debit,
      reference: t.invoiceNumber,
    }));

    // Sales trend
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const salesTrend = [];

    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = await SalesBill.find({
        invoiceDate: { $gte: date, $lt: nextDate },
        status: "active",
      });

      salesTrend.push({
        date: date.toISOString().split("T")[0],
        revenue: daySales.reduce(
          (acc, sale) => acc + (sale.grandTotal || 0),
          0
        ),
      });
    }

    res.json({
      todayMetrics,
      monthlyMetrics: {
        revenue: thisMonthRevenue,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
      },
      customerMetrics: {
        activeCustomers: activeCustomers.length,
      },
      inventoryMetrics,
      financialMetrics,
      paymentMethodsDistribution,
      recentTransactions: formattedTransactions,
      salesTrend,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
