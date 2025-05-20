import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Home,
  Settings,
  UsersIcon,
  IndianRupee,
  ShoppingCart,
  Truck,
  Package,
  Menu,
  ChevronDown,
  LogOut,
  Users,
  Wallet,
  WalletMinimal,
  ChartColumn
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { clearUserData } from "../../../redux/slices/userSlice";
import {setIsCollapsed } from '../../../redux/slices/loaderSlice'
import { Backend_URL } from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";

export const navItems = [
  { name: "Quick Menu", icon: Home, path: "/" },
  { name: "Sales", icon: ShoppingCart, path: "/sales" },
  { name: "Purchase", icon: Truck, path: "/purchase" },
  { name: "Inventory", icon: Package, path: "/inventory" },
  { name: "Payments", icon: IndianRupee, path: "/payments" },
  { name: "Accounts", icon: Wallet, path: "/accounts" },
  { name: "Customers", icon: Users, path: "/customers" },
  { name: "Distributors", icon: Users, path: "/distributors" },
  { name: "Expenses", icon: WalletMinimal, path: "/expenses" },
  { name: "Dashboard", icon: ChartColumn, path: "/dashboard" },
  { name: "Staffs", icon: UsersIcon, path: "/staff" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export const ColorfulLogo = ({ className }) => (
  <svg
  className={className}
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  {/* Blue circular background */}
  <circle cx="50" cy="50" r="45" fill="#4299E1" />

  {/* Receipt shape */}
  <rect x="35" y="30" width="30" height="40" rx="3" fill="#F6E05E" />
  <path
    d="M35 40H65M35 48H65M35 56H50"
    stroke="#4299E1"
    strokeWidth="3"
    strokeLinecap="round"
  />

  {/* Green currency symbol */}
  <text
    x="50"
    y="70"
    textAnchor="middle"
    fill="#48BB78"
    fontSize="16"
    fontWeight="bold"
    fontFamily="Arial"
  >
    ₹
  </text>
</svg>
);

export default function VerticalNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state) => state.user.userData);
  const {isCollapsed} = useSelector(state=>state.loader);

  const isActive = (itemPath) => {
    if (itemPath === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(itemPath);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${Backend_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Clear user data from Redux store
        dispatch(clearUserData());
        // Show success toast
        toast({
          title: "Logged out successfully",
          variant: "success",
        });
        // Redirect to login page
        navigate("/");
      } else {
        // Show error toast
        toast({
          title: "Logout failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen  border-r transition-all duration-300 fixed top-0 left-0 z-10",
        isCollapsed ? "w-16" : "w-48"
      )}
    >
      {/* Top section */}
      <div className="flex items-center p-4 border-b-[1px] border-b-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch(setIsCollapsed(!isCollapsed))}
        >
          <Menu className="h-4 w-4" />
        </Button>
        {!isCollapsed && (
          <div className="flex items-center">
            <ColorfulLogo className="h-6 w-6" />
            <span className="ml-1 text-lg text-gray-800 font-medium">
              The Billing
            </span>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <ScrollArea className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start rounded-[6px]",
                        isActive(item.path)
                          ? "bg-blue-300 text-blue-900"
                          : "text-gray-600 hover:bg-blue-100 hover:text-blue-900",
                        isCollapsed ? "px-2" : "px-4"
                      )}
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon
                        className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p className="font-semibold">{item.name}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </ScrollArea>

      {/* Profile section */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-start"
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <span className="text-sm capitalize">{user?.name}</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                navigate(`/staff/${user?._id}`, { state: { staffData: user } })
              }
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
