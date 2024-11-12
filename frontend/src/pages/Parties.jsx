import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent } from "../components/ui/card"
import { ChevronDown, FileText, Settings, Users, Search, FileQuestion } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchParties } from "../redux/slices/partySlice"
import { useNavigate } from "react-router-dom"

export default function Party() {
  const dispatch = useDispatch()
  const { parties, fetchStatus } = useSelector((state) => state.party);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPartyType, setFilterPartyType] = useState('all')
  const [filterBalanceType, setFilterBalanceType] = useState('all')

  useEffect(() => {
    if (fetchStatus === 'idle') {
      dispatch(fetchParties())
    }
  }, [dispatch, fetchStatus])

  // Calculate totals for the cards
  const totalParties = parties.length
  const toCollect = parties
    .filter(party => party.current_balance > 0)
    .reduce((sum, party) => sum + party.current_balance, 0)
  const toPay = parties
    .filter(party => party.current_balance < 0)
    .reduce((sum, party) => sum + Math.abs(party.current_balance), 0)

  // Filter parties based on search and filters
  const filteredParties = parties.filter(party => {
    const searchMatch = 
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.mobile_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const partyTypeMatch = 
      filterPartyType === 'all' || 
      party.party_type?.toLowerCase() === filterPartyType.toLowerCase()
    
    const balanceTypeMatch = 
      filterBalanceType === 'all' || 
      (filterBalanceType === 'collect' && party.current_balance > 0) ||
      (filterBalanceType === 'pay' && party.current_balance < 0)

    return searchMatch && partyTypeMatch && balanceTypeMatch
  })

  return (
    <div className="container mx-auto p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parties</h1>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[140px]">
              <FileText className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="purchases">Purchases Report</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-purple-50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">All Parties</p>
              <p className="text-2xl font-bold">{totalParties.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">To Collect</p>
              <p className="text-2xl font-bold">₹ {toCollect.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-xl">₹</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">To Pay</p>
              <p className="text-2xl font-bold">₹ {toPay.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">₹</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              className="w-64 pl-8" 
              placeholder="Search parties..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterPartyType} onValueChange={setFilterPartyType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Party Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Customer">Customer</SelectItem>
              <SelectItem value="Supplier">Supplier</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBalanceType} onValueChange={setFilterBalanceType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Balance Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Balances</SelectItem>
              <SelectItem value="collect">To Collect</SelectItem>
              <SelectItem value="pay">To Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Bulk Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Delete Selected</SelectItem>
              <SelectItem value="export">Export Selected</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/parties/create-party')}>Create Party</Button>
        </div>
      </div>

      {filteredParties.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Party Name</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Party type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParties.map((party) => (
              <TableRow 
                key={party._id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/party-details/${party._id}`)}
              >
                <TableCell className="font-medium">{party.name}</TableCell>
                <TableCell>{party.mobile_number || '-'}</TableCell>
                <TableCell className="capitalize">{party.party_type}</TableCell>
                <TableCell className="text-right">
                  <span className={party.current_balance > 0 ? "text-green-600" : "text-red-600"}>
                    {party.current_balance > 0 ? "↓ " : "↑ "}
                    ₹ {Math.abs(party.current_balance || 0)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
          <FileQuestion className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-500">No parties found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || filterPartyType !== 'all' || filterBalanceType !== 'all' 
              ? "Try adjusting your filters or search terms"
              : "Get started by creating your first party"}
          </p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/parties/create-party')}
          >
            Create Party
          </Button>
        </div>
      )}
    </div>
  )
}
