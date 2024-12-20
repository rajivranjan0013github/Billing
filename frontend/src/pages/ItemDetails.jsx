import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { ArrowLeft, Edit, Printer, Trash2, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { Calendar, Download } from "lucide-react"
import { useEffect, useState } from "react"
import { Backend_URL } from "../assets/Data"
import { useParams } from "react-router-dom"
import { Badge } from "../components/ui/badge"
import { formatQuantityDisplay } from "../assets/utils"

export default function inventoryDetails() {
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const { inventoryId } = useParams();
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${Backend_URL}/api/inventory/${inventoryId}`, {
          credentials: "include",
        });
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (inventoryId) {
      fetchItemDetails();
    }
  }, [inventoryId]);

  useEffect(() => {
    const fetchStockHistory = async () => {
      const response = await fetch(`${Backend_URL}/api/inventory/${inventoryId}/stock-history`, {
        credentials: "include",
      });
      const data = await response.json();
      setStockHistory(data);
    };
    
    if (inventoryId && activeTab === "stock") {
      fetchStockHistory();
    }
  }, [inventoryId, activeTab, item]  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg text-gray-700">Loading item details...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">No item data found.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{item.name}</h1>
          <Badge variant={item.quantity <= 0 ? "destructive" : "success"}>
            {item.quantity <= 0 ? 'Out of Stock' : 'In Stock'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" onValueChange={setActiveTab}>
        <TabsList className="border-b rounded-none w-full justify-start h-auto p-0 mb-6">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Item Details
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Stock Details
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">General Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Item Name</div>
                    <div>{item.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Item Type</div>
                    <div>{item.item_type || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Category</div>
                    <div>{item.category || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Stock</div>
                    <div>{formatQuantityDisplay(item.quantity, item.unit, item?.secondary_unit, true)}</div>
                  </div>
                  {item.secondary_unit?.unit && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Secondary Unit</div>
                      <div>
                        {item.secondary_unit.unit} 
                        <span className="text-sm text-muted-foreground ml-1">
                          (1 {item.unit} = {item.secondary_unit.conversion_rate} {item.secondary_unit.unit})
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Manufacturer</div>
                    <div>{item.manufacturer_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Company</div>
                    <div>{item.company_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pack</div>
                    <div>{item.pack || '-'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Sales Price</div>
                      <div>₹ {item.sales_info?.price_per_unit || '-'} 
                        <span className="text-sm text-muted-foreground">
                          {item.sales_info?.is_tax_included ? ' With Tax' : ' Without Tax'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Purchase Price</div>
                      <div>₹ {item.purchase_info?.price_per_unit || '-'}
                        <span className="text-sm text-muted-foreground">
                          {item.purchase_info?.is_tax_included ? ' With Tax' : ' Without Tax'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">HSN Code</div>
                      <div>{item.HSN || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">GST Tax Rate</div>
                      <div>{item.gstPer ? `${item.gstPer}%` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">MRP</div>
                      <div>₹ {item.mrp || '-'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Batch Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Batch Number</div>
                      <div>{item.batchNumber || '-'}</div>
                    </div>
                    {item.expiry_date && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Expiry Date</div>
                        <div>{new Date(item.expiry_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="stock" className="mt-0">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last 365 Days
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                <DropdownMenuItem>Last 365 Days</DropdownMenuItem>
                <DropdownMenuItem>Custom Range</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-col sm:flex-row gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Excel</DropdownMenuItem>
                  <DropdownMenuItem>CSV</DropdownMenuItem>
                  <DropdownMenuItem>PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Print PDF
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Transaction Type</TableHead>
                  <TableHead className="font-semibold">Quantity</TableHead>
                  <TableHead className="font-semibold">Invoice Number</TableHead>
                  <TableHead className="font-semibold">Closing Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockHistory.map((transaction, index) => (
                  <TableRow key={transaction._id} className={index % 2 === 2 ? "bg-muted/50" : ""}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className={
                      transaction.type === "Sales Invoice" ? "text-blue-600" :
                      transaction.type === "Purchase Record" ? "text-green-600" :
                      "text-muted-foreground"
                    }>
                      {transaction.type}
                    </TableCell>
                    <TableCell>{formatQuantityDisplay(transaction.quantity, item.unit, item?.secondary_unit, true)}</TableCell>
                    <TableCell>{transaction.bill_number || '-'}</TableCell>
                    <TableCell>{formatQuantityDisplay(transaction.closing_stock, item.unit, item?.secondary_unit, true)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}