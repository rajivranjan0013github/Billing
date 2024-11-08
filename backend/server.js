import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import billRoutes from "./routes/sellBillRoutes.js";
import { identifyHospital } from "./middleware/hospitalMiddleware.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import superAdminRoutes from "./routes/superAdmin.js";
import partyRoutes from "./routes/PartyRouter.js";
import purchaseBillRoutes from "./routes/purchaseBillRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
dotenv.config({ path: "./config/config.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.options("*", cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to database"); 
  })
  .catch((err) => {
    console.log(err);
  });

// Apply tenant plugin to all schemas

// API routes
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", identifyHospital);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/sales", billRoutes);
app.use("/api/purchase", purchaseBillRoutes);
app.use("/api/payment", paymentRoutes);
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
