import { ChevronRight, ClipboardX } from 'lucide-react'
import { Badge } from "../../ui/badge"
import { useState, useEffect } from "react"
import { Backend_URL } from "../../../assets/Data"
import { useToast } from "../../../hooks/use-toast"
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover"

export default function Timeline({inventoryId}) {
    const {toast} = useToast();
    const [timeline, setTimeline] = useState([]);
    
    // fetch timeline
    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/inventory/timeline/${inventoryId}?type=all`, {credentials: "include"});
                if(!response.ok) throw new Error("Failed to fetch timeline");
                const data = await response.json();
                setTimeline(data);
            } catch (error) {
                toast({title: "Failed to fetch timeline", variant: "destructive"});
            }
        }
        if(inventoryId) fetchTimeline();
    }, [inventoryId]);

  return (
    <div className="w-full">
      <div className="border rounded-lg">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <ClipboardX className="w-12 h-12 mb-2" />
            <p className="text-sm">No transaction history available</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">TXN DATE</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">TXN TYPE</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">TXN NO</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">distributor NAME</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">BATCH NO</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">CREDIT</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">DEBIT</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">BALANCE</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((transaction, index) => (
                <tr
                  key={index}
                  className="hover:bg-secondary cursor-pointer border-b last:border-0"
                >
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Time: {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      {transaction.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">{transaction.invoiceNumber || '-'}</div>
                    <div className="text-xs text-gray-500">User: {transaction.userName || '-'}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">{transaction.distributorName || '-'}</div>
                    <div className="text-xs text-gray-500">Mob: {transaction.distributorMob || '-'}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium">{transaction.batchNumber}</div>
                    <div className="text-xs text-gray-500">Exp: {transaction.expiry}</div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-green-600 font-medium">
                      {transaction.credit || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-red-600 font-medium">
                      {transaction.debit || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{transaction.balance}</td>
                  <td className="px-4 py-2">
                    <Popover>
                      <PopoverTrigger>
                        <ChevronRight className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-50" 
                        align="end"
                        sideOffset={5}
                        alignOffset={-20}
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium">Transaction Remarks</h4>
                          <div className="text-sm text-gray-500">
                            {(transaction.remarks || "No remarks available")
                              .split('\n')
                              .map((line, index) => (
                                <p key={index}>
                                  {line || '\u00A0'}
                                </p>
                              ))
                            }
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

