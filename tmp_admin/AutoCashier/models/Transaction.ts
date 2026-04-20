import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionProduct {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ITransaction extends Document {
  transaction_id: string;
  timestamp: string;
  items: number;
  total: number;
  payment_method: string;
  cashier: string;
  products: ITransactionProduct[];
}

const TransactionSchema: Schema = new Schema(
  {
    transaction_id: { type: String, required: true, unique: true },
    timestamp: { type: String, required: true },
    items: { type: Number, required: true },
    total: { type: Number, required: true },
    payment_method: { type: String, required: true },
    cashier: { type: String, required: true },
    products: [
      {
        sku: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema, "transaction");
