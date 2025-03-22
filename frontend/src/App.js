import "./App.css";
import React, { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffMembers } from "./redux/slices/staffSlice";
import Home from "./pages/Home";
import VerticalNav from "./components/custom/Navigations/VerticalNav";
import Dashboard from "./pages/Dashboard";
import Staffs from "./pages/Staffs";
import Settings from "./pages/Settings";
import StaffProfile from "./pages/StaffProfile";
import AddStaff from "./pages/AddStaff";
import { fetchUserData } from "./redux/slices/userSlice";
import { fetchHospitalInfo } from "./redux/slices/HospitalSlice";
import { setLoading } from "./redux/slices/loaderSlice";
import HospitalInfo from "./pages/HospitalInfo";
import AboutPage from "./pages/About";
import ContactPage from "./pages/ContactUs";
import Expenses from "./pages/Expenses";
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase";
import PurchaseReturnList from "./pages/PurchaseReturnList";
import Distributors from "./pages/Distributors";
import CreateSellInvoice from "./pages/CreateSellInvoice";
import CreatePurchaseInvoice from "./pages/CreatePurchaseInvoice";
import EditPurchaseInvoice from "./pages/EditPurchaseInvoice";
import EditSaleInvoice from "./pages/EditSaleInvoice";
import DistributorDetails from "./pages/DistributorDetails";
import PaymentOut from "./pages/PaymentOut";
import CreatePaymentOut from "./pages/CreatePaymentOut";
import PaymentDetails from "./pages/PaymentDetails";
import PaymentIn from "./pages/PaymentIn";
import CreatePaymentIn from "./pages/createPaymentIn";
import PaymentDetailsIn from "./pages/PaymentDetailsIn";
import SalesReturn from "./pages/SalesReturn";
import CreatePurchaseReturn from "./pages/CreatePurchaseReturn";
import Inventory from "./pages/Inventory";
import SalesInvoicePrint from "./pages/SalesInvoicePrint";
import AccountDetails from "./pages/AccountDetails";
import SalesReturnList from "./pages/SalesReturnList";
import Customers from "./pages/Customers";
import ScrollRestoration from "./utils/ScrollRestoration";
import EditPurchaseReturn from "./pages/EditPurchaseReturn";
import CustomerDetails from "./pages/CustomerDetails";
import Payments from "./pages/Payments";
import QuickMenu from "./pages/QuickMenu";

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
            dispatch(fetchHospitalInfo()),
          ]);
        }
      })
      .finally(() => {
        dispatch(setLoading(false));
        setIsInitializing(false);
      });
  }, [dispatch, isAuthenticated]);

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
        <VerticalNav
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      )}
      <main
        className={`${
          isAuthenticated ? (isCollapsed ? "md:ml-16" : "md:ml-56") : ""
        } flex-1 px-0 sm:px-4 w-full h-screen overflow-y-auto transition-all duration-300`}
      >
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <QuickMenu /> : <Home />}
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {isAuthenticated && (
            <>
              <Route path="/staff" element={<Staffs />} />
              <Route path="/accounts" element={<AccountDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/staff/:staffId" element={<StaffProfile />} />
              <Route path="/addstaff" element={<AddStaff />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/editstaff/:staffId" element={<AddStaff />} />
              <Route
                path="/settings/hospital-info"
                element={<HospitalInfo />}
              />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/items-master" element={<Inventory />} />
              <Route path="/distributors" element={<Distributors />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/payments" element={<Payments />} />
              <Route
                path="/customers/:customerId"
                element={<CustomerDetails />}
              />
              <Route
                path="/sales/create-sell-invoice"
                element={<CreateSellInvoice />}
              />
              {/* <Route path="/sales/:billId" element={<ViewSalesBill />} /> */}
              <Route
                path="/purchase/create-purchase-invoice"
                element={<CreatePurchaseInvoice />}
              />
              <Route
                path="/purchase/:invoiceId"
                element={<EditPurchaseInvoice />}
              />
              <Route path="/sale/:invoiceId" element={<EditSaleInvoice />} />
              <Route
                path="/distributor-details/:distributorId"
                element={<DistributorDetails />}
              />
              <Route path="/purchase/payment-out" element={<PaymentOut />} />
              <Route
                path="/purchase/payment-out/:paymentId"
                element={<PaymentDetails />}
              />
              <Route
                path="/purchase/create-payment-out"
                element={<CreatePaymentOut />}
              />
              <Route path="/sales/payment-in" element={<PaymentIn />} />
              <Route
                path="/sales/create-payment-in"
                element={<CreatePaymentIn />}
              />
              <Route
                path="/sales/payment-in/:paymentId"
                element={<PaymentDetailsIn />}
              />
              <Route path="/sales/return" element={<SalesReturn />} />
              <Route path="/sales/return/list" element={<SalesReturnList />} />
              <Route
                path="/purchase/return/create"
                element={<CreatePurchaseReturn />}
              />
              <Route path="/purchase/return" element={<PurchaseReturnList />} />
              <Route
                path="/purchase/return/:returnId"
                element={<EditPurchaseReturn />}
              />
              <Route
                path="/sales/invoice-print"
                element={<SalesInvoicePrint />}
              />
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
        <ScrollRestoration />
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
