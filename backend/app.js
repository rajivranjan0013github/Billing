import billRoutes from "./routes/billRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

// ... other imports and middleware

app.use("/api/bills", billRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/reports", reportRoutes);
