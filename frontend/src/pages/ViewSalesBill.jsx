import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Backend_URL, numberToWords } from "../assets/Data"
import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { useReactToPrint } from 'react-to-print';

export default function ViewSalesBill() {
    const { billId } = useParams();
    const [billData, setBillData] = useState(null);
    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    console.log('billId', billId);
    console.log('billData', billData);
    

    useEffect(() => {
        const fetchBill = async () => {
            const response = await fetch(`${Backend_URL}/api/bills/sales-bill/${billId}`, { credentials: 'include' });
            const data = await response.json();
            setBillData(data);
        }
        if(billId) {
            fetchBill();
        }
    }, [billId]);

    if (!billData) return <div>Loading...</div>;

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
            
            <Card 
                ref={componentRef}
                className="w-full max-w-4xl mx-auto my-8 border-2 print:border-0"
            >
                <CardHeader className="border-b-2 print:border-b">
                    <CardTitle className="text-3xl font-bold text-center mb-2">Good And Bad Services</CardTitle>
                    <div className="text-center space-y-1">
                        <p className="text-gray-600">123 Main Street, Patna, Bihar - 800001</p>
                        <p className="text-gray-600">Mobile: +91 9097849090 | Email: contact@goodandbad.com</p>
                        <p className="text-gray-600 font-semibold">GSTIN: 22AAAAA0000A1Z5</p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex justify-between items-start mt-4 border-b pb-4">
                        <div className="w-1/2 border p-4 rounded-lg bg-gray-50">
                            <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">BILL TO</h3>
                            <div className="space-y-1">
                                <p className="font-semibold">{billData.party_name}</p>
                                <p className="text-gray-600">{billData.party.billing_address}</p>
                                <p className="text-gray-600">Mobile: {billData.party.mobile_number}</p>
                                <p className="text-gray-600">GSTIN: {billData.party.gstin}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="text-right space-y-1">
                                <h2 className="text-xl font-bold">Tax Invoice</h2>
                                <p className="text-gray-600">Invoice No.: {billData.bill_number}</p>
                                <p className="text-gray-600">Invoice Date: {new Date(billData.bill_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <Table className="border">
                        <TableHeader>
                            <TableRow className="bg-gray-100">
                                <TableHead className="font-bold">ITEM</TableHead>
                                <TableHead className="font-bold text-center">HSN</TableHead>
                                <TableHead className="font-bold text-center">QTY.</TableHead>
                                <TableHead className="font-bold text-right">RATE</TableHead>
                                <TableHead className="font-bold text-right">DISC.</TableHead>
                                <TableHead className="font-bold text-right">TAX</TableHead>
                                <TableHead className="font-bold text-right">AMOUNT</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billData.items.map((item, index) => {
                                const subtotal = item.quantity * item.price_per_unit;
                                const discountAmount = (subtotal * item.discount_percentage) / 100;
                                const taxableAmount = subtotal - discountAmount;
                                const taxAmount = (taxableAmount * item.gst_percentage) / 100;
                                const totalAmount = taxableAmount + taxAmount;

                                return (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.item.name}</TableCell>
                                        <TableCell className="text-center">{item.hsn_code}</TableCell>
                                        <TableCell className="text-center">{item.quantity} {item.unit}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.price_per_unit)}</TableCell>
                                        <TableCell className="text-right">
                                            {item.discount_percentage > 0 ? 
                                                `${formatCurrency(discountAmount)} (${item.discount_percentage}%)` : 
                                                '₹0.00 (0%)'
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(taxAmount)} ({item.gst_percentage}%)
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(totalAmount)}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <table className="text-sm w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="py-2 text-left font-medium">Tax Rate</th>
                                        <th className="py-2 text-right font-medium">Taxable Amt</th>
                                        <th className="py-2 text-right font-medium">SGST</th>
                                        <th className="py-2 text-right font-medium">CGST</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billData.tax_summary.map((tax, index) => (
                                        <tr key={index} className="border-b border-gray-200">
                                            <td className="py-2 text-left">{tax.rate}%</td>
                                            <td className="py-2 text-right">{formatCurrency(tax.taxableAmount)}</td>
                                            <td className="py-2 text-right">{formatCurrency(tax.sgst)}</td>
                                            <td className="py-2 text-right">{formatCurrency(tax.cgst)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span>{formatCurrency(billData.tax_summary[0].taxableAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">CGST @{billData.tax_summary[0].rate/2}%:</span>
                                <span>{formatCurrency(billData.tax_summary[0].cgst)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">SGST @{billData.tax_summary[0].rate/2}%:</span>
                                <span>{formatCurrency(billData.tax_summary[0].sgst)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                    <span>Total Amount:</span>
                                    <span>{formatCurrency(billData.grand_total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Received Amount:</span>
                                    <span>{formatCurrency(billData.payment.amount_received)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Balance:</span>
                                    <span>{formatCurrency(billData.grand_total - billData.payment.amount_received)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-bold text-gray-700 mb-2">TERMS AND CONDITIONS</h3>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            <li>Goods once sold will not be taken back or exchanged</li>
                            <li>All disputes are subject to Patna jurisdiction only</li>
                            <li>Payment should be made within 30 days of invoice</li>
                        </ol>
                    </div>
                </CardContent>

                <CardFooter className="border-t-2 mt-6 pt-4 flex-col items-start space-y-2">
                    <div className="w-full">
                        <p className="font-semibold text-gray-700">Amount in Words:</p>
                        <p className="text-gray-600">{numberToWords(billData.grand_total)}</p>
                    </div>
                    <div className="w-full flex justify-between items-center mt-4">
                        <p className="text-sm text-gray-500">TAX INVOICE - ORIGINAL FOR RECIPIENT</p>
                        <div className="text-right">
                            <p className="font-semibold">For {billData.created_by.name}</p>
                            <div className="h-16"></div>
                            <p>Authorized Signatory</p>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}