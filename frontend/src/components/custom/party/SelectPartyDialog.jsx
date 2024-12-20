import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Edit, Search, Trash2, X } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { useSelector, useDispatch } from "react-redux"
import { useEffect } from "react"
import { fetchParties } from "../../../redux/slices/partySlice";

export default function SelectPartyDialog({open, setOpen, search, setSearch, onSelect}) {

  const {parties : distributors, fetchStatus} = useSelector(state=> state.party);
  const dispatch = useDispatch();
  useEffect(()=> {
    if(fetchStatus === 'idle') {
      dispatch(fetchParties());
    }
  }, [ fetchStatus])
  
  // Filter distributors based on search
  const filteredDistributors = distributors.filter(distributor =>
    distributor.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 gap-0">
        <DialogHeader className="p-6 flex flex-row items-center justify-between border-b">
          <div className="space-y-1">
            <DialogTitle className="text-xl">Select a Distributor</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select an option from the below list
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-gray-800">Create New (F2)</Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 border-b space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="text-sm">SEARCH DISTRIBUTOR</div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DISTRIBUTOR NAME/ADDRESS</TableHead>
                <TableHead>MOBILE NO</TableHead>
                <TableHead>GSTIN / DRUG LIC</TableHead>
                <TableHead>BALANCE</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistributors.map((distributor) => (
                <TableRow 
                  key={distributor._id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => {
                    onSelect?.(distributor);
                    setOpen(false);
                  }}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {distributor.name}
                        {distributor.verified && (
                          <Badge variant="secondary" className="bg-emerald-100">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {distributor.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{distributor.mobile}</TableCell>
                  <TableCell>
                    <div>
                      <div>{distributor.gstin}</div>
                      <div className="text-sm text-muted-foreground">
                        {distributor.drugLic}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{distributor.balance}</div>
                      <div className="text-sm text-muted-foreground">-</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-3 bg-gray-50 text-sm text-muted-foreground flex items-center justify-center gap-3">
          <span>Create New - F2</span>
          <span>|</span>
          <span>Edit Selected - F4</span>
          <span>|</span>
          <span>Delete Selected - DEL</span>
          <span>|</span>
          <span>Close - ESC</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

