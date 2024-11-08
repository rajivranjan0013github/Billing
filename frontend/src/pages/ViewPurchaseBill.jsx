import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Backend_URL, numberToWords } from "../assets/Data"
import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useReactToPrint } from 'react-to-print';
import { Loader2 } from "lucide-react";

export default function ViewPurchaseBill() {
    const { billId } = useParams();
    const [billData, setBillData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    useEffect(() => {
        const fetchBill = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${Backend_URL}/api/purchase/purchase-bill/${billId}`, { credentials: 'include' });
                const data = await response.json();
                setBillData(data);
            } catch (error) {
                console.error('Error fetching bill:', error);
            } finally {
                setIsLoading(false);
            }
        }
        if(billId) {
            fetchBill();
        }
    }, [billId]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-lg text-gray-700">Loading invoice...</span>
            </div>
        );
    }

    if (!billData) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-lg text-gray-700">No invoice data found.</p>
            </div>
        );
    }

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount).replace(/^(\D+)/, '₹');
    };

    return (
        <div className="relative">
            <button 
                onClick={handlePrint}
                className="fixed top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 print:hidden"
            >
                Print Invoice
            </button>
            
            <div 
                ref={componentRef}
                className="max-w-4xl mx-auto p-6 bg-white my-8"
            >
                <h1 className="text-xl font-bold mb-4">PURCHASE INVOICE</h1>
                
                <div className="border border-gray-300">
                    {/* Company Header */}
                    <div className="grid grid-cols-2 border-b border-gray-300">
                        <div className="p-4">
                            <h2 className="font-bold text-lg">GOOD AND BAD SERVICES</h2>
                            <p className="text-sm">123 Main Street, Patna, Bihar - 800001</p>
                            <p className="text-sm">GSTIN: 22AAAAA0000A1Z5 | Mobile: +91 9097849090</p>
                            <p className="text-sm">Email: contact@goodandbad.com</p>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm">Invoice No.</p>
                                <p className="text-sm">{billData?.bill_number}</p>
                                <p className="text-sm mt-2">Supplier Invoice</p>
                                <p className="text-sm">{billData?.supplier_invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-sm">Invoice Date</p>
                                <p className="text-sm">{billData?.bill_date ? new Date(billData.bill_date).toLocaleDateString() : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Details */}
                    <div className="grid grid-cols-2 border-b border-gray-300">
                        <div className="p-4">
                            <h3 className="font-bold mb-2">SUPPLIER DETAILS</h3>
                            <div className="text-sm">
                                <p className="font-bold">{billData?.supplier?.name}</p>
                                <p>{billData?.supplier?.billing_address}</p>
                                <p>GSTIN: {billData?.supplier?.gstin}</p>
                                <p>Mobile: {billData?.supplier?.mobile_number}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-2 border text-left">S.NO.</th>
                                    <th className="p-2 border text-left">ITEMS</th>
                                    <th className="p-2 border text-left">HSN</th>
                                    <th className="p-2 border text-left">BATCH</th>
                                    <th className="p-2 border text-left">EXPIRY</th>
                                    <th className="p-2 border text-left">QTY</th>
                                    <th className="p-2 border text-left">MRP</th>
                                    <th className="p-2 border text-left">RATE</th>
                                    <th className="p-2 border text-left">DISC.</th>
                                    <th className="p-2 border text-left">GST</th>
                                    <th className="p-2 border text-left">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billData?.items?.map((item, index) => {
                                    const subtotal = (item?.quantity || 0) * (item?.purchase_price || 0);
                                    const discountAmount = (subtotal * (item?.discount_percentage || 0)) / 100;
                                    const taxableAmount = subtotal - discountAmount;
                                    const taxAmount = (taxableAmount * (item?.gst_percentage || 0)) / 100;
                                    const totalAmount = taxableAmount + taxAmount;

                                    return (
                                        <tr key={index}>
                                            <td className="p-2 border">{index + 1}</td>
                                            <td className="p-2 border">{item?.item?.name}</td>
                                            <td className="p-2 border">{item?.hsn_code}</td>
                                            <td className="p-2 border">{item?.batch_number}</td>
                                            <td className="p-2 border">
                                                {item?.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="p-2 border">{item?.quantity} {item?.unit}</td>
                                            <td className="p-2 border">{formatCurrency(item?.mrp || 0)}</td>
                                            <td className="p-2 border">{formatCurrency(item?.purchase_price)}</td>
                                            <td className="p-2 border">{formatCurrency(discountAmount)} ({item?.discount_percentage}%)</td>
                                            <td className="p-2 border">{formatCurrency(taxAmount)} ({item?.gst_percentage}%)</td>
                                            <td className="p-2 border">{formatCurrency(totalAmount)}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-gray-50 font-bold">
                                    <td className="p-2 border" colSpan="5">TOTAL</td>
                                    <td className="p-2 border">{billData?.items?.reduce((acc, item) => acc + (item.quantity || 0), 0)}</td>
                                    <td className="p-2 border" colSpan="2"></td>
                                    <td className="p-2 border">{formatCurrency(billData?.tax_summary?.[0]?.taxableAmount)}</td>
                                    <td className="p-2 border">{formatCurrency((billData?.tax_summary?.[0]?.sgst || 0) + (billData?.tax_summary?.[0]?.cgst || 0))}</td>
                                    <td className="p-2 border">{formatCurrency(billData?.grand_total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 border-t border-gray-300">
                        <div className="p-4">
                            <p className="text-sm">Paid Amount ({billData?.payment?.payment_method}): {formatCurrency(billData?.payment?.amount_paid)}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm">Balance Amount: {formatCurrency((billData?.grand_total || 0) - (billData?.payment?.amount_paid || 0))}</p>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="p-4 border-t border-gray-300">
                        <h3 className="font-bold mb-2">Terms and Conditions</h3>
                        <ol className="text-sm list-decimal list-inside">
                            <li>All disputes are subject to Patna jurisdiction only</li>
                            <li>Payment should be made as per agreed terms</li>
                            <li>Goods received in good condition</li>
                        </ol>
                    </div>

                    {/* Signature Section */}
                    <div className="p-4 border-t border-gray-300 text-right">
                        <p className="font-semibold">For {billData?.created_by?.name}</p>
                        <div className="h-16"></div>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    );
}