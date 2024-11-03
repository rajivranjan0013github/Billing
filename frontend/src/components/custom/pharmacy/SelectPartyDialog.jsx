import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Search } from "lucide-react";
import { Separator } from "../../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import { fetchParties } from '../../../redux/slices/partySlice';

const SelectPartyDialog = ({ open, onOpenChange, onSelectParty }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newParty, setNewParty] = useState({
    name: "",
    mobile_number: "",
    gstin: "",
    state: "",
    billing_address: "",
  });
  
  const dispatch = useDispatch();
  const { parties, fetchStatus } = useSelector((state) => state.party);

  useEffect(() => {
    if (open && fetchStatus === 'idle') {
      dispatch(fetchParties());
    }
  }, [open, fetchStatus, dispatch]);

  const filteredParties = parties.filter(party => 
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.phone.includes(searchQuery)
  );

  const handleCreateParty = () => {
    // Add logic to create new party
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-[90vw] max-h-[80vh] min-h-[60vh] gap-3 rounded-lg p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 shrink-0">
          <DialogTitle>Select or Create Party</DialogTitle>
        </DialogHeader>
        <Separator />
        
        <div className="flex flex-col flex-grow overflow-hidden">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 px-4">
              <TabsTrigger value="search">Search Party</TabsTrigger>
              <TabsTrigger value="create">Create New Party</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-grow px-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name or phone number..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <ScrollArea className="h-[400px] rounded-md border">
                {fetchStatus === 'loading' ? (
                  <div className="flex justify-center items-center p-4">
                    Loading parties...
                  </div>
                ) : fetchStatus === 'failed' ? (
                  <div className="flex justify-center items-center p-4 text-red-500">
                    Failed to load parties. Please try again.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-sm font-medium text-gray-600">Name</th>
                        <th className="text-left p-2 text-sm font-medium text-gray-600">Phone</th>
                        <th className="text-left p-2 text-sm font-medium text-gray-600">GSTIN</th>
                        <th className="text-left p-2 text-sm font-medium text-gray-600">State</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredParties.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-4 text-gray-500">
                            No parties found
                          </td>
                        </tr>
                      ) : (
                        filteredParties.map((party) => (
                          <tr 
                            key={party._id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => onSelectParty(party)}
                          >
                            <td className="p-2 text-sm">{party?.name}</td>
                            <td className="p-2 text-sm">{party?.mobile_number}</td>
                            <td className="p-2 text-sm">{party?.gstin || '-'}</td>
                            <td className="p-2 text-sm">{party?.state || '-'}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm">Select</Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="name">Party Name<span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    value={newParty.name}
                    onChange={(e) => setNewParty({...newParty, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="mobile">Mobile Number<span className="text-red-500">*</span></Label>
                  <Input 
                    id="mobile" 
                    value={newParty.mobile_number}
                    onChange={(e) => setNewParty({...newParty, mobile_number: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input 
                    id="gstin" 
                    value={newParty.gstin}
                    onChange={(e) => setNewParty({...newParty, gstin: e.target.value})}
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="state">State</Label>
                  <Input 
                    id="state" 
                    value={newParty.state}
                    onChange={(e) => setNewParty({...newParty, state: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Billing Address</Label>
                  <Input 
                    id="address" 
                    value={newParty.billing_address}
                    onChange={(e) => setNewParty({...newParty, billing_address: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="mt-2" />
        <DialogFooter className="px-4 py-2 shrink-0">
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={handleCreateParty}
          >
            Create Party
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectPartyDialog;