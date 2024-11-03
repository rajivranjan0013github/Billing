import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Staff } from "../models/Staff.js";
import { identifyHospitalFromBody } from "../middleware/hospitalMiddleware.js";
import { checkPermission, verifyToken } from "../middleware/authMiddleware.js";
import { verifySuperAdmin } from "../middleware/SuperAdminMiddleWare.js";
const router = express.Router();

// Registration route for staff by admin access person , not for genral login
router.post("/register", identifyHospitalFromBody, async (req, res) => {
  try {
    const { username, password, name, ...otheFields } = req.body;

    let user = await Staff.findOne({ username });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    user = new Staff({
      username,
      password: hashedPassword,
      name,

      ...otheFields,
    });

    const savedStaff = await user.save();

    const payload = { _id: savedStaff._id };

    jwt.sign(payload, "secretkey", (err, token) => {
      if (err) throw err;
      // res.cookie("jwtaccesstoken", token, {
      //   maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
      // });
      //  res.redirect("http://localhost:3000/completeProfile")
      res.json({ token });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Servers error");
  }
});

router.post("/login", identifyHospitalFromBody, async (req, res) => {
  try {
    const { username, password } = req.body;

    let user = await Staff.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create and return JWT token
    const payload = { _id: user._id };
    jwt.sign(payload, "secretkey", (err, token) => {
      if (err) throw err;
      res.cookie("jwtaccesstoken", token, {
        maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
      });
      // Add new cookie for hospitalId
      res.cookie("hospitalId", req.body.hospitalId, {
        maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ login: "success" });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// Add this route after the login route
router.post("/logout", (req, res) => {
  try {
    // Clear the cookies
    res.clearCookie("jwtaccesstoken");
    res.clearCookie("hospitalId");

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

export default router;
