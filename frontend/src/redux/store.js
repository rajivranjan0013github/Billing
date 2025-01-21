import { configureStore } from "@reduxjs/toolkit";
import staffReducer from "./slices/staffSlice";
import userReducer from "./slices/userSlice";
import pharmacyReducer from "./slices/pharmacySlice";
import loaderReducer from "./slices/loaderSlice";
import hospitalReducer from "./slices/HospitalSlice";
import expenseReducer from "./slices/expenseSlice";
import partyReducer from "./slices/partySlice";
import billReducer from "./slices/SellBillSlice";
import purchaseBillReducer from "./slices/PurchaseBillSlice";
import inventoryReducer from "./slices/inventorySlice";
import paymentReducer from "./slices/paymentSlice";
import accountReducer from "./slices/accountSlice";
import customerReducer from "./slices/CustomerSlice";

export const store = configureStore({
  reducer: {
    staff: staffReducer,
    pharmacy: pharmacyReducer,
    user: userReducer,
    loader: loaderReducer,
    hospital: hospitalReducer,
    expenses: expenseReducer,
    party: partyReducer,
    bill: billReducer,
    purchaseBill: purchaseBillReducer,
    inventory: inventoryReducer,
    payment: paymentReducer,
    accounts: accountReducer,
    customers: customerReducer,
  },
});
