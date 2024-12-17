import * as React from "react"
import { Search, X, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import { Input } from "../../ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"


const batches = [
  {
    batchNo: "CM1223136",
    pack: "1's",
    expiry: "08/25",
    mrp: "₹44.68",
    status: "",
    purchRate: "₹32.00",
    ptr: "₹34.00",
    hsnCode: "3004"
  },
  {
    batchNo: "CM1224011",
    pack: "1's",
    expiry: "12/25",
    mrp: "₹44.69",
    status: "",
    purchRate: "₹29.02",
    ptr: "₹31.92",
    hsnCode: "30049063"
  },
  {
    batchNo: "CM1223184",
    pack: "1's",
    expiry: "11/25",
    mrp: "₹44.69",
    status: "",
    purchRate: "₹29.02",
    ptr: "₹31.92",
    hsnCode: "3004"
  },
  {
    batchNo: "1023633",
    pack: "1's",
    expiry: "10/25",
    mrp: "₹50.65",
    status: "",
    purchRate: "₹32.89",
    ptr: "₹36.18",
    hsnCode: "3004"
  },
  {
    batchNo: "23008",
    pack: "1's",
    expiry: "05/25",
    mrp: "₹40.64",
    status: "",
    purchRate: "₹26.39",
    ptr: "₹29.09",
    hsnCode: "3004"
  },
  {
    batchNo: "086",
    pack: "1's",
    expiry: "05/25",
    mrp: "₹40.64",
    status: "",
    purchRate: "₹26.39",
    ptr: "₹29.03",
    hsnCode: "3004"
  }
]

export default function BatchSearch() {
  const [open, setOpen] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const filteredBatches = batches.filter(batch =>
    batch.batchNo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Search Batch for &apos;Combiflame Susp 100ml&apos;</DialogTitle>
          <button
            onClick={() => setOpen(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select a batch from the below list
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Start Typing Here to Search..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BATCH NO</TableHead>
                <TableHead>PACK</TableHead>
                <TableHead>EXPIRY</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>PURC RATE</TableHead>
                <TableHead>PTR</TableHead>
                <TableHead>HSN CODE</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.batchNo} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{batch.batchNo}</TableCell>
                  <TableCell>{batch.pack}</TableCell>
                  <TableCell>{batch.expiry}</TableCell>
                  <TableCell>{batch.mrp}</TableCell>
                  <TableCell>{batch.status}</TableCell>
                  <TableCell>{batch.purchRate}</TableCell>
                  <TableCell>{batch.ptr}</TableCell>
                  <TableCell>{batch.hsnCode}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

