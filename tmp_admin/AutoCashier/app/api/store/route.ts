import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Store from "@/models/Store";

export async function GET() {
  try {
    await connectToDatabase();
    let store = await Store.findOne();

    if (!store) {
      store = await Store.create({
        name: "AutoCashier Default Store",
        address: "123 Default Address Rd, City",
        phone: "+62 800 1234 5678",
        email: "contact@autocashier.local",
      });
    }

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    console.error("Error fetching store data:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
