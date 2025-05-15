import {
  ChevronRight,
  PackageX,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { useState, useEffect, useRef } from "react";
import {
  Backend_URL,
  convertToFraction,
  convertQuantity,
} from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { formatCurrency } from "../../../utils/Helper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

export default function PurchaseTab({ inventoryId }) {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${Backend_URL}/api/purchase/inventory/${inventoryId}?page=${currentPage}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch purchase history");
        const data = await response.json();
        setPurchases(data.purchases);
        setTotalPages(data.totalPages);
        if (containerRef.current) {
          containerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } catch (error) {
        toast({
          title: "Failed to fetch purchase history",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    if (inventoryId) fetchPurchases();
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
                    <p className="text-sm font-medium mt-2 text-gray-600">
                      Loading...
                    </p>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-50">
                    <TableHead>INVOICE DATE</TableHead>
                    <TableHead>PURCHASED FROM</TableHead>
                    <TableHead>BATCH NO</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">NET PURC RATE</TableHead>
                    <TableHead className="text-right">MARGIN</TableHead>
                    <TableHead className="text-right">PURC QTY</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow
                      key={purchase._id}
                      className="cursor-pointer"
                      onClick={() => {
                        navigate(`/purchase/${purchase.invoiceId}`);
                      }}
                    >
                      <TableCell>
                        <div className="text-sm font-medium">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {purchase.distributorName}
                        </div>
                        {purchase.distributorMob && (
                          <div className="text-xs text-gray-500">
                            Mobile: {purchase.distributorMob}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {purchase.batchNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Expiry: {purchase.expiry}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{purchase.mrp?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <p>
                          {formatCurrency(
                            purchase.purchaseRate *
                              (1 + (purchase.gstPer || 0) / 100) *
                              (1 - (purchase.discount || 0) / 100)
                          )}
                        </p>
                        <p className="text-xs font-normal">
                          Dis: {purchase.discount || 0}% | GST:
                          {purchase.gstPer}%
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {(
                            ((purchase.mrp -
                              purchase.purchaseRate *
                                (1 + (purchase.gstPer || 0) / 100) *
                                (1 - (purchase.discount || 0) / 100)) /
                              purchase.mrp) *
                            100
                          ).toFixed(2)}
                          %
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-medium">
                          {convertQuantity(purchase.credit, purchase.pack)}
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
