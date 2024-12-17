import { ChevronRight } from 'lucide-react'
import { Badge } from "../../ui/badge"
import { useState, useEffect } from "react"
import { Backend_URL } from "../../../assets/Data"
import { useToast } from "../../../hooks/use-toast"

export default function Timeline({inventory_id}) {
    const {toast} = useToast();
    const [timeline, setTimeline] = useState([]);

    // fetch timeline
    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const response = await fetch(`${Backend_URL}/api/inventory/timeline/${inventory_id}`, {credentials: "include"});
                if(!response.ok) throw new Error("Failed to fetch timeline");
                const data = await response.json();
                setTimeline(data);
            } catch (error) {
                toast({title: "Failed to fetch timeline", variant: "destructive"});
            }
        }
        if(inventory_id) fetchTimeline();
    }, [inventory_id]);

  return (
    <div className="w-full">
      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">TXN DATE</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">TXN TYPE</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">TXN NO</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">PARTY NAME</th>
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
                className="hover:bg-gray-50 cursor-pointer border-b last:border-0"
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
                  <div className="text-sm">{transaction.invoice_number || '-'}</div>
                  <div className="text-xs text-gray-500">User: {transaction.createdBy?.name || '-'}</div>
                </td>
                <td className="px-4 py-2">
                  <div className="text-sm">{transaction.party_name || '-'}</div>
                  <div className="text-xs text-gray-500">Mob: {transaction.mobile || '-'}</div>
                </td>
                <td className="px-4 py-2">
                  <div className="text-sm font-medium">{transaction.batch_number}</div>
                  <div className="text-xs text-gray-500">Exp: {transaction.batch_expiry}</div>
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
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

