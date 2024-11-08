import mongoose from 'mongoose';
import { hospitalPlugin } from '../plugins/hospitalPlugin.js';

const purchaseBillSchema = new mongoose.Schema({
  // Bill Details
  bill_number: {
    type: String,
    required: true,
    unique: true
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
  supplier_invoice_number: {
    type: String,
    required: true
  },

  // Items
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
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
    mrp: {
      type: Number,
    },
    purchase_price: {
      type: Number,
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
      enum: ['cash', 'upi', 'card', 'bank'],
      required: true
    }
  },

  payment_status : {
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
  timestamps: true
});

// Update the pre-save middleware to use pre('validate') instead of pre('save')
purchaseBillSchema.pre('validate', async function(next) {
  try {
    if (this.isNew) {
      // Find the latest bill
      const lastBill = await this.constructor.findOne({
        hospital: this.hospital
      }).sort({ invoice_counter: -1 });

      // Set the counter
      this.invoice_counter = lastBill ? lastBill.invoice_counter + 1 : 1;
      
      // Generate bill number - just use the counter padded with zeros
      this.bill_number = this.invoice_counter.toString().padStart(6, '0');
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Apply hospital plugin
purchaseBillSchema.plugin(hospitalPlugin);

export const PurchaseBill = mongoose.model('PurchaseBill', purchaseBillSchema);
