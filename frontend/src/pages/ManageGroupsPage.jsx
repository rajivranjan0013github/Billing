import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Backend_URL } from "../assets/Data";
import { useToast } from "../hooks/use-toast"; // Assuming you have a toast component
import { Checkbox } from "../components/ui/checkbox"; // Assuming you have a Checkbox component
import { Label } from "../components/ui/label"; // Assuming you have a Label component

const ManageGroupsPage = () => {
  const { toast } = useToast();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [distinctGroups, setDistinctGroups] = useState([]);
  const [selectedInventoryIds, setSelectedInventoryIds] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toggledGroup, setToggledGroup] = useState(null); // Renamed from activeFilterGroup
  const [searchTerm, setSearchTerm] = useState(""); // State for the search term
  const [editingGroup, setEditingGroup] = useState(null); // null or group name

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch(`${Backend_URL}/api/inventory`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch inventory items" }));
        throw new Error(errorData.message || "Failed to fetch inventory items");
      }
      const data = await response.json();
      setInventoryItems(data || []);
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch inventory items.",
        variant: "destructive",
      });
    }
  };

  const fetchDistinctGroups = async () => {
    try {
      const response = await fetch(
        `${Backend_URL}/api/inventory/groups/distinct`,
        { credentials: "include" }
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch distinct groups" }));
        throw new Error(errorData.message || "Failed to fetch distinct groups");
      }
      const data = await response.json();
      setDistinctGroups(data || []);
    } catch (error) {
      console.error("Failed to fetch distinct groups:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch distinct groups.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInventoryItems();
    fetchDistinctGroups();
  }, []);

  const handleEditGroup = (groupName) => {
    if (editingGroup === groupName) {
      // Deselect if clicking the same group
      setEditingGroup(null);
      setNewGroupName("");
      setSelectedInventoryIds([]);
      setToggledGroup(null);
      return;
    }
    setEditingGroup(groupName);
    setNewGroupName(groupName);
    // Select all items in this group
    const itemsInGroup = inventoryItems.filter(
      (item) => item.group && item.group.includes(groupName)
    );
    setSelectedInventoryIds(itemsInGroup.map((item) => item._id));
    setToggledGroup(groupName);
  };

  const handleAssignGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (selectedInventoryIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one inventory item.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const trimmedGroupName = newGroupName.trim();
    let groupNameToUse = editingGroup ? editingGroup : trimmedGroupName;

    const TtrimmedGroupNameLower = trimmedGroupName.toLowerCase();
    const existingCanonicalGroup = distinctGroups.find(
      (group) => group.toLowerCase() === TtrimmedGroupNameLower
    );

    if (!editingGroup && existingCanonicalGroup) {
      groupNameToUse = existingCanonicalGroup;
    }

    try {
      if (editingGroup) {
        // Find all inventory items that currently have the old group
        const oldInventoryIds = inventoryItems
          .filter((item) => item.group && item.group.includes(editingGroup))
          .map((item) => item._id);
        const newInventoryIds = selectedInventoryIds;
        // Compute the three sets
        const removeOldGroupIds = oldInventoryIds.filter(
          (id) => !newInventoryIds.includes(id)
        );
        const addNewGroupIds = newInventoryIds.filter(
          (id) => !oldInventoryIds.includes(id)
        );
        const renameGroupIds = oldInventoryIds.filter((id) =>
          newInventoryIds.includes(id)
        );
        const payload = {
          oldGroupName: editingGroup,
          newGroupName: trimmedGroupName,
          removeOldGroupIds,
          addNewGroupIds,
        };
        if (editingGroup !== trimmedGroupName) {
          payload.renameGroupIds = renameGroupIds;
        }
        const response = await fetch(
          `${Backend_URL}/api/inventory/groups/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include",
          }
        );
        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || "Failed to update group.");
        }
        toast({
          title: "Success",
          description:
            responseData.message ||
            `Group '${trimmedGroupName}' updated successfully.`,
        });
      } else {
        // Normal assign logic
        const response = await fetch(
          `${Backend_URL}/api/inventory/groups/assign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              groupName: groupNameToUse, // Use the determined groupName
              inventoryIds: selectedInventoryIds,
            }),
            credentials: "include",
          }
        );
        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || "Failed to assign group.");
        }
        toast({
          title: "Success",
          description:
            responseData.message ||
            `Group '${groupNameToUse}' assigned successfully.`,
        });
      }
      setNewGroupName("");
      setSelectedInventoryIds([]);
      setEditingGroup(null);
      setToggledGroup(null);
      fetchDistinctGroups();
      // Optionally, refresh inventory items if their group info is displayed directly
      // fetchInventoryItems();
    } catch (error) {
      console.error("Failed to assign group:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign group.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryItemSelect = (itemId) => {
    setSelectedInventoryIds((prevSelectedIds) =>
      prevSelectedIds.includes(itemId)
        ? prevSelectedIds.filter((id) => id !== itemId)
        : [...prevSelectedIds, itemId]
    );
  };

  const handleToggleGroupItemsSelection = (groupName) => {
    const itemsInGroup = inventoryItems.filter(
      (item) => item.group && item.group.includes(groupName)
    );
    const itemIdsInGroup = itemsInGroup.map((item) => item._id);

    // Handle clicks on groups with no items
    if (itemIdsInGroup.length === 0) {
      if (toggledGroup === groupName) {
        // Clicking an already toggled empty group: deselect it
        setSelectedInventoryIds([]);
        setToggledGroup(null);
      } else {
        // Clicking a new empty group: make it active, clear other selections
        setSelectedInventoryIds([]);
        setToggledGroup(groupName);
      }
      return;
    }

    // Check if all items in the *clicked* group are currently selected
    const allItemsOfClickedGroupAreSelected = itemIdsInGroup.every((id) =>
      selectedInventoryIds.includes(id)
    );

    // Check if the *current selection* consists *only* of items from the clicked group
    const selectionIsExclusivelyClickedGroup =
      allItemsOfClickedGroupAreSelected &&
      selectedInventoryIds.length === itemIdsInGroup.length;

    if (toggledGroup === groupName && selectionIsExclusivelyClickedGroup) {
      // Scenario 1: Clicking the active, exclusively selected group to deselect it.
      // This means all its items were selected, and no other items were selected.
      setSelectedInventoryIds([]); // Deselect all items
      setToggledGroup(null); // Clear the active group filter
    } else {
      // Scenario 2: Clicking a new group, or re-clicking the current group
      // to ensure its items are exclusively selected.
      setSelectedInventoryIds(itemIdsInGroup); // Select only items from this group
      setToggledGroup(groupName); // Set this group as the active filter
    }
  };

  // Determine which items to display based on the search term and toggled group
  const filteredInventoryItems = (() => {
    let items = inventoryItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (toggledGroup) {
      items.sort((a, b) => {
        const aInToggledGroup = a.group && a.group.includes(toggledGroup);
        const bInToggledGroup = b.group && b.group.includes(toggledGroup);

        if (aInToggledGroup && !bInToggledGroup) {
          return -1; // a comes first
        }
        if (!aInToggledGroup && bInToggledGroup) {
          return 1; // b comes first
        }
        // If both are in or out of the toggled group, maintain original relative order (or sort by name as a secondary criterion)
        // For now, keeping it simple. Can add secondary sort by name if needed.
        return 0;
      });
    }
    return items;
  })();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedInventoryIds([]);
    setToggledGroup(null);
  };

  // Calculate item counts for each group
  const groupItemCounts = distinctGroups.reduce((acc, groupName) => {
    acc[groupName] = inventoryItems.filter(
      (item) => item.group && item.group.includes(groupName)
    ).length;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-2 bg-gray-50 min-h-screen">
      <h3 className="font-bold text-gray-800">Manage Inventory Groups</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Group Management */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Available Groups
            </h2>
            {distinctGroups.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {distinctGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => handleEditGroup(group)}
                    className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out 
                                ${
                                  toggledGroup === group ||
                                  editingGroup === group
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-indigo-400 border border-gray-200"
                                }`}
                  >
                    {group}
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        toggledGroup === group || editingGroup === group
                          ? "bg-indigo-400 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {groupItemCounts[group] || 0}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No groups created yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Inventory Selection and Assignment */}
        <div className="lg:col-span-2 space-y-2">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Select Inventory Items
              </h2>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search items by name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="max-w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                />
              </div>
            </div>

            {filteredInventoryItems.length > 0 ? (
              <div className="max-h-[calc(100vh-300px)] min-h-[200px] lg:max-h-[calc(100vh-400px)] overflow-y-auto border border-gray-200 rounded-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/50">
                {filteredInventoryItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors duration-150 border border-gray-200 bg-white"
                  >
                    <Checkbox
                      id={`item-${item._id}`}
                      checked={selectedInventoryIds.includes(item._id)}
                      onCheckedChange={() =>
                        handleInventoryItemSelect(item._id)
                      }
                      className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 focus:ring-indigo-500"
                    />
                    <Label
                      htmlFor={`item-${item._id}`}
                      className="cursor-pointer flex-1 text-xs text-gray-700"
                    >
                      <div className=" flex font-medium  text-sm">
                        <div className="">{item.name}</div>
                        {item.group && item.group.length > 0 && (
                          <div className="ml-2 flex justify-center items-center text-[10px] text-gray-500">
                            {item.group.join(", ")}
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8 italic">
                {searchTerm
                  ? `No items match "${searchTerm}".`
                  : "No inventory items found."}
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {editingGroup
                ? `Edit Group: ${editingGroup}`
                : "Assign Selected Items to Group"}
            </h2>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="groupName"
                  className="text-sm font-medium text-gray-700"
                >
                  Group Name
                </Label>
                <Input
                  id="groupName"
                  type="text"
                  placeholder="Enter new or existing group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-1 block w-full max-w-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                />
                {/* Bottom row: Cancel Edit and Assign/Update button (edit mode only) */}
                {editingGroup && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingGroup(null);
                        setNewGroupName("");
                        setSelectedInventoryIds([]);
                        setToggledGroup(null);
                      }}
                    >
                      Cancel Edit
                    </Button>
                    <Button
                      onClick={handleAssignGroup}
                      disabled={
                        loading ||
                        selectedInventoryIds.length === 0 ||
                        !newGroupName.trim()
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {loading
                        ? "Updating..."
                        : `Update Group Items (${selectedInventoryIds.length})`}
                    </Button>
                  </div>
                )}
                {/* If not editing, show only the assign button below the input */}
                {!editingGroup && (
                  <Button
                    onClick={handleAssignGroup}
                    disabled={
                      loading ||
                      selectedInventoryIds.length === 0 ||
                      !newGroupName.trim()
                    }
                    className="mt-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {loading
                      ? "Assigning..."
                      : `Assign ${selectedInventoryIds.length} Item(s) to Group`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageGroupsPage;
