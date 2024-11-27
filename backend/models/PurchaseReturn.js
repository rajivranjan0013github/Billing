import mongoose from 'mongoose';
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const purchaseReturnSchema = new mongoose.Schema({
  // Return Details
  bill_number: {
    type: String,
    required: true,
  },
  invoice_counter: {
    type: Number,
    required: true
  },
  bill_date: {
    type: Date,
    required: true,
    default: Date.now
  },

  return_type : {
    type: String,
    enum: ['exchange', 'refund'],
  },

  // Reference to original purchase bill
  original_bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseBill',
    required: true
  },

  // Supplier Details
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  supplier_name: {
    type: String,
    required: true
  },

  // Items being returned
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    type : {
      type: String,
      enum: ['return', 'normal'],
      required: true
    },
    batch_number: {
      type: String,
    },
    expiry_date: {
      type: Date,
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: String,
    purchase_price: {
      type: Number,
      required: true
    },
    discount_percentage: {
      type: Number,
      default: 0
    },
    gst_percentage: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      required: true,
      enum: ['damaged', 'expired', 'wrong_item', 'excess_stock', 'other']
    }
  }],

  

  // Return Amount Details
  total_amount: {
    type: Number,
    required: true
  },
  tax_summary: {
    type: Object
  },

  // Payment Details
  payment_status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  payment_details: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],

  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'final', 'cancelled'],
    default: 'final'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate return number on creation
purchaseReturnSchema.pre('validate', async function(next) {
  try {
    if (this.isNew) {
      // Find the latest return
      const lastReturn = await this.constructor.findOne({
        hospital: this.hospital
      }).sort({ invoice_counter: -1 });

      // Set the counter
      this.invoice_counter = lastReturn ? lastReturn.invoice_counter + 1 : 1;
      
      // Generate return number with PR prefix
      this.return_number = 'PR' + this.invoice_counter.toString().padStart(6, '0');
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Apply hospital plugin
purchaseReturnSchema.plugin(hospitalPlugin);

export const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
