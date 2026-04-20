import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with your Google Apps Script Web App URL from deployment
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

/**
 * Utility function to forward requests to Google Apps Script
 */
async function fetchFromGAS(method: string, data: any) {
  if (!APPS_SCRIPT_URL) {
    throw new Error("APPS_SCRIPT_URL is not defined in environment variables. Please set it in .env file.");
  }

  try {
    const options: RequestInit = {
      method: method,
      redirect: "follow", // Important for Apps Script because it redirects on POST
    };

    if (method === "POST") {
      options.headers = { "Content-Type": "text/plain" }; // Apps script likes text/plain for POST to bypass CORS preflight
      options.body = JSON.stringify(data);
    } else if (method === "GET" && data) {
      const params = new URLSearchParams(data).toString();
      const urlWithParams = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes("?") ? "&" : "?"}${params}`;
      const response = await fetch(urlWithParams, options);
      return await response.json();
    }

    const response = await fetch(APPS_SCRIPT_URL, options);
    return await response.json();
  } catch (error) {
    console.error("Error communicating with Google Apps Script:", error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  console.log("==========================================");
  console.log("Using Google Apps Script as Database Provider");
  if (!APPS_SCRIPT_URL) {
    console.warn("⚠️ WARNING: APPS_SCRIPT_URL is not set in .env!");
    console.warn("⚠️ Please deploy your Google Apps Script as a Web App and add the URL to your .env file.");
  } else {
    console.log("Connected to Apps Script API");
  }
  console.log("==========================================");

  // API Routes
  
  // 1. Authentication Logic (Login)
  app.post("/api/login", async (req, res) => {
    try {
      const result = await fetchFromGAS("POST", { action: "login", ...req.body });
      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 1b. Authentication Logic (Register)
  app.post("/api/register", async (req, res) => {
    try {
      const result = await fetchFromGAS("POST", { action: "register", ...req.body });
      if (result.success) res.json(result);
      else res.status(400).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 1c. Request Password Reset (Forgot Password)
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const result = await fetchFromGAS("POST", { action: "forgotPassword", ...req.body });
      if (result.success) res.json(result);
      else res.status(404).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 1d. Reset Password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const result = await fetchFromGAS("POST", { action: "resetPassword", ...req.body });
      if (result.success) res.json(result);
      else res.status(400).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2. AI Scanning & Cart Logic (Product Search)
  app.get("/api/products/search", async (req, res) => {
    try {
      const result = await fetchFromGAS("GET", { action: "searchProduct", label: req.query.label });
      if (result.success) res.json(result);
      else res.status(404).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 2b. Get All Products (for local sync)
  app.get("/api/products", async (req, res) => {
    try {
      const result = await fetchFromGAS("GET", { action: "getProducts" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 3. Payment & Checkout Logic (Submit Order)
  app.post("/api/checkout", async (req, res) => {
    try {
      const result = await fetchFromGAS("POST", { action: "checkout", ...req.body });
      if (result.success) res.json(result);
      else res.status(400).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 4. Store Settings
  app.get("/api/store-settings", async (req, res) => {
    try {
      const result = await fetchFromGAS("GET", { action: "getStoreSettings" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 5. Analytics Aggregations
  app.get("/api/analytics", async (req, res) => {
    try {
      const result = await fetchFromGAS("GET", { action: "getAnalytics", filter: req.query.filter || "daily" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // 6. User Profile Updates
  app.post("/api/user/update", async (req, res) => {
    try {
      const result = await fetchFromGAS("POST", { action: "updateUser", ...req.body });
      if (result.success) res.json(result);
      else res.status(400).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Server Error:", err.stack);
    res.status(500).json({ success: false, message: "Internal API Error: Malformed request or unhandled promise." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
