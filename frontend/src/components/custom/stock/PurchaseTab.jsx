import { ChevronRight, PackageX, ChevronLeftIcon, ChevronRightIcon, Loader2 } from 'lucide-react'
import { Badge } from "../../ui/badge"
import { useState, useEffect, useRef } from "react"
import { Backend_URL, convertToFraction, convertQuantity } from "../../../assets/Data"
import { useToast } from "../../../hooks/use-toast"
import { useNavigate } from 'react-router-dom'
import { Button } from "../../ui/button"
import { formatCurrency } from '../../../utils/Helper'

export default function PurchaseTab({inventoryId}) {
    const {toast} = useToast();
    const [purchases, setPurchases] = useState([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    console.log(purchases);

    useEffect(() => {
        const fetchPuchases = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${Backend_URL}/api/inventory/timeline/${inventoryId}?type=purchase&page=${currentPage}`, {credentials: "include"});
                if(!response.ok) throw new Error("Failed to fetch timeline");
                const data = await response.json();
                setPurchases(data.timeline);
                setTotalPages(data.totalPages);
                if (containerRef.current) {
                    containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (error) {
                toast({title: "Failed to fetch timeline", variant: "destructive"});
            } finally {
                setLoading(false);
            }
        }
        if(inventoryId) fetchPuchases();
    }, [inventoryId, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="w-full" ref={containerRef}>
            <div className="border rounded-lg min-h-[400px] relative">
                {purchases.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                        {loading ? (
                            <>
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium mt-4">Loading purchases...</p>
                            </>
                        ) : (
                            <>
                                <PackageX className="w-10 h-10 mb-4" />
                                <p className="text-sm font-medium">No purchase history found</p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            {loading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <p className="text-sm font-medium mt-2 text-gray-600">Loading...</p>
                                    </div>
                                </div>
                            )}
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">INVOICE DATE</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">PURCHASED FROM</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">BATCH NO</th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">MRP</th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">NET PURC RATE</th>
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
                                                    {purchase.distributorName}
                                                </div>
                                                {purchase.distributorMob && (
                                                    <div className="text-xs text-gray-500">Mobile: {purchase.distributorMob}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="text-sm font-medium">{purchase.batchNumber}</div>
                                                <div className="text-xs text-gray-500">Expiry: {purchase.expiry}</div>
                                            </td>
                                            <td className="px-4 py-2 text-center">₹{purchase.mrp?.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-center">
                                                <p>{formatCurrency(purchase?.purchaseRate * (1 + (purchase?.gstPer||0)/100) * (1-(purchase?.discount||0)/100) )}</p>
                                                <p className="text-xs font-normal">Dis: {purchase?.discount || 0}% | GST:{purchase?.gstPer}%</p>
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <span className="text-green-600 font-medium">
                                                    {((purchase.mrp - (purchase.purchaseRate * (1 + (purchase?.gstPer||0)/100) * (1-(purchase?.discount||0)/100)) ) / purchase.mrp * 100).toFixed(2)}%
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
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    Next
                                    <ChevronRightIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
