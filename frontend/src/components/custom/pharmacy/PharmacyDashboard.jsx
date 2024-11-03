import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "../../../hooks/use-media-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Button } from "../../ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label } from "recharts";
import { Pill, DollarSign, Package, Users, Calendar as CalendarIcon, Activity, ChevronRight, BriefcaseMedicalIcon, Download, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import { convertFilterToDateRange, DateRangePicker, calculatePercentageChange } from "../../../assets/Data";
import { useDispatch, useSelector } from "react-redux";
import { fetchPharmacyDashboardData, fetchItems } from "../../../redux/slices/pharmacySlice";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, isEqual } from 'date-fns';

const PharmacyDashboard = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [dateFilter, setDateFilter] = useState("Today");
  const [tempDateRange, setTempDateRange] = useState({ from: null, to: null });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {dashboardData, dashboardDataStatus, items, itemsStatus} = useSelector((state) => state.pharmacy);

  const itemsInStock = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [items]);

  const filteredData = useMemo(() => {
    if(dateFilter === "Custom") return {currentValue: dashboardData, previousValue: []};
    const dates = convertFilterToDateRange(dateFilter);
    const startDate = (new Date(dates.from));
    const endDate = (new Date(dates.to));
    let previousStartDate, previousEndDate;
    if (dateFilter === "Today") {
      previousStartDate = startOfDay(subDays(startDate, 1));
      previousEndDate = endOfDay(subDays(endDate, 1));
    } else if (dateFilter === "Yesterday") {
      previousStartDate = startOfDay(subDays(startDate, 1));
      previousEndDate = endOfDay(subDays(endDate, 1));
    } else if (dateFilter === "This Week") {
      previousStartDate = startOfWeek(subDays(startDate, 7));
      previousEndDate = endOfWeek(subDays(endDate, 7));
    } else if (dateFilter === "This Month") {
      previousStartDate = startOfMonth(subDays(startDate, 30));
      previousEndDate = endOfMonth(subDays(endDate, 30));
    } else {
      previousStartDate = null;
      previousEndDate = null;
    }
    const currentValue = dashboardData.filter((item) => {
      const itemDate = new Date(item._id);
      return isWithinInterval(itemDate, { start: startDate, end: endDate });
    });
    const previousValue = previousStartDate && previousEndDate
      ? dashboardData.filter((item) => {
          const itemDate = new Date(item._id);
          return isWithinInterval(itemDate, { start: previousStartDate, end: previousEndDate });
        })
      : [];
    return { currentValue, previousValue };
  }, [dashboardData, dateFilter]);

  const previousData = useMemo(() => {
    return filteredData.previousValue.reduce((acc, curr) => ({
      totalRevenue: acc.totalRevenue + curr.totalRevenue,
      totalCount: acc.totalCount + curr.totalCount
    }), { totalRevenue: 0, totalCount: 0 });
  }, [filteredData]);

  const dashboardTotals = useMemo(() => {
    return filteredData.currentValue.reduce((acc, curr) => {
      acc.totalRevenue += curr.totalRevenue;
      acc.totalPrescriptions += curr.totalCount;
      curr.paymentMethods.forEach(method => {
        const methodName = method.method || 'Others';
        if (!acc.paymentMethods[methodName]) acc.paymentMethods[methodName] = 0;
        acc.paymentMethods[methodName] += parseInt(method.amount);
      });
      return acc;
    }, { totalRevenue: 0, totalPrescriptions: 0, paymentMethods: {} });
  }, [filteredData]);

  const paymentMethodData = useMemo(() => {
    const chartColors = {
      'Cash': "hsl(var(--chart-1))", 'UPI': "hsl(var(--chart-2))",
      'Card': "hsl(var(--chart-3))", 'Others': "hsl(var(--chart-4))"
    };
    return Object.entries(dashboardTotals.paymentMethods).map(([method, value]) => ({
      method, value, fill: chartColors[method] || "hsl(var(--chart-4))"
    }));
  }, [dashboardTotals]);

  const weeklyPerformanceData = useMemo(() => {
    const today = startOfDay(new Date());
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return { date, formattedDate: format(date, 'EEE'), sales: 0, prescriptions: 0 };
    });
    dashboardData.forEach(day => {
      const dayDate = startOfDay(new Date(day._id));
      const index = last7Days.findIndex(d => isEqual(d.date, dayDate));
      if (index !== -1) {
        last7Days[index].sales = parseInt(day.totalRevenue);
        last7Days[index].prescriptions = day.totalCount;
      }
    });
    return last7Days;
  }, [filteredData]);

  useEffect(() => {
    if (dashboardDataStatus === "idle") {
      const initialDateRange = convertFilterToDateRange("Last 7 Days");
      fetchDashboardData(initialDateRange);
    } 
    if(itemsStatus === 'idle') dispatch(fetchItems());
  }, [dashboardDataStatus, dispatch, itemsStatus]);

  const handleDateRangeSearch = () => {
    setDateFilter("Custom");
    fetchDashboardData(tempDateRange);
  };

  const handleDateRangeCancel = () => {
    setTempDateRange({ from: null, to: null });
    setDateFilter("Today");
  };

  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    if (newFilter !== "Custom") {
      let newDateRange;
      if(newFilter === 'Today' || newFilter === 'Yesterday') newDateRange = convertFilterToDateRange('Last 7 Days');
      else if(newFilter === 'This Week') newDateRange = convertFilterToDateRange('This Week Fetched');
      else if(newFilter === 'This Month') newDateRange = convertFilterToDateRange('This Month Fetched');
      else newDateRange = convertFilterToDateRange(newFilter);
      fetchDashboardData(newDateRange);
    }
  };

  const fetchDashboardData = (range) => {
    const ISO_time = {
      startDate: new Date(range.from).toISOString(),
      endDate: new Date(range.to).toISOString()
    }
    dispatch(fetchPharmacyDashboardData(ISO_time));
  };

  return (
    <div>
      <div className="flex justify-between items-center bg-gray-100 pr-2">
        <div className="flex items-center p-1 space-x-1">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <BriefcaseMedicalIcon className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="font-semibold text-gray-700 text-sm">Pharmacy Dashboard</span>
        </div>
        <div className="flex items-center space-x-4">
        {dateFilter === "Custom" && (
            <DateRangePicker from={tempDateRange.from} to={tempDateRange.to} onSelect={(range) => setTempDateRange(range)} onSearch={handleDateRangeSearch} onCancel={handleDateRangeCancel} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter === "All" ? "All Time" : dateFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Time Filter Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleDateFilterChange("Today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDateFilterChange("Yesterday")}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDateFilterChange("This Week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDateFilterChange("This Month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDateFilterChange("All")}>All Time</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange("Custom")}>Custom Range</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <Button variant="outline" size="sm">
            <Download className="w-3 h-3 mr-2" />
            Export Dashboard
          </Button> */}
        </div>
      </div>
      <div className="space-y-4 mt-2 mx-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-blue-100 col-span-1">
                <CardContent className="p-4">
                  <Pill className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{dashboardTotals.totalPrescriptions}</p>
                  <p className="text-sm text-gray-600">Prescriptions Filled</p>
                  <p className={`text-xs mt-1 ${calculatePercentageChange(dashboardTotals.totalPrescriptions, previousData.totalCount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculatePercentageChange(dashboardTotals.totalPrescriptions, previousData.totalCount)}% from previous period
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-green-100 col-span-1">
                <CardContent className="p-4">
                  <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">₹{parseInt(dashboardTotals.totalRevenue).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className={`text-xs mt-1 ${calculatePercentageChange(dashboardTotals.totalRevenue, previousData.totalRevenue) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculatePercentageChange(dashboardTotals.totalRevenue, previousData.totalRevenue)}% from previous period
                  </p>
                </CardContent>
              </Card>
              {!isMobile && (
                <Card className="bg-yellow-100 col-span-1">
                  <CardContent className="p-4">
                    <Package className="w-8 h-8 text-yellow-600 mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{itemsInStock.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Items in Stock</p>
                  </CardContent>
                </Card>
              )}
            </div>
            {isMobile && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card className="bg-yellow-100">
                  <CardContent className="p-4">
                    <Package className="w-8 h-8 text-yellow-600 mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{itemsInStock.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Items in Stock</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-2 px-3">
                    <Button className="w-full justify-center" variant="outline" onClick={() => navigate("/pharmacy/sales")}>
                      <Users className="mr-2 h-4 w-4" />
                      Sales
                    </Button>
                    <Button className="w-full justify-center" variant="outline" onClick={() => navigate("/pharmacy/items-master")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Inventory
                    </Button>
                    <Button className="w-full justify-center" variant="outline" onClick={() => navigate("/pharmacy/reports")}>
                      <Activity className="mr-2 h-4 w-4" />
                      Reports
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            {!isMobile && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <Button className="w-full justify-center" variant="outline" onClick={() => navigate("/pharmacy/sales")}>
                    <Users className="mr-2 h-4 w-4" />
                    Pharmacy Sales
                  </Button>
                  <Button className="w-full justify-center" variant="outline" onClick={() => navigate("/pharmacy/items-master")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Manage Inventory
                  </Button>
                  <Button className="w-full justify-center" variant="outline" onClick={() => navigate("/pharmacy/reports")}>
                    <Activity className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          <Card className="col-span-1">
            <CardHeader className='pb-0'>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of payment methods used</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length > 0 ? (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethodData} dataKey="value" nameKey="method" cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={1}>
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <Label content={({ viewBox }) => {
                              const { cx, cy } = viewBox;
                              return (
                                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                                  <tspan x={cx} y={cy} className="text-xl font-bold">₹{parseInt(dashboardTotals.totalRevenue).toLocaleString()}</tspan>
                                  <tspan x={cx} y={cy + 15} className="text-xs">Total</tspan>
                                </text>
                              );
                            }}
                          />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-0 flex justify-center space-x-4">
                    {paymentMethodData.map((entry, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-3 h-3 mr-1" style={{ backgroundColor: entry.fill }}></div>
                        <span className="text-xs">{entry.method}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex flex-col items-center justify-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mb-2" />
                  <p className="text-sm">No payment data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Sales and prescriptions filled in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[400px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPerformanceData}>
                  <XAxis dataKey="formattedDate" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Sales (₹)" />
                  <Bar yAxisId="right" dataKey="prescriptions" fill="#10b981" name="Prescriptions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
