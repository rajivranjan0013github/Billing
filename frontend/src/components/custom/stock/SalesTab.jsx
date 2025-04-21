import { ChevronRight, PackageX, ChevronLeftIcon, ChevronRightIcon, Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from "react"
import { Backend_URL, convertToFraction, convertQuantity, convertQuantityValue } from "../../../assets/Data"
import { useToast } from "../../../hooks/use-toast"
import { useNavigate } from 'react-router-dom'
import { Button } from "../../ui/button"

export default function SalesTab({inventoryId}) {
    const {toast} = useToast();
    const [sales, setSales] = useState([]); 
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchSales = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${Backend_URL}/api/inventory/timeline/${inventoryId}?type=sale&page=${currentPage}`, {credentials: "include"});
                if(!response.ok) throw new Error("Failed to fetch timeline");
                const data = await response.json();
                setSales(data.timeline);
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
        if(inventoryId) fetchSales();
    }, [inventoryId, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="w-full" ref={containerRef}>
            <div className="border rounded-lg min-h-[400px] relative">
                {sales.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                        {loading ? (
                            <>
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium mt-4">Loading sales data...</p>
                            </>
                        ) : (
                            <>
                                <PackageX className="w-10 h-10 mb-4" />
                                <p className="text-sm font-medium">No sales data available</p>
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
                                                    {sale?.distributorName || sale?.customerName || '--'}
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