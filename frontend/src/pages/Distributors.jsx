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
  FileInput,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDistributors } from "../redux/slices/distributorSlice";
import { useNavigate } from "react-router-dom";
import CreateDistributorDlg from "../components/custom/distributor/CreateDistributorDlg";
import { formatCurrency } from "../utils/Helper";
import * as XLSX from "xlsx";

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
  const [isBalanceDropdownOpen, setIsBalanceDropdownOpen] = useState(false);
  const balanceDropdownRef = useRef(null);

  useEffect(() => {
   
      dispatch(fetchDistributors());
    
  }, [dispatch]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        balanceDropdownRef.current &&
        !balanceDropdownRef.current.contains(event.target)
      ) {
        setIsBalanceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Function to handle exporting data to Excel
  const handleExport = () => {
    const dataToExport = getFilteredDistributors().map((distributor) => ({
      "Distributor Name": distributor.name,
      "Mobile Number": distributor.mob || "-",
      Address: distributor.address || "-",
      "Account Number": distributor.bankDetails?.accountNumber || "-",
      "IFSC Code": distributor.bankDetails?.ifsc || "-",
      Balance: distributor.currentBalance || 0,
    }));

    // Add empty row and total row
    dataToExport.push({
      "Distributor Name": "",
      "Mobile Number": "",
      "Address": "",
      "Account Number": "",
      "IFSC Code": "",
      "Balance": "",
    });

    dataToExport.push({
      "Distributor Name": "Total",
      "Mobile Number": `Count: ${summary.count}`,
      "Address": "",
      "Account Number": "",
      "IFSC Code": "",
      "Balance": summary.totalBalance,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Distributors");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 25 }, // Distributor Name
      { wch: 15 }, // Mobile Number
      { wch: 30 }, // Address
      { wch: 20 }, // Account Number
      { wch: 15 }, // IFSC Code
      { wch: 15 }, // Balance
    ];

    // Format Balance column as currency
    dataToExport.forEach((_row, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: 5 }); // Balance column
      if (worksheet[cellRef] && worksheet[cellRef].v !== "") {
        worksheet[cellRef].z = '"₹"#,##0.00'; // Indian Rupee format
      }
    });

    // Style the total row
    const totalRowIndex = dataToExport.length - 1;
    for (let col = 0; col < 6; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { font: { bold: true } };
      }
    }

    XLSX.writeFile(workbook, "distributors.xlsx");
  };

  // Replace the Select component with this dropdown menu
  const balanceFilterOptions = [
    { value: "all", label: "All Distributors" },
    { value: "due", label: "To Collect" },
    { value: "pay", label: "To Pay" },
    { value: "zero", label: "Zero Balance" },
  ];

  return (
    <div className="relative p-4 space-y-4">
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

      <div className="flex gap-4">
        <div className="relative flex-1">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
            <div className="relative flex items-center px-3 border-r border-slate-200">
              <Select
                defaultValue="name"
                onValueChange={(value) => setSearchType(value)}
              >
                <SelectTrigger className="h-9 w-[120px] border-0 bg-transparent hover:bg-slate-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Search by" />
                </SelectTrigger>
                <SelectContent align="start" className="w-[120px]">
                  <SelectItem value="name" className="text-sm">
                    Name
                  </SelectItem>
                  <SelectItem value="mobile" className="text-sm">
                    Mobile
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                className="w-[200px] h-9 pl-10 pr-10 border-0 focus-visible:ring-0 placeholder:text-slate-400"
                placeholder={`Search by ${
                  searchType === "name" ? "distributor name" : "mobile number"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute right-3 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-slate-100 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3 text-slate-500" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative" ref={balanceDropdownRef}>
          <Button
            variant="outline"
            className="w-[150px] justify-between"
            onClick={() => setIsBalanceDropdownOpen(!isBalanceDropdownOpen)}
          >
            {balanceFilterOptions.find((opt) => opt.value === balanceFilter)
              ?.label || "Filter by balance"}
            <ChevronDown className="h-4 w-4" />
          </Button>
          {isBalanceDropdownOpen && (
            <div className="absolute z-10 mt-1 w-[150px] bg-white rounded-md shadow-lg border border-slate-200">
              {balanceFilterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${
                    balanceFilter === option.value ? "bg-slate-100" : ""
                  }`}
                  onClick={() => {
                    setBalanceFilter(option.value);
                    setIsBalanceDropdownOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Distributor
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={getFilteredDistributors().length === 0}
          >
            <FileInput className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
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
                <TableHead className="text-right">BALANCE</TableHead>
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
                      {formatCurrency(
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
    </div>
  );
}
