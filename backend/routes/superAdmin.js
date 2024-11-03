import express from "express";
import { SuperAdmin } from "../models/SuperAdmin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

router.post("/register",async(req,res)=>{
    try {
        const {email,password} = req.body;

        // Check if a SuperAdmin with the given email already exists
        const existingSuperAdmin = await SuperAdmin.findOne({ email });
        if (existingSuperAdmin) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const superAdmin = new SuperAdmin({email,password:hashedPassword});
      const  savedSuperAdmin= await superAdmin.save();

      if(!savedSuperAdmin)
      {
        res.status(400).json({message:"Invalid user data"});
      }
       jwt.sign({_id:savedSuperAdmin._id},"secretkey",(err,token)=>{
        if(err) throw err;
        res.json({token});
       });

        res.status(200).json({message:"SuperAdmin registered successfully"});
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
});

router.post("/login",async(req,res)=>{
    try {
        const {email,password} = req.body;

        const superAdmin = await SuperAdmin.findOne({email});
        if(!superAdmin)
        {
            res.status(400).json({message:"Invalid credentials"});
        }

        const isMatch = await bcrypt.compare(password, superAdmin.password);
        if(!isMatch)
        {
            res.status(400).json({message:"Invalid credentials"});
        }

        const payload = {_id:superAdmin._id};
        jwt.sign(payload,"secretkey",(err,token)=>{
            if(err) throw err;
            res.json({token}); 
        });
    } catch (error) {
        res.status(500).json({message:"Internal server error"});
    }
});

export default router;
