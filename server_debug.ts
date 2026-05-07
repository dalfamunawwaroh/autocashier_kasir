import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./src/lib/supabase.js";
import bcrypt from "bcryptjs";

dotenv.config();

console.log(">>> DEBUG SERVER: NO VITE <<<");

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/detect", async (req, res) => {
     res.json({ success: true, message: "Detection endpoint stub" });
  });

  const port = 3005;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Debug server on http://localhost:${port}`);
  });
}

startServer();
