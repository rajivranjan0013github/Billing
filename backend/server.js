import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import { identifyPharmacy } from "./middleware/pharmacyMiddleware.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import superAdminRoutes from "./routes/superAdmin.js";
import accountRoutes from "./routes/accountRoutes.js";
import distributorRoutes from "./routes/distributorRouter.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import exportImportRoutes from "./routes/exportImportRoutes.js";
dotenv.config({ path: "./config/config.env" });

const app = express();
const PORT = process.env.PORT || 3002;

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3001",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply CORS middleware before any routes
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Increase JSON payload size limit for image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {})
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Apply tenant plugin to all schemas

// API routes
app.use("/api/pharmacies", pharmacyRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", identifyPharmacy);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/distributor", distributorRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/export-import", exportImportRoutes);
// Serve index.html for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Start the server
app.listen(PORT, () => {});
