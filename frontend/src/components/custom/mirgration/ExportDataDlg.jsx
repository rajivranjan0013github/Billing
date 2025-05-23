import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { FileInput } from "lucide-react";
import * as XLSX from "xlsx";
import { Separator } from "../../ui/separator";
import { FileSpreadsheet, Table2, Loader2 } from "lucide-react";
import { Checkbox } from "../../ui/checkbox";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

export default function ExportDataDlg({ 
  open, 
  onOpenChange, 
  data: initialData = [], 
  columns, // columns now include { header, field, width, addTotal = false, format }
  fileName = "export",
  formatters = {},
  title = "Export Data",
  fetchData,
  isFetchData=false,
}) {
  // State for selected columns
  const [selectedColumns, setSelectedColumns] = useState(
    columns.map(col => col.header)
  );
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (isFetchData && open && fetchData) {
      setIsLoading(true);
      dispatch(fetchData())
        .unwrap()
        .then((result) => {
          setData(result);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [fetchData, dispatch, isFetchData, open]);

  useEffect(() => {
    if (!isFetchData) {
      setData(initialData);
    }
  }, [initialData, isFetchData]);

  // Calculate export statistics based on selected columns
  const exportStats = {
    totalRecords: data.length,
    totalColumns: selectedColumns.length,
  };

  const handleColumnToggle = (header) => {
    setSelectedColumns(prev => {
      if (prev.includes(header)) {
        return prev.filter(h => h !== header);
      } else {
        return [...prev, header];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map(col => col.header));
    }
  };

  const handleExport = () => {
    // Filter columns based on selection
    const selectedColumnsConfig = columns.filter(col => 
      selectedColumns.includes(col.header)
    );

    const dataToExport = data.map((item) => {
      const exportRow = {};
      selectedColumnsConfig.forEach(({ header, field }) => {
        let value = field.split('.').reduce((obj, key) => obj?.[key], item) || "-";
        if (formatters[header]) {
          value = formatters[header](value);
        }
        exportRow[header] = value;
      });
      return exportRow;
    });

    // Add empty row
    const emptyRow = {};
    selectedColumnsConfig.forEach(({ header }) => {
      emptyRow[header] = "";
    });
    dataToExport.push(emptyRow);

    // Add total row with automatic sum for numeric columns
    const totalRow = {};
    selectedColumnsConfig.forEach(({ header, field, addTotal, format }, index) => {
      if (index === 0) {
        totalRow[header] = `Total (Count: ${data.length})`;
      } else if (addTotal) {
        // Calculate sum for columns marked with addTotal
        const sum = data.reduce((acc, item) => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item);
          return acc + (Number(value) || 0);
        }, 0);
        totalRow[header] = sum;
      } else {
        totalRow[header] = "";
      }
    });
    dataToExport.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Set column widths
    worksheet["!cols"] = selectedColumnsConfig.map(({ width }) => ({ wch: width || 20 }));

    // Format numeric columns
    dataToExport.forEach((_row, index) => {
      selectedColumnsConfig.forEach(({ header, format }, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: index, c: colIndex });
        if (worksheet[cellRef] && typeof worksheet[cellRef].v === 'number') {
          if (format === 'currency' || 
              header.toLowerCase().includes('balance') || 
              header.toLowerCase().includes('amount')) {
            worksheet[cellRef].z = '"₹"#,##0.00';
          }
        }
      });
    });

    // Style the total row
    const totalRowIndex = dataToExport.length - 1;
    selectedColumnsConfig.forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: colIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = { font: { bold: true } };
      }
    });

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <DialogTitle className="text-base font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-2 text-sm text-gray-600">Loading data...</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="space-y-6">
                {/* Column Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">
                      Select Columns to Export
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-6 px-2"
                    >
                      {selectedColumns.length === columns.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    {columns.map((column) => (
                      <div key={column.header} className="flex items-center space-x-3">
                        <Checkbox
                          id={column.header}
                          checked={selectedColumns.includes(column.header)}
                          onCheckedChange={() => handleColumnToggle(column.header)}
                        />
                        <label
                          htmlFor={column.header}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {column.header}
                          {column.format === 'currency' && (
                            <span className="ml-2 text-xs text-muted-foreground">(Currency)</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-gray-100 grid grid-cols-3">
          <div className="px-3 col-span-2 py-2 bg-gray-50 border-b flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span>Records: <span className="font-medium text-foreground">{exportStats.totalRecords}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Selected Columns: <span className="font-medium text-foreground">{exportStats.totalColumns}</span></span>
              </div>
            </div>
          </div>
          <div className="p-3 flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleExport}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={selectedColumns.length === 0 || isLoading || !data.length}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileInput className="mr-2 h-4 w-4" />
              )}
              Export to Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
