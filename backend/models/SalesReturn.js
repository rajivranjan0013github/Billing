import mongoose from "mongoose";
import { hospitalPlugin } from "../plugins/hospitalPlugin.js";
const salesReturnCounterSchema=new mongoose.Schema({
  year:String,
  returnNumber:{type:Number,default:0}
})
const salesReturnCounter=mongoose.model("salesReturnCounter",salesReturnCounterSchema)
const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
    },
    originalInvoiceNumber: {
      type: String,
    },
    partyName: {
      type: String,
      default:"N/A"
    },
   payments:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
   ],
    returnDate: {
      type: Date,
      required: true,
    },
    products: [
      {
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        batchNumber: {
          type: String,
          required: true,
        },
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Batch",
          required: true,
        },
        expiry: {
          type: String,
          required: true,
        },
        HSN: {
          type: String,
        },
        mrp: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        saleRate: {
          type: Number,
          required: true,
        },
        pack: {
          type: Number,
          required: true,
          default: 1,
        },
        
       
        discount: {
          type: Number,
          default: 0,
        },
        gstPer: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    billSummary: {
      subtotal: {
        type: Number,
        required: true,
      },
      discountAmount: {
        type: Number,
        required: true,
      },
      taxableAmount: {
        type: Number,
        required: true,
      },
      gstAmount: {
        type: Number,
        required: true,
      },
      totalQuantity: {
        type: Number,
        required: true,
      },
      productCount: {
        type: Number,
        required: true,
      },
      grandTotal: {
        type: Number,
        required: true,
      },
      gstSummary: {
        0: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        5: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        12: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        18: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
        28: {
          taxable: Number,
          cgst: Number,
          sgst: Number,
          igst: Number,
          total: Number,
        },
      },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
salesReturnSchema.statics.getNextReturnNumber=async function(session){
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await salesReturnCounter.findOneAndUpdate(
    { year: currentYear },
    {$inc:{returnNumber:1}},
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `CreditNote/${yearSuffix}/${counter.returnNumber}`;
};
salesReturnSchema.statics.getCurrentReturnNumber=async function(session){
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const counter = await salesReturnCounter.findOneAndUpdate(
    { year: currentYear },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `CreditNote/${yearSuffix}/${counter.returnNumber+1}`;
}
// Add any pre-save hooks or methods here if needed
salesReturnSchema.plugin(hospitalPlugin);

export const SalesReturn = mongoose.model("SalesReturn", salesReturnSchema);

