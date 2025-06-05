import express from "express";
import { SalesBill } from "../models/SalesBill.js";
import { InvoiceSchema } from "../models/InvoiceSchema.js";
import mongoose from "mongoose";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { InventoryBatch } from "../models/InventoryBatch.js";
import { Inventory } from "../models/Inventory.js";

const router = express.Router();

// Helper function to escape special characters for regex
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

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
      query["products.productName"] = {
        $regex: new RegExp(escapeRegExp(product), "i"),
      };
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
                          regex: new RegExp(escapeRegExp(manufacturer), "i"),
                        },
                      }
                    : { $eq: [true, true] },
                  product
                    ? {
                        $regexMatch: {
                          input: "$$product.productName",
                          regex: new RegExp(escapeRegExp(product), "i"),
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

    const sales = await SalesBill.pharmacyAwareAggregate(pipeline);

    // Prepare response based on report type
    let response = {
      summary: {
        totalSales: 0,
        totalBills: sales.length,
        totalGST: 0,
        totalQuantity: 0,
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
              product.quantity / product.pack;
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

      case "group-wise":
        const groupSalesSummary = {};
        // Need a different pipeline for group-wise that looks up inventory groups
        // The 'sales' variable above is already filtered by date, customer, potentially product/manufacturer for the bill level
        // Now we need to process these sales to aggregate by inventory group

        for (const sale of sales) {
          // Iterate over already fetched and partially filtered sales
          for (const productItem of sale.products) {
            // Assuming productItem has an inventoryId to lookup Inventory
            if (productItem.inventoryId) {
              const inventoryItem = await Inventory.findById(
                productItem.inventoryId
              ).lean();
              if (
                inventoryItem &&
                inventoryItem.group &&
                inventoryItem.group.length > 0
              ) {
                inventoryItem.group.forEach((groupName) => {
                  if (!groupSalesSummary[groupName]) {
                    groupSalesSummary[groupName] = {
                      groupName: groupName,
                      totalQuantity: 0,
                      totalAmount: 0,
                      uniqueProducts: new Set(),
                    };
                  }
                  groupSalesSummary[groupName].totalQuantity +=
                    productItem.quantity;
                  groupSalesSummary[groupName].totalAmount +=
                    productItem.amount; // Assuming productItem.amount is the value before tax for consistency
                  groupSalesSummary[groupName].uniqueProducts.add(
                    productItem.productName
                  );
                });
              }
            }
          }
        }
        response.groupSummary = Object.values(groupSalesSummary)
          .map((summary) => ({
            ...summary,
            uniqueProducts: summary.uniqueProducts.size,
          }))
          .sort((a, b) => a.groupName.localeCompare(b.groupName));
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
            productSummary[key].quantitySold += product.quantity / product.pack;
            productSummary[key].totalAmount += product.amount;

            // Store individual sales
            if (!productSales[key]) {
              productSales[key] = [];
            }
            productSales[key].push({
              invoiceNumber: sale.invoiceNumber,
              invoiceDate: sale.invoiceDate,
              customerName: sale.distributorName,
              quantity: product.quantity / product.pack,
              taxableAmount: product.amount * (1 - product.gstPer / 100),
              rate: product.saleRate,
              amount: product.amount,
              gst: product.gstPer,
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
    response.summary.totalQuantity = 0; // Initialize to ensure we sum correctly
    sales.forEach((sale) => {
      response.summary.totalSales += sale.billSummary.grandTotal;
      if (sale.products && Array.isArray(sale.products)) {
        sale.products.forEach((p) => {
          if (
            p &&
            typeof p.quantity === "number" &&
            typeof p.pack === "number" &&
            p.pack !== 0
          ) {
            response.summary.totalQuantity += p.quantity / p.pack;
          } else if (p && typeof p.quantity === "number") {
            // If pack is not available or zero, assume pack is 1 (or handle as per your business logic)
            response.summary.totalQuantity += p.quantity;
          }
        });
      }
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
      query["products.productName"] = {
        $regex: new RegExp(escapeRegExp(product), "i"),
      };
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
                          regex: new RegExp(escapeRegExp(manufacturer), "i"),
                        },
                      }
                    : { $eq: [true, true] },
                  product
                    ? {
                        $regexMatch: {
                          input: "$$product.productName",
                          regex: new RegExp(escapeRegExp(product), "i"),
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

    const purchases = await InvoiceSchema.pharmacyAwareAggregate(pipeline);

    // Prepare response based on report type
    let response = {
      summary: {
        totalPurchases: 0,
        totalBills: purchases.length,
        totalGST: 0,
        totalQuantity: 0,
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
              totalAmount: 0,
              billCount: 0,
              invoices: [],
            };
          }
          distributorSummary[distributorId].totalAmount +=
            purchase.billSummary.grandTotal;
          distributorSummary[distributorId].billCount++;
          distributorSummary[distributorId].invoices.push(purchase);
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
              product.quantity / product.pack;
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

      case "group-wise":
        const groupPurchaseSummary = {};
        // Similar to sales, iterate over 'purchases' and lookup inventory groups
        for (const purchase of purchases) {
          for (const productItem of purchase.products) {
            if (productItem.inventoryId) {
              // Assuming productItem.inventoryId exists
              const inventoryItem = await Inventory.findById(
                productItem.inventoryId
              ).lean();
              if (
                inventoryItem &&
                inventoryItem.group &&
                inventoryItem.group.length > 0
              ) {
                inventoryItem.group.forEach((groupName) => {
                  if (!groupPurchaseSummary[groupName]) {
                    groupPurchaseSummary[groupName] = {
                      groupName: groupName,
                      totalQuantity: 0,
                      totalAmount: 0,
                      uniqueProducts: new Set(),
                    };
                  }
                  groupPurchaseSummary[groupName].totalQuantity +=
                    productItem.quantity;
                  groupPurchaseSummary[groupName].totalAmount +=
                    productItem.amount; // Assuming productItem.amount is taxable value
                  groupPurchaseSummary[groupName].uniqueProducts.add(
                    productItem.productName
                  );
                });
              }
            }
          }
        }
        response.groupSummary = Object.values(groupPurchaseSummary)
          .map((summary) => ({
            ...summary,
            uniqueProducts: summary.uniqueProducts.size,
          }))
          .sort((a, b) => a.groupName.localeCompare(b.groupName));
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
            productSummary[key].quantityPurchased +=
              product.quantity / product.pack;
            productSummary[key].totalAmount += product.amount;

            // Store individual purchases
            if (!productPurchases[key]) {
              productPurchases[key] = [];
            }
            productPurchases[key].push({
              invoiceNumber: purchase.invoiceNumber,
              invoiceDate: purchase.invoiceDate,
              distributorName: purchase.distributorName,
              quantity: product.quantity / product.pack,
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
      if (purchase.products && Array.isArray(purchase.products)) {
        purchase.products.forEach((p) => {
          // p for product
          if (p && typeof p.amount === "number") {
            const taxableAmount = p.amount - (p.amount * p.gstPer) / 100;
            let gstAmountForItem = 0;

            if (typeof p.gstPer === "number" && p.gstPer > 0) {
              gstAmountForItem = (taxableAmount * p.gstPer) / 100;
            }

            response.summary.totalGST += gstAmountForItem;
            response.summary.totalPurchases += taxableAmount;
            response.summary.totalQuantity += p.quantity / p.pack;
          }
        });
      }
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

        const stockStatus = await InventoryBatch.pharmacyAwareAggregate(
          stockStatusPipeline
        );
        response.items = stockStatus;
        break;

      case "low-stock":
        // Get items with low stock (quantity less than minimum stock level)
        const { threshold = 10 } = req.query; // Default to 10 if not provided
        const lowStockPipeline = [
          ...basePipeline,
          {
            $match: {
              $expr: {
                $lt: [
                  "$quantity",
                  { $multiply: [parseInt(threshold), "$pack"] },
                ],
              },
            },
          },
          {
            $project: {
              productName: "$inventory.name",
              manufacturer: "$inventory.mfcName",
              batchNumber: 1,
              currentStock: "$quantity",
              pack: 1,
              expiry: 1,
              mrp: 1,
            },
          },
          { $sort: { currentStock: 1 } },
        ];

        const lowStockItems = await InventoryBatch.pharmacyAwareAggregate(
          lowStockPipeline
        );
        response.lowStockItems = lowStockItems;
        break;

      case "expiry-alert":
        // Get items near expiry based on target expiry date
        const { targetExpiry } = req.query;

        if (!targetExpiry) {
          throw new Error("Target expiry date is required");
        }

        // Convert target expiry (mm/yy) to a comparable format
        const [targetMonth, targetYear] = targetExpiry.split("/");
        const targetDate = new Date(
          2000 + parseInt(targetYear),
          parseInt(targetMonth)
        );

        const expiryPipeline = [
          ...basePipeline,
          {
            $addFields: {
              // Convert expiry string to Date for comparison
              expiryDate: {
                $let: {
                  vars: {
                    month: { $toInt: { $substr: ["$expiry", 0, 2] } },
                    year: { $toInt: { $substr: ["$expiry", 3, 2] } },
                  },
                  in: {
                    $dateFromParts: {
                      year: { $add: [2000, "$$year"] },
                      month: "$$month",
                      day: 1,
                    },
                  },
                },
              },
            },
          },
          {
            $match: {
              quantity: { $gt: 0 }, // Only include items with stock
              expiryDate: { $lte: targetDate }, // Get items expiring on or before target date
            },
          },
          {
            $project: {
              productName: "$inventory.name",
              manufacturer: "$inventory.mfcName",
              batchNumber: 1,
              quantity: 1,
              expiry: 1,
              pack: 1,
              mrp: 1,
              expiryDate: 1,
            },
          },
          {
            $sort: {
              expiryDate: 1,
              productName: 1,
              batchNumber: 1,
            },
          },
        ];

        const expiryAlerts = await InventoryBatch.pharmacyAwareAggregate(
          expiryPipeline
        );
        const processedExpiryAlerts = expiryAlerts.map((item) => ({
          ...item,
          quantity: item.quantity / item.pack,
        }));
        response.expiryAlerts = processedExpiryAlerts;
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
