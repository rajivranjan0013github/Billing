import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Backend_URL } from "../assets/Data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

const PurchaseReturnList = () => {
  const [returns, setReturns] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchReturns = async () => {
    try {
      setLoading(true);
      let url = `${Backend_URL}/api/purchase/returns`;
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch purchase returns");
      }

      const data = await response.json();
      setReturns(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [startDate, endDate]);

  const handleRowClick = (returnId) => {
    navigate(`/purchase-return/${returnId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Purchase Returns</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Start Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>End Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => navigate("/purchase/return/create")}>
            Create Return
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Debit Note No.</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead>Original Invoice</TableHead>
              <TableHead>Total Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((returnItem) => (
              <TableRow
                key={returnItem._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(returnItem._id)}
              >
                <TableCell>{returnItem.debitNoteNumber}</TableCell>
                <TableCell>
                  {format(new Date(returnItem.returnDate), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{returnItem.partyName}</TableCell>
                <TableCell>{returnItem.originalInvoiceNumber}</TableCell>
                <TableCell>{returnItem.billSummary.productCount}</TableCell>
                <TableCell>
                  ₹{returnItem.billSummary.grandTotal.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      {
                        "bg-green-100 text-green-800":
                          returnItem.paymentStatus === "completed",
                        "bg-yellow-100 text-yellow-800":
                          returnItem.paymentStatus === "pending",
                      }
                    )}
                  >
                    {returnItem.paymentStatus.charAt(0).toUpperCase() +
                      returnItem.paymentStatus.slice(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {returns.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No purchase returns found
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchaseReturnList;
