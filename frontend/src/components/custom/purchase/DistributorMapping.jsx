import { useState, useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Check, AlertCircle, Plus } from "lucide-react";
import { useSelector } from "react-redux";
import Fuse from "fuse.js";
import SelectDistributorDlg from "../distributor/SelectDistributorDlg";

const DistributorMapping = ({
  distributorName,
  distributorData,
  onDistributorSelect,
  selectedDistributor,
}) => {
  const [isSelectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { distributors } = useSelector((state) => state.distributor);

  const distributorFuse = useMemo(() => {
    const fuseOptions = {
      keys: [{ name: "name", weight: 1 }],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
      shouldSort: true,
      includeScore: true,
      includeMatches: true,
    };
    return new Fuse(distributors || [], fuseOptions);
  }, [distributors]);

  useEffect(() => {
    if (distributorName && !selectedDistributor) {
      const results = distributorFuse.search(distributorName).slice(0, 1);
      const firstResult = results[0];
      if (firstResult && 1 - (firstResult.score || 0) >= 0.8) {
        onDistributorSelect(firstResult.item);
      }
    }
  }, [
    distributorName,
    selectedDistributor,
    distributorFuse,
    onDistributorSelect,
  ]);

  const handleSelectDistributor = (distributor) => {
    onDistributorSelect(distributor);
    setSelectionDialogOpen(false);
  };

  const openSelectionDialog = () => {
    setSearch(selectedDistributor?.name || distributorName || "");
    setSelectionDialogOpen(true);
  };

  const initialDataForCreate = {
    name: distributorName || "",
    mob: distributorData?.distributorMob || "",
    email: distributorData?.distributorEmail || "",
    gstin: distributorData?.distributorGstin || "",
    DLNumber: distributorData?.distributorDlNumber || "",
    accountNumber: distributorData?.distributorBankNumber || "",
    ifsc: distributorData?.distributorBankIfsc || "",
    address: distributorData?.distributorAddress || "",
  };

  return (
    <>
      <div className="mb-4 border-b pb-4">
        <div className="text-sm font-medium mb-2">DISTRIBUTOR MAPPING</div>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            {selectedDistributor ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="text-sm py-1 px-3 bg-green-100 text-green-800"
                  >
                    {selectedDistributor.name}
                  </Badge>
                  <span className="text-sm text-green-700 font-semibold flex items-center gap-1">
                    <Check className="h-4 w-4" /> Mapped
                  </span>
                </div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={openSelectionDialog}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>No distributor mapped. Try selecting one.</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1"
                  onClick={openSelectionDialog}
                >
                  <Plus className="h-4 w-4" />
                  Select Distributor
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <SelectDistributorDlg
        open={isSelectionDialogOpen}
        setOpen={setSelectionDialogOpen}
        onSelect={handleSelectDistributor}
        search={search}
        setSearch={setSearch}
        initialDataForCreate={initialDataForCreate}
      />
    </>
  );
};

export default DistributorMapping;
