import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "../components/ui/select";
// import { Textarea } from "../components/ui/textarea";
// import { Checkbox } from "../components/ui/checkbox";
// import { Plus, X } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createStaffMember,
  updateStaffMember,
} from "../redux/slices/staffSlice";
import { useNavigate, useLocation, useParams } from "react-router-dom";

export default function AddStaff() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { staffId } = useParams();
  const { status, error } = useSelector((state) => state.staff);
  // Departments might not be needed anymore
  // const departments = useSelector((state) => state.departments?.departments);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    mobileNumber: "",
    role: "user", // Added role with default
  }); // Added mobileNumber
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (location.state?.editMode && location.state?.staffData) {
      setEditMode(true);
      // Only set fields that exist in the minimal model
      const { name, username, email, _id, mobileNumber, role } =
        location.state.staffData;
      setFormData({
        name,
        username,
        email,
        _id,
        mobileNumber,
        role: role || "user",
      }); // Added mobileNumber and role
    } else if (staffId) {
      // Fetch staff data by ID if needed - adapt to fetch only minimal fields
      // dispatch(fetchStaffById(staffId)).then(data => {
      //   const { name, username, email, _id, mobileNumber, role } = data; // Assuming data contains these fields
      //   setFormData({ name, username, email, _id, mobileNumber, role }); // Added mobileNumber and role
      // });
      setEditMode(true);
    }
  }, [location, staffId /*, dispatch */]); // dispatch removed if fetchStaffById isn't used here

  const [errors, setErrors] = useState({});
  // newQualification and newCertification states are no longer needed
  // const [newQualification, setNewQualification] = useState("");
  // const [newCertification, setNewCertification] = useState("");

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // Simplified logic, assuming no nested fields anymore
    setFormData({ ...formData, [id]: value });
  };

  const handleSelectChange = (id, value) => {
    if (id === "role") {
      setFormData({ ...formData, role: value || "user" });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  // handleCheckboxChange for roles is no longer needed
  // const handleCheckboxChange = (id, checked) => { ... };

  // handleDepartmentChange is no longer needed
  // const handleDepartmentChange = (department, checked) => { ... };

  // Qualification and Certification functions are no longer needed
  // const addQualification = () => { ... };
  // const removeQualification = (index) => { ... };
  // const addCertification = () => { ... };
  // const removeCertification = (index) => { ... };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.email) newErrors.email = "Email is required";
    // Basic mobile number validation (e.g., not empty, or more complex regex)
    if (!formData.mobileNumber)
      newErrors.mobileNumber = "Mobile number is required";
    // else if (!/^\d{10}$/.test(formData.mobileNumber)) newErrors.mobileNumber = "Mobile number must be 10 digits"; // Example regex
    if (!formData.role) newErrors.role = "Role is required.";

    if (!editMode && !formData.password)
      newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const minimalData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          mobileNumber: formData.mobileNumber, // Added mobileNumber
          role: formData.role, // Added role
        };
        if (formData.password) {
          minimalData.password = formData.password;
        }

        if (editMode) {
          await dispatch(
            updateStaffMember({ id: formData._id, data: minimalData })
          ).unwrap();
          toast({
            variant: "success",
            title: "Staff Updated",
            description: "Staff member has been updated successfully.",
          });
        } else {
          await dispatch(createStaffMember(minimalData)).unwrap();
          toast({
            variant: "success",
            title: "Staff Added",
            description: "Staff member has been added successfully.",
          });
        }
        navigate("/staff"); // Or a more relevant page
      } catch (err) {
        // Changed error variable name
        toast({
          title: "Error",
          description:
            err.message ||
            err ||
            `Failed to ${
              editMode ? "update" : "add"
            } staff member. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      mobileNumber: "",
      role: "user", // Added role
    }); // Added mobileNumber
    setErrors({});
  };

  return (
    <div className="max-w-[800px] mx-auto p-4">
      {" "}
      {/* Adjusted max-width */}
      <h2 className="text-xl font-bold mb-0">
        {editMode ? "Edit" : "Add New"} Staff Member
      </h2>
      <p className="text-gray-600 mb-4">
        Fill in the details of the {editMode ? "existing" : "new"} staff member
      </p>
      <form onSubmit={handleSubmit}>
        {/* Simplified grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name || ""}
              onChange={handleInputChange}
              className="font-semibold"
            />
            {errors.name && (
              <span className="text-red-500 text-sm">{errors.name}</span>
            )}
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="johndoe"
              value={formData.username || ""}
              onChange={handleInputChange}
              disabled={editMode && formData.username}
              className="font-semibold"
            />
            {errors.username && (
              <span className="text-red-500 text-sm">{errors.username}</span>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email || ""}
              onChange={handleInputChange}
              className="font-semibold"
            />
            {errors.email && (
              <span className="text-red-500 text-sm">{errors.email}</span>
            )}
          </div>
          <div>
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel" // Use type="tel" for mobile numbers
              placeholder="e.g., 9876543210"
              value={formData.mobileNumber || ""}
              onChange={handleInputChange}
              className="font-semibold"
            />
            {errors.mobileNumber && (
              <span className="text-red-500 text-sm">
                {errors.mobileNumber}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              onValueChange={(value) => handleSelectChange("role", value)}
              value={formData.role}
            >
              <SelectTrigger className="font-semibold">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <span className="text-red-500 text-sm">{errors.role}</span>
            )}
          </div>
          {/* Password field: always show, but only required for new or if changing */}
          <div>
            <Label htmlFor="password">
              {editMode ? "New Password (optional)" : "Password"}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={formData.password || ""}
              onChange={handleInputChange}
              className="font-semibold"
            />
            {errors.password && (
              <span className="text-red-500 text-sm">{errors.password}</span>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          {" "}
          {/* Increased margin-top */}
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editMode ? "Updating..." : "Adding..."}
              </>
            ) : editMode ? (
              "Update Staff"
            ) : (
              "Add Staff"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
