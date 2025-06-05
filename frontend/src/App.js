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
import { fetchPharmacyInfo } from "./redux/slices/pharmacySlice";
import { setLoading } from "./redux/slices/loaderSlice";
import PharmacyInfo from "./pages/PharmacyInfo";
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
import CreatePayment from "./pages/CreatePayment";
import PaymentDetails from "./pages/PaymentDetails";
import CreatePurchaseReturn from "./pages/CreatePurchaseReturn";
import Inventory from "./pages/Inventory";
import SalesInvoicePrint from "./pages/SalesInvoicePrint";
import AccountDetails from "./pages/AccountDetails";
import Customers from "./pages/Customers";
import ScrollRestoration from "./utils/ScrollRestoration";
import EditPurchaseReturn from "./pages/EditPurchaseReturn";
import CustomerDetails from "./pages/CustomerDetails";
import Payments from "./pages/Payments";
import QuickMenu from "./pages/QuickMenu";
import Reports from "./pages/Reports";
import PaymentInvoicePrint from "./pages/PaymentInvoicePrint";
import BillingSettings from "./pages/BillingSettings";
import Transactions from "./pages/Transactions";
import ManageGroupsPage from "./pages/ManageGroupsPage";

const AppContent = () => {
  const dispatch = useDispatch();
  const { isLoading, isCollapsed } = useSelector((state) => state.loader);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    dispatch(setLoading(true));
    dispatch(fetchUserData())
      .then(() => {
        if (isAuthenticated) {
          return Promise.all([
            dispatch(fetchStaffMembers()),
            dispatch(fetchPharmacyInfo()),
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
      {isAuthenticated && <VerticalNav />}
      <main
        className={`${
          isAuthenticated ? (isCollapsed ? "md:ml-16" : "md:ml-48") : ""
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
                path="/settings/pharmacy-info"
                element={<PharmacyInfo />}
              />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/distributors" element={<Distributors />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reports" element={<Reports />} />
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
              <Route path="/sales/:invoiceId" element={<EditSaleInvoice />} />
              <Route
                path="/distributors/:distributorId"
                element={<DistributorDetails />}
              />
              <Route path="/payment/:paymentId" element={<PaymentDetails />} />
              <Route
                path="/payment/create-payment/:distributorId?"
                element={<CreatePayment />}
              />
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
              <Route
                path="/payment/invoice-print"
                element={<PaymentInvoicePrint />}
              />
              <Route path="/settings/config" element={<BillingSettings />} />
              <Route
                path="/settings/manage-groups"
                element={<ManageGroupsPage />}
              />
              <Route
                path="/accounts/transactions/:accountId"
                element={<Transactions />}
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
