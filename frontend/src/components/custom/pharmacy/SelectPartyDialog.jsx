import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Search } from "lucide-react";
import { Separator } from "../../ui/separator";
import { ScrollArea } from "../../ui/scroll-area";
import { fetchParties } from '../../../redux/slices/partySlice';

const SelectPartyDialog = ({ open, onOpenChange, onSelectParty }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const dispatch = useDispatch();
  const { parties, fetchStatus } = useSelector((state) => state.party);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && fetchStatus === 'idle') {
      dispatch(fetchParties());
    }
  }, [open, fetchStatus, dispatch]);

  const filteredParties = parties.filter(party => 
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.phone.includes(searchQuery)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] w-[90vw] max-h-[80vh] min-h-[60vh] gap-3 rounded-lg p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 shrink-0">
          <DialogTitle>Select Party</DialogTitle>
        </DialogHeader>
        <Separator />
        
        <div className="flex flex-col flex-grow overflow-hidden px-4">
          <div className="flex gap-0 items-center mb-4">
            <div className="relative flex-1 p-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or phone number..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                onOpenChange(false);
                navigate('/parties/create-party');
              }}
            >
              Add New Party
            </Button>
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
        </div>

        <Separator className="mt-2" />
        <DialogFooter className="px-4 py-2 shrink-0">
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectPartyDialog;