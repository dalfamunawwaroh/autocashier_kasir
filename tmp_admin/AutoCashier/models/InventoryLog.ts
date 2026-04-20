import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryLog extends Document {
  transaction_id: string;
  sku: string;
  quantity_changed: number;
  type: string;
  timestamp: string;
}

const InventoryLogSchema: Schema = new Schema(
  {
    transaction_id: { type: String, required: true },
    sku: { type: String, required: true },
    quantity_changed: { type: Number, required: true },
    type: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.InventoryLog || mongoose.model<IInventoryLog>("InventoryLog", InventoryLogSchema, "inventory_log");
