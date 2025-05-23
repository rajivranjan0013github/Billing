import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Upload, FileSpreadsheet, Table2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useToast } from "../../../hooks/use-toast";
import { useDispatch } from "react-redux";
import { Separator } from "../../ui/separator";

export default function ImportDataDlg({
  open,
  onOpenChange,
  importFunction,
  title = "Import Data",
  columns = [],
  customValidation,
}) {
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [columnStats, setColumnStats] = useState(null);
  const [excelColumns, setExcelColumns] = useState([]);
  const [hasRequiredColumns, setHasRequiredColumns] = useState(false);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  console.log(excelData);
  

  const checkColumnMatches = (jsonData) => {
    if (!jsonData || jsonData.length === 0) return null;
    
    const uploadedColumns = Object.keys(jsonData[0]);
    setExcelColumns(uploadedColumns);
    const expectedColumns = columns.map(col => col.header);
    
    // Get required columns - only if required is explicitly true
    const requiredColumns = columns
      .filter(col => col.required === true)
      .map(col => col.header);
    
    const matchingColumns = expectedColumns.filter(col => 
      uploadedColumns.includes(col)
    );

    // Check if all required columns are present
    const allRequiredColumnsPresent = requiredColumns.every(col => 
      uploadedColumns.includes(col)
    );
    
    setHasRequiredColumns(allRequiredColumnsPresent);

    return {
      total: expectedColumns.length,
      matching: matchingColumns.length,
      matchedColumns: matchingColumns,
      missingColumns: expectedColumns.filter(col => !uploadedColumns.includes(col)),
      missingRequiredColumns: requiredColumns.filter(col => !uploadedColumns.includes(col))
    };
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Invalid File",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Check column matches
            const stats = checkColumnMatches(jsonData);
            setColumnStats(stats);

            // Validate data
            const validationError = validateData(jsonData);
            if (validationError) {
              toast({
                title: "Validation Error",
                description: validationError,
                variant: "destructive",
              });
              return;
            }

            // Transform data
            const transformedData = transformData(jsonData);

            if (transformedData.length === 0) {
              toast({
                title: "File Error",
                description: "No valid data found in the Excel file",
                variant: "destructive",
              });
              return;
            }

            setExcelData(transformedData);

          } catch (error) {
            toast({
              title: "Processing Failed",
              description: error.message || "Failed to process Excel file",
              variant: "destructive",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        toast({
          title: "File Read Failed",
          description: error.message || "Failed to read Excel file",
          variant: "destructive",
        });
      }
    }
  };

  const validateData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return "No data found in the Excel file";
    }

    // Get required columns - only if required is explicitly true
    const requiredColumns = columns
      .filter(col => col.required === true)
      .map(col => col.header);

    // Check if required columns exist
    const missingColumns = requiredColumns.filter(
      col => !data.some(row => row[col] !== undefined)
    );

    if (missingColumns.length > 0) {
      return `Missing required columns: ${missingColumns.join(", ")}`;
    }

    // Run custom validation if provided
    if (customValidation) {
      const customError = customValidation(data);
      if (customError) {
        return customError;
      }
    }

    return null;
  };

  const transformData = (data) => {
    return data
      .filter(row => {
        // Check if at least one required field has a value
        const requiredColumns = columns
          .filter(col => col.required === true)
          .map(col => col.header);
        return requiredColumns.some(col => row[col] && row[col].toString().trim() !== '');
      })
      .map(row => {
        const transformedRow = {};
        
        columns.forEach(col => {
          let value = row[col.header];
          
          // Handle nested fields using lodash get/set
          const fieldParts = col.field.split('.');
          const lastField = fieldParts.pop();
          let currentObj = transformedRow;
          
          // Create nested objects if needed
          fieldParts.forEach(part => {
            if (!currentObj[part]) {
              currentObj[part] = {};
            }
            currentObj = currentObj[part];
          });

          // Apply type conversion based on format
          if (value !== undefined && value !== null) {
            if (col.format === 'currency' || col.format === 'number') {
              value = parseFloat(value) || 0;
            } else if (col.format === 'string') {
              value = value.toString();
            } else if (col.format === 'boolean') {
              value = Boolean(value);
            }
          }

          // Apply custom formatter if provided
          if (col.formatter && typeof col.formatter === 'function') {
            value = col.formatter(value, row);
          }

          currentObj[lastField] = value;
        });

        return transformedRow;
      });
  };

  const handleImport = async () => {
    if (!excelData) {
      toast({
        title: "No Data Available",
        description: "Please select and process a file first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await dispatch(importFunction(excelData)).unwrap();
      toast({
        title: "Import Successful",
        variant: "success",
        description: `Successfully imported ${excelData.length} records`,
      });
      
      // Reset states
      setSelectedFile(null);
      setExcelData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close the dialog
      onOpenChange(false);

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getColumnsList = () => {
    return columns.map(col => {
      const required = col.required === true;
      return `${col.header}${required ? '*' : ''}`;
    }).join(' | ');
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
              <p className="mt-2 text-sm text-gray-600">Importing data...</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  {columns.length > 0 && (
                    <>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-gray-700">Expected Columns:</span> {getColumnsList()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1"><span className="font-medium text-red-500">Warning : </span> Please match with column name in excel file with Expected Columns</div>
                      {columnStats && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            {columnStats.matching === columnStats.total ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span>
                              Matching Columns: {columnStats.matching} / {columnStats.total}
                            </span>
                          </div>
                          
                          <div className="mt-2">
                            <div className="text-sm font-medium mb-2">Excel File Columns:</div>
                            <div className="flex flex-wrap gap-2">
                              {excelColumns.map((col, index) => (
                                <div
                                  key={index}
                                  className={`px-2 py-1 rounded-md text-sm ${
                                    columnStats.matchedColumns.includes(col)
                                      ? 'bg-green-100 text-green-700 border border-green-300'
                                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                                  }`}
                                >
                                  {col}
                                </div>
                              ))}
                            </div>
                          </div>

                          {columnStats.missingColumns.length > 0 && (
                            <div className="text-sm text-red-500 mt-2">
                              Missing columns: {columnStats.missingColumns.join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-gray-100 grid grid-cols-3">
          <div className="px-3 col-span-2 py-2 bg-gray-50 border-b flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span>Records to Import: <span className="font-medium text-foreground">{excelData ? excelData.length : 0}</span></span>
              </div>
              <div className="flex items-center gap-2 ">
                <div className="flex items-center gap-2"> <FileSpreadsheet className="h-4 w-4" />File: </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full border-primary"
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile ? selectedFile.name : "Select Excel File"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileSelect}
                />
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
              onClick={handleImport}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
              disabled={!excelData || isLoading || !hasRequiredColumns}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
