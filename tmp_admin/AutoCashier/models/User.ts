import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password?: string;
  role: string;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, required: true, enum: ["Admin", "Cashier"], default: "Cashier" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema, "user");
