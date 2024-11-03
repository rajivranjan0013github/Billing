import React, { useState } from "react";
import { ChevronDown, LogOut, Bell, Menu, Clock, Search } from "lucide-react";
import { Input } from "../../ui/input";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { ColorfulLogo } from "./VerticalNav";
import { clearUserData } from "../../../redux/slices/userSlice";
import { Backend_URL } from "../../../assets/Data";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { Separator } from "../../ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../ui/sheet";

const HorizontalNav = ({ isCollapsed, setIsCollapsed, navItems }) => {
  const user = useSelector((state) => state.user.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);  // Close the drawer after navigation
  };

  // Sample notifications array (empty for now)
  const notifications = [];

  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 bg-white z-50 sticky top-0">
      <div className="flex items-center">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 sm:mr-3 md:hidden"
            >
              <Menu className="h-5 w-5 sm:h-10 sm:w-10" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[250px] pt-6 px-4">
            <div className="flex items-center mb-4">
              <ColorfulLogo className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-800">The Hospital</span>
            </div>
            <Separator className="mb-4" />
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={`justify-start ${location.pathname === item.path ? 'bg-blue-100 text-blue-900' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mr-2 sm:mr-3 hidden md:flex"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="hidden sm:flex items-center">
          <ColorfulLogo className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="ml-2 text-base sm:text-lg font-bold text-gray-800">The Hospital</span>
        </div>
      </div>
      <div className="flex-grow" />
      <div className="flex items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative hidden sm:inline-flex">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mt-2" side="bottom" align="end">
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Notifications</h3>
              <Separator className="my-2" />
              {notifications.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {notifications.map((notification, index) => (
                      <NotificationItem
                        key={index}
                        title={notification.title}
                        description={notification.description}
                        time={notification.time}
                      />
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <Button variant="ghost" className="w-full justify-center mt-2">
                    View All Notifications
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications at the moment</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2 sm:ml-3 flex items-center justify-end ">
              <Avatar className="h-6 w-6 ring-2 ring-primary ring-offset-2 md:ring-0 md:ring-offset-0">
                <AvatarFallback>{(user?.name?.charAt(0))?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm capitalize ml-2 hidden lg:inline">{user?.name}</span>
              <ChevronDown className="ml-1 h-3 w-3 hidden lg:inline" />
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
    </header>
  );
};

const NotificationItem = ({ title, description, time }) => (
  <div className="flex items-start space-x-2">
    <Bell className="h-5 w-5 text-blue-500 mt-1" />
    <div className="flex-1">
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
      <div className="flex items-center mt-1 text-xs text-gray-400">
        <Clock className="h-3 w-3 mr-1" />
        <span>{time}</span>
      </div>
    </div>
  </div>
);

export default HorizontalNav;
