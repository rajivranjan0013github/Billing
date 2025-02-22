import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import {
  ChevronDown,
  FileText,
  Settings,
  Users,
  Search,
  FileQuestion,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDistributors } from "../redux/slices/distributorSlice";
import { useNavigate } from "react-router-dom";
import CreateDistributorDlg from "../components/custom/distributor/CreateDistributorDlg";

export default function Distributors() {
  const dispatch = useDispatch();
  const { distributors, fetchStatus } = useSelector((state) => state.distributor);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchDistributors());
    }
  }, [dispatch, fetchStatus]);

  // Calculate totals for the cards
  const totaldistributors = distributors.length;
  const toCollect = distributors
    .filter((Distributor) => Distributor.currentBalance > 0)
    .reduce((sum, Distributor) => sum + Distributor.currentBalance, 0);
  const toPay = distributors
    .filter((Distributor) => Distributor.currentBalance < 0)
    .reduce((sum, Distributor) => sum + Math.abs(Distributor.currentBalance), 0);

  // Filter distributors based on search
  const filtereddistributors = distributors.filter((Distributor) => {
    const searchMatch =
      Distributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Distributor.mob?.toLowerCase().includes(searchTerm.toLowerCase());

    return searchMatch;
  });

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Distributors</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[140px]">
              <FileText className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="purchases">Purchases Report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-purple-50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">All distributors</p>
              <p className="text-2xl font-bold">
                {totaldistributors.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">To Collect</p>
              <p className="text-2xl font-bold">
                ₹ {toCollect.toLocaleString()}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-xl">₹</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">To Pay</p>
              <p className="text-2xl font-bold">₹ {toPay.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">₹</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-64 pl-8"
              placeholder="Search distributors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Bulk Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Delete Selected</SelectItem>
              <SelectItem value="export">Export Selected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create Distributor
          </Button>
        </div>
      </div>

      {filtereddistributors.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Distributor Name</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtereddistributors.map((Distributor) => (
              <TableRow
                key={Distributor._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/distributor-details/${Distributor._id}`)}
              >
                <TableCell className="font-medium">{Distributor.name}</TableCell>
                <TableCell>{Distributor.mob || "-"}</TableCell>
                <TableCell>{Distributor.address || "-"}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      Distributor.currentBalance > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {Distributor.currentBalance > 0 ? "↓ " : "↑ "}₹{" "}
                    {Math.abs(Distributor.currentBalance || 0)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
          <FileQuestion className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-500">No distributors found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Get started by creating your first Distributor"}
          </p>
          <Button
            className="mt-4"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Distributor
          </Button>
        </div>
      )}
      <CreateDistributorDlg 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
