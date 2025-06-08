import { configureStore } from "@reduxjs/toolkit";
import staffReducer from "./slices/staffSlice";
import userReducer from "./slices/userSlice";
import pharmacyReducer from "./slices/pharmacySlice";
import loaderReducer from "./slices/loaderSlice";
import expenseReducer from "./slices/expenseSlice";
import distributorSlice from "./slices/distributorSlice";
import billReducer from "./slices/SellBillSlice";
import purchaseBillReducer from "./slices/PurchaseBillSlice";
import inventoryReducer from "./slices/inventorySlice";
import paymentReducer from "./slices/paymentSlice";
import accountReducer from "./slices/accountSlice";
import customerReducer from "./slices/CustomerSlice";
import reportReducer from "./slices/reportSlice";
import settingsReducer from "./slices/settingsSlice";
import exportImportReducer from "./slices/exportImportSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    staff: staffReducer,
    pharmacy: pharmacyReducer,
    user: userReducer,
    loader: loaderReducer,
    expenses: expenseReducer,
    distributor: distributorSlice,
    bill: billReducer,
    purchaseBill: purchaseBillReducer,
    inventory: inventoryReducer,
    payment: paymentReducer,
    accounts: accountReducer,
    customers: customerReducer,
    report: reportReducer,
    settings: settingsReducer,
    exportImport: exportImportReducer,
    dashboard: dashboardReducer,
  },
});
