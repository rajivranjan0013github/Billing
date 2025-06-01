import {
  ChevronRight,
  ClipboardX,
  ChevronLeft,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { useState, useEffect, useRef } from "react";
import { Backend_URL } from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";

export default function Timeline({ inventoryId }) {
  const { toast } = useToast();
  const timelineRef = useRef(null);
  const [timeline, setTimeline] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // fetch timeline
  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${Backend_URL}/api/inventory/timeline/${inventoryId}?type=all&page=${currentPage}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch timeline");
        const data = await response.json();
        setTimeline(data.timeline);
        setTotalPages(data.totalPages);
        // Scroll to top after new data is loaded
        if (timelineRef.current) {
          timelineRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } catch (error) {
        toast({ title: "Failed to fetch timeline", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (inventoryId) fetchTimeline();
  }, [inventoryId, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="w-full" ref={timelineRef}>
      <div className="border rounded-lg min-h-[400px] relative">
        {timeline.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            {loading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium mt-4">
                  Loading transactions...
                </p>
              </>
            ) : (
              <>
                <ClipboardX className="w-10 h-10 mb-4" />
                <p className="text-sm font-medium">
                  No transaction history available
                </p>
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
                    <TableHead>TXN DATE</TableHead>
                    <TableHead>TXN TYPE</TableHead>
                    <TableHead>TXN NO</TableHead>
                    <TableHead>DISTRIBUTOR/CUSTOMER</TableHead>
                    <TableHead>BATCH NO</TableHead>
                    <TableHead className="text-right">CREDIT</TableHead>
                    <TableHead className="text-right">DEBIT</TableHead>
                    <TableHead className="text-right">BALANCE</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline.map((transaction, index) => (
                    <TableRow key={index} className="cursor-pointer">
                      <TableCell>
                        <div className="text-sm font-medium">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Time:{" "}
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-medium
                            ${
                              transaction.type === "PURCHASE" &&
                              "bg-green-600 hover:bg-green-700"
                            }
                            ${
                              transaction.type === "SALE" &&
                              "bg-blue-600 hover:bg-blue-700"
                            }
                            ${
                              transaction.type === "PURCHASE_RETURN" &&
                              "bg-orange-600 hover:bg-orange-700"
                            }
                            ${
                              transaction.type === "SALE_RETURN" &&
                              "bg-red-600 hover:bg-red-700"
                            }
                            ${
                              transaction.type === "Adjustment" &&
                              "bg-purple-600 hover:bg-purple-700"
                            }
                            ${
                              transaction.type === "SALE_EDIT" &&
                              "bg-yellow-600 hover:bg-yellow-700"
                            }
                            ${
                              transaction.type === "PURCHASE_EDIT" &&
                              "bg-indigo-600 hover:bg-indigo-700"
                            }
                            ${
                              (transaction.type === "PURCHASE_DELETE" || transaction.type === "SALE_DELETE") &&
                              "bg-rose-600 hover:bg-rose-700"
                            }
                          `}
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction?.invoiceNumber || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          User: {transaction?.createdByName || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.name || transaction?.distributorName || transaction?.customerName || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Mob: {transaction?.mob || transaction?.distributorMob || transaction?.customerMob || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {transaction?.batchNumber || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 font-medium">
                          {transaction?.credit || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-red-600 font-medium">
                          {transaction?.debit || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {transaction?.balance || "-"}
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger>
                            <ChevronRight className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-50"
                            align="end"
                            sideOffset={5}
                            alignOffset={-20}
                          >
                            <div className="space-y-2">
                              <h4 className="font-medium">
                                Transaction Remarks
                              </h4>
                              <div className="text-sm text-gray-500">
                                {(transaction?.remarks ||
                                  "No remarks available")
                                  .split("\n")
                                  .map((line, index) => (
                                    <p key={index}>{line || "\u00A0"}</p>
                                  ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
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
