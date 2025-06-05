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
import {
  Search,
  Users,
  X,
  ArrowLeft,
  Plus,
  ChevronDown,
  Upload,
  Download,
  EllipsisVertical,
  Phone,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDistributors } from "../redux/slices/distributorSlice";
import { importDistributors } from "../redux/slices/exportImportSlice";
import { useNavigate } from "react-router-dom";
import CreateDistributorDlg from "../components/custom/distributor/CreateDistributorDlg";
import ExportDataDlg from "../components/custom/mirgration/ExportDataDlg";
import ImportDataDlg from "../components/custom/mirgration/ImportDataDlg";
import { formatCurrency } from "../utils/Helper";
import Loader from "../components/ui/loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const columnsArray = [
  { header: "Distributor Name", field: "name", width: 25, required: true },
  { header: "Mobile Number", field: "mob", width: 15, required: false },
  { header: "Address", field: "address", width: 30, required: false },
  { header: "Account Number", field: "bankDetails.accountNumber", width: 20, required: false },
  { header: "IFSC Code", field: "bankDetails.ifsc", width: 15, required: false },
  { header: "Balance", field: "currentBalance", width: 15, format: "currency", required: false },
  { header: "GSTIN", field: "gstin", required: false },
  { header: "PAN Number", field: "panNumber", required: false },
  { header: "DL Number", field: "DLNumber", required: false }
];

export default function Distributors() {
  const dispatch = useDispatch();
  const { distributors, fetchStatus } = useSelector(
    (state) => state.distributor
  );
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { importStatus } = useSelector((state) => state.exportImport);

  useEffect(() => {
    if(fetchStatus === 'idle') {
      dispatch(fetchDistributors());
    }
  }, [dispatch, fetchStatus]);

  // Calculate totals for the summary
  const summary = {
    count: distributors.length,
    toCollect: distributors
      .filter((distributor) => distributor.currentBalance > 0)
      .reduce((sum, distributor) => sum + distributor.currentBalance, 0),
    toPay: distributors
      .filter((distributor) => distributor.currentBalance < 0)
      .reduce(
        (sum, distributor) => sum + Math.abs(distributor.currentBalance),
        0
      ),
    totalBalance: distributors.reduce(
      (sum, distributor) => sum + (distributor.currentBalance || 0),
      0
    ),
  };

  // Filter distributors based on search and balance
  const getFilteredDistributors = () => {
    let filtered = distributors;

    // Apply balance filter
    if (balanceFilter !== "all") {
      filtered = filtered.filter((distributor) => {
        if (balanceFilter === "due") {
          return distributor.currentBalance > 0;
        } else if (balanceFilter === "pay") {
          return distributor.currentBalance < 0;
        } else if (balanceFilter === "zero") {
          return distributor.currentBalance === 0;
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((distributor) => {
        if (searchType === "name") {
          return distributor.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        } else if (searchType === "mobile") {
          return distributor.mob
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
        return true;
      });
    }

    return filtered;
  };

  const handleSearchTypeChange = (value) => {
    setSearchType(value);
    setSearchQuery("");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="relative p-2 space-y-4">
      {importStatus === 'loading' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <Loader text="Importing distributors..." />
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Distributors</h1>
        </div>
        <div className="grid grid-cols-4 gap-4 text-right">
          <div>
            <div className="font-semibold">{summary.count}</div>
            <div className="text-sm text-muted-foreground">
              Total Distributors
            </div>
          </div>
          <div>
            <div className="font-semibold text-green-600">
              {formatCurrency(summary.toCollect)}
            </div>
            <div className="text-sm text-muted-foreground">To Collect</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">
              {formatCurrency(summary.toPay)}
            </div>
            <div className="text-sm text-muted-foreground">To Pay</div>
          </div>
          <div>
            <div className="font-semibold">
              {formatCurrency(summary.totalBalance)}
            </div>
            <div className="text-sm text-muted-foreground">Net Balance</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Select
            value={searchType}
            onValueChange={handleSearchTypeChange}
          >
            <SelectTrigger className="w-[100px] focus:ring-0">
              <SelectValue placeholder="Search by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              className="w-[250px] pl-8"
              placeholder={`Search ${searchType === "name" ? "distributor name" : "mobile number"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-full aspect-square absolute right-0 top-0 hover:bg-transparent"
                onClick={clearSearch}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <Select
          value={balanceFilter}
          onValueChange={setBalanceFilter}
        >
          <SelectTrigger className="w-[150px] focus:ring-0">
            <SelectValue placeholder="Filter by balance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Distributors</SelectItem>
            <SelectItem value="due">To Collect</SelectItem>
            <SelectItem value="pay">To Pay</SelectItem>
            <SelectItem value="zero">Zero Balance</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Distributor
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)} disabled={importStatus === 'loading'}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsExportDialogOpen(true)}
                disabled={getFilteredDistributors().length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {getFilteredDistributors().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">No distributors found</p>
            <p className="text-sm">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create a new distributor to get started"}
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Distributor
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DISTRIBUTOR NAME</TableHead>
                <TableHead>MOBILE NUMBER</TableHead>
                <TableHead>ADDRESS</TableHead>
                {/* <TableHead>ACCOUNT NUMBER</TableHead>
                <TableHead>IFSC CODE</TableHead> */}
                <TableHead className="text-right"> BALANCE (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredDistributors().map((distributor) => (
                <TableRow
                  key={distributor._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/distributors/${distributor._id}`)}
                >
                  <TableCell className="font-medium">
                    {distributor.name}
                  </TableCell>
                  <TableCell>{distributor.mob || "-"}</TableCell>
                  <TableCell>{distributor.address || "-"}</TableCell>
                  {/* <TableCell>{distributor.bankDetails?.accountNumber || "-"}</TableCell>
                  <TableCell>{distributor.bankDetails?.ifsc || "-"}</TableCell> */}
                  <TableCell className="text-right font-bold">
                    <span
                      className={
                        distributor.currentBalance > 0
                          ? "text-green-600"
                          : distributor.currentBalance < 0
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {distributor.currentBalance > 0
                        ? "↓ "
                        : distributor.currentBalance < 0
                        ? "↑ "
                        : ""}
                      {(
                        Math.abs(distributor.currentBalance || 0)
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateDistributorDlg
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ImportDataDlg
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        importFunction={importDistributors}
        title="Import Distributors"
        columns={columnsArray}
      />

      <ExportDataDlg
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={getFilteredDistributors()}
        columns={columnsArray}
        formatters={{
          "Balance": (value) => value || 0
        }}
        fileName="distributors"
        title="Export Distributors Data"
      />
    </div>
  );
}
