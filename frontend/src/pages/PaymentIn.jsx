// import { Button } from "../components/ui/button"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
// import { Input } from "../components/ui/input"
// import { MessageSquare, Search, Settings } from "lucide-react"
// import { useNavigate } from "react-router-dom";
// import { useSelector, useDispatch } from "react-redux";
// import { fetchPaymentsIn } from "../redux/slices/paymentSlice";
// import { useEffect } from "react";

// export default function PaymentIn() {
//   const navigate = useNavigate();
//   const { paymentIn, paymentInStatus } = useSelector((state) => state.payment);
//   const dispatch = useDispatch();

//   useEffect(() => {
//     if (paymentInStatus === "idle") {
//       dispatch(fetchPaymentsIn());
//     }
//   }, [dispatch, paymentInStatus]);
  
//   return (
//     <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Payment In</h1>
//         <div className="flex items-center gap-2">
//           <Button variant="ghost" size="icon">
//             <Settings className="h-5 w-5" />
//           </Button>
//           <Button variant="ghost" size="icon">
//             <MessageSquare className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>
      
//       <div className="flex items-center justify-between gap-4">
//         <div className="flex items-center gap-2 flex-1">
//           <div className="relative">
//             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//             <Input className="pl-8" placeholder="Search payments..." />
//           </div>
//           <Select defaultValue="365">
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Select period" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="365">Last 365 Days</SelectItem>
//               <SelectItem value="30">Last 30 Days</SelectItem>
//               <SelectItem value="7">Last 7 Days</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         <Button className="bg-[#6366F1] hover:bg-[#5558DD]" onClick={() => navigate("/sales/create-payment-in")}>
//           Create Payment In
//         </Button>
//       </div>

//       <div className="border rounded-lg">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-[150px]">Date</TableHead>
//               <TableHead>Payment Number</TableHead>
//               <TableHead>distributor Name</TableHead>
//               <TableHead className="text-right">Amount</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {paymentIn.map((payment) => (
//               <TableRow key={payment._id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/sales/payment-in/${payment._id}`)}>
//                 <TableCell>
//                   {new Date(payment.createdAt).toLocaleDateString('en-IN', {
//                     day: '2-digit',
//                     month: 'short',
//                     year: 'numeric'
//                   })}
//                 </TableCell>
//                 <TableCell>{payment?.payment_number}</TableCell>
//                 <TableCell>{payment.distributorName}</TableCell>
//                 <TableCell className="text-right">₹ {payment.amount.toLocaleString('en-IN')}</TableCell>
//               </TableRow>
//             ))}
//             {paymentIn.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={4} className="text-center text-muted-foreground">
//                   No payments found
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   )
// }