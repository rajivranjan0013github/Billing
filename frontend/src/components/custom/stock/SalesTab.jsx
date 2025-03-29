import { ChevronRight, PackageX } from 'lucide-react'
import { useState, useEffect } from "react"
import { Backend_URL, convertToFraction, convertQuantity, convertQuantityValue } from "../../../assets/Data"
import { useToast } from "../../../hooks/use-toast"
import { useNavigate } from 'react-router-dom'

export default function SalesTab({inventoryId}) {
    const {toast} = useToast();
    const [sales, setSales] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/inventory/timeline/${inventoryId}?type=sale`, {credentials: "include"});
                if(!response.ok) throw new Error("Failed to fetch timeline");
                const data = await response.json();
                setSales(data);
            } catch (error) {
                toast({title: "Failed to fetch timeline", variant: "destructive"});
            }
        }
        if(inventoryId) fetchSales();
    }, [inventoryId]);

    
    return (
        <div className="w-full">
            <div className="border rounded-lg">
                {sales.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">INVOICE DATE</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">SOLD TO</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">BATCH NO</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">MRP</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">SALE RATE</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">MARGIN</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">SALE QTY</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr
                                    key={sale._id}
                                    className="hover:bg-secondary cursor-pointer border-b last:border-0"
                                    onClick={() => {navigate(`/sale/${sale.invoiceId}`)}}
                                >
                                    <td className="px-4 py-2">
                                        <div className="text-sm font-medium">
                                            {new Date(sale.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="text-sm font-medium flex items-center gap-2">
                                            {sale.distributorName}
                                        </div>
                                        {sale.distributorMob && (
                                            <div className="text-xs text-gray-500">Mobile: {sale.distributorMob}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="text-sm font-medium">{sale.batchNumber}</div>
                                        <div className="text-xs text-gray-500">Expiry: {sale.expiry}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right">₹{sale.mrp?.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="text-sm font-medium">₹{convertToFraction(sale?.saleRate * (1 + sale.gstPer/100))}</div>
                                        <div className="text-xs text-gray-500">{sale.gstPer}% GST</div>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <span className="text-green-600 font-medium">
                                            {/* {((sale.saleRate - sale.purchaseRate) / sale.purchaseRate * 100).toFixed(2)}% */}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <div className="text-sm ">Packs: {convertQuantityValue(sale.debit, sale.pack).packs}</div>
                                        <div className="text-xs font-semibold">Loose: {convertQuantityValue(sale.debit, sale.pack).loose}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <PackageX className="w-12 h-12 mb-2" />
                        <p className="text-sm">No sales data available</p>
                    </div>
                )}
            </div>
        </div>
    )
}