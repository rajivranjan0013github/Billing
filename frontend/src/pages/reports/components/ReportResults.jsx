import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  DownloadIcon,
  FilterIcon,
  Search,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import ReportSummary from "./ReportSummary"; // Import the new component

const ReportResults = ({
  reportData,
  reportStatus,
  reportError,
  localError,
  activeTab,
  selectedReportType,
  getSelectedReport,
  isFilterRequired,
  dateRange,
  singleDate,
  selectedMonth,
  generateReport,
  selectedProduct,
  setSelectedProduct,
}) => {
  const selectedReport = getSelectedReport();
  const [expandedDistributorId, setExpandedDistributorId] = useState(null);

  if (!selectedReport) {
    return null;
  }

  const isDataEmpty = (data, tab, type) => {
    if (!data) return true;

    const reportId = type[tab];
    switch (tab) {
      case "sales":
        switch (reportId) {
          case "all-sales":
            return !data.sales || data.sales.length === 0;
          case "customer-wise":
            return !data.customerSummary || data.customerSummary.length === 0;
          case "manufacturer-wise":
            return (
              !data.manufacturerSummary || data.manufacturerSummary.length === 0
            );
          case "product-wise":
            return !data.productSummary || data.productSummary.length === 0;
          case "group-wise":
            return !data.groupSummary || data.groupSummary.length === 0;
          case "daily-sales":
            return !data.hourlyData || data.hourlyData.length === 0;
          case "monthly-sales":
            return !data.dailyData || data.dailyData.length === 0;
          default:
            return Object.keys(data).length === 0;
        }
      case "purchase":
        switch (reportId) {
          case "all-purchases":
            return !data.purchases || data.purchases.length === 0;
          case "distributor-wise":
            return (
              !data.distributorSummary || data.distributorSummary.length === 0
            );
          case "manufacturer-wise":
            return (
              !data.manufacturerSummary || data.manufacturerSummary.length === 0
            );
          case "product-wise":
            return !data.productSummary || data.productSummary.length === 0;
          case "group-wise":
            return !data.groupSummary || data.groupSummary.length === 0;
          default:
            return Object.keys(data).length === 0;
        }
      case "inventory":
        switch (reportId) {
          case "stock-status":
            return !data.items || data.items.length === 0;
          case "low-stock":
            return !data.lowStockItems || data.lowStockItems.length === 0;
          case "expiry-alert":
            return !data.expiryAlerts || data.expiryAlerts.length === 0;
          case "stock-movement":
            return !data.stockMovement || data.stockMovement.length === 0;
          case "fast-moving":
            return !data.fastMovingItems || data.fastMovingItems.length === 0;
          case "slow-moving":
            return !data.slowMovingItems || data.slowMovingItems.length === 0;
          default:
            return Object.keys(data).length === 0;
        }
      default:
        return !data || Object.keys(data).length === 0;
    }
  };

  const renderSalesTable = () => {
    if (!reportData) return null;

    const commonTableClass = "min-w-full divide-y divide-gray-200";
    const commonHeaderClass =
      "px-4  text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100/70";
    const commonCellClass =
      "px-4  whitespace-nowrap text-sm text-gray-700 font-semibold";
    const commonNumericCellClass = `${commonCellClass} text-right`;

    switch (selectedReportType[activeTab]) {
      case "all-sales":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Invoice No</TableHead>
                <TableHead className={commonHeaderClass}>Date</TableHead>
                <TableHead className={commonHeaderClass}>Customer</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Items
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Subtotal
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  GST
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.sales?.map((sale) => (
                <TableRow
                  key={sale._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {sale.invoiceNumber}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {format(new Date(sale.invoiceDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    <div className="font-semibold">{sale.distributorName}</div>
                    {sale.mob && (
                      <div className="text-xs text-gray-500">{sale.mob}</div>
                    )}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {sale.billSummary.productCount}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {sale.billSummary.subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {sale.billSummary.gstAmount.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {sale.billSummary.grandTotal.toFixed(2)}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    <Badge
                      variant={
                        sale.paymentStatus === "paid"
                          ? "success"
                          : "destructive"
                      }
                    >
                      {sale.paymentStatus.charAt(0).toUpperCase() +
                        sale.paymentStatus.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "customer-wise":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Customer</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Total Bills
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total Amount
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Avg. Bill Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.customerSummary?.map((customer) => (
                <TableRow
                  key={customer.customerId}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {customer.customerName}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {customer.totalSales}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {customer.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {(customer.totalAmount / customer.totalSales || 0).toFixed(
                      2
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "manufacturer-wise":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>
                  Manufacturer
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Products Sold
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Total Quantity
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.manufacturerSummary?.map((mfr) => (
                <TableRow
                  key={mfr.manufacturer}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {mfr.manufacturer}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {mfr.uniqueProducts}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {mfr.totalQuantity}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {mfr.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "group-wise":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Group Name</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Unique Products Sold
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Total Quantity Sold
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total Sales Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.groupSummary?.map((group) => (
                <TableRow
                  key={group.groupName}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {group.groupName}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {group.uniqueProducts}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {group.totalQuantity}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {group.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "product-wise":
        return (
          <div className="space-y-0">
            <Table className={commonTableClass}>
              <TableHeader>
                <TableRow>
                  <TableHead className={commonHeaderClass}>Product</TableHead>
                  <TableHead className={commonHeaderClass}>Batch</TableHead>
                  <TableHead className={commonHeaderClass}>
                    Manufacturer
                  </TableHead>
                  <TableHead className={`${commonHeaderClass} text-center`}>
                    Qty Sold
                  </TableHead>
                  <TableHead className={`${commonHeaderClass} text-right`}>
                    Total Amount
                  </TableHead>
                  <TableHead
                    className={`${commonHeaderClass} text-center w-[50px]`}
                  >
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {reportData.productSummary?.map((product) => {
                  const productKey = `${product.productName}-${product.batchNumber}`;
                  const isSelected = selectedProduct === productKey;

                  return (
                    <React.Fragment key={productKey}>
                      <TableRow
                        className={cn(
                          "cursor-pointer hover:bg-pink-50 transition-colors",
                          isSelected && "bg-pink-100"
                        )}
                        onClick={() =>
                          setSelectedProduct(isSelected ? null : productKey)
                        }
                      >
                        <TableCell className={commonCellClass}>
                          {product.productName}
                        </TableCell>
                        <TableCell className={commonCellClass}>
                          {product.batchNumber}
                        </TableCell>
                        <TableCell className={commonCellClass}>
                          {product.manufacturer}
                        </TableCell>
                        <TableCell className={`${commonCellClass} text-center`}>
                          {product.quantitySold}
                        </TableCell>
                        <TableCell
                          className={`${commonNumericCellClass} font-semibold`}
                        >
                          {product.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className={`${commonCellClass} text-center`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-pink-600 hover:bg-pink-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(
                                isSelected ? null : productKey
                              );
                            }}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isSelected && "transform rotate-180"
                              )}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isSelected && reportData.productSales[productKey] && (
                        <TableRow className="bg-pink-50 hover:bg-pink-100/80">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-3 m-2 border border-pink-200 rounded-md bg-white shadow-inner">
                              <h4 className="text-sm font-semibold text-pink-600 mb-2 pl-1">
                                Sale Details: {product.productName} (Batch:{" "}
                                {product.batchNumber})
                              </h4>
                              <Table className="min-w-full">
                                <TableHeader>
                                  <TableRow className="border-b border-pink-300">
                                    <TableHead className="py-1.5 px-2 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Inv No
                                    </TableHead>
                                    <TableHead className="py-1.5 px-2 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Date
                                    </TableHead>
                                    <TableHead className="py-1.5 px-2 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Customer
                                    </TableHead>
                                    <TableHead className="py-1.5 px-2 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Qty
                                    </TableHead>
                                    <TableHead className="py-1.5 px-2 text-right text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Rate (GST included)
                                    </TableHead>
                                    <TableHead className="py-1.5 px-2 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      GST
                                    </TableHead>
                                    <TableHead className="py-1.5 px-2 text-right text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Amount
                                    </TableHead>

                                    {/* <TableHead className="py-1.5 px-2 text-right text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                      Total
                                    </TableHead> */}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {reportData.productSales[productKey].map(
                                    (sale, index) => (
                                      <TableRow
                                        key={`${sale.invoiceNumber}-${index}`}
                                        className="border-b border-gray-200 last:border-b-0 hover:bg-pink-50/50"
                                      >
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 font-semibold">
                                          {sale.invoiceNumber}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 font-semibold">
                                          {format(
                                            new Date(sale.invoiceDate),
                                            "dd/MM/yy"
                                          )}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 font-semibold">
                                          {sale.customerName}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-center font-semibold">
                                          {sale.quantity}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-right font-semibold">
                                          {sale.rate?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-center font-semibold">
                                          {sale.gst}%
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-right font-semibold">
                                          {sale.amount.toFixed(2)}
                                        </TableCell>

                                        {/* <TableCell className="py-1.5 px-2 text-xs text-gray-700 font-semibold text-right">
                                          {sale.totalAmount?.toFixed(2)}
                                        </TableCell> */}
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );

      case "daily-sales":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Sales
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.dailySummary.totalSales.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Bills
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.dailySummary.totalBills}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Average Bill Value
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.dailySummary.averageBillValue.toFixed(2)}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HOUR</TableHead>
                  <TableHead>BILLS</TableHead>
                  <TableHead>SALES AMOUNT</TableHead>
                  <TableHead>TOTAL AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.hourlyData.map((hour) => (
                  <TableRow key={hour.hour}>
                    <TableCell>{`${hour.hour
                      .toString()
                      .padStart(2, "0")}:00 - ${(hour.hour + 1)
                      .toString()
                      .padStart(2, "0")}:00`}</TableCell>
                    <TableCell>{hour.billCount}</TableCell>
                    <TableCell>₹{hour.totalSales.toFixed(2)}</TableCell>
                    <TableCell>₹{hour.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "monthly-sales":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Sales
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.monthlySummary.totalSales.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Bills
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.monthlySummary.totalBills}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Average Bill Value
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.monthlySummary.averageBillValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Average Daily Sales
                </h3>
                <p className="text-2xl font-semibold">
                  {reportData.monthlySummary.averageDailySales.toFixed(2)}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>BILLS</TableHead>
                  <TableHead>SALES AMOUNT</TableHead>
                  <TableHead>TOTAL AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.dailyData.map((day) => (
                  <TableRow key={day.day}>
                    <TableCell>
                      {format(
                        new Date(
                          reportData.monthlySummary.month +
                            `-${day.day.toString().padStart(2, "0")}`
                        ),
                        "dd MMM yyyy"
                      )}
                    </TableCell>
                    <TableCell>{day.billCount}</TableCell>
                    <TableCell>₹{day.totalSales.toFixed(2)}</TableCell>
                    <TableCell>₹{day.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPurchaseTable = () => {
    if (!reportData) return null;

    const commonTableClass = "min-w-full divide-y divide-gray-200";
    const commonHeaderClass =
      "px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100/70";
    const commonCellClass =
      "px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold";
    const commonNumericCellClass = `${commonCellClass} text-right`;

    switch (selectedReportType[activeTab]) {
      case "all-purchases":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Invoice No</TableHead>
                <TableHead className={commonHeaderClass}>Date</TableHead>
                <TableHead className={commonHeaderClass}>Distributor</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Items
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Taxable (₹)
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  GST (₹)
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total (₹)
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.purchases?.map((purchase) => (
                <TableRow
                  key={purchase._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {purchase.invoiceNumber}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {format(new Date(purchase.invoiceDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    <div className="font-semibold">
                      {purchase.distributorName}
                    </div>
                    {purchase.mob && (
                      <div className="text-xs text-gray-500">
                        {purchase.mob}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {purchase.billSummary.productCount}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {purchase.billSummary.taxableAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {purchase.billSummary.gstAmount.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {purchase.billSummary.grandTotal.toFixed(2)}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    <Badge
                      variant={
                        purchase.paymentStatus === "paid"
                          ? "success"
                          : "destructive"
                      }
                    >
                      {purchase.paymentStatus.charAt(0).toUpperCase() +
                        purchase.paymentStatus.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "distributor-wise":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Distributor</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Total Bills
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total Amount (₹)
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Avg. Bill Value (₹)
                </TableHead>
                <TableHead
                  className={`${commonHeaderClass} text-center w-[100px]`}
                >
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.distributorSummary?.map((distributor) => (
                <React.Fragment key={distributor.distributorId}>
                  <TableRow className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className={commonCellClass}>
                      {distributor.distributorName}
                    </TableCell>
                    <TableCell className={`${commonCellClass} text-center`}>
                      {distributor.billCount}
                    </TableCell>
                    <TableCell
                      className={`${commonNumericCellClass} font-semibold`}
                    >
                      {distributor.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className={commonNumericCellClass}>
                      {(
                        distributor.totalAmount / distributor.billCount || 0
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell className={`${commonCellClass} text-center`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedDistributorId(
                            expandedDistributorId === distributor.distributorId
                              ? null
                              : distributor.distributorId
                          )
                        }
                      >
                        {expandedDistributorId === distributor.distributorId ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                        )}
                        <span className="sr-only">Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedDistributorId === distributor.distributorId && (
                    <TableRow className="bg-gray-50/30">
                      <TableCell colSpan={5} className="p-0">
                        <div className="px-4 py-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Invoices for {distributor.distributorName}
                          </h4>
                          {distributor.invoices &&
                          distributor.invoices.length > 0 ? (
                            <Table className="min-w-full bg-white">
                              <TableHeader className="bg-gray-100">
                                <TableRow>
                                  <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Invoice No
                                  </TableHead>
                                  <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Date
                                  </TableHead>
                                  <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Items
                                  </TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Taxable (₹)
                                  </TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    GST (₹)
                                  </TableHead>
                                  <TableHead className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Total (₹)
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-gray-200">
                                {distributor.invoices.map((invoice) => (
                                  <TableRow
                                    key={invoice._id}
                                    className="hover:bg-gray-50/50"
                                  >
                                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 font-semibold">
                                      {invoice.invoiceNumber}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 font-semibold">
                                      {format(
                                        new Date(invoice.invoiceDate),
                                        "dd MMM yyyy"
                                      )}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 text-center font-semibold">
                                      {invoice.billSummary.productCount}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 text-right font-semibold">
                                      {invoice.billSummary.taxableAmount?.toFixed(
                                        2
                                      ) || "0.00"}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 text-right font-semibold">
                                      {invoice.billSummary.gstAmount?.toFixed(
                                        2
                                      ) || "0.00"}
                                    </TableCell>
                                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-600 text-right font-semibold">
                                      {invoice.billSummary.grandTotal.toFixed(
                                        2
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-xs text-gray-500 px-3 py-2">
                              No invoices found for this distributor within the
                              selected criteria.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        );

      case "manufacturer-wise":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>
                  Manufacturer
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Products Purchased
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Total Quantity
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.manufacturerSummary?.map((mfr) => (
                <TableRow
                  key={mfr.manufacturer}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {mfr.manufacturer}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {mfr.uniqueProducts}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {mfr.totalQuantity}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {mfr.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "group-wise":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Group Name</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Unique Products Purchased
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Total Quantity Purchased
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  Total Purchase Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.groupSummary?.map((group) => (
                <TableRow
                  key={group.groupName}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {group.groupName}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {group.uniqueProducts}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {group.totalQuantity}
                  </TableCell>
                  <TableCell
                    className={`${commonNumericCellClass} font-semibold`}
                  >
                    {group.totalAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "product-wise":
        return (
          <div className="space-y-0">
            <Table className={commonTableClass}>
              <TableHeader>
                <TableRow>
                  <TableHead className={commonHeaderClass}>Product</TableHead>
                  <TableHead className={commonHeaderClass}>Batch</TableHead>
                  <TableHead className={commonHeaderClass}>
                    Manufacturer
                  </TableHead>
                  <TableHead className={`${commonHeaderClass} text-center`}>
                    Qty Purchased
                  </TableHead>
                  <TableHead className={`${commonHeaderClass} text-right`}>
                    Total Amount
                  </TableHead>
                  <TableHead
                    className={`${commonHeaderClass} text-center w-[50px]`}
                  >
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {reportData.productSummary?.map((product) => {
                  const productKey = `${product.productName}-${product.batchNumber}`;
                  const isSelected = selectedProduct === productKey;

                  return (
                    <React.Fragment key={productKey}>
                      <TableRow
                        className={cn(
                          "cursor-pointer hover:bg-pink-50 transition-colors",
                          isSelected && "bg-pink-100"
                        )}
                        onClick={() =>
                          setSelectedProduct(isSelected ? null : productKey)
                        }
                      >
                        <TableCell className={commonCellClass}>
                          {product.productName}
                        </TableCell>
                        <TableCell className={commonCellClass}>
                          {product.batchNumber}
                        </TableCell>
                        <TableCell className={commonCellClass}>
                          {product.manufacturer}
                        </TableCell>
                        <TableCell className={`${commonCellClass} text-center`}>
                          {product.quantityPurchased}
                        </TableCell>
                        <TableCell
                          className={`${commonNumericCellClass} font-semibold`}
                        >
                          {product.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className={`${commonCellClass} text-center`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 p-0 text-gray-500 hover:text-pink-600 hover:bg-pink-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(
                                isSelected ? null : productKey
                              );
                            }}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isSelected && "transform rotate-180"
                              )}
                            />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isSelected &&
                        reportData.productPurchases[productKey] && (
                          <TableRow className="bg-pink-50 hover:bg-pink-100/80">
                            <TableCell colSpan={6} className="p-0">
                              <div className="p-3 m-2 border border-pink-200 rounded-md bg-white shadow-inner">
                                <h4 className="text-sm font-semibold text-pink-600 mb-2 pl-1">
                                  Purchase Details: {product.productName}{" "}
                                  (Batch: {product.batchNumber})
                                </h4>
                                <Table className="min-w-full">
                                  <TableHeader>
                                    <TableRow className="border-b border-pink-300">
                                      <TableHead className="py-1.5 px-2 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Inv No
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-left text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Distributor
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Qty
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-right text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rate
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-right text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-center text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        GST
                                      </TableHead>
                                      <TableHead className="py-1.5 px-2 text-right text-2xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {reportData.productPurchases[
                                      productKey
                                    ].map((purchase, index) => (
                                      <TableRow
                                        key={`${purchase.invoiceNumber}-${index}`}
                                        className="border-b border-gray-200 last:border-b-0 hover:bg-pink-50/50"
                                      >
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 font-semibold">
                                          {purchase.invoiceNumber}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 font-semibold">
                                          {format(
                                            new Date(purchase.invoiceDate),
                                            "dd/MM/yy"
                                          )}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 font-semibold">
                                          {purchase.distributorName}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-center font-semibold">
                                          {purchase.quantity}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-right font-semibold">
                                          {purchase.rate?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-right font-semibold">
                                          {purchase.amount?.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-center font-semibold">
                                          {purchase.gst}%
                                        </TableCell>
                                        <TableCell className="py-1.5 px-2 text-xs text-gray-700 font-semibold text-right">
                                          {purchase.totalAmount?.toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return null;
    }
  };

  const renderInventoryTable = () => {
    if (!reportData) return null;

    const commonTableClass = "min-w-full divide-y divide-gray-200";
    const commonHeaderClass =
      "px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100/70";
    const commonCellClass =
      "px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold";
    const commonNumericCellClass = `${commonCellClass} text-right`;

    switch (selectedReportType[activeTab]) {
      case "stock-status":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Product</TableHead>
                <TableHead className={commonHeaderClass}>
                  Manufacturer
                </TableHead>
                <TableHead className={commonHeaderClass}>Batch</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Quantity
                </TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  MRP
                </TableHead>
                <TableHead className={commonHeaderClass}>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.items?.map((item) => (
                <TableRow
                  key={`${item.productName}-${item.batchNumber}`}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {item.productName}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {item.manufacturer}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {item.batchNumber}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {item.quantity}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {item.mrp?.toFixed(2)}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {item.expiry}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "low-stock":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Product</TableHead>
                <TableHead className={commonHeaderClass}>
                  Manufacturer
                </TableHead>
                <TableHead className={commonHeaderClass}>Batch</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Current Stock
                </TableHead>
                <TableHead className={commonHeaderClass}>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.lowStockItems?.map((item) => {
                const packs = Math.floor(item.currentStock / (item.pack || 1));
                const units = item.currentStock % (item.pack || 1);
                let stockDisplay = "";
                if (packs > 0)
                  stockDisplay += `${packs} pack${packs > 1 ? "s" : ""}`;
                if (packs > 0 && units > 0) stockDisplay += " & ";
                if (units > 0)
                  stockDisplay += `${units} unit${units > 1 ? "s" : ""}`;
                if (stockDisplay === "") stockDisplay = "0 units";

                return (
                  <TableRow
                    key={`${item.productName}-${item.batchNumber}`}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className={commonCellClass}>
                      {item.productName}
                    </TableCell>
                    <TableCell className={commonCellClass}>
                      {item.manufacturer}
                    </TableCell>
                    <TableCell className={commonCellClass}>
                      {item.batchNumber}
                    </TableCell>
                    <TableCell className={`${commonCellClass} text-center`}>
                      <div className="font-semibold">{stockDisplay}</div>
                      <div className="text-xs text-gray-500">
                        (Total: {item.currentStock} units, Pack:{" "}
                        {item.pack || 1})
                      </div>
                    </TableCell>
                    <TableCell className={commonCellClass}>
                      {item.expiry}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );

      case "expiry-alert":
        return (
          <Table className={commonTableClass}>
            <TableHeader>
              <TableRow>
                <TableHead className={commonHeaderClass}>Product</TableHead>
                <TableHead className={commonHeaderClass}>
                  Manufacturer
                </TableHead>
                <TableHead className={commonHeaderClass}>Batch</TableHead>
                <TableHead className={`${commonHeaderClass} text-center`}>
                  Quantity
                </TableHead>
                <TableHead className={commonHeaderClass}>Expiry</TableHead>
                <TableHead className={`${commonHeaderClass} text-right`}>
                  MRP
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {reportData.expiryAlerts?.map((item) => (
                <TableRow
                  key={`${item.productName}-${item.batchNumber}`}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className={commonCellClass}>
                    {item.productName}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {item.manufacturer}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {item.batchNumber}
                  </TableCell>
                  <TableCell className={`${commonCellClass} text-center`}>
                    {item.quantity}
                  </TableCell>
                  <TableCell className={commonCellClass}>
                    {item.expiry}
                  </TableCell>
                  <TableCell className={commonNumericCellClass}>
                    {item.mrp?.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-4">
      {/* Header Section */}
      <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-gray-50/50 gap-4">
        {/* Report Title and Date Range */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="p-2.5 rounded-lg bg-pink-50 border border-pink-200">
            {/* Icon placeholder or actual icon can go here */}
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-800">
              {selectedReport.name || "Report"}
            </h3>
            {isFilterRequired("dateRange") &&
              dateRange.from &&
              dateRange.to && (
                <p className="text-xs text-gray-500">
                  {format(new Date(dateRange.from), "dd MMM, yyyy")} -{" "}
                  {format(new Date(dateRange.to), "dd MMM, yyyy")}
                </p>
              )}
            {isFilterRequired("singleDate") && singleDate && (
              <p className="text-xs text-gray-500">
                Date: {format(new Date(singleDate), "dd MMM, yyyy")}
              </p>
            )}
            {isFilterRequired("month") && selectedMonth && (
              <p className="text-xs text-gray-500">
                Month: {format(new Date(selectedMonth), "MMMM yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Report Summary - takes available space and centers its content */}
        <div className="flex-grow flex justify-center px-2 min-w-0">
          {(activeTab === "sales" || activeTab === "purchase") &&
            reportData?.summary && (
              <ReportSummary
                summary={reportData.summary}
                activeTab={activeTab}
              />
            )}
        </div>

        {/* Export Button - does not shrink */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={
              reportStatus === "loading" ||
              !reportData ||
              isDataEmpty(reportData, activeTab, selectedReportType)
            }
            className="h-9 px-4 text-sm font-medium shadow-sm hover:bg-gray-100"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="p-0 md:p-2">
        {localError || reportError ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-600 bg-red-50 m-4 rounded-lg">
            <XCircle className="h-12 w-12 mb-3 text-red-500" />
            <p className="text-lg font-semibold">Error Generating Report</p>
            <p className="text-sm text-red-500 mt-1">
              {localError || reportError}
            </p>
          </div>
        ) : reportStatus === "loading" ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-pink-400 animate-spin mb-4"></div>
            <p className="text-md font-medium text-gray-800">
              Generating report, please wait...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              This might take a few moments.
            </p>
          </div>
        ) : !reportData ? (
          <div className="flex flex-col items-center justify-center py-16 text-center m-4 bg-gray-50 rounded-lg">
            <div className="p-4 rounded-full bg-pink-50 border border-pink-200 mb-4"></div>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              Your {selectedReport.name} will appear here.
            </p>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              {selectedReport.filters?.length > 0
                ? "Please select the required filters and click 'Generate Report' to view your data."
                : "Click 'Generate Report' to view your data."}
            </p>
            <Button
              onClick={generateReport}
              size="sm"
              className="bg-pink-400 hover:bg-pink-500 text-white text-sm h-9 px-4"
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        ) : isDataEmpty(reportData, activeTab, selectedReportType) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center m-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="p-4 rounded-full bg-yellow-100 mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-lg font-semibold text-yellow-800 mb-1">
              No Data Found
            </p>
            <p className="text-sm text-yellow-600 max-w-md">
              There is no data available for the selected criteria. Please try
              adjusting the filters or changing the date range.
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-2 md:p-0">
            {/* Report Summary Section */}

            <div className="overflow-x-auto report-table-container rounded-md border border-gray-200">
              {activeTab === "sales" && renderSalesTable()}
              {activeTab === "purchase" && renderPurchaseTable()}
              {activeTab === "inventory" && renderInventoryTable()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportResults;
