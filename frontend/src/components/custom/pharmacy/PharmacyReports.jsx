import React, { useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import {
  ChevronRight,
  BriefcaseMedicalIcon,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Download,
  TrendingUp,
  FileX,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSalesBills,
  fetchItems,
} from "../../../redux/slices/pharmacySlice";
import BillsTableWithDialog from "./itemMaster/BillsTableWithDialog";
import {
  format,
  addMonths,
  isBefore,
  startOfToday,
  endOfToday,
  differenceInDays,
} from "date-fns";
import { Badge } from "../../ui/badge"; // Add this import
import { useMediaQuery } from "../../../hooks/useMediaQuery";

const topSellingArray = [
  {
    name: "Amoxicillin 500mg",
    category: "Antibiotic",
    unitsSold: 1234,
    revenue: 6170.0,
    trend: { direction: "up", percentage: 5 },
  },
  {
    name: "Lisinopril 10mg",
    category: "ACE Inhibitor",
    unitsSold: 987,
    revenue: 3948.0,
    trend: { direction: "down", percentage: 2 },
  },
  {
    name: "Metformin 850mg",
    category: "Antidiabetic",
    unitsSold: 876,
    revenue: 2628.0,
    trend: { direction: "up", percentage: 3 },
  },
  {
    name: "Amlodipine 5mg",
    category: "Calcium Channel Blocker",
    unitsSold: 765,
    revenue: 2295.0,
    trend: { direction: "up", percentage: 1 },
  },
  {
    name: "Omeprazole 20mg",
    category: "Proton Pump Inhibitor",
    unitsSold: 654,
    revenue: 1962.0,
    trend: { direction: "down", percentage: 1 },
  },
];

const PharmacyReports = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { salesBills, salesBillsStatus, items, itemsStatus } = useSelector(
    (state) => state.pharmacy
  );
  const { hospitalInfo } = useSelector((state) => state.hospital);
  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    if (salesBillsStatus === "idle") {
      dispatch(fetchSalesBills());
    }
    if (itemsStatus === "idle") {
      dispatch(fetchItems());
    }
  }, [dispatch, salesBillsStatus, itemsStatus]);

  const lowStockItems = items.filter((item) => item.quantity <= 200);

  const twoMonthsFromNow = addMonths(
    new Date(),
    Number(hospitalInfo?.pharmacyExpiryThreshold)
  );
  const itemsExpiringInTwoMonths = items.filter((item) => {
    if (!item.expiryDate) return false; // Exclude items with undefined expiry date
    const expiryDate = new Date(item.expiryDate);
    return isBefore(expiryDate, twoMonthsFromNow);
  });

  const todayStats = useMemo(() => {
    const today = startOfToday();
    const endOfDay = endOfToday();
    return salesBills.reduce(
      (acc, bill) => {
        const billDate = new Date(bill.createdAt);
        if (billDate >= today && billDate <= endOfDay) {
          acc.count++;
          acc.totalAmount += bill.totalAmount;
        }
        return acc;
      },
      { count: 0, totalAmount: 0 }
    );
  }, [salesBills]);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) {
      return { status: null, variant: "secondary" };
    }

    const today = new Date();
    const daysLeft = differenceInDays(new Date(expiryDate), today);

    if (daysLeft < 0) {
      return { status: "Expired", variant: "destructive" };
    } else if (daysLeft <= 30) {
      return { status: "Expiring Soon", variant: "warning", daysLeft };
    } else {
      return { status: "OK", variant: "default", daysLeft };
    }
  };

  const LowStockItemCard = ({ item }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold capitalize">
              {item.name}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({item.type})
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-sm">Stock: {item.quantity}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm capitalize">Supplier: {item?.supplier?.name || "—"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ExpiringItemCard = ({ item }) => {
    const { status, variant, daysLeft } = getExpiryStatus(item.expiryDate);
    return (
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold capitalize">
                {item.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({item.type})
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
              <div className="flex items-center">
                <Package className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">Stock: {item.quantity}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm capitalize">Supplier: {item?.supplier?.name || "—"}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm">
                  Expiry: {item.expiryDate ? format(new Date(item.expiryDate), 'MMM dd, yyyy') : "—"}
                </span>
              </div>
              <div className="flex items-center">
                {status && (
                  <Badge variant={variant}>
                    {status}
                    {status === "Expiring Soon" && ` (${daysLeft} ${daysLeft === 1 ? "day" : "days"})`}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center bg-gray-100 pr-2">
        <div className="flex items-center p-1 space-x-1">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <BriefcaseMedicalIcon className="h-4 w-4" />
          </Button>
          <ChevronRight className="h-3 w-3 text-gray-400" />
          <span className="font-semibold text-gray-700 text-sm">
            Pharmacy Reports
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {/* <Button variant="outline" size="sm">
            <Download className="w-3 h-3 mr-2" />
            Export Report
          </Button> */}
        </div>
      </div>
      <main className="flex-1 overflow-y-auto mt-2 mx-2 md:mx-0">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Items Expiring Soon
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {itemsExpiringInTwoMonths.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Within next 60 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Items
              </CardTitle>
              <ArrowDown className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Below reorder level
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sales Today
              </CardTitle>
              <ArrowUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹
                {todayStats.totalAmount.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Today's total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bills Generated Today
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.count}</div>
              <p className="text-xs text-muted-foreground">Today's total</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="expiring" className="space-y-4">
          <TabsList className="grid w-full lg:w-1/3 grid-cols-3 sm:grid-cols-3 mb-4">
            <TabsTrigger value="expiring">Expiring Items</TabsTrigger>
            <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
            <TabsTrigger value="bills">Recent Bills</TabsTrigger>
          </TabsList>
          <TabsContent value="expiring">
            <Card>
              <CardHeader>
                <CardTitle>Items Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto px-4">
                {isSmallScreen ? (
                  <div>
                    {itemsExpiringInTwoMonths.length > 0 ? (
                      itemsExpiringInTwoMonths.map((item, index) => (
                        <ExpiringItemCard key={index} item={item} />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500 py-8">
                        <FileX className="w-12 h-12 mb-2" />
                        <p className="font-semibold text-center">
                          No items expiring in the next 2 months
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Item Name</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Supplier</TableHead>
                        <TableHead className="whitespace-nowrap">Expiry Date</TableHead>
                        <TableHead className="whitespace-nowrap">Quantity</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsExpiringInTwoMonths.length > 0 ? (
                        itemsExpiringInTwoMonths.map((item, index) => {
                          const { status, variant, daysLeft } = getExpiryStatus(item.expiryDate);
                          return (
                            <TableRow key={index}>
                              <TableCell className="capitalize">{item.name}</TableCell>
                              <TableCell>{item.type}</TableCell>
                              <TableCell className="capitalize">{item?.supplier?.name || "——"}</TableCell>
                              <TableCell>
                                {item.expiryDate ? format(new Date(item.expiryDate), "MMM dd, yyyy") : "—"}
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {status ? (
                                  <Badge variant={variant}>
                                    {status}
                                    {status === "Expiring Soon" && ` (${daysLeft} ${daysLeft === 1 ? "day" : "days"})`}
                                  </Badge>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <FileX className="w-8 h-8 mb-2" />
                              <p className="font-semibold">
                                No items expiring in the next 2 months
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="lowstock">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto px-4">
                {isSmallScreen ? (
                  <div>
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item, index) => (
                        <LowStockItemCard key={index} item={item} />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500 py-8">
                        <FileX className="w-12 h-12 mb-2" />
                        <p className="font-semibold text-center">
                          No low stock items available
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Item Name</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Supplier</TableHead>
                        <TableHead className="whitespace-nowrap">Current Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.length > 0 ? (
                        lowStockItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="capitalize">
                              {item.name}
                            </TableCell>
                            <TableCell>{item?.type}</TableCell>
                            <TableCell className="capitalize">
                              {item?.supplier?.name || "—"}
                            </TableCell>
                            <TableCell>{item?.quantity}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <FileX className="w-8 h-8 mb-2" />
                              <p className="font-semibold">
                                No low stock items available
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bills">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-2 sm:space-y-0 space-x-2">
                <h1 className="text-lg font-semibold">Recent Bills Generated</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/pharmacy/all-bills")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="px-4">
                <BillsTableWithDialog bills={salesBills.slice(0, 5)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PharmacyReports;
