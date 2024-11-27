import React, { useState, useRef, useEffect } from "react";
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
  ChevronRight,
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
import { Backend_URL } from "../../../assets/Data";
import { useToast } from "../../../hooks/use-toast";

export const navItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Parties", icon: Users, path: "/parties" },
  { name: "Expenses", icon: IndianRupee, path: "/expenses" },
  { name: "Sales", icon: ShoppingCart, path: "/sales",
    submenu: [
      { name: "Sales List", path: "/sales" },
      { name: "Sales Return", path: "/sales/return" },
      { name: "Payment In", path: "/sales/payment-in" },
    ],
   },
  {
    name: "Purchase",
    icon: Truck,
    path: "/purchase",
    submenu: [
      { name: "Purchase List", path: "/purchase" },
      { name: "Purchase Return", path: "/purchase/return" },
      { name: "Payment Out", path: "/purchase/payment-out" },
    ],
  },
  { name: "Stocks", icon: Package, path: "/items-master" },
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
    <circle cx="50" cy="50" r="45" fill="#4299E1" /> {/* Blue background */}
    <path
      d="M30 50H70"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
    />{" "}
    {/* White horizontal line */}
    <path
      d="M50 30V70"
      stroke="#48BB78"
      strokeWidth="8"
      strokeLinecap="round"
    />{" "}
    {/* Green vertical line */}
    <circle cx="50" cy="50" r="15" fill="#F6E05E" />{" "}
    {/* Yellow center circle */}
    <path
      d="M50 42V58M42 50H58"
      stroke="#4299E1"
      strokeWidth="4"
      strokeLinecap="round"
    />{" "}
    {/* Blue cross in yellow circle */}
  </svg>
);

export default function VerticalNav({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const user = useSelector((state) => state.user.userData);
  const [expandedItems, setExpandedItems] = useState([]);

  const isActive = (itemPath, submenuPaths = []) => {
    if (itemPath === "/") {
      return location.pathname === "/";
    }
    
    // If this is a parent menu with submenu
    if (submenuPaths.length > 0) {
      return submenuPaths.some(subPath => location.pathname.startsWith(subPath));
    }
    
    // For regular menu items and submenu items
    return location.pathname === itemPath;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${Backend_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear user data from Redux store
        dispatch(clearUserData());
        // Show success toast
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
          variant: "success",
        });
        // Redirect to login page
        navigate('/');
      } else {
        // Show error toast
        toast({
          title: "Logout failed",
          description: "There was an error logging out. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSubmenu = (itemName) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r transition-all duration-300 fixed top-0 left-0 z-10",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      {/* Top section */}
      <div className="flex items-center p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mr-2"
        >
          <Menu className="h-4 w-4" />
        </Button>
        {!isCollapsed && (
          <div className="flex items-center">
            <ColorfulLogo className="h-6 w-6" />
            <span className="ml-2 text-lg font-bold text-gray-800">The Invoice</span>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <ScrollArea className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        isActive(
                          item.path,
                          item.submenu?.map(sub => sub.path) || []
                        )
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-900",
                        isCollapsed ? "px-2" : "px-4"
                      )}
                      onClick={() => {
                        if (item.submenu) {
                          toggleSubmenu(item.name);
                        } else {
                          navigate(item.path);
                        }
                      }}
                    >
                      <item.icon
                        className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")}
                      />
                      {!isCollapsed && (
                        <>
                          <span>{item.name}</span>
                          {item.submenu && (
                            <ChevronRight
                              className={cn(
                                "ml-auto h-4 w-4 transition-transform",
                                expandedItems.includes(item.name) && "rotate-90"
                              )}
                            />
                          )}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p className="font-semibold">{item.name}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              {/* Submenu items - Updated with animation */}
              {!isCollapsed && item.submenu && (
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    expandedItems.includes(item.name) ? "max-h-[500px]" : "max-h-0"
                  )}
                >
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <li key={subItem.name}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start pl-7",
                            isActive(subItem.path)
                              ? "bg-blue-100 text-blue-900"
                              : "text-gray-600 hover:bg-blue-50 hover:text-blue-900"
                          )}
                          onClick={() => navigate(subItem.path)}
                        >
                          <span>{subItem.name}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>

      {/* Profile section */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full flex items-center justify-start">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>{(user?.name?.charAt(0))?.toUpperCase()}</AvatarFallback>
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
            <DropdownMenuItem onSelect={() => navigate(`/staff/${user?._id}`, { state: { staffData: user } })}>Profile</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/settings")}>Settings</DropdownMenuItem>
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
