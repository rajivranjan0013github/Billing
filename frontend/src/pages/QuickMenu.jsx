import React from "react";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Receipt,
  ShoppingCart,
  ArrowLeftRight,
  UserPlus,
  Wallet,
  Settings,
  BarChart3,
  Package,
  Store,
  FileText,
  CreditCard,
  FileInput,
  RotateCcw,
} from "lucide-react";

const QuickMenu = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Create Sale Invoice",
      description: "Create a new sales invoice",
      icon: FileInput,
      action: () => navigate("/sales/create-sell-invoice"),
      color: "bg-blue-300 text-blue-900 hover:bg-blue-400",
    },
    {
      title: "Sales List",
      description: "View all sales invoices",
      icon: Receipt,
      action: () => navigate("/sales"),
      color: "bg-blue-200 text-blue-900 hover:bg-blue-300",
    },
    {
      title: "Create Purchase Invoice",
      description: "Create a new purchase invoice",
      icon: FileInput,
      action: () => navigate("/purchase/create-purchase-invoice"),
      color: "bg-green-300 text-green-900 hover:bg-green-400",
    },
    {
      title: "Purchase List",
      description: "View all purchase invoices",
      icon: ShoppingCart,
      action: () => navigate("/purchase"),
      color: "bg-green-200 text-green-900 hover:bg-green-300",
    },
    
    {
      title: "Inventory",
      description: "View and manage inventory",
      icon: Package,
      action: () => navigate("/inventory"),
      color: "bg-purple-200 text-purple-900 hover:bg-purple-300",
    },
    {
      title: "Payments",
      description: "Track all payments",
      icon: Wallet,
      action: () => navigate("/payments"),
      color: "bg-indigo-200 text-indigo-900 hover:bg-indigo-300",
    },
    {
      title: "Create Purchase Return",
      description: "Create new purchase return",
      icon: RotateCcw,
      action: () => navigate("/purchase/return/create"),
      color: "bg-cyan-300 text-cyan-900 hover:bg-cyan-400",
    },
    {
      title: "Purchase Return List",
      description: "View all purchase returns",
      icon: ArrowLeftRight,
      action: () => navigate("/purchase/return"),
      color: "bg-cyan-200 text-cyan-900 hover:bg-cyan-300",
    },
    {
      title: "Distributors",
      description: "Manage distributors",
      icon: Store,
      action: () => navigate("/distributors"),
      color: "bg-yellow-200 text-yellow-900 hover:bg-yellow-300",
    },
    {
      title: "Customers",
      description: "View and manage customers",
      icon: Users,
      action: () => navigate("/customers"),
      color: "bg-pink-200 text-pink-900 hover:bg-pink-300",
    },

    {
      title: "Expenses",
      description: "Track and manage expenses",
      icon: CreditCard,
      action: () => navigate("/expenses"),
      color: "bg-rose-200 text-rose-900 hover:bg-rose-300",
    },
    {
      title: "Reports",
      description: "View financial reports",
      icon: FileText,
      action: () => navigate("/reports"),
      color: "bg-lime-200 text-lime-900 hover:bg-lime-300",
    },
    {
      title: "Dashboard",
      description: "View business dashboard",
      icon: BarChart3,
      action: () => navigate("/dashboard"),
      color: "bg-teal-200 text-teal-900 hover:bg-teal-300",
    },
    {
      title: "Staff",
      description: "Manage staff members",
      icon: UserPlus,
      action: () => navigate("/staff"),
      color: "bg-amber-200 text-amber-900 hover:bg-amber-300",
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      action: () => navigate("/settings"),
      color: "bg-slate-200 text-slate-900 hover:bg-slate-300",
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-300 rounded-xl hover:shadow-lg ${action.color}`}
            onClick={action.action}
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-white">
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg  font-semibold">{action.title}</h2>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuickMenu;
