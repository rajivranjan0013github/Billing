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
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  ShoppingCart,
  IndianRupee,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const Dashboard = () => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("Today");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const fetchDashboardData = async (from, to) => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/dashboard/metrics?startDate=${from.toISOString()}&endDate=${to.toISOString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter !== "Custom") {
      const { from, to } = convertFilterToDateRange(dateFilter);
      setDateRange({ from, to });
      fetchDashboardData(from, to);
    }
  }, [dateFilter]);

  const handleDateRangeSelect = (range) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  };

  const handleDateSearch = () => {
    if (dateRange.from && dateRange.to) {
      fetchDashboardData(dateRange.from, dateRange.to);
    }
  };

  const handleDateCancel = () => {
    const { from, to } = convertFilterToDateRange("Today");
    setDateFilter("Today");
    setDateRange({ from, to });
    fetchDashboardData(from, to);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const paymentMethodData = dashboardData?.paymentMethodsDistribution
    ? Object.entries(dashboardData.paymentMethodsDistribution).map(
        ([method, amount]) => ({
          name: method,
          value: amount,
        })
      )
    : [];

  const COLORS = [
    "#4F46E5", // Indigo
    "#06B6D4", // Cyan
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EC4899", // Pink
  ];

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
            className="flex items-center hover:bg-indigo-50 transition-colors text-sm"
          >
            <Activity className="mr-2 h-3 w-3" />
            View Reports
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm border-indigo-200 hover:border-indigo-300 transition-colors">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className={`h-1 ${gradients.blue}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-indigo-600">
                  Period Sales
                </p>
                <h3 className="text-lg font-bold mt-0.5 text-gray-900">
                  ₹{dashboardData?.todayMetrics.totalRevenue.toLocaleString()}
                </h3>
                <p className="text-xs text-gray-600">
                  {dashboardData?.todayMetrics.totalSales} orders
                </p>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <ShoppingCart className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className={`h-1 ${gradients.green}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-emerald-600">
                  Monthly Revenue
                </p>
                <h3 className="text-lg font-bold mt-0.5 text-gray-900">
                  ₹{dashboardData?.monthlyMetrics?.revenue.toLocaleString()}
                </h3>
                <div className="flex items-center gap-0.5 text-xs">
                  <span
                    className={
                      dashboardData?.monthlyMetrics?.revenueGrowth >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {Math.abs(dashboardData?.monthlyMetrics?.revenueGrowth)}%
                  </span>
                  {dashboardData?.monthlyMetrics?.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className={`h-1 ${gradients.purple}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-purple-600">
                  Active Customers
                </p>
                <h3 className="text-lg font-bold mt-0.5 text-gray-900">
                  {dashboardData?.customerMetrics?.activeCustomers}
                </h3>
                <p className="text-xs text-gray-600">Last 30 days</p>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className={`h-1 ${gradients.amber}`} />
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-amber-600">
                  Inventory Alerts
                </p>
                <h3 className="text-lg font-bold mt-0.5 text-gray-900">
                  {dashboardData?.inventoryMetrics?.lowStockItems +
                    dashboardData?.inventoryMetrics?.outOfStockItems}
                </h3>
                <p className="text-xs text-gray-600">Items need attention</p>
              </div>
              <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-gray-50 to-indigo-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm text-gray-800">Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-[200px] ">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData?.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ fill: "#4F46E5", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#4F46E5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-gray-50 to-purple-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm text-gray-800">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      index,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius * 1.2;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const percent = (
                        (value /
                          paymentMethodData.reduce(
                            (sum, entry) => sum + entry.value,
                            0
                          )) *
                        100
                      ).toFixed(0);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill={COLORS[index % COLORS.length]}
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs font-medium"
                        >
                          {paymentMethodData[index].name} ({percent}%)
                        </text>
                      );
                    }}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Payment Legend */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {paymentMethodData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs">
                    {entry.name}: ₹{entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-gray-50 to-blue-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm text-gray-800">
              Accounts Receivable
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="p-2 rounded-md bg-blue-50 flex justify-between items-center">
                <span className="text-xs text-blue-700">Outstanding</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  ₹
                  {dashboardData?.financialMetrics?.totalReceivables.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-md bg-red-50 flex justify-between items-center">
                <span className="text-xs text-red-700">Overdue</span>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  ₹
                  {dashboardData?.financialMetrics?.overdueReceivables.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-gray-50 to-emerald-50/30">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-sm text-gray-800">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {dashboardData?.recentTransactions
                ?.slice(0, 3)
                .map((transaction, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-xs font-medium capitalize">
                        {transaction.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        transaction.type === "sale"
                          ? "text-emerald-600 bg-emerald-100"
                          : "text-blue-600 bg-blue-100"
                      }`}
                    >
                      ₹{transaction?.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
