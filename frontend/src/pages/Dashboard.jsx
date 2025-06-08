import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "../hooks/use-media-query";
import {
  Backend_URL,
  formatDate,
  DateRangePicker,
  convertFilterToDateRange,
} from "../assets/Data.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Loader from "../components/ui/loader";
import {
  Activity,
  ShoppingCart,
  IndianRupee,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ArrowLeftRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Truck,
  Landmark,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardMetrics, resetDashboardState } from "../redux/slices/dashboardSlice";

const Dashboard = () => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: dashboardData, loading: loadingState, error } = useSelector((state) => state.dashboard);
  const isLoading = loadingState === 'pending' || loadingState === 'idle';

  const [dateFilter, setDateFilter] = useState("Today");
  const [dateRange, setDateRange] = useState(() => {
    const { from, to } = convertFilterToDateRange("Today");
    return { from, to };
  });

  useEffect(() => {
    if (dateFilter !== "Custom") {
      const { from, to } = convertFilterToDateRange(dateFilter);
      setDateRange({ from, to });
      dispatch(fetchDashboardMetrics({ from, to }));
    }
  }, [dateFilter, dispatch]);

  useEffect(() => {
    if (dateFilter === "Today" && loadingState === 'idle') {
      const { from, to } = convertFilterToDateRange("Today");
      dispatch(fetchDashboardMetrics({ from, to }));
    }
  }, [dispatch, dateFilter, loadingState]);

  const handleDateRangeSelect = (range) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  };

  const handleDateSearch = () => {
    if (dateRange.from && dateRange.to) {
      dispatch(fetchDashboardMetrics({ from: dateRange.from, to: dateRange.to }));
    }
  };

  const handleDateCancel = () => {
    const { from, to } = convertFilterToDateRange("Today");
    setDateFilter("Today");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader text="Loading dashboard data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Dashboard Overview
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/reports")}
              className="flex items-center hover:bg-indigo-50 transition-colors text-base"
            >
              <Activity className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] h-10 text-base border-indigo-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateFilter === "Custom" && (
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={handleDateRangeSelect}
                onSearch={handleDateSearch}
                onCancel={handleDateCancel}
              />
            )}
          </div>
        </div>
        <div className="text-center py-10 text-red-600">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg">Error loading dashboard data:</p>
          <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
          <Button onClick={() => dispatch(fetchDashboardMetrics({ from: dateRange.from, to: dateRange.to }))} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.salesSummary) {
    return (
      <div className="p-4 bg-gray-50 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Dashboard Overview
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate("/reports")}
              className="flex items-center hover:bg-indigo-50 transition-colors text-base"
            >
              <Activity className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] h-10 text-base border-indigo-200 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === "Custom" && (
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={handleDateRangeSelect}
                onSearch={handleDateSearch}
                onCancel={handleDateCancel}
              />
            )}
          </div>
        </div>
        <div className="text-center py-10">No data available for the selected period.</div>
      </div>
    );
  }

  const gradients = {
    blue: "bg-gradient-to-br from-blue-500 to-indigo-600",
    green: "bg-gradient-to-br from-emerald-500 to-teal-600",
    purple: "bg-gradient-to-br from-purple-500 to-pink-600",
    amber: "bg-gradient-to-br from-amber-500 to-orange-600",
  };

  return (
    <div className="p-4 bg-gray-50 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Dashboard Overview
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/reports")}
            className="flex items-center hover:bg-indigo-50 transition-colors text-base"
          >
            <Activity className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px] h-10 text-base border-indigo-200 hover:border-indigo-300 transition-colors">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Yesterday">Yesterday</SelectItem>
              <SelectItem value="This Week">This Week</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
              <SelectItem value="Custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "Custom" && (
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={handleDateRangeSelect}
              onSearch={handleDateSearch}
              onCancel={handleDateCancel}
            />
          )}
        </div>
      </div>

      {/* Stats Overview - Updated for new data structure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Card 1: Sales Summary */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className={`h-1 ${gradients.blue}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  Sales Summary
                </p>
                <h3 className="text-xl font-bold mt-0.5 text-gray-900">
                  ₹{dashboardData.salesSummary.totalRevenue.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {dashboardData.salesSummary.totalSales} orders
                </p>
                <p className="text-sm text-gray-500">
                  Received: ₹{dashboardData.salesSummary.totalAmountReceived.toLocaleString()}
                </p>
                <p className="text-sm text-red-600">
                  Due: ₹{dashboardData.salesSummary.totalAmountDue.toLocaleString()} ({dashboardData.salesSummary.dueInvoicesCount} invoices)
                </p>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <ShoppingCart className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Purchase Summary */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className={`h-1 ${gradients.green}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  Purchase Summary
                </p>
                <h3 className="text-xl font-bold mt-0.5 text-gray-900">
                  ₹{dashboardData.purchaseSummary.totalCost.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {dashboardData.purchaseSummary.totalPurchases} purchases
                </p>
                <p className="text-sm text-gray-500">
                  Paid: ₹{dashboardData.purchaseSummary.totalAmountPaid.toLocaleString()}
                </p>
                <p className="text-sm text-orange-600">
                  Due: ₹{dashboardData.purchaseSummary.totalAmountDue.toLocaleString()} ({dashboardData.purchaseSummary.dueInvoicesCount} invoices)
                </p>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <Truck className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Payment Summary */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className={`h-1 ${gradients.amber}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-600">
                  Payment Summary
                </p>
                <h3 className={`text-xl font-bold mt-0.5 ${dashboardData.paymentSummary.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ₹{dashboardData.paymentSummary.netCashFlow.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600"> (Net Flow)</span>
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  In: ₹{dashboardData.paymentSummary.totalPaymentIn.toLocaleString()}
                </p>
                <p className="text-sm text-red-600">
                  Out: ₹{dashboardData.paymentSummary.totalPaymentOut.toLocaleString()}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <ArrowLeftRight className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Financial Metrics */}
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className={`h-1 ${gradients.purple}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Financial Metrics
                </p>
                <div className="mt-1 space-y-1">
                  <p className="text-base  text-red-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1"/>
                    Receivables: ₹{dashboardData.financialMetrics.totalReceivables.toLocaleString()}
                  </p>
                  <p className="text-base text-orange-600 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1"/>
                    Payables: ₹{dashboardData.financialMetrics.totalPayables.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Landmark className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account-wise Payment Breakdowns -> Changed to Method-wise */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        {/* Method Wise Payment In */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-base font-medium text-green-700">Payment In by Method</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-sm max-h-40 overflow-y-auto space-y-1">
            {dashboardData.paymentSummary.paymentInMethods.length > 0 ? (
              dashboardData.paymentSummary.paymentInMethods.map((method) => (
                <div key={method.method} className="flex justify-between">
                  <span className="capitalize">{method.method.toLowerCase()}</span>
                  <span className="font-medium">₹{method.totalAmount.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No payments received in this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Method Wise Payment Out */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-base font-medium text-red-700">Payment Out by Method</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-sm max-h-40 overflow-y-auto space-y-1">
             {dashboardData.paymentSummary.paymentOutMethods.length > 0 ? (
              dashboardData.paymentSummary.paymentOutMethods.map((method) => (
                <div key={method.method} className="flex justify-between">
                   <span className="capitalize">{method.method.toLowerCase()}</span>
                  <span className="font-medium">₹{method.totalAmount.toLocaleString()}</span>
                </div>
              ))
             ) : (
               <p className="text-sm text-gray-500">No payments made in this period.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
