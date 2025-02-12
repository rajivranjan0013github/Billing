import { ChevronRight } from 'lucide-react'
import { Badge } from "../../ui/badge"
import { useState, useEffect } from "react"
import { Backend_URL, convertToFraction, convertQuantity } from "../../../assets/Data"
import { useToast } from "../../../hooks/use-toast"
import { useNavigate } from 'react-router-dom'

export default function PurchaseTab({inventoryId}) {
    const {toast} = useToast();
    const [purchases, setPurchases] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPuchases = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/inventory/timeline/${inventoryId}?type=purchase`, {credentials: "include"});
                if(!response.ok) throw new Error("Failed to fetch timeline");
                const data = await response.json();
                setPurchases(data);
            } catch (error) {
                toast({title: "Failed to fetch timeline", variant: "destructive"});
            }
        }
        if(inventoryId) fetchPuchases();
    }, [inventoryId]);

    return (
        <div className="w-full">
            <div className="border rounded-lg">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">INVOICE DATE</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">PURCHASED FROM</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">BATCH NO</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">MRP</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">NET RATE</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">MARGIN</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">PURC QTY</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map((purchase, index) => (
                            <tr
                                key={purchase._id}
                                className="hover:bg-secondary cursor-pointer border-b last:border-0"
                                onClick={() => {navigate(`/purchase/${purchase.invoiceId}`)}}
                            >
                                <td className="px-4 py-2">
                                    <div className="text-sm font-medium">
                                        {new Date(purchase.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        {purchase.partyName}
                                    </div>
                                    {purchase.partyMob && (
                                        <div className="text-xs text-gray-500">Mobile: {purchase.partyMob}</div>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    <div className="text-sm font-medium">{purchase.batchNumber}</div>
                                    <div className="text-xs text-gray-500">Expiry: {purchase.expiry}</div>
                                </td>
                                <td className="px-4 py-2 text-right">₹{purchase.mrp?.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right">
                                    <div className="text-sm font-medium">₹{convertToFraction(purchase.purchaseRate * (1 + purchase.gstPer/100))}</div>
                                    <div className="text-xs text-gray-500">{purchase.gstPer}% GST</div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <span className="text-green-600 font-medium">
                                        {((purchase.mrp - (purchase.purchaseRate * (1+purchase.gstPer/100)) ) / purchase.mrp * 100).toFixed(2)}%
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <div className="text-sm font-medium">{convertQuantity(purchase.credit, purchase.pack)}</div>
                                </td>
                                <td className="px-4 py-2">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
