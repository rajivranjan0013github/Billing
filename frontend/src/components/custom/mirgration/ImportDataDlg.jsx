import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Upload, FileSpreadsheet, Table2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useToast } from "../../../hooks/use-toast";
import { useDispatch } from "react-redux";
import { Separator } from "../../ui/separator";
import { ScrollArea } from "../../ui/scroll-area";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "../../ui/badge";

const DRAGGABLE_PREFIX = 'excel-';
const DROPPABLE_PREFIX = 'target-';

const DraggableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'inline-block',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="touch-none"
    >
      <Badge
        variant="outline"
        className="cursor-grab text-sm border-gray-300"
      >
        {children}
      </Badge>
    </div>
  );
};

const DroppableColumn = ({ id, children, mappedExcelColumn, onRemoveMapping }) => {
  const { setNodeRef, isOver } = useSortable({id}); // Using useSortable for droppable for now

  const style = {
    border: isOver ? '2px dashed green' : '1px solid #e0e0e0', // Slightly softer border
    padding: '12px', // Adjusted padding
    margin: '4px 0',
    borderRadius: '4px',
    minHeight: '40px', // Adjusted min height
    backgroundColor: isOver ? '#e6ffe6' : '#f9f9f9', // Softer background for non-over state
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div>{children}</div> {/* This contains the target column header and field */}
      <div className="ml-2 text-sm flex items-center">
        {mappedExcelColumn ? (
          <>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              <span className="font-mono">{'->'}</span> {mappedExcelColumn}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 p-0 h-auto hover:bg-red-100"
              onClick={() => onRemoveMapping(id)}
            >
              <XCircle className="h-4 w-4 text-red-500" />
            </Button>
          </>
        ) : (
          <span className="text-gray-400 italic">{'-> (Drop here)'}</span>
        )}
      </div>
    </div>
  );
};


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
  const [rawExcelData, setRawExcelData] = useState(null);
  const [columnStats, setColumnStats] = useState(null);
  const [excelColumns, setExcelColumns] = useState([]);
  const [hasRequiredColumns, setHasRequiredColumns] = useState(false);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [mappedColumns, setMappedColumns] = useState({}); // Maps target column field to excel column name
  const [unmappedExcelColumns, setUnmappedExcelColumns] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const checkColumnMatches = (jsonData) => {
    if (!jsonData || jsonData.length === 0) {
      setExcelColumns([]);
      setUnmappedExcelColumns([]);
      setMappedColumns({});
      setHasRequiredColumns(false);
      return null;
    }
    
    const uploadedCols = Object.keys(jsonData[0]);
    setExcelColumns(uploadedCols);
    setUnmappedExcelColumns(uploadedCols); // Initially all are unmapped
    setMappedColumns({}); // Reset mappings

    // Auto-map if names match exactly for convenience
    const newMappedColumns = {};
    const stillUnmappedExcelCols = [...uploadedCols];
    columns.forEach(targetCol => {
      const exactMatch = uploadedCols.find(excelCol => excelCol === targetCol.header);
      if (exactMatch) {
        newMappedColumns[targetCol.field] = exactMatch;
        // Remove from unmapped
        const index = stillUnmappedExcelCols.indexOf(exactMatch);
        if (index > -1) {
          stillUnmappedExcelCols.splice(index, 1);
        }
      }
    });
    setMappedColumns(newMappedColumns);
    setUnmappedExcelColumns(stillUnmappedExcelCols);
    
    // Update hasRequiredColumns based on initial auto-mapping
    updateHasRequiredColumns(newMappedColumns);

    // This function's return value is less critical now as matching is visual
    // but we can still provide some stats if needed for other UI parts.
    const expectedHeaders = columns.map(col => col.header);
    const matchedExcelHeaders = Object.values(newMappedColumns);
    
    return {
      total: expectedHeaders.length,
      matching: matchedExcelHeaders.length, // Based on current mapping
      matchedColumns: matchedExcelHeaders,
      missingColumns: expectedHeaders.filter(col => !matchedExcelHeaders.includes(col)),
      // missingRequiredColumns logic will need an update based on mappedColumns
    };
  };

  const updateHasRequiredColumns = (currentMappings) => {
    const requiredTargetFields = columns
      .filter(col => col.required === true)
      .map(col => col.field);
    
    const allRequiredMapped = requiredTargetFields.every(field => 
      currentMappings[field] && currentMappings[field] !== null
    );
    setHasRequiredColumns(allRequiredMapped);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      // Ensure we are dealing with correctly prefixed IDs
      if (!active.id.toString().startsWith(DRAGGABLE_PREFIX) || !over.id.toString().startsWith(DROPPABLE_PREFIX)) {
        console.error("Dnd item ID prefix mismatch:", active.id, over.id);
        return;
      }

      const draggedExcelColumn = active.id.toString().substring(DRAGGABLE_PREFIX.length);
      const targetColumnField = over.id.toString().substring(DROPPABLE_PREFIX.length);

      setMappedColumns((prev) => {
        const newMappings = { ...prev };
        // Remove the draggedExcelColumn from any other target it might be mapped to
        for (const field in newMappings) {
          if (newMappings[field] === draggedExcelColumn) {
            delete newMappings[field];
          }
        }
        // Assign to new target
        newMappings[targetColumnField] = draggedExcelColumn;
        updateHasRequiredColumns(newMappings);
        return newMappings;
      });

      // Update unmappedExcelColumns
      setUnmappedExcelColumns((prev) =>
        prev.filter((col) => col !== draggedExcelColumn)
      );
    }
  };

  const handleRemoveMapping = (prefixedTargetColumnFieldToRemove) => {
    const targetColumnFieldToRemove = prefixedTargetColumnFieldToRemove.startsWith(DROPPABLE_PREFIX) 
      ? prefixedTargetColumnFieldToRemove.substring(DROPPABLE_PREFIX.length)
      : prefixedTargetColumnFieldToRemove; // Fallback, though it should always be prefixed

    setMappedColumns((prevMappedColumns) => {
      const newMappings = { ...prevMappedColumns };
      const excelColToUnmap = newMappings[targetColumnFieldToRemove];
      
      if (excelColToUnmap) {
        // Add back to unmappedExcelColumns if not already there (it should be unique)
        setUnmappedExcelColumns((prevUnmapped) => {
          // Sort added to ensure consistent ordering for SortableContext items
          const updatedUnmapped = prevUnmapped.includes(excelColToUnmap) ? prevUnmapped : [...prevUnmapped, excelColToUnmap];
          return updatedUnmapped.sort(); 
        });
        delete newMappings[targetColumnFieldToRemove];
      }
      updateHasRequiredColumns(newMappings); // Update required status
      return newMappings;
    });
  };

  useEffect(() => {
    if (rawExcelData && rawExcelData.length > 0) {
      const validationError = validateData(rawExcelData); // Validate raw data
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive",
        });
        setExcelData(null); // Clear processed data if validation fails
        return;
      }
      const transformed = transformData(rawExcelData); // transformData uses current mappedColumns
      setExcelData(transformed);
    } else {
      setExcelData(null); // Clear if no raw data or empty raw data
    }
  // transformData implicitly depends on `columns` and `mappedColumns`.
  // validateData implicitly depends on `customValidation`.
  // Explicitly listing them helps understand dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [rawExcelData, mappedColumns, columns, toast, customValidation]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      setSelectedFile(null);
      setRawExcelData(null); // This will trigger useEffect to clear excelData
      setExcelColumns([]);
      setUnmappedExcelColumns([]);
      setMappedColumns({});
      setColumnStats(null);
      setHasRequiredColumns(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Allow re-selecting the same file
      }
      return;
    }

    setSelectedFile(file); // Set selected file state

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid File",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      // Reset states if file is invalid after selection
      setSelectedFile(null);
      setRawExcelData(null);
      setExcelColumns([]);
      setUnmappedExcelColumns([]);
      setMappedColumns({});
      setColumnStats(null);
      setHasRequiredColumns(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
      
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);


          setRawExcelData(jsonData); // Store raw data; useEffect will handle transformation

          // checkColumnMatches sets initial mappings based on headers and updates related states
          const stats = checkColumnMatches(jsonData);
          setColumnStats(stats);
          
          // Validation and transformation are now handled by useEffect based on rawExcelData and mappedColumns
          // No direct call to validateData, transformData, or setExcelData here for the main flow.

        } catch (error) {
          toast({
            title: "Processing Failed",
            description: error.message || "Failed to process Excel file",
            variant: "destructive",
          });
          setRawExcelData(null); // Clear raw data on error
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast({
        title: "File Read Failed",
        description: error.message || "Failed to read Excel file",
        variant: "destructive",
      });
      setRawExcelData(null); // Clear raw data on error
    }
  };

  const validateData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return "No data found in the Excel file";
    }
    
    return null;
  };

  const transformData = (data) => {
    return data
      .filter(row => {
        // Check if at least one required field (based on mapping) has a value
        const requiredTargetFields = columns
          .filter(col => col.required === true)
          .map(col => col.field);
        
        return requiredTargetFields.some(targetField => {
          const excelHeader = mappedColumns[targetField];
          return excelHeader && row[excelHeader] && row[excelHeader].toString().trim() !== '';
        });
      })
      .map(row => {
        const transformedRow = {};
        
        columns.forEach(col => {
          const excelHeader = mappedColumns[col.field]; // Get mapped Excel header
          if (!excelHeader) return; // Skip if no mapping for this target column

          let value = row[excelHeader]; // Use mapped header to get value
          
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader className="px-4 py-2.5 flex flex-row items-center justify-between bg-gray-100 border-b">
          <DialogTitle className="text-base font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        <Separator />

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-gray-600">Importing data...</p>
              </div>
            ) : (
              <div className="p-0">
                <div className="">
                  <div className=" rounded-lg p-4">
                    {columns.length > 0 && (
                      <>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="grid grid-cols-1 gap-4">
                            {/* Target Columns (Droppable) */}
                            <div>
                              <h3 className="text-sm font-medium mb-2">Target Columns (Drop here)</h3>
                              <SortableContext items={columns.map(c => `${DROPPABLE_PREFIX}${c.field}`)} strategy={rectSortingStrategy}> {/* Use unique field for ID */}
                                <div className="space-y-2 grid grid-cols-3 gap-2 text-sm">
                                  {columns.map((targetCol) => (
                                    <DroppableColumn
                                      key={`${DROPPABLE_PREFIX}${targetCol.field}`}
                                      id={`${DROPPABLE_PREFIX}${targetCol.field}`} // Crucial: ID must be unique for dnd-kit
                                      mappedExcelColumn={mappedColumns[targetCol.field]}
                                      onRemoveMapping={handleRemoveMapping}
                                    >
                                      <span className={targetCol.required ? "font-semibold" : ""}>
                                        {targetCol.header}
                                        {targetCol.required && <span className="text-red-500 ml-1">*</span>}
                                      </span>
                                    </DroppableColumn>
                                  ))}
                                </div>
                              </SortableContext>
                            </div>

                            {/* Excel Columns List (Draggable) */}
                            <div>
                              <h3 className="text-sm font-medium mb-2">Excel File Columns (Drag from here)</h3>
                              {excelColumns.length === 0 && selectedFile && <p className="text-xs text-gray-500">No columns found in the uploaded file or file not processed yet.</p>}
                              {!selectedFile && <p className="text-xs text-gray-500">Upload an Excel file to see its columns.</p>}
                              <SortableContext items={unmappedExcelColumns.map(col => `${DRAGGABLE_PREFIX}${col}`)} strategy={rectSortingStrategy}>
                                <div className="p-2 border rounded-md min-h-[100px] bg-gray-100 flex flex-wrap gap-2">
                                  {unmappedExcelColumns.map((excelCol) => (
                                    <DraggableItem key={`${DRAGGABLE_PREFIX}${excelCol}`} id={`${DRAGGABLE_PREFIX}${excelCol}`}>
                                      {excelCol}
                                    </DraggableItem>
                                  ))}
                                  {unmappedExcelColumns.length === 0 && excelColumns.length > 0 && (
                                    <p className="text-xs text-gray-500 p-2 col-span-4">All Excel columns have been mapped or there are no unmapped columns left.</p>
                                  )}
                                </div>
                              </SortableContext>
                            </div>
                          </div>
                        </DndContext>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-gray-100 grid grid-cols-5">
          <div className="px-3 col-span-4 py-2 bg-gray-50 border-b flex items-center justify-between text-sm text-muted-foreground">
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
                  className="w-full border-primary px-2"
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
              {columnStats && (
                <div className="flex items-center gap-2 text-sm">
                  {hasRequiredColumns ? ( // Updated to use hasRequiredColumns
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>
                    Required Columns Mapped: {hasRequiredColumns ? "Yes" : "No"}
                  </span>
                </div>
              )}
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
