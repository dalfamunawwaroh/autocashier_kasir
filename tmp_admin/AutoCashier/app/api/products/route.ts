import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Product from "@/models/Product";
import { products } from "@/lib/data"; // for fallback seeding

export async function GET() {
  try {
    await connectToDatabase();
    let dbProducts = await Product.find({}).sort({ createdAt: -1 });

    // Seed database if empty for demo purposes
    if (dbProducts.length === 0) {
      dbProducts = await Product.insertMany(products);
    }

    return NextResponse.json({ success: true, data: dbProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const newProduct = await Product.create(data);

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: "Product SKU already exists" }, { status: 400 });
    }
    console.error("Error creating product:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

