import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

console.log("Environment variables loaded:", Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("GEMINI") || k.includes("PORT")));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing. Database operations will fail.");
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully");
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
  }
}

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  // 1. Logging Middleware (Very Top)
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // 1. Create API Router
  const apiRouter = express.Router();

  // Logging for API Router
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // Health check inside API Router
  apiRouter.get("/health", (req, res) => {
    console.log("API Health check requested");
    res.json({ 
      status: "ok", 
      supabase: !!supabase, 
      env: process.env.NODE_ENV 
    });
  });

  // Test route inside API Router
  apiRouter.get("/test", (req, res) => {
    res.json({ message: "API Router is working" });
  });

  // Middleware to check Supabase
  const checkSupabase = (req: any, res: any, next: any) => {
    if (!supabase) {
      return res.status(500).json({ 
        error: "Supabase not configured" 
      });
    }
    next();
  };

  // Invoice Routes
  apiRouter.get("/invoices", checkSupabase, async (req, res) => {
    try {
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json((invoices || []).map((inv: any) => ({ ...inv, items: inv.invoice_items })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  apiRouter.post("/invoices", checkSupabase, async (req, res) => {
    try {
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert([req.body])
        .select()
        .single();
      if (invError) throw invError;
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // 2. Catch-all for API (Must be before Vite)
  app.all("/api/*", (req, res) => {
    console.log(`404 API: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route not found" });
  });

  // 6. Vite / Static Files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

console.log("Calling startServer()...");
startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
});
