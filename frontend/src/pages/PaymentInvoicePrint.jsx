import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Button } from "../components/ui/button";
import { format } from "date-fns";
import { ArrowLeft, Printer, Send, FileDown } from "lucide-react";
import { useSelector } from "react-redux";
import { formatCurrency } from '../utils/Helper';

const PaymentInvoicePrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  const [pageSize, setPageSize] = useState("A4"); // A4 or A5
  const paymentData = location.state?.paymentData;
  const hospitalInfo = useSelector((state) => state.pharmacy.pharmacyInfo);

  

  // Add useEffect for keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault(); // Prevent default browser print dialog
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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

  if (!paymentData) {
    return <div>No payment data found</div>;
  }

  const togglePageSize = () => {
    setPageSize((prev) => (prev === "A4" ? "A5" : "A4"));
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
    <div className="p-4">
      {/* Header Controls - Only visible on screen */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Payment Receipt Preview</h1>
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

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handlePrint} size='sm'>
              <Printer className="w-4 h-4" />
              Print Now (Ctrl + P)
            </Button>
            <Button variant="outline" className="gap-2" size='sm'>
              <Send className="w-4 h-4" />
              Send Receipt (F2)
            </Button>
            <Button variant="outline" className="gap-2" size='sm'>
              <FileDown className="w-4 h-4" />
              Export as PDF (F4)
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Receipt */}
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
        {/* Header Section */}
        <div className="border-x-[1px] border-t-[1px] border-gray-800">
          <div className="grid grid-cols-6 gap-3">
            {/* Logo */}
            <div className="border-r-[1px] border-gray-800">
              <div className="w-full border-b-[1px] border-gray-800 p-1 text-xs" style={{backgroundColor: '#e5e7eb'}}>PAYMENT RECEIPT</div>
              {hospitalInfo?.logoUsable && (
                <div className="w-auto h-[78px] p-1">
                  <img
                    src={hospitalInfo.logoUsable}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="col-span-3 gap-2 py-1">
              <h2 className="font-semibold uppercase text-xl">
                {hospitalInfo?.name || "Your Pharmacy Name"}
              </h2>
              <p className="text-sm leading-snug">
                {hospitalInfo?.address || "Pharmacy Address"}
              </p>
              <div className="text-sm space-x-6">
                <span>Mob No: {hospitalInfo?.contactNumber}</span>
                <span>DL: {hospitalInfo?.drugLicenceNumber}</span>
              </div>
              <div className="text-sm">
                <span>GSTIN: {hospitalInfo?.gstNumber}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="col-span-2 border-l-[1px] border-gray-800">
              <div className="bg-gray-200 px-3 py-1 border-b-[1px] border-gray-800 flex justify-between gap-8 text-sm">
                <span className="font-medium">{paymentData.paymentNumber}</span>
                <span className="font-medium">
                  {format(new Date(paymentData.createdAt), "dd-MM-yyyy")}
                </span>
              </div>
              <div className="text-xs font-medium p-2">
                <div className="grid grid-cols-3">
                  <span>Name:</span>
                  <span className="col-span-2 capitalize">{paymentData.distributorName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span>Type:</span>
                  <span className="col-span-2">{paymentData.paymentType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settled Invoices Table */}
        <div className="min-h-[160px] border-[1px] border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-200 border-b-[1px] border-gray-800">
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5">S.No</th>
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5">Invoice No</th>
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5">Type</th>
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5">Date</th>
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-right">Invoice Amount</th>
                <th className="border-r-[1px] border-gray-800 font-medium p-1.5 text-right">Amount Settled</th>
                <th className="font-medium p-1.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="min-h-[180px]">
              {/* Purchase Bills */}
              {paymentData.bills.map((bill, index) => (
                <tr key={bill._id} className="">
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5">
                    {index + 1}
                  </td>
                  <td className="border-r-[1px] border-gray-800 pl-2 p-1.5 text-center">
                    {bill.invoiceNumber}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5">
                    {bill.invoiceType}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5">
                    {format(new Date(bill.invoiceDate), "dd-MM-yyyy")}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-right p-1.5">
                    {formatCurrency(bill.grandTotal)}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-right p-1.5">
                    {formatCurrency(bill.amountPaid)}
                  </td>
                  <td className="text-center p-1.5 capitalize">
                    {bill.paymentStatus}
                  </td>
                </tr>
              ))}
              {/* Sales Bills */}
              {paymentData.salesBills.map((bill, index) => (
                <tr key={bill._id} className="">
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5">
                    {paymentData.bills.length + index + 1}
                  </td>
                  <td className="border-r-[1px] border-gray-800 pl-2 p-1.5 text-center">
                    {bill.invoiceNumber}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5">
                    {bill.invoiceType}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5">
                    {format(new Date(bill.invoiceDate), "dd-MM-yyyy")}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-right p-1.5">
                    {formatCurrency(bill.grandTotal)}
                  </td>
                  <td className="border-r-[1px] border-gray-800 text-right p-1.5">
                    {formatCurrency(bill.amountPaid)}
                  </td>
                  <td className="text-center p-1.5 capitalize">
                    {bill.paymentStatus}
                  </td>
                </tr>
              ))}
              {[...Array(Math.max(0, 10 - (paymentData.bills.length + paymentData.salesBills.length)))].map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>
                  <td className="border-r-[1px] border-gray-800 pl-2 p-1.5"></td>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>
                  <td className="border-r-[1px] border-gray-800 text-center p-1.5"></td>
                  <td className="border-r-[1px] border-gray-800 text-right p-1.5"></td>
                  <td className="border-r-[1px] border-gray-800 text-right p-1.5"></td>
                  <td className="text-right p-1.5"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-7 border-b-[1px] border-l-[1px] border-r-[1px] border-gray-800">
          <div className="flex items-end justify-center pb-3 col-span-2">
            <div className="inline-block">
              <p className="font-medium text-xs text-gray-700">Authorized Signatory</p>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="col-span-3 border-r-[1px] border-l-[1px] border-gray-800 p-2">
            <p className="text-xs font-medium">Remarks:</p>
            <p className="text-xs">{paymentData.remarks || ''}</p>
          </div>

          {/* Payment Summary */}
          <div className="col-span-2">
            <div className="space-y-1 text-xs py-1">
              <div className="flex justify-between px-2">
                <span>Payment Method:</span>
                <span>{paymentData.paymentMethod}</span>
              </div>
              {paymentData.paymentMethod === "CHEQUE" && (
                <>
                  <div className="flex justify-between px-2">
                    <span>Cheque No:</span>
                    <span>{paymentData.chequeNumber}</span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Cheque Date:</span>
                    <span>{paymentData.chequeDate ? format(new Date(paymentData.chequeDate), "dd-MM-yyyy") : ''}</span>
                  </div>
                </>
              )}
              {(paymentData.paymentMethod === "UPI" || paymentData.paymentMethod === "BANK") && (
                <div className="flex justify-between px-2">
                  <span>Transaction No:</span>
                  <span>{paymentData.transactionNumber || 'N/A'}</span>
                </div>
              )}
              <div className="flex justify-between border-t-[1px] border-b-[1px] border-gray-800 font-medium bg-gray-200 py-1 px-2 text-sm box-border">
                <span>Total Amount:</span>
                <span>{formatCurrency(paymentData.amount)}</span>
              </div>
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

export default PaymentInvoicePrint;