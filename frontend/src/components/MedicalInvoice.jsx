import React from 'react';

const MedicalInvoice = ({ invoiceData }) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6">
      {/* Header Section */}
      <div className="grid grid-cols-12 border border-gray-800">
        {/* Left Section - Logo and Tax Invoice */}
        <div className="col-span-2 border-r border-gray-800">
          <div className="border-b border-gray-800 bg-gray-100 p-2">
            <h2 className="font-bold">TAX INVOICE</h2>
          </div>
          <div className="p-4">
            <img src="/logo.png" alt="Medical Logo" className="w-20 h-20" />
          </div>
        </div>

        {/* Middle Section - Company Details */}
        <div className="col-span-5 p-4">
          <h1 className="text-xl font-bold">SANTI MEDICAL</h1>
          <p className="text-sm">Central Delhi, Delhi - 110001</p>
          <div className="mt-2">
            <p className="text-sm">CONTACT: 9942000425</p>
            <p className="text-sm">EMAIL ID: abc@gmail.com</p>
            <p className="text-sm">DRUG LIC: -</p>
          </div>
        </div>

        {/* Right Section - Invoice Details */}
        <div className="col-span-5 border-l border-gray-800">
          <div className="flex justify-between p-2 bg-gray-100 border-b border-gray-800">
            <span>Invoice/1</span>
            <span>25-Mar-2025</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-1 text-sm">
              <span>PATIENT</span>
              <span className="col-span-2">MANISH</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm">
              <span>ADDRESS</span>
              <span className="col-span-2">-</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm">
              <span>CONTACT</span>
              <span className="col-span-2">-</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm">
              <span>POS</span>
              <span className="col-span-2">07 - DELHI</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-sm">
              <span>DOCTOR</span>
              <span className="col-span-2">Dr. SIDHARTH CLINIC(SIDHARTH VIR)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-4 border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-800">
              <th className="border-r border-gray-800 p-2 text-left">#</th>
              <th className="border-r border-gray-800 p-2 text-left">DESCRIPTION</th>
              <th className="border-r border-gray-800 p-2">COMP</th>
              <th className="border-r border-gray-800 p-2">SCH</th>
              <th className="border-r border-gray-800 p-2">RACK</th>
              <th className="border-r border-gray-800 p-2">HSN</th>
              <th className="border-r border-gray-800 p-2">BATCH</th>
              <th className="border-r border-gray-800 p-2">EXP</th>
              <th className="border-r border-gray-800 p-2">QTY</th>
              <th className="border-r border-gray-800 p-2">MRP</th>
              <th className="border-r border-gray-800 p-2">RATE</th>
              <th className="border-r border-gray-800 p-2">DIS %</th>
              <th className="border-r border-gray-800 p-2">GST%</th>
              <th className="p-2 text-right">AMT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-800">
              <td className="border-r border-gray-800 p-2">1</td>
              <td className="border-r border-gray-800 p-2">DOLO T TAB 10'S</td>
              <td className="border-r border-gray-800 p-2 text-center">MICRO</td>
              <td className="border-r border-gray-800 p-2 text-center">H1</td>
              <td className="border-r border-gray-800 p-2 text-center">-</td>
              <td className="border-r border-gray-800 p-2 text-center">3004</td>
              <td className="border-r border-gray-800 p-2 text-center">QWERTEE</td>
              <td className="border-r border-gray-800 p-2 text-center">12/34</td>
              <td className="border-r border-gray-800 p-2 text-center">2</td>
              <td className="border-r border-gray-800 p-2 text-center">134.0</td>
              <td className="border-r border-gray-800 p-2 text-center">134.0</td>
              <td className="border-r border-gray-800 p-2 text-center">-</td>
              <td className="border-r border-gray-800 p-2 text-center">12%</td>
              <td className="p-2 text-right">268.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Left Side - Remarks and Products */}
        <div>
          <div className="mb-2">
            <p className="font-bold">REMARKS</p>
            <p>-</p>
            <p>-</p>
          </div>
          <div>
            <p>PRODUCTS: 1, TOTAL QTY: 2</p>
          </div>
        </div>

        {/* Right Side - GST Details and Totals */}
        <div className="grid grid-cols-2">
          <div>
            <p>E&OE</p>
            <div className="mt-2">
              <p>GST 0%</p>
              <p>GST 5%</p>
              <p>GST 12%</p>
              <p>GST 18%</p>
              <p>GST 28%</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mt-2">
              <p>TAXABLE: 239.29</p>
              <p>CGST: 14.36</p>
              <p>SGST: 14.36</p>
              <p>IGST: 0.0</p>
              <p>TOTAL: 28.71</p>
            </div>
            <div className="mt-4">
              <p>Subtotal: 268.0</p>
              <p>CGST+SGST: 28.71</p>
              <p className="font-bold">To Pay: Rs 268.00</p>
              <p>Paid/Balance: 268.00/0.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Type */}
      <div className="mt-4 text-sm">
        <p>ORIGINAL / DUPLICATE / TRIPLICATE</p>
        <p>Generated by SANTI DEVI at 25/Mar 01:26 PM</p>
        <p className="text-right">Powered by LocalWell Pharmacy App</p>
      </div>
    </div>
  );
};

export default MedicalInvoice; 