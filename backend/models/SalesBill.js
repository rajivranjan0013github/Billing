import mongoose from 'mongoose';
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const salesBillSchema = new mongoose.Schema({
  // Bill Details
  bill_number: {
    type: String,
    unique: true
  },
  invoice_counter: {
    type: Number
  },
  bill_date: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Party/Customer Details
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: function() {
      return !this.is_cash_customer;
    }
  },
  is_cash_customer: {
    type: Boolean,
    default: true
  },

  party_name:String,

  // Items
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    batch_number: String,
    expiry_date: Date,
    quantity: {
      type: Number,
      required: true
    },
    unit: String,
    price_per_unit: {
      type: Number,
      required: true
    },
    secondary_unit: {
      unit: String,
      conversion_rate: Number,
    },
    discount_percentage: {
      type: Number,
      default: 0
    },
    gst_percentage: {
      type: Number,
      default: 0
    },
    hsn_code: String
  }],

  // Bill Level Discount
  bill_discount: {
    type: Number,
    default: 0
  },

  // Payment Details
  payment: {
    amount_paid: {
      type: Number,
      required: true
    },
    payment_method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer'],
      required: true
    }
  },

  payment_status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },

  payment_details: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  }],

  is_round_off: {
    type: Boolean,
    default: false
  },

  // Final Amount
  grand_total: {type: Number, required: true},
  tax_summary: {type: Object},

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
  }
}, {
  timestamps: true // This will add created_at and updated_at fields
});

// Update the pre-save middleware
salesBillSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      // Find the latest counter for this hospital
      const lastBill = await this.constructor.findOne(
        { hospital: this.hospital },
        { invoice_counter: 1 }
      ).sort({ createdAt: -1 });

      // Set the counter
      const counter = lastBill ? lastBill.invoice_counter + 1 : 1;
      this.invoice_counter = counter;

      // Generate bill number format: INV/FY/COUNTER
      const today = new Date();
      const fiscalYear = today.getMonth() >= 3 ? 
        `${today.getFullYear()}-${(today.getFullYear() + 1).toString().slice(2)}` : 
        `${today.getFullYear() - 1}-${today.getFullYear().toString().slice(2)}`;
      
      this.bill_number = `INV/${fiscalYear}/${counter.toString().padStart(6, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Apply hospital plugin
salesBillSchema.plugin(hospitalPlugin);

export const SalesBill = mongoose.model('SalesBill', salesBillSchema);
