import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  AlertCircle, // Add this import
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useSelector } from "react-redux";
import { Plus, Eye, Edit } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { ScrollArea } from "../components/ui/scroll-area";
// Sample staff data

export default function Reports() {
  const navigate = useNavigate();
  const { staffMembers } = useSelector((state) => state.staff);
  const staffToDisplay = staffMembers;

  const handleStaffClick = (staff) => {
    navigate(`/staff/${staff._id}`, { state: { staffData: staff } });
  };

  const handleEditStaff = (staff) => {
    navigate("/addstaff", { state: { editMode: true, staffData: staff } });
  };

  const handleViewStaff = (staff) => {
    navigate(`/staff/${staff._id}`, { state: { staffData: staff } });
  };

  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  return (
    <div className="w-full mx-auto p-0">
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Staff List</CardTitle>
            <CardDescription>Manage and view staff information</CardDescription>
          </div>
          {isSmallScreen && (
            <Button size="icon" onClick={() => navigate("/addstaff")}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center mb-4">
            {!isSmallScreen && (
              <div className="flex justify-end w-full">
                <Button variant="outline" onClick={() => navigate("/addstaff")}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Staff
                </Button>
              </div>
            )}
          </div>
          {staffToDisplay.length > 0 ? (
            isSmallScreen ? (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-4">
                  {staffToDisplay.map((staff) => (
                    <Card key={staff._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center space-x-4 cursor-pointer"
                          onClick={() => handleViewStaff(staff)}
                        >
                          <Avatar>
                            <AvatarFallback>
                              {staff.name
                                .split(" ")
                                .filter(
                                  (n, i, arr) => i === 0 || i === arr.length - 1
                                )
                                .map((n) => n[0].toUpperCase())
                                ?.join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold hover:underline">
                              {staff.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {staff.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStaff(staff)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(staff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Name</TableHead>
                      <TableHead className="w-[35%]">Role</TableHead>
                      <TableHead className="w-[15%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffToDisplay.map((staff) => (
                      <TableRow key={staff._id}>
                        <TableCell className="font-medium">
                          <div
                            className="flex items-center space-x-2 cursor-pointer hover:underline"
                            onClick={() => handleViewStaff(staff)}
                          >
                            <Avatar className="hidden md:block">
                              <AvatarFallback>
                                {staff.name
                                  .split(" ")
                                  .filter(
                                    (n, i, arr) =>
                                      i === 0 || i === arr.length - 1
                                  )
                                  .map((n) => n[0].toUpperCase())
                                  ?.join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="capitalize">{staff.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold uppercase">
                          {staff.role}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStaff(staff)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStaff(staff)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No staff members found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add new staff members to see them listed here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
