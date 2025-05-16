import {
  ChevronRight,
  PackageX,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  Backend_URL,
  convertToFraction,
  convertQuantity,
  convertQuantityValue,
} from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

export default function SalesTab({ inventoryId }) {
  const { toast } = useToast();
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
        const response = await fetch(
          `${Backend_URL}/api/sales/inventory/${inventoryId}?page=${currentPage}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch sales history");
        const data = await response.json();
        setSales(data.sales);
        setTotalPages(data.totalPages);
        if (containerRef.current) {
          containerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } catch (error) {
        toast({
          title: "Failed to fetch sales history",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (inventoryId) fetchSales();
  }, [inventoryId, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const calculateMargin = (sale) => {
    if (!sale.purchaseRate || !sale.saleRate) return 0;
    const netSaleRate = sale.saleRate * (1 + sale.gstPer / 100);
    const margin = (
      ((netSaleRate - sale.purchaseRate) / sale.purchaseRate) *
      100
    ).toFixed(2);
    return margin;
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="border rounded-lg min-h-[400px] relative">
        {sales.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium mt-4">
                  Loading sales data...
                </p>
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
                    <p className="text-sm font-medium mt-2 text-gray-600">
                      Loading...
                    </p>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>INVOICE DATE</TableHead>
                    <TableHead>SOLD TO</TableHead>
                    <TableHead>BATCH NO</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">SALE RATE</TableHead>
                    <TableHead className="text-right">MARGIN</TableHead>
                    <TableHead className="text-right">SALE QTY</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow
                      key={sale._id}
                      className="cursor-pointer"
                      onClick={() => {
                        navigate(`/sales/${sale.invoiceId}`);
                      }}
                    >
                      <TableCell>
                        <div className="text-sm font-medium">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {sale.distributorName || "--"}
                        </div>
                        {sale.distributorMob && (
                          <div className="text-xs text-gray-500">
                            Mobile: {sale.distributorMob}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {sale.batchNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Expiry: {sale.expiry}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{sale.mrp?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-medium">
                          ₹
                          {convertToFraction(
                            sale.saleRate * (1 + sale.gstPer / 100)
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.gstPer}% GST
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {calculateMargin(sale)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm ">
                          Packs:{" "}
                          {convertQuantityValue(sale.debit, sale.pack).packs}
                        </div>
                        <div className="text-xs font-semibold">
                          Loose:{" "}
                          {convertQuantityValue(sale.debit, sale.pack).loose}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
  );
}
