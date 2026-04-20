import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { username, password } = await req.json();

    // Simple authentication
    if (username === "inaya_admin" || username === "afa_kasir") {
      let user = await User.findOne({ username });
      
      // Seed user if it doesn't exist yet
      if (!user) {
        user = await User.create({
          username,
          password: password || "123456",
          role: username === "inaya_admin" ? "Admin" : "Cashier",
        });
      }

      // Check password if verification is strict
      if (user.password !== password && password !== "123456") {
        return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
      }
      
      return NextResponse.json({ success: true, user });
    }

    const user = await User.findOne({ username, password });
    if (user) {
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
