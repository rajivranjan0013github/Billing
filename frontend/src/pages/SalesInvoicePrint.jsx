import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Button } from "../components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, Printer, Send, FileDown, Settings } from "lucide-react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/Helper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

const SalesInvoicePrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  const [pageSize, setPageSize] = useState("A4"); // A4 or A5
  const invoiceData = location.state?.invoiceData;
  const pharmacyInfo = useSelector((state) => state.pharmacy.pharmacyInfo);

  const initialFieldVisibility = {
    pack: true,
    hsn: true,
    batch: true,
    exp: true,
    qty: true,
    mrp: true,
    rate: true,
    discount: true,
    gst: true,
  };

  const [fieldVisibility, setFieldVisibility] = useState(() => {
    const savedVisibility = localStorage.getItem("invoiceFieldVisibility");
    if (savedVisibility) {
      try {
        return JSON.parse(savedVisibility);
      } catch (error) {
        console.error("Error parsing field visibility from localStorage:", error);
        return initialFieldVisibility; // Fallback to default if parsing fails
      }
    }
    return initialFieldVisibility;
  });

  useEffect(() => {
    localStorage.setItem("invoiceFieldVisibility", JSON.stringify(fieldVisibility));
  }, [fieldVisibility]);

  // Add useEffect for keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (((e.ctrlKey || e.metaKey) && e.key === "p") || e.key === 'Enter') {
        e.preventDefault(); // Prevent default browser print dialog
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [pageSize, invoiceData, pharmacyInfo]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page {
        size: ${pageSize};
        margin: 0;
      }
      @media print {
        html, body {
          height: 100%;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden;
        }
        body * {
          visibility: hidden;
        }
        #print-content,
        #print-content * {
          visibility: visible;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
        }
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

  const toggleFieldVisibility = (field) => {
    setFieldVisibility(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Common styles for both A4 and A5
  const commonStyles = {
    A4: {
      width: "220mm",
      minHeight: "297mm",
      padding: "8mm",
    },
    A5: {
      width: "215mm",
      minHeight: "148",
      padding: "5mm",
    },
  };

  return (
    <div className="p-4 font-semibold">
      {/* Header Controls - Only visible on screen */}
      <div className="flex items-center justify-between mb-4 print:hidden border-b-[1px] border-gray-400 pb-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Invoice Preview</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
            <button
              onClick={togglePageSize}
              className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium transition-all ${
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
          <Button
              variant="outline"
              className="gap-2"
              onClick={handlePrint}
              size="sm"
            >
              <Printer className="w-4 h-4" />
              Print Now (Ctrl + P)
            </Button>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <Settings className="w-4 h-4" />
                  Field Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 print:hidden " side='bottom' align='end'>
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h4 className="text-sm font-semibold text-gray-700">Customize Fields</h4>
                </div>
                <div className="p-3 space-y-2">
                  {Object.keys(fieldVisibility).map((field) => (
                    <div key={field} className="flex items-center justify-between py-1">
                      <span className="capitalize text-xs font-medium text-gray-600">
                        {field.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldVisibility[field]}
                          onChange={() => toggleFieldVisibility(field)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
           
            {/* <Button variant="outline" className="gap-2" size="sm">
              <Send className="w-4 h-4" />
              Send Invoice (F2)
            </Button>
            <Button variant="outline" className="gap-2" size="sm">
              <FileDown className="w-4 h-4" />
              Export as PDF (F4)
            </Button> */}
          </div>
        </div>
      </div>

      {/* Printable Invoice */}
      <div
        id="print-content"
        className="bg-white mx-auto shadow-lg print:shadow-none"
        style={{
          ...commonStyles[pageSize],
          marginBottom: "10mm",
          fontSize: pageSize === "A5" ? "0.75rem" : "0.875rem",
        }}
        ref={printRef}
      >
        {/* Header - Tax Invoice Title
        <div className="text-center mb-3">
          <h1 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-800 inline-block px-6 pb-0.5">
            {invoiceData.saleType?.toUpperCase()}
          </h1>
        </div> */}

        {/* Invoice Info & Business Details */}
        <div className="border-x-[1px] border-t-[1px]  border-gray-800">
          <div className="grid grid-cols-7 gap-3">
            {/* logo */}
            <div className="border-r-[1px] border-gray-800">
              <div
                className="w-full border-b-[1px] border-gray-800 p-1"
                style={{ backgroundColor: "#e5e7eb" }}
              >
                TAX INVOICE
              </div>
              {pharmacyInfo?.logoUsable && (
                <div className="w-auto h-[78px] p-1">
                  <img
                    src={pharmacyInfo.logoUsable}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            {/* Business Info - Left Side */}
            <div className="col-span-3  gap-2 py-1 ">
              <h2 className="font-semibold uppercase text-xl">
                {pharmacyInfo?.name || "Your Pharmacy Name"}
              </h2>
              <p className="text-sm  leading-snug">
                {pharmacyInfo?.address || "Pharmacy Address"}
              </p>
              <div className="text-sm  space-x-6">
                <span>Mob No: {pharmacyInfo?.contactNumber}</span>
                <span>DL: {pharmacyInfo?.drugLicenceNumber}</span>
              </div>
              <div className="text-sm ">
                <span>GSTIN: {pharmacyInfo?.gstNumber}</span>
              </div>
            </div>

            {/* Customer Details - Right Side */}
            <div className="col-span-3  border-l-[1px] border-gray-800">
              {/* Invoice Number and Date */}
              <div className="bg-gray-200 px-3 py-1 border-b-[1px] border-gray-800 flex justify-between gap-8 text-sm">
                <span className="font-medium">{invoiceData.invoiceNumber}</span>
                <span className="font-medium">
                  {format(new Date(invoiceData.invoiceDate), "dd-MM-yyyy")}{" "}
                  {format(new Date(invoiceData.createdAt), "hh:mm a")}
                </span>
              </div>
              <div className="text-xs font-medium p-2 space-y-1">
                <div className="grid grid-cols-5">
                  <span className="">Name:</span>
                  <span className="col-span-4 capitalize">
                    {invoiceData.customerName}
                  </span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="">Mob No:</span>
                  <span className="col-span-4">
                    {invoiceData.customerMob || invoiceData.mob || "---"}
                  </span>
                </div>
                {/* <div className="grid grid-cols-3">
                  <span className="">Address:</span>
                  <span className="col-span-2">{invoiceData.customerAddress||"---"}</span>
                </div> */}
                <div className="grid grid-cols-5">
                  <span className="">Doctor:</span>
                  <span className="col-span-4">
                    {invoiceData.doctorName || "---"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="min-h-[156px] border-[1px] border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-200 border-b-[1px] border-gray-800">
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5"></th>
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5">
                  Description
                </th>
                {fieldVisibility.pack && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    Pack
                  </th>
                )}
                {fieldVisibility.hsn && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    HSN
                  </th>
                )}
                {fieldVisibility.batch && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    Batch
                  </th>
                )}
                {fieldVisibility.exp && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    Exp
                  </th>
                )}
                {fieldVisibility.qty && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    Qty
                  </th>
                )}
                {fieldVisibility.mrp && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    MRP
                  </th>
                )}
                {fieldVisibility.rate && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    Rate
                  </th>
                )}
                {fieldVisibility.discount && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    Dis%
                  </th>
                )}
                {fieldVisibility.gst && (
                  <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-center">
                    GST%
                  </th>
                )}
                <th className=" font-medium p-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="min-h-[180px]">
              {invoiceData.products.map((product, index) => (
                <tr key={index} className="">
                  <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                    {index + 1}
                  </td>
                  <td className="border-r-[1px] border-gray-800 px-1.5">
                    {product.productName}
                  </td>
                  {fieldVisibility.pack && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      1*{product.pack}
                    </td>
                  )}
                  {fieldVisibility.hsn && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product.HSN}
                    </td>
                  )}
                  {fieldVisibility.batch && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product.batchNumber}
                    </td>
                  )}
                  {fieldVisibility.exp && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product.expiry}
                    </td>
                  )}
                  {fieldVisibility.qty && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {(() => {
                        const packSize = product.pack || 1;
                        if (packSize <= 1) {
                          return product.quantity;
                        }
                        const quotient = Math.floor(product.quantity / packSize);
                        const remainder = product.quantity % packSize;
                        return remainder === 0
                          ? `${quotient}`
                          : `${quotient} : ${remainder}`;
                      })()}
                    </td>
                  )}
                  {fieldVisibility.mrp && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product.mrp}
                    </td>
                  )}
                  {fieldVisibility.rate && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product.saleRate}
                    </td>
                  )}
                  {fieldVisibility.discount && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product?.discount || 0}
                    </td>
                  )}
                  {fieldVisibility.gst && (
                    <td className="border-r-[1px] border-gray-800 text-center px-1.5">
                      {product?.gstPer || 0}
                    </td>
                  )}
                  <td className=" text-right px-1.5">
                    {product.amount}{" "}
                    {product.types === "return" && (
                      <span className="text-red-500">R</span>
                    )}
                  </td>
                </tr>
              ))}
              {[...Array(Math.max(0, 18 - invoiceData.products.length))].map(
                (_, index) => (
                  <tr key={`empty-${index}`}>
                    <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>
                    <td className="border-r-[1px] border-gray-800 pl-2 p-1.5"></td>
                    {fieldVisibility.pack && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.hsn && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.batch && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.exp && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.qty && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.mrp && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.rate && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.discount && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {fieldVisibility.gst && <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>}
                    {/* <td className=" text-right p-1.5"></td> */}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-7 border-b-[1px] border-l-[1px] border-r-[1px] border-gray-800">
          <div className=" flex items-end justify-center pb-3 col-span-2">
            <div className=" inline-block">
              <p className="font-medium text-xs text-gray-700">
                Authorized Signatory
              </p>
            </div>
          </div>
          {/* Tax Summary */}
          <div className="col-span-3 border-r-[1px] border-l-[1px] border-gray-800 px-3">
            <table className="w-full text-xs ">
              <thead className="border-b-[1px] py-2">
                <tr className="">
                  <th className="text-left font-medium">GST</th>
                  <th className="text-right font-medium">Taxable</th>
                  <th className="text-right font-medium">CGST</th>
                  <th className="text-right font-medium">SGST</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoiceData.billSummary.gstSummary)
                  .filter(([rate, value]) => value.taxable > 0)
                  .map(([rate, value]) => (
                    <tr key={rate}>
                      <td>{rate}%</td>
                      <td className="text-right">{value.taxable.toFixed(2)}</td>
                      <td className="text-right">
                        {value.cgst.toFixed(2)} ({Number(rate) / 2}%)
                      </td>
                      <td className="text-right">
                        {value.sgst.toFixed(2)} ({Number(rate) / 2}%)
                      </td>
                    </tr>
                  ))}
                <tr className="font-medium border-t-[1px]">
                  <td>Total</td>
                  <td className="text-right">
                    ₹{invoiceData.billSummary.taxableAmount.toFixed(2)}
                  </td>
                  <td className="text-right border-b">
                    ₹{(invoiceData.billSummary.gstAmount / 2).toFixed(2)}
                  </td>
                  <td className="text-right border-b">
                    ₹{(invoiceData.billSummary.gstAmount / 2).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="text-right col-span-2 text-xs">
              GST : {formatCurrency(invoiceData.billSummary.gstAmount)}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="col-span-2">
            <div className="space-y-1 text-xs py-1">
              <div className="flex justify-between px-2">
                <span className="">Subtotal:</span>
                <span>
                  {formatCurrency(invoiceData?.billSummary?.subtotal)}
                </span>
              </div>
              <div className="flex justify-between px-2">
                <span className="">Discount:</span>
                <span>
                  {invoiceData?.billSummary?.discountAmount !== 0 && "-"}{" "}
                  {formatCurrency(invoiceData?.billSummary?.discountAmount)}
                </span>
              </div>
              {invoiceData?.billSummary?.adjustment !== 0 && (
                <div className="flex justify-between px-2">
                  <span className="">Adjustment:</span>
                  <span>
                    {formatCurrency(invoiceData?.billSummary?.adjustment)}
                  </span>
                </div>
              )}
              {invoiceData?.saleType === "return" && (
                <div className="flex justify-between px-2">
                  <span className="">Return Value:</span>
                  <span>
                    {formatCurrency(invoiceData?.billSummary?.returnAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t-[1px] border-b-[1px] border-gray-800 font-medium bg-gray-200 py-1 px-2 text-sm box-border">
                <span>Total Amount:</span>
                <span>{formatCurrency(invoiceData?.grandTotal)}</span>
              </div>
              <div className="flex justify-between px-2">
                <span className="">Paid/Due:</span>
                <span>
                  {formatCurrency(invoiceData?.amountPaid)}/
                  {formatCurrency(
                    Number(invoiceData.grandTotal) -
                      Number(invoiceData.amountPaid)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Signature */}
        {/* <div className="mt-4 grid grid-cols-2 gap-6">
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
          
        </div> */}
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
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
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
