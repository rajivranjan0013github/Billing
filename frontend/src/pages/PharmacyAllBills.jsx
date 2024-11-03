import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesBills } from '../redux/slices/pharmacySlice';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Eye,
  Calendar as CalendarIcon,
  FileX,
  Filter
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays, startOfWeek, isBefore, subMonths } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { cn } from "../lib/utils";
import ViewBillDialog from "../components/custom/pharmacy/reports/ViewBillDialog";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";

const PharmacyAllBills = () => {
  const dispatch = useDispatch();
  const { salesBills, salesBillsStatus } = useSelector((state) => state.pharmacy);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const billsPerPage = 10;
  const [dateFilter, setDateFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [tempDateRange, setTempDateRange] = useState({ from: null, to: null });
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 640px)");
  const isMediumScreen = useMediaQuery("(max-width: 1024px)");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    if (salesBillsStatus === 'idle') {
      dispatch(fetchSalesBills());
    }
  }, [salesBillsStatus, dispatch]);

  const filteredBills = salesBills.filter((bill) => {
    const searchMatch = `#B${bill._id.slice(-6)}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.patientInfo.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let dateMatch = true;
    const billDate = parseISO(bill.createdAt);
    const today = new Date();

    switch (dateFilter) {
      case 'Today':
        dateMatch = isWithinInterval(billDate, { start: startOfDay(today), end: endOfDay(today) });
        break;
      case 'Yesterday':
        dateMatch = isWithinInterval(billDate, { start: startOfDay(subDays(today, 1)), end: endOfDay(subDays(today, 1)) });
        break;
      case 'This Week':
        dateMatch = isWithinInterval(billDate, { start: startOfWeek(today), end: endOfDay(today) });
        break;
      case 'Custom':
        if (dateRange.from && dateRange.to) {
          dateMatch = isWithinInterval(billDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
        }
        break;
    }

    return searchMatch && dateMatch;
  });

  const totalPages = Math.ceil(filteredBills.length / billsPerPage);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * billsPerPage,
    currentPage * billsPerPage
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setIsViewDialogOpen(true);
  };

  const handleDateRangeSearch = () => {
    setDateRange(tempDateRange);
    setDateFilter('Custom');
  };

  const handleDateRangeCancel = () => {
    setTempDateRange({ from: null, to: null });
    setDateFilter('All');
  };

  const BillCard = ({ bill }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{`#B${bill._id.slice(-6)}`}</h3>
            <Badge variant={bill?.amountPaid === bill?.totalAmount ? "success" : "destructive"}>
              {bill?.amountPaid === bill?.totalAmount ? "Paid" : "Due"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div className="flex items-center">
              <span className="text-sm font-semibold capitalize">{bill.patientInfo.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">₹{bill.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">{format(new Date(bill.createdAt), "MMM dd, hh:mm a")}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm">{bill?.payment?.paymentMethod || "__"}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewBill(bill)}
            className="w-full mt-2"
          >
            <Eye className="h-3 w-3 mr-2" /> View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="font-semibold">Pharmacy All Bills</CardTitle>
        <CardDescription>View and manage all pharmacy bills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-2 md:space-y-0">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
            <div className="flex w-full space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-8 w-full"
                />
              </div>
              {isSmallScreen && (
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isSmallScreen ? (
              <AnimatePresence>
                {isFilterExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden w-full"
                  >
                    <div className="pt-2 space-y-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFilter === 'All' ? 'All Time' : dateFilter}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px]">
                          <DropdownMenuLabel>Time Filter Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setDateFilter('Today')}>Today</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDateFilter('Yesterday')}>Yesterday</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDateFilter('This Week')}>This Week</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDateFilter('All')}>All Time</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDateFilter('Custom')}>Custom Range</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {dateFilter === 'Custom' && (
                        <DateRangePicker
                          from={tempDateRange.from}
                          to={tempDateRange.to}
                          onSelect={(range) => setTempDateRange(range)}
                          onSearch={handleDateRangeSearch}
                          onCancel={handleDateRangeCancel}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter === 'All' ? 'All Time' : dateFilter}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuLabel>Time Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setDateFilter('Today')}>Today</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDateFilter('Yesterday')}>Yesterday</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDateFilter('This Week')}>This Week</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDateFilter('All')}>All Time</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDateFilter('Custom')}>Custom Range</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {dateFilter === 'Custom' && (
                  <DateRangePicker
                    from={tempDateRange.from}
                    to={tempDateRange.to}
                    onSelect={(range) => setTempDateRange(range)}
                    onSearch={handleDateRangeSearch}
                    onCancel={handleDateRangeCancel}
                  />
                )}
              </>
            )}
          </div>
          {/* <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button> */}
        </div>
        {filteredBills.length > 0 ? (
          <>
            {isSmallScreen ? (
              <div>
                {paginatedBills.map((bill) => (
                  <BillCard key={bill._id} bill={bill} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBills.map((bill) => (
                      <TableRow key={bill._id}>
                        <TableCell>{`#B${bill._id.slice(-6)}`}</TableCell>
                        <TableCell className='capitalize'>{bill.patientInfo.name}</TableCell>
                        <TableCell>
                          {format(new Date(bill.createdAt), "MMM dd, hh:mm a")}
                        </TableCell>
                        <TableCell>₹{bill.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={bill?.amountPaid === bill?.totalAmount ? "success" : "destructive"}>
                            {bill?.amountPaid === bill?.totalAmount ? "Paid" : "Due"}
                          </Badge>
                        </TableCell>
                        <TableCell>{bill?.payment?.paymentMethod || "__"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBill(bill)}
                          >
                            <Eye className="h-3 w-3 mr-2" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-between items-center mt-3">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * billsPerPage + 1, filteredBills.length)} to{" "}
                {Math.min(currentPage * billsPerPage, filteredBills.length)} of {filteredBills.length} bills
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("prev")}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {!isSmallScreen && "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("next")}
                  disabled={currentPage === totalPages}
                >
                  {!isSmallScreen && "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileX className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No bills found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </CardContent>
      <ViewBillDialog
        isOpen={isViewDialogOpen}
        setIsOpen={setIsViewDialogOpen}
        billData={selectedBill}
      />
    </Card>
  );
};

export default PharmacyAllBills;

const DateRangePicker = ({ from, to, onSelect, onSearch, onCancel }) => {
  const [open, setOpen] = useState(false);

  const handleSearch = () => {
    onSearch();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel();
    setOpen(false);
  };

  const today = new Date();
  const lastMonth = subMonths(today, 1);

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
                </>
              ) : (
                format(from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={lastMonth}
            selected={{ from, to }}
            onSelect={onSelect}
            numberOfMonths={2}
            disabled={(date) => isBefore(today, date)}
            toDate={today}
          />
          <div className="flex justify-end gap-2 p-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSearch}>Search</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
