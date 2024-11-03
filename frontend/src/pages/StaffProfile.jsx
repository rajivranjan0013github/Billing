import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Clock,
  Award,
  BookOpen,
  FileText,
  DollarSign,
  Building,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function StaffProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const staffMember = location.state?.staffData || {};

  return (
    <div className="space-y-2 px-4 ">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Staff Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader></CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src="/placeholder.svg?height=64&width=64"
                  alt={staffMember.name}
                />
                <AvatarFallback>
                  {staffMember.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">
                  {staffMember.name}
                </h2>
                <p className="text-gray-500">{staffMember.roles?.join(", ")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{staffMember.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{staffMember.username}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-gray-500" />
                <span>{staffMember.department?.join(", ")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Joined on {staffMember.hireDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Shift Type:</span>
              <span>{staffMember.shift?.type}</span>
            </div>
            <div className="flex align-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="font-semibold">Time In:</span>
                <span>{staffMember.shift?.hours.start}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-red-500" />
                <span className="font-semibold">Time Out:</span>
                <span>{staffMember.shift?.hours.end}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Employee Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Employee ID:</span>
              <span>{staffMember.employeeID}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Experience:</span>
              <span>{staffMember.yearsOfExperience} years</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-2 flex flex-wrap">
            <TabsTrigger value="personal" className="flex-grow">
              <span className="hidden sm:inline">Personal Info</span>
              <span className="sm:hidden">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="flex-grow">
              <span className="hidden sm:inline">Payroll Info</span>
              <span className="sm:hidden">Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex-grow">
              <span className="hidden sm:inline">Education & Certifications</span>
              <span className="sm:hidden">Education</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Date of Birth:</span>
                    <span>{staffMember.dateOfBirth}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Gender:</span>
                    <span>{staffMember.gender}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Building className="h-4 w-4 text-gray-500 mt-1" />
                    <span className="font-semibold">Address:</span>
                    <span>{staffMember.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Salary:</span>
                    <span>₹{staffMember.salary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Bank Name:</span>
                    <span>{staffMember.payrollInfo?.bankName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Account Number:</span>
                    <span>{staffMember.payrollInfo?.accountNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">IFSC Code:</span>
                    <span>{staffMember.payrollInfo?.ifscCode}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Education & Certifications</CardTitle>
                <CardDescription>
                  Academic background and professional certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Qualifications</h3>
                    {staffMember.qualifications?.length > 0 ? (
                      <ul className="space-y-2">
                        {staffMember.qualifications.map((qual, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <BookOpen className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <p className="font-medium">{qual}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No qualification information available.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Certifications
                    </h3>
                    {staffMember.certifications?.length > 0 ? (
                      <ul className="space-y-2">
                        {staffMember.certifications.map((cert, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Award className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium">{cert}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No certification information available.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
