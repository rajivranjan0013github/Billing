import { Pharmacy } from "../models/Pharmacy.js";
import { runWithPharmacyContext } from "../utils/asyncLocalStorage.js";
import cookie from "cookie";

export const identifyPharmacy = async (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const pharmacyId = cookies?.pharmacyId;
  if (!pharmacyId) {
    return res.status(400).json({ error: "Pharmacy not specified" });
  }

  try {
    const pharmacy = await Pharmacy.findOne({ pharmacyId });
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    runWithPharmacyContext(pharmacy._id, () => {
      req.pharmacy = pharmacy._id;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Error identifying pharmacy" });
  }
};

export const identifyPharmacyFromBody = async (req, res, next) => {
  const { pharmacyId } = req.body;
  if (!pharmacyId) {
    return res
      .status(400)
      .json({ error: "Pharmacy ID not provided in request body" });
  }

  try {
    const pharmacy = await Pharmacy.findOne({ pharmacyId });
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" }); 
    }

    runWithPharmacyContext(pharmacy._id, () => {
      req.pharmacy = pharmacy._id;
      next();
    });
  } catch (error) {
    res.status(500).json({ error: "Error identifying pharmacy" });
  }
};
