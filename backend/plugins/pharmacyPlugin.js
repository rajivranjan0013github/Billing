import mongoose from "mongoose";
import { getPharmacyId } from "../utils/asyncLocalStorage.js";

export const pharmacyPlugin = (schema) => {
  // Add the pharmacy field to the schema if it doesn't exist
  if (!schema.path("pharmacy")) {
    schema.add({
      pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy" },
    });
  }

  // Helper function to set pharmacy condition
  const setPharmacyCondition = function () {
    const pharmacyId = getPharmacyId();
    if (!this.getQuery().pharmacy && pharmacyId) {
      this.where({ pharmacy: pharmacyId });
    }
  };

  // Apply setPharmacyCondition to all query middlewares
  const queryMiddlewares = [
    "count",
    "countDocuments",
    "find",
    "findOne",
    "findOneAndDelete",
    "findOneAndRemove",
    "findOneAndUpdate",
    "update",
    "updateOne",
    "updateMany",
  ];

  queryMiddlewares.forEach((method) => {
    schema.pre(method, setPharmacyCondition);
  });

  schema.pre("save", function (next) {
    const pharmacyId = getPharmacyId();
    if (!this.pharmacy && pharmacyId) {
      this.pharmacy = pharmacyId;
    }
    next();
  });

  schema.pre("insertMany", function (next, docs) {
    const pharmacyId = getPharmacyId();

    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.pharmacy && pharmacyId) {
          doc.pharmacy = pharmacyId;
        }
      });
    }
    next();
  });

  // Add a static method to the schema for pharmacy-aware aggregation
  schema.statics.pharmacyAwareAggregate = function (pipeline) {
    const pharmacyId = getPharmacyId();
    if (pharmacyId) {
      // Add a $match stage at the beginning of the pipeline to filter by pharmacy
      pipeline.unshift({ $match: { pharmacy: pharmacyId } });
    }
    return this.aggregate(pipeline);
  };
};
