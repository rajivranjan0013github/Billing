import express from "express";
import { SalesBill } from "../models/SalesBill.js";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import mongoose from "mongoose";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { Inventory } from "../models/Inventory.js";

const router = express.Router();

// Helper function to get date range
const getDateRange = (params) => {
  if (params.startDate && params.endDate) {
    return {
      $gte: parseISO(params.startDate),
      $lt: parseISO(params.endDate + "T18:30:00.000Z"),
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
    console.log(dateRange);

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
      query["products.types"] = "sale";
    }

    // Fetch sales data with filtered products
    let pipeline = [
      { $match: query },
      {
        $addFields: {
          products: {
            $filter: {
              input: "$products",
              as: "product",
              cond: {
                $and: [
                  { $eq: ["$$product.types", "sale"] },
                  manufacturer
                    ? {
                        $regexMatch: {
                          input: "$$product.mfcName",
                          regex: new RegExp(manufacturer, "i"),
                        },
                      }
                    : { $eq: [true, true] },
                  product
                    ? {
                        $regexMatch: {
                          input: "$$product.productName",
                          regex: new RegExp(product, "i"),
                        },
                      }
                    : { $eq: [true, true] },
                ],
              },
            },
          },
        },
      },
      { $match: { "products.0": { $exists: true } } }, // Only keep bills that have matching products
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerId",
        },
      },
      {
        $unwind: {
          path: "$customerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { invoiceDate: -1 } },
    ];

    const sales = await SalesBill.aggregate(pipeline);

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

// GET /api/reports/purchase
router.get("/purchase", async (req, res) => {
  try {
    const { reportType, distributorId, manufacturer, product } = req.query;
    const dateRange = getDateRange(req.query);

    // Base query
    let query = { status: "active" };
    if (dateRange) {
      query.invoiceDate = dateRange;
    }
    if (distributorId && distributorId !== "all") {
      query.distributorId = new mongoose.Types.ObjectId(distributorId);
    }

    // Add product filter to query if provided
    if (product) {
      query["products.productName"] = { $regex: new RegExp(product, "i") };
    }

    // Fetch purchase data with filtered products
    let pipeline = [
      { $match: query },
      {
        $addFields: {
          products: {
            $filter: {
              input: "$products",
              as: "product",
              cond: {
                $and: [
                  manufacturer
                    ? {
                        $regexMatch: {
                          input: "$$product.mfcName",
                          regex: new RegExp(manufacturer, "i"),
                        },
                      }
                    : { $eq: [true, true] },
                  product
                    ? {
                        $regexMatch: {
                          input: "$$product.productName",
                          regex: new RegExp(product, "i"),
                        },
                      }
                    : { $eq: [true, true] },
                ],
              },
            },
          },
        },
      },
      { $match: { "products.0": { $exists: true } } }, // Only keep bills that have matching products
      {
        $lookup: {
          from: "distributors",
          localField: "distributorId",
          foreignField: "_id",
          as: "distributorId",
        },
      },
      {
        $unwind: {
          path: "$distributorId",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { invoiceDate: -1 } },
    ];

    const purchases = await InvoiceSchema.aggregate(pipeline);

    // Prepare response based on report type
    let response = {
      summary: {
        totalPurchases: 0,
        totalBills: purchases.length,
        totalGST: 0,
      },
    };

    switch (reportType) {
      case "all-purchases":
        response.purchases = purchases;
        break;

      case "distributor-wise":
        const distributorSummary = {};
        purchases.forEach((purchase) => {
          const distributorId =
            purchase.distributorId?._id?.toString() || "unknown";
          if (!distributorSummary[distributorId]) {
            distributorSummary[distributorId] = {
              distributorId,
              distributorName:
                purchase.distributorName || "Unknown Distributor",
              totalPurchases: 0,
              totalAmount: 0,
              billCount: 0,
            };
          }
          distributorSummary[distributorId].totalPurchases++;
          distributorSummary[distributorId].totalAmount +=
            purchase.billSummary.grandTotal;
          distributorSummary[distributorId].billCount++;
        });
        response.distributorSummary = Object.values(distributorSummary);
        break;

      case "manufacturer-wise":
        const manufacturerSummary = {};
        purchases.forEach((purchase) => {
          purchase.products.forEach((product) => {
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
        const productPurchases = {};

        purchases.forEach((purchase) => {
          // Filter products if product name is provided
          const filteredProducts = product
            ? purchase.products.filter((p) =>
                p.productName.toLowerCase().includes(product.toLowerCase())
              )
            : purchase.products;

          filteredProducts.forEach((product) => {
            const key = `${product.productName}-${product.batchNumber}`;

            // Update summary
            if (!productSummary[key]) {
              productSummary[key] = {
                productName: product.productName,
                batchNumber: product.batchNumber,
                manufacturer: product.mfcName,
                quantityPurchased: 0,
                totalAmount: 0,
              };
            }
            productSummary[key].quantityPurchased += product.quantity;
            productSummary[key].totalAmount += product.amount;

            // Store individual purchases
            if (!productPurchases[key]) {
              productPurchases[key] = [];
            }
            productPurchases[key].push({
              invoiceNumber: purchase.invoiceNumber,
              invoiceDate: purchase.invoiceDate,
              distributorName: purchase.distributorName,
              quantity: product.quantity,
              mfcName: product.mfcName,
              batchNumber: product.batchNumber,
              productName: product.productName,
              rate: product.rate,
              amount: product.amount,
              gst: product.gstPer,
              totalAmount:
                product.amount + (product.amount * product.gstPer) / 100,
            });
          });
        });

        response.productSummary = Object.values(productSummary);
        response.productPurchases = productPurchases;
        break;
    }

    // Calculate summary
    purchases.forEach((purchase) => {
      response.summary.totalPurchases += purchase.billSummary.grandTotal;
      response.summary.totalGST += purchase.billSummary.gstAmount;
    });

    res.json(response);
  } catch (error) {
    console.error("Error generating purchase report:", error);
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
});

// GET /api/reports/inventory
router.get("/inventory", async (req, res) => {
  try {
    const { reportType } = req.query;

    // Base pipeline for inventory lookup
    const basePipeline = [
      {
        $lookup: {
          from: "inventories",
          localField: "inventoryId",
          foreignField: "_id",
          as: "inventory",
        },
      },
      {
        $unwind: "$inventory",
      },
      {
        $match: { status: "active" },
      },
    ];

    let response = {};

    switch (reportType) {
      case "stock-status":
        // Get current stock status for all items
        const stockStatusPipeline = [
          ...basePipeline,
          {
            $project: {
              productName: "$inventory.productName",
              manufacturer: "$inventory.mfcName",
              batchNumber: 1,
              quantity: 1,
              expiry: 1,
              mrp: 1,
              purchaseRate: 1,
              saleRate: 1,
              pack: 1,
            },
          },
          { $sort: { productName: 1, batchNumber: 1 } },
        ];

        const stockStatus = await InventoryBatch.aggregate(stockStatusPipeline);
        response.items = stockStatus;
        break;

      case "low-stock":
        // Get items with low stock (quantity less than minimum stock level)
        const lowStockPipeline = [
          ...basePipeline,
          {
            $match: {
              quantity: { $lt: 10 }, // Assuming 10 is the minimum stock level
            },
          },
          {
            $project: {
              productName: "$inventory.productName",
              manufacturer: "$inventory.mfcName",
              batchNumber: 1,
              currentStock: "$quantity",
              minimumStock: 10, // This could be configurable
              expiry: 1,
              mrp: 1,
            },
          },
          { $sort: { currentStock: 1 } },
        ];

        const lowStockItems = await InventoryBatch.aggregate(lowStockPipeline);
        response.lowStockItems = lowStockItems;
        break;

      case "expiry-alert":
        // Get items near expiry based on the expiry range
        const { expiryRange } = req.query;
        const currentDate = new Date();

        // Function to convert mm/yy to comparable number (YYMM)
        const getComparableDate = (mmyy) => {
          const [month, year] = mmyy.split("/").map(Number);
          return year * 12 + month;
        };

        // Get current date in mm/yy format
        const currentMMYY = `${String(currentDate.getMonth() + 1).padStart(
          2,
          "0"
        )}/${String(currentDate.getFullYear()).slice(-2)}`;
        const currentComparable = getComparableDate(currentMMYY);

        // Calculate target date based on range
        let targetComparable;
        if (expiryRange === "1month") {
          targetComparable = currentComparable;
        } else if (expiryRange === "3months") {
          targetComparable = currentComparable + 2; // Current + 2 more months
        } else if (expiryRange === "6months") {
          targetComparable = currentComparable + 5; // Current + 5 more months
        } else if (expiryRange === "1year") {
          targetComparable = currentComparable + 11; // Current + 11 more months
        } else if (expiryRange === "custom" && req.query.selectedMonth) {
          const selectedDate = new Date(req.query.selectedMonth);
          const selectedMMYY = `${String(selectedDate.getMonth() + 1).padStart(
            2,
            "0"
          )}/${String(selectedDate.getFullYear()).slice(-2)}`;
          targetComparable = getComparableDate(selectedMMYY);
        }

        const expiryPipeline = [
          ...basePipeline,
          {
            $match: {
              quantity: { $gt: 0 }, // Only include items with stock
            },
          },
          {
            $addFields: {
              comparableExpiry: {
                $let: {
                  vars: {
                    monthYear: { $split: ["$expiry", "/"] },
                  },
                  in: {
                    $add: [
                      {
                        $multiply: [
                          { $toInt: { $arrayElemAt: ["$$monthYear", 1] } },
                          12,
                        ],
                      },
                      { $toInt: { $arrayElemAt: ["$$monthYear", 0] } },
                    ],
                  },
                },
              },
            },
          },
          {
            $match: {
              comparableExpiry: {
                $gte: currentComparable,
                $lte: targetComparable,
              },
            },
          },
          {
            $project: {
              productName: "$inventory.productName",
              manufacturer: "$inventory.mfcName",
              batchNumber: 1,
              quantity: 1,
              expiry: 1,
              mrp: 1,
              comparableExpiry: 1,
            },
          },
          {
            $sort: {
              comparableExpiry: 1,
            },
          },
        ];

        let expiryAlerts = await InventoryBatch.aggregate(expiryPipeline);

        // Remove the comparable field from final results
        expiryAlerts = expiryAlerts.map(
          ({ comparableExpiry, ...rest }) => rest
        );

        response.expiryAlerts = expiryAlerts;
        break;
    }

    res.json(response);
  } catch (error) {
    console.error("Error generating inventory report:", error);
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
});

export default router;
