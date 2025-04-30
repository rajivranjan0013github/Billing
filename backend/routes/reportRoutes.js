import express from "express";
import { SalesBill } from "../models/SalesBill.js";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const router = express.Router();

// Helper function to get date range
const getDateRange = (params) => {
  if (params.startDate && params.endDate) {
    return {
      $gte: parseISO(params.startDate),
      $lte: parseISO(params.endDate),
    };
  } else if (params.date) {
    const date = parseISO(params.date);
    return {
      $gte: date,
      $lte: date,
    };
  } else if (params.month) {
    const monthDate = parseISO(params.month + "-01");
    return {
      $gte: startOfMonth(monthDate),
      $lte: endOfMonth(monthDate),
    };
  }
  return null;
};

// GET /api/reports/sales
router.get("/sales", async (req, res) => {
  try {
    const { reportType, customerId, manufacturer, product } = req.query;
    const dateRange = getDateRange(req.query);

    // Base query
    let query = { status: "active" };
    if (dateRange) {
      query.invoiceDate = dateRange;
    }
    if (customerId && customerId !== "all") {
      query.distributorId = customerId;
    }

    // Add product filter to query if provided
    if (product) {
      query["products.productName"] = { $regex: new RegExp(product, "i") };
      query["products.types"] = "sale"; // Only include sale type products, exclude returns
    }

    // Add manufacturer filter to query if provided
    if (manufacturer) {
      query["products.mfcName"] = { $regex: new RegExp(manufacturer, "i") };
    }

    // Fetch sales data
    const sales = await SalesBill.find(query)
      .sort({ invoiceDate: -1 })
      .populate("customerId");

    // Prepare response based on report type
    let response = {
      summary: {
        totalSales: 0,
        totalBills: sales.length,
        totalGST: 0,
      },
    };

    switch (reportType) {
      case "all-sales":
        response.sales = sales;
        break;

      case "customer-wise":
        const customerSummary = {};
        sales.forEach((sale) => {
          const customerId = sale.distributorId?._id?.toString() || "cash";
          if (!customerSummary[customerId]) {
            customerSummary[customerId] = {
              customerId,
              customerName: sale.distributorName || "Cash Customer",
              totalSales: 0,
              totalAmount: 0,
              billCount: 0,
            };
          }
          customerSummary[customerId].totalSales++;
          customerSummary[customerId].totalAmount +=
            sale.billSummary.grandTotal;
          customerSummary[customerId].billCount++;
        });
        response.customerSummary = Object.values(customerSummary);
        break;

      case "manufacturer-wise":
        const manufacturerSummary = {};
        sales.forEach((sale) => {
          sale.products.forEach((product) => {
            if (!manufacturerSummary[product.mfcName]) {
              manufacturerSummary[product.mfcName] = {
                manufacturer: product.mfcName,
                uniqueProducts: new Set(),
                totalQuantity: 0,
                totalAmount: 0,
              };
            }
            manufacturerSummary[product.mfcName].uniqueProducts.add(
              product.productName
            );
            manufacturerSummary[product.mfcName].totalQuantity +=
              product.quantity;
            manufacturerSummary[product.mfcName].totalAmount += product.amount;
          });
        });

        response.manufacturerSummary = Object.values(manufacturerSummary).map(
          (mfr) => ({
            ...mfr,
            uniqueProducts: mfr.uniqueProducts.size,
          })
        );
        break;

      case "product-wise":
        const productSummary = {};
        const productSales = {};

        sales.forEach((sale) => {
          // Filter products if product name is provided
          const filteredProducts = product
            ? sale.products.filter((p) =>
                p.productName.toLowerCase().includes(product.toLowerCase())
              )
            : sale.products;

          filteredProducts.forEach((product) => {
            const key = `${product.productName}-${product.batchNumber}`;

            // Update summary
            if (!productSummary[key]) {
              productSummary[key] = {
                productName: product.productName,
                batchNumber: product.batchNumber,
                manufacturer: product.mfcName,
                quantitySold: 0,
                totalAmount: 0,
              };
            }
            productSummary[key].quantitySold += product.quantity;
            productSummary[key].totalAmount += product.amount;

            // Store individual sales
            if (!productSales[key]) {
              productSales[key] = [];
            }
            productSales[key].push({
              invoiceNumber: sale.invoiceNumber,
              invoiceDate: sale.invoiceDate,
              customerName: sale.distributorName,
              quantity: product.quantity,
              rate: product.rate,
              amount: product.amount,
              gst: product.gst,
              totalAmount:
                product.amount + (product.amount * product.gst) / 100,
            });
          });
        });

        response.productSummary = Object.values(productSummary);
        response.productSales = productSales;
        break;

      case "daily-sales":
        // Group sales by hour for the selected date
        const hourlyData = Array(24)
          .fill()
          .map((_, hour) => ({
            hour,
            totalSales: 0,
            billCount: 0,
            totalAmount: 0,
          }));

        sales.forEach((sale) => {
          const saleHour = new Date(sale.invoiceDate).getHours();
          hourlyData[saleHour].totalSales += sale.billSummary.grandTotal;
          hourlyData[saleHour].billCount += 1;
          hourlyData[saleHour].totalAmount += sale.billSummary.subtotal;
        });

        response.hourlyData = hourlyData;
        response.dailySummary = {
          date: req.query.date,
          totalSales: sales.reduce(
            (sum, sale) => sum + sale.billSummary.grandTotal,
            0
          ),
          totalBills: sales.length,
          averageBillValue: sales.length
            ? sales.reduce(
                (sum, sale) => sum + sale.billSummary.grandTotal,
                0
              ) / sales.length
            : 0,
        };
        break;

      case "monthly-sales":
        // Group sales by day for the selected month
        const daysInMonth = endOfMonth(
          parseISO(req.query.month + "-01")
        ).getDate();
        const dailyData = Array(daysInMonth)
          .fill()
          .map((_, index) => ({
            day: index + 1,
            totalSales: 0,
            billCount: 0,
            totalAmount: 0,
          }));

        sales.forEach((sale) => {
          const saleDay = new Date(sale.invoiceDate).getDate() - 1;
          dailyData[saleDay].totalSales += sale.billSummary.grandTotal;
          dailyData[saleDay].billCount += 1;
          dailyData[saleDay].totalAmount += sale.billSummary.subtotal;
        });

        response.dailyData = dailyData;
        response.monthlySummary = {
          month: req.query.month,
          totalSales: sales.reduce(
            (sum, sale) => sum + sale.billSummary.grandTotal,
            0
          ),
          totalBills: sales.length,
          averageBillValue: sales.length
            ? sales.reduce(
                (sum, sale) => sum + sale.billSummary.grandTotal,
                0
              ) / sales.length
            : 0,
          averageDailySales: sales.length
            ? sales.reduce(
                (sum, sale) => sum + sale.billSummary.grandTotal,
                0
              ) / daysInMonth
            : 0,
        };
        break;
    }

    // Calculate summary
    sales.forEach((sale) => {
      response.summary.totalSales += sale.billSummary.grandTotal;
      response.summary.totalGST += sale.billSummary.gstAmount;
    });

    res.json(response);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
});

export default router;
