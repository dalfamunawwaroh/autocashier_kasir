import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";
import { transactions } from "@/lib/data"; // for fallback seeding

export async function GET() {
  try {
    await connectToDatabase();
    let dbTransactions = await Transaction.find({}).sort({ timestamp: -1 });

    // Seed if empty
    if (dbTransactions.length === 0) {
      const seedData = transactions.map(t => ({
        ...t,
        products: [] // We don't have detailed static products for past transactions
      }));
      dbTransactions = await Transaction.insertMany(seedData);
    }

    return NextResponse.json({ success: true, data: dbTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();

    // 1. Create Transaction
    const newTransaction = await Transaction.create(data);

    // 2. Inventory Sync
    if (data.products && Array.isArray(data.products)) {
      for (const item of data.products) {
        // Decrease stock
        await Product.findOneAndUpdate(
          { sku: item.sku },
          { $inc: { stock: -item.quantity } }
        );

        // Create inventory log
        const timestamp = newTransaction.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);
        await InventoryLog.create({
          transaction_id: newTransaction.transaction_id,
          sku: item.sku,
          quantity_changed: -item.quantity,
          type: "SALE",
          timestamp: timestamp,
        });
      }
    }

    return NextResponse.json({ success: true, data: newTransaction }, { status: 201 });
  } catch (error) {
    console.error("Error saving transaction:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
