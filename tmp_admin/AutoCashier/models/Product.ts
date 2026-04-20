import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  ai_label: string;
  image?: string;
  image_url?: string;
}

const ProductSchema: Schema = new Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    ai_label: { type: String, required: true },
    image: { type: String },
    image_url: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema, "product");
