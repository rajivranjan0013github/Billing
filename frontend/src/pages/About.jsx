import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  Lightbulb,
  Target,
  Mail,
  Pill,
  TestTube,
  UserCog,
  BarChart,
  Stethoscope,
  HeartPulse,
  LogIn,
  FileText,
  CreditCard,
  TrendingUp,
  Clock,
  Shield,
  Menu,
} from "lucide-react";
import { ColorfulLogo } from "../components/custom/Navigations/VerticalNav";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { useState } from "react";

export default function AboutPage() {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleFeaturesClick = (e) => {
    e.preventDefault();
    navigate("/", { state: { scrollToFeatures: true } });
  };

  const handleContactClick = () => {
    navigate("/contact", { state: { scrollToContact: true } });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleNavLinkClick = (e, action) => {
    e.preventDefault();
    closeDrawer();
    if (action === "scrollToFeatures") {
      setTimeout(() => {
        navigate("/", { state: { scrollToFeatures: true } });
      }, 300); // 300ms delay, adjust if needed
    }
  };

  const scrollToLoginForm = () => {
    navigate("/", { state: { scrollToLogin: true } });
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
                  onClick={(e) => handleNavLinkClick(e, "scrollToFeatures")}
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
              PharmaBill Pro
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
            onClick={handleFeaturesClick}
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
        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                  About PharmaBill Pro
                </h1>
                <p className="max-w-[900px] text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">
                  Streamlining pharmacy operations with intelligent billing and
                  inventory management solutions.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-100">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
              Complete Pharmacy Management Solution
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <Pill className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Prescription Management
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Efficiently process prescriptions and manage patient
                  medication records with ease.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Insurance Processing
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Seamlessly handle insurance claims and verify coverage in
                  real-time.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <TestTube className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Inventory Control
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Track medication stock levels and automate reordering
                  processes.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-blue-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8">
              Our Impact on Businesses
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Time Savings</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Pharmacies save up to 75% of time spent on billing and
                  prescription processing.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Increased Accuracy
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Reduce medication errors by 99% with our automated
                  verification system.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  HIPAA Compliant
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Ensure patient data protection with our secure, compliant
                  platform.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-100">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
              Our Core Values
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Patient-First Approach
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  We prioritize patient care by streamlining medication
                  dispensing and billing processes.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Lightbulb className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Healthcare Integration
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Seamlessly connect with healthcare providers and insurance
                  networks.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <HeartPulse className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">
                  Quality Assurance
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Maintain the highest standards in pharmaceutical care and
                  service delivery.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
              Why Choose Our Solution
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">
                  Drug Database Integration
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Access comprehensive drug information, interactions, and
                  pricing data in real-time.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">
                  Scalable Solution
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Perfect for independent pharmacies and large pharmacy chains
                  alike.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">
                  Customizable Workflows
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Adapt the system to your pharmacy's specific needs and
                  processes.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">Expert Support</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Get dedicated support from pharmacy technology specialists
                  24/7.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                  Our Team
                </h2>
                <p className="max-w-[900px] text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">
                  Behind PharmaBill Pro is a dedicated team of pharmacists,
                  healthcare technologists, and industry experts committed to
                  revolutionizing pharmacy management.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Button
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleContactClick}
                >
                  <Mail className="mr-2 h-4 w-4" /> Contact Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-4 sm:py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500">
          © 2024 PharmaBill Pro. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
