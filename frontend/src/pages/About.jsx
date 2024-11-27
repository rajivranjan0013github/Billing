import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"
import { Users, Lightbulb, Target, Mail, Pill, TestTube, UserCog, BarChart, Stethoscope, HeartPulse, LogIn, FileText, CreditCard, TrendingUp, Clock, Shield } from "lucide-react"
import { ColorfulLogo } from "../components/custom/Navigations/VerticalNav";
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function AboutPage() {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleFeaturesClick = (e) => {
    e.preventDefault();
    navigate('/', { state: { scrollToFeatures: true } });
  };

  const handleContactClick = () => {
    navigate('/contact', { state: { scrollToContact: true } });
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleNavLinkClick = (e, action) => {
    e.preventDefault();
    closeDrawer();
    if (action === 'scrollToFeatures') {
      setTimeout(() => {
        navigate('/', { state: { scrollToFeatures: true } });
      }, 300); // 300ms delay, adjust if needed
    }
  };

  const scrollToLoginForm = () => {
    navigate('/', { state: { scrollToLogin: true } });
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
              InvoicePro
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
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">About InvoicePro</h1>
                <p className="max-w-[900px] text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">
                  Empowering businesses with smart billing and invoice management solutions.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-100">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">Comprehensive Billing Management Solution</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Invoice Generation</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Create professional invoices instantly with customizable templates and automated calculations.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Payment Processing</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Accept multiple payment methods and track transactions effortlessly.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <BarChart className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Financial Reports</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Generate detailed reports and gain insights into your business performance.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-blue-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8">Our Impact on Businesses</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Time Savings</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Businesses save up to 70% of time spent on billing and invoice management.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Increased Efficiency</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Our users report 40% improvement in payment collection and cash flow.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Secure Transactions</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Enterprise-grade security ensuring safe payment processing and data protection.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-100">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">Our Core Values</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Patient-Centric Approach</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  We prioritize the needs of patients and healthcare providers in every feature we develop.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Lightbulb className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Innovation</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  We continuously push the boundaries of technology to bring cutting-edge solutions to healthcare management.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <Target className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-bold">Excellence</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  We strive for excellence in every aspect of our software, from functionality to user experience.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">Why Choose Our Solution</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">Interoperability</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Our software seamlessly integrates with existing healthcare systems and devices, ensuring smooth data flow and compatibility.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">Scalability</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Whether you're a small clinic or a large hospital network, our solution grows with your needs.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">Customization</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Tailor the software to your specific workflows and requirements with our flexible configuration options.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-bold">24/7 Support</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Our dedicated support team is always available to ensure your operations run smoothly around the clock.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">Our Team</h2>
                <p className="max-w-[900px] text-sm sm:text-base md:text-lg lg:text-xl text-gray-500">
                  Behind The Hospital is a dedicated team of healthcare professionals, software engineers, and industry
                  experts committed to revolutionizing hospital management.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={handleContactClick}>
                  <Mail className="mr-2 h-4 w-4" /> Contact Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-4 sm:py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500">© 2024 InvoicePro. All rights reserved.</p>
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
  )
}
