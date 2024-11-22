import "./App.css";
import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStaffMembers } from './redux/slices/staffSlice';
import Home from './pages/Home';
import VerticalNav from './components/custom/Navigations/VerticalNav';
import Dashboard from './pages/Dashboard';
import Staffs from './pages/Staffs';
import Settings from './pages/Settings';
import StaffProfile from './pages/StaffProfile';
import AddStaff from './pages/AddStaff';
import { fetchUserData } from "./redux/slices/userSlice";
import { fetchHospitalInfo } from "./redux/slices/HospitalSlice";
import { setLoading } from './redux/slices/loaderSlice';
import HospitalInfo from './pages/HospitalInfo';
import AboutPage from './pages/About';
import ContactPage from './pages/ContactUs';
import Expenses from './pages/Expenses';
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase";
import ItemsMaster from "./pages/ItemsMaster";
import Parties from "./pages/Parties";
import CreateParty from "./pages/CreateParty";
import CreateSellInvoice from "./pages/CreateSellInvoice";
import ViewSalesBill from "./pages/ViewSalesBill";
import CreatePurchaseInvoice from "./pages/CreatePurchaseInvoice";
import ViewPurchaseBill from "./pages/ViewPurchaseBill";
import ItemDetails from "./pages/ItemDetails";
import PartyDetails from "./pages/PartyDetails";
import PaymentOut from "./pages/PaymentOut";
import CreatePaymentOut from "./pages/CreatePaymentOut";
import PaymentDetails from "./pages/PaymentDetails";
import PaymentIn from "./pages/PaymentIn";
import CreatePaymentIn from "./pages/createPaymentIn";
import PaymentDetailsIn from "./pages/PaymentDetailsIn";

const AppContent = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loader.isLoading);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    dispatch(setLoading(true));
    dispatch(fetchUserData())
      .then(() => {
        if (isAuthenticated) {
          return Promise.all([
            dispatch(fetchStaffMembers()),
            dispatch(fetchHospitalInfo())
          ]);
        }
      })
      .finally(() => {
        dispatch(setLoading(false));
        setIsInitializing(false);
      });
  }, [dispatch,isAuthenticated]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-8 border-blue-200"></div>
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-t-8 border-blue-500 animate-spin"></div>
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-8 border-transparent animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex relative">
      {isLoading && <div className="youtube-loader"></div>}
      {isAuthenticated && (
        <VerticalNav isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}
      <main
        className={`${
          isAuthenticated ? (isCollapsed ? "md:ml-16" : "md:ml-56") : ""
        } flex-1 px-0 sm:px-4 w-full h-screen overflow-y-auto bg-gray-50 transition-all duration-300`}
      >
        <Routes>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {isAuthenticated && (
            <>
              <Route path="/staff" element={<Staffs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/staff/:staffId" element={<StaffProfile />} />
              <Route path="/addstaff" element={<AddStaff />} />
              <Route path="/editstaff/:staffId" element={<AddStaff />} />
              <Route path="/settings/hospital-info" element={<HospitalInfo />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/items-master" element={<ItemsMaster />} />
              <Route path="/parties" element={<Parties />} />
              <Route path="/parties/create-party" element={<CreateParty />} />
              <Route path="/sales/create-sell-invoice" element={<CreateSellInvoice />} />
              <Route path="/sales/:billId" element={<ViewSalesBill />} />
              <Route path="/purchase/create-purchase-invoice" element={<CreatePurchaseInvoice />} />
              <Route path="/purchase/:billId" element={<ViewPurchaseBill />} />
              <Route path="/item-details/:itemId" element={<ItemDetails />} />
              <Route path="/party-details/:partyId" element={<PartyDetails />} />
              <Route path="/purchase/payment-out" element={<PaymentOut />} />
              <Route path="/purchase/payment-out/:paymentId" element={<PaymentDetails />} />
              <Route path="/purchase/create-payment-out" element={<CreatePaymentOut />} />
              <Route path="/sales/payment-in" element={<PaymentIn />} />
              <Route path="/sales/create-payment-in" element={<CreatePaymentIn />} />
              <Route path="/sales/payment-in/:paymentId" element={<PaymentDetailsIn />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
