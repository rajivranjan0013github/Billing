import React, { useEffect, useRef, useState } from 'react';
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { CardContent, Card } from "../components/ui/card"
import { Link } from "react-router-dom"
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, LogIn } from "lucide-react"
import { ColorfulLogo } from "../components/custom/Navigations/VerticalNav";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/ui/sheet";
import { Menu } from "lucide-react";

export default function ContactPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const contactFormRef = useRef(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (location.state?.scrollToContact && contactFormRef.current) {
      contactFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  const handleFeaturesClick = (e) => {
    e.preventDefault();
    navigate('/', { state: { scrollToFeatures: true } });
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
            <span className="ml-2 text-lg sm:text-xl md:text-2xl font-bold text-gray-900">The Hospital</span>
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
        <section className="w-full py-6 sm:py-8 md:py-12 bg-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-4 text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">Contact Us</h1>
              <p className="max-w-[600px] text-gray-500 text-sm sm:text-base md:text-lg">
                We're here to help. Get in touch with us for any inquiries or support.
              </p>
            </div>
          </div>
        </section>
        <section className="w-full py-6 sm:py-8 md:py-12">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:gap-12 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter">Contact Information</h2>
                <Card className="w-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                        <span className="text-sm sm:text-base">+91 9097849090</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                        <span className="text-sm sm:text-base">support@thehospital.com</span>
                      </div>
                      <div className="flex items-start space-x-4">
                        <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <span className="text-sm sm:text-base">Thousand Ways Private Limited<br />
                            Dariyapur, Bodh Gaya,<br />
                            Bihar 824237, India</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold">Follow Us</h3>
                  <div className="flex space-x-4">
                    <Link href="#" className="text-gray-500 hover:text-blue-600">
                      <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="sr-only">Facebook</span>
                    </Link>
                    <Link href="#" className="text-gray-500 hover:text-blue-600">
                      <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="sr-only">Twitter</span>
                    </Link>
                    <Link href="#" className="text-gray-500 hover:text-blue-600">
                      <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="sr-only">LinkedIn</span>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="space-y-4" ref={contactFormRef}>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter">Contact Us</h2>
                <p className="text-gray-500 text-sm sm:text-base">
                  We appreciate your interest. Please complete the form below, and a member of our team will respond promptly.
                </p>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Contact Number
                    </label>
                    <Input
                      id="mobile"
                      placeholder="Enter your contact number"
                      required
                      type="tel"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Inquiry
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Please provide details about your inquiry"
                      required
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    Submit Inquiry
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col sm:flex-row justify-between items-center py-6 px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-gray-500 mb-2 sm:mb-0">© 2024 The Hospital. All rights reserved.</p>
        <nav className="flex gap-4">
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
