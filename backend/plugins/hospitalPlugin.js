import mongoose from "mongoose";
import { getHospitalId } from '../utils/asyncLocalStorage.js';

export const hospitalPlugin = (schema) => {
  // Add the hospital field to the schema if it doesn't exist
  if (!schema.path("hospital")) {
    schema.add({
      hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    });
  }

  // Helper function to set hospital condition
  const setHospitalCondition = function () {
    const hospitalId = getHospitalId();
    if (!this.getQuery().hospital && hospitalId) {
      this.where({ hospital: hospitalId });
    }
  };

  // Apply setHospitalCondition to all query middlewares
  [
    "find",
    "findOne",
    "update",
    "findOneAndUpdate",
    "delete",
    "deleteMany",
  ].forEach((method) => {
    schema.pre(method, setHospitalCondition);
  });

  // Middleware for 'save'
  schema.pre("save", function (next) {
    const hospitalId = getHospitalId();
    if (!this.hospital && hospitalId) {
      this.hospital = hospitalId;
    }
  
    next();
  });

  // Middleware for 'insertMany'
  schema.pre("insertMany", function (next, docs) {
    const hospitalId = getHospitalId();
    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.hospital && hospitalId) {
          doc.hospital = hospitalId;
        }
      });
    }
    next();
  });

  // Add a static method to the schema for hospital-aware aggregation
  schema.statics.hospitalAwareAggregate = function (pipeline) {
    const hospitalId = getHospitalId();
    if (hospitalId) {
      // Add a $match stage at the beginning of the pipeline to filter by hospital
      pipeline.unshift({ $match: { hospital: hospitalId } });
    }
    return this.aggregate(pipeline);
  };
};
