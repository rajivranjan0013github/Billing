import mongoose from "mongoose";
import { pharmacyPlugin } from "../plugins/pharmacyPlugin.js";

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unit: String,
    pack: { type: Number, default: 1 },
    secondary_unit: String,
    quantity: { type: Number, default: 0 },
    category: String,
    purchases: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }],
    sales: [{ type: mongoose.Schema.Types.ObjectId, ref: "SalesBill" }],
    mfcName: String,
    imgUri: String,
    composition: String,
    location: String,
    HSN: String,
    code: { type: Number },
    timeline: [{ type: mongoose.Schema.Types.ObjectId, ref: "StockTimeline" }],
    batch: [{ type: mongoose.Schema.Types.ObjectId, ref: "InventoryBatch" }],
    group: { type: [String], default: [] },
  },
  { timestamps: true }
);

inventorySchema.plugin(pharmacyPlugin);

// Add method to fix timeline balances after a specific point in time
inventorySchema.statics.recalculateTimelineBalancesAfter = async function (
  inventoryId,
  startTime,
  session
) {
  const inventory = await this.findById(inventoryId)
    .populate({
      path: "timeline",
      options: { sort: { createdAt: 1 } }, // Sort by creation time to process in order
    })
    .session(session);

  if (!inventory || !inventory.timeline.length) return;

  // Find the balance of the last entry before our start time
  // This will be our starting balance
  let startingBalance = 0;
  let startIndex = 0;

  for (let i = 0; i < inventory.timeline.length; i++) {
    const entry = inventory.timeline[i];
    if (entry.createdAt >= startTime) {
      startIndex = i;
      break;
    }
    // Accumulate balance up to our start point
    if (entry.credit) startingBalance += entry.credit;
    if (entry.debit) startingBalance -= entry.debit;
  }

  let runningBalance = startingBalance;

  // Only process entries after our start time
  for (let i = startIndex; i < inventory.timeline.length; i++) {
    const timeline = inventory.timeline[i];

    // Add credits, subtract debits
    if (timeline.credit) runningBalance += timeline.credit;
    if (timeline.debit) runningBalance -= timeline.debit;

    // Update the balance if it's different
    if (timeline.balance !== runningBalance) {
      timeline.balance = runningBalance;
      await timeline.save(session ? { session } : undefined);
    }
  }

  // Update inventory's current quantity to match final balance
  if (inventory.quantity !== runningBalance) {
    inventory.quantity = runningBalance;
    await inventory.save(session ? { session } : undefined);
  }

  return inventory;
};

export const Inventory = mongoose.model("Inventory", inventorySchema);
