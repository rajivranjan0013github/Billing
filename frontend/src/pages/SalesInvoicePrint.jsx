import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Button } from "../components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, Printer, Send, FileDown } from "lucide-react";
import { useSelector } from "react-redux";

const SalesInvoicePrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  const [pageSize, setPageSize] = useState("A4"); // A4 or A5
  const invoiceData = location.state?.invoiceData;
  const hospitalInfo = useSelector((state) => state.hospital.hospitalInfo);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page {
        size: ${pageSize};
        margin: 0;
      }
    `,
    onBeforeGetContent: () => {
      // Any preparation before printing
    },
    onAfterPrint: () => {
      // Any cleanup after printing
    },
  });

  if (!invoiceData) {
    return <div>No invoice data found</div>;
  }

  const togglePageSize = () => {
    setPageSize((prev) => (prev === "A4" ? "A5" : "A4"));
  };

  // Common styles for both A4 and A5
  const commonStyles = {
    A4: {
      width: "210mm",
      minHeight: "297mm",
      padding: "8mm",
    },
    A5: {
      width: "210",
      minHeight: "148",
      padding: "5mm",
    },
  };

  return (
    <div className="p-4">
      {/* Header Controls - Only visible on screen */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <ChevronLeft
            className="w-5 h-5 text-rose-500 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <h1 className="text-xl font-medium">Invoice Preview</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
            <button
              onClick={togglePageSize}
              className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium transition-all ${
                pageSize === "A4"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              A4
            </button>
            <button
              onClick={togglePageSize}
              className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium transition-all ${
                pageSize === "A5"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              A5
            </button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print Now (Ctrl + P)
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="w-4 h-4" />
              Send Invoice (F2)
            </Button>
            <Button variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              Export as PDF (F4)
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Invoice */}
      <div
        className="bg-white mx-auto shadow-lg print:shadow-none"
        style={{
          ...commonStyles[pageSize],
          marginBottom: "10mm",
          fontSize: pageSize === "A5" ? "0.75rem" : "0.875rem",
        }}
        ref={printRef}
      >
        {/* Header - Tax Invoice Title */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-800 inline-block px-6 pb-0.5">
            {invoiceData.saleType?.toUpperCase()}
          </h1>
        </div>

        {/* Invoice Info & Business Details */}
        <div className="border border-gray-300">
          {/* Invoice Number and Date */}
          <div className="bg-gray-50 px-3 py-1 border-b border-gray-300 flex justify-end gap-8 text-sm">
            <span>
              Invoice No:{" "}
              <span className="font-medium">{invoiceData.invoiceNumber}</span>
            </span>
            <span>
              Date:{" "}
              <span className="font-medium">
                {format(new Date(invoiceData.invoiceDate), "dd-MM-yyyy")}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3 p-3">
            {/* Business Info - Left Side */}
            <div className="col-span-3 flex gap-3">
              {hospitalInfo?.logoUsable && (
                <div className="w-[60px] h-[60px]">
                  <img
                    src={hospitalInfo.logoUsable}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {hospitalInfo?.name || "Your Pharmacy Name"}
                </h2>
                <p className="text-sm text-gray-600 leading-snug">
                  {hospitalInfo?.address || "Pharmacy Address"}
                </p>
                <div className="text-sm text-gray-600 space-x-6">
                  <span>Ph: {hospitalInfo?.contactNumber}</span>
                  <span>DL: {hospitalInfo?.drugLicenceNumber}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>GSTIN: {hospitalInfo?.gstNumber}</span>
                </div>
              </div>
            </div>

            {/* distributor Details - Right Side */}
            <div className="col-span-2 bg-gray-50 p-2 border border-gray-200 rounded">
              <h3 className="text-sm font-medium mb-1 text-gray-700">
                distributor Details
              </h3>
              <div className="space-y-0.5 text-sm">
                <div className="grid grid-cols-3">
                  <span className="text-gray-600">distributor Name:</span>
                  <span className="col-span-2">{invoiceData.distributorName}</span>
                </div>
                {invoiceData.distributorGstin && (
                  <div className="grid grid-cols-3">
                    <span className="text-gray-600">GSTIN:</span>
                    <span className="col-span-2">{invoiceData.distributorGstin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="bg-gray-50 p-1.5 border border-gray-300 text-left font-medium text-gray-600">
                  Description
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-20">
                  HSN
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-24">
                  Batch
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-20">
                  Exp
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-16">
                  Qty
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-20">
                  MRP
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-20">
                  Rate
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-16">
                  Dis%
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-center w-16">
                  GST%
                </th>
                <th className="bg-gray-50 p-1.5 border border-gray-300 font-medium text-gray-600 text-right w-24">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.products.map((product, index) => (
                <tr key={index}>
                  <td className="p-1.5 border border-gray-300">
                    {product.productName}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {product.HSN}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {product.batchNumber}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {product.expiry}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {product.quantity / (product.pack || 1)}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    ₹{product.mrp}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    ₹{product.saleRate}
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {product.discount}%
                  </td>
                  <td className="p-1.5 border border-gray-300 text-center">
                    {product.gstPer}%
                  </td>
                  <td className="p-1.5 border border-gray-300 text-right">
                    ₹{product.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="mt-3 grid grid-cols-5 gap-3">
          {/* Tax Summary */}
          <div className="col-span-3">
            <table className="w-full text-sm border border-gray-300">
              <thead>
                <tr>
                  <th className="bg-gray-50 p-1.5 border-b border-gray-300 text-left font-medium text-gray-600">
                    Tax Type
                  </th>
                  <th className="bg-gray-50 p-1.5 border-b border-gray-300 text-right font-medium text-gray-600">
                    Taxable Value
                  </th>
                  <th className="bg-gray-50 p-1.5 border-b border-gray-300 text-right font-medium text-gray-600">
                    CGST
                  </th>
                  <th className="bg-gray-50 p-1.5 border-b border-gray-300 text-right font-medium text-gray-600">
                    SGST
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoiceData.billSummary.gstSummary)
                  .filter(([rate, value]) => value.taxable > 0)
                  .map(([rate, value]) => (
                    <tr key={rate}>
                      <td className="p-1.5 border-b border-gray-300">
                        GST {rate}%
                      </td>
                      <td className="p-1.5 border-b border-gray-300 text-right">
                        ₹{value.taxable.toFixed(2)}
                      </td>
                      <td className="p-1.5 border-b border-gray-300 text-right">
                        ₹{value.cgst.toFixed(2)} ({Number(rate) / 2}%)
                      </td>
                      <td className="p-1.5 border-b border-gray-300 text-right">
                        ₹{value.sgst.toFixed(2)} ({Number(rate) / 2}%)
                      </td>
                    </tr>
                  ))}
                <tr className="font-medium bg-gray-50">
                  <td className="p-1.5">Total</td>
                  <td className="p-1.5 text-right">
                    ₹{invoiceData.billSummary.taxableAmount.toFixed(2)}
                  </td>
                  <td className="p-1.5 text-right">
                    ₹{(invoiceData.billSummary.gstAmount / 2).toFixed(2)}
                  </td>
                  <td className="p-1.5 text-right">
                    ₹{(invoiceData.billSummary.gstAmount / 2).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bill Summary */}
          <div className="col-span-2">
            <div className="border border-gray-300">
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-300">
                <h3 className="text-sm font-medium text-gray-700">
                  Bill Summary
                </h3>
              </div>
              <div className="p-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>₹{invoiceData.billSummary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span>
                      ₹{invoiceData.billSummary.discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST Amount:</span>
                    <span>₹{invoiceData.billSummary.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 font-medium">
                    <span>Total Amount:</span>
                    <span>₹{invoiceData.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Signature */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600 pl-1 [&>li]:truncate">
              <li>Goods once sold will not be taken back or exchanged</li>
              <li>All disputes are subject to local jurisdiction only</li>
              <li>Please check expiry date and instructions before use</li>
              <li>E. & O. E. (Errors and Omissions Excepted)</li>
            </ul>
          </div>
          <div className="text-right">
            <div className="mt-8 pt-2 border-t border-gray-300 inline-block">
              <p className="font-medium text-gray-700">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              size: ${pageSize};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default SalesInvoicePrint;
