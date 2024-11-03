import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Checkbox } from "../../ui/checkbox"
import { ArrowUpDown, Box, FileText, Package, RefreshCw, Settings } from "lucide-react"

export default function Component() {
  const items = [
    { name: "Calpol 1000mg Tablet", type: "Capsule", code: "-", stock: "210 STRP", selling: 10, purchase: 5 },
    { name: "CIPLACEF 1 GM INJECTION", type: "Injection", code: "-", stock: "200 VIAL", selling: 141.75, purchase: 90 },
    { name: "Ciplactin Tablet", type: "Tablet", code: "-", stock: "198 STRP", selling: 44.58, purchase: 20 },
    { name: "Dexona", type: "Tablet", code: "-", stock: "696 PCS", selling: 30, purchase: 12 },
    { name: "Dolo 500 Tablet", type: "Capsule", code: "-", stock: "996 PCS", selling: 15.29, purchase: 5 },
    { name: "Mask", type: "Others", code: "-", stock: "500 PCS", selling: 12, purchase: 5 },
    { name: "Motelukast", type: "Tablet", code: "-", stock: "1,938 PCS", selling: 120, purchase: 15 },
  ]

  return (
    <div className="container mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Items</h1>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[140px]">
              <FileText className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stock">Stock Report</SelectItem>
              <SelectItem value="sales">Sales Report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Package className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium flex items-center">
                Stock Value
                <RefreshCw className="h-4 w-4 ml-2" />
              </p>
              <p className="text-2xl font-bold">₹ 60,903.57</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium flex items-center">
                  Low Stock
                  <RefreshCw className="h-4 w-4 ml-2" />
                </p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Button variant="outline" size="sm">
                Low Stock
              </Button>
            </div>
            <div className="border-l pl-4">
              <p className="text-sm font-medium flex items-center text-red-500">
                Items Expiring (30 days)
                <RefreshCw className="h-4 w-4 ml-2" />
              </p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
          <Input className="w-full md:w-64" placeholder="Search Item" />
          <Select>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tablets">Tablets</SelectItem>
              <SelectItem value="capsules">Capsules</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full md:w-auto">
            <Box className="mr-2 h-4 w-4" />
            Show Low Stock
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Bulk Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Delete Selected</SelectItem>
              <SelectItem value="export">Export Selected</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Create Item</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <Checkbox />
            </TableHead>
            <TableHead className="w-[250px]">
              Item Name <ArrowUpDown className="ml-2 h-4 w-4" />
            </TableHead>
            <TableHead>Item Code</TableHead>
            <TableHead>
              Stock QTY <ArrowUpDown className="ml-2 h-4 w-4" />
            </TableHead>
            <TableHead>Selling Price</TableHead>
            <TableHead>Purchase Price</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.name}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div>{item.name}</div>
                <div className="text-sm text-gray-500">{item.type}</div>
              </TableCell>
              <TableCell>{item.code}</TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell>₹ {item.selling.toFixed(2)}</TableCell>
              <TableCell>₹ {item.purchase.toFixed(2)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Box className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}