import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { CardContent, Card } from "../components/ui/card";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, BarChart, Pill, Loader2, Eye, EyeOff, Menu, LogIn } from "lucide-react";
import { ColorfulLogo } from "../components/custom/Navigations/VerticalNav";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserData, loginUser } from "../redux/slices/userSlice";
import { useToast } from "../hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";

export default function LandingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const featuresRef = useRef(null);
  const [formData, setFormData] = useState({
    hospitalId: "",
    username: "", // Changed from email to username
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const loginStatus = useSelector((state) => state.user.loginStatus);
  const loginError = useSelector((state) => state.user.loginError);
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Add a new ref for the Hospital ID input
  const hospitalIdRef = useRef(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (location.state?.scrollToFeatures && featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  const scrollToFeatures = (e) => {
    e.preventDefault();
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.hospitalId && formData.username && formData.password) {
      setIsLoading(true);
      try {
        await dispatch(loginUser(formData)).unwrap();
        await dispatch(fetchUserData());
        navigate("/");
      } catch (error) {
        console.error("Login error:", error);
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Incomplete form",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
    }
  };

  // Add a new function to handle the "Get Started" button click
  const handleGetStarted = () => {
    if (hospitalIdRef.current) {
      hospitalIdRef.current.focus();
      hospitalIdRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Add a new function to handle the "Learn More" button click
  const handleLearnMore = () => {
    navigate('/about');
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleNavLinkClick = (e, action) => {
    closeDrawer();
    if (action === 'scrollToFeatures') {
      scrollToFeatures(e);
    }
  };

  const scrollToLoginForm = () => {
    if (hospitalIdRef.current) {
      hospitalIdRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="px-2 lg:px-6 h-16 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-0">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              {/* <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navigation options</SheetDescription>
              </SheetHeader> */}
              <nav className="flex flex-col gap-4 mt-4">
                <Link
                  className="text-sm font-medium hover:underline underline-offset-4"
                  to="/"
                  onClick={closeDrawer}
                >
                  Home
                </Link>
                <a
                  href="#features"
                  className="text-sm font-medium hover:underline underline-offset-4 cursor-pointer"
                  onClick={(e) => handleNavLinkClick(e, 'scrollToFeatures')}
                >
                  Features
                </a>
                <Link
                  className="text-sm font-medium hover:underline underline-offset-4"
                  to="/about"
                  onClick={closeDrawer}
                >
                  About
                </Link>
                <Link
                  className="text-sm font-medium hover:underline underline-offset-4"
                  to="/contact"
                  onClick={closeDrawer}
                >
                  Contact
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center justify-center" to="/">
            <ColorfulLogo className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            <span className="ml-2 text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              The Hospital
            </span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-4">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            to="/"
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4 cursor-pointer"
            onClick={scrollToFeatures}
          >
            Features
          </a>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            to="/about"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            to="/contact"
          >
            Contact
          </Link>
        </nav>
        <Button 
          variant="outline" 
          size="sm" 
          className="md:hidden mr-2"
          onClick={scrollToLoginForm}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Login
        </Button>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Streamline Your Hospital Management
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl">
                    The Hospital provides a comprehensive solution for efficient
                    hospital administration, patient care, and resource
                    management.
                  </p>
                </div>
                <div className="hidden md:flex lg:flex flex-col gap-2 min-[400px]:flex-row">
                  <Button 
                    className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 sm:px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:opacity-50"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                  <Button
                    className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 sm:px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                    variant="outline"
                    onClick={handleLearnMore}
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              <Card className="w-full max-w-sm mx-auto lg:mx-0">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-center">Login</h2>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor="hospitalId"
                      >
                        Hospital ID
                      </label>
                      <Input
                        className="w-full flex h-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        id="hospitalId"
                        placeholder="Enter your hospital ID"
                        type="text"
                        required
                        value={formData.hospitalId}
                        onChange={handleInputChange}
                        ref={hospitalIdRef}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor="username"
                      >
                        User ID
                      </label>
                      <Input
                        className="w-full flex h-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        id="username"
                        placeholder="Enter your user ID"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          className="w-full flex h-10 rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                          id="password"
                          placeholder="********"
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                    {loginStatus === "failed" && (
                      <p className="text-red-500 text-sm">{loginError}</p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section
          id="features"
          ref={featuresRef}
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
              Key Features
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-blue-600" />
                <h3 className="text-xl font-bold">Secure Patient Records</h3>
                <p className="text-gray-500">
                  Maintain confidential patient information with our
                  state-of-the-art security measures.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Users className="h-12 w-12 text-blue-600" />
                <h3 className="text-xl font-bold">Staff Management</h3>
                <p className="text-gray-500">
                  Efficiently manage schedules, assignments, and performance of
                  your medical staff.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Pill className="h-12 w-12 text-blue-600" />
                <h3 className="text-xl font-bold">Pharmacy Management</h3>
                <p className="text-gray-500">
                  Streamline medication dispensing, inventory control, and
                  prescription tracking.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <BarChart className="h-12 w-12 text-blue-600" />
                <h3 className="text-xl font-bold">Analytics Dashboard</h3>
                <p className="text-gray-500">
                  Gain insights into hospital operations with comprehensive
                  analytics and reporting.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col sm:flex-row justify-between items-center py-6 px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500 mb-2 sm:mb-0">© 2024 TheHospital. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link
            className="text-xs hover:underline underline-offset-4"
            // to="/terms"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4"
            // to="/privacy"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
