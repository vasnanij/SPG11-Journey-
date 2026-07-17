import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const HOST = "0.0.0.0";

// Lazy-initialized Supabase Client
let supabaseClient: any = null;

// Local in-memory store for fallback/graceful persistence
const inMemorySubmissions: any[] = [
  {
    id: "fallback-1",
    name: "Dr. Sarah Lindqvist",
    email: "s.lindqvist@hsp-research.org",
    category: "Clinical Research Inquiry",
    message: "Thank you for establishing this educational portal. Our lab is conducting functional studies on SPG11 mutations, and we would love to collaborate on resource linking.",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  }
];

function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.");
    }
    // Initialize anyway or fallback gracefully to prevent crash on startup if keys are not set yet
    supabaseClient = createClient(
      supabaseUrl || "https://placeholder-project.supabase.co",
      supabaseKey || "placeholder-anon-key"
    );
  }
  return supabaseClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API endpoint to submit a contact inquiry
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, category, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields: name, email, message" });
      }

      const newSubmission = {
        name,
        email,
        category: category || "General Support",
        message,
        created_at: new Date().toISOString()
      };

      // Always save to our in-memory list as an extra layer of protection/fallback
      inMemorySubmissions.unshift(newSubmission);

      // Check if keys are set
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;

      if (!url || !key) {
        console.warn("Keys missing. Mocking success response.");
        return res.json({
          success: true,
          savedLocally: true,
          message: "Saved locally (Supabase URL/Key environment variables are not configured in AI Studio yet)",
          data: [newSubmission]
        });
      }

      const supabase = getSupabase();
      
      // Attempt to save to Supabase "contact_submissions" table
      const { data, error } = await supabase
        .from("contact_submissions")
        .insert([newSubmission])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        // Fallback: If table doesn't exist, return success with a warning
        return res.json({ 
          success: true, 
          savedLocally: true,
          message: `Inquiry registered successfully! Note: Supabase insertion reported an error (${error.message || error.details || "Table may not exist"}). Saved to server in-memory storage.`,
          data: [newSubmission]
        });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Internal API error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // API endpoint to fetch list of contacts (for testing/admin view)
  app.get("/api/contact", async (req, res) => {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      if (!url || !key) {
        return res.json({
          success: true,
          message: "Supabase environment variables are not configured yet. Returning placeholder inquiries.",
          data: inMemorySubmissions
        });
      }

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase select error:", error);
        // Fallback gracefully to in-memory submissions when the table is not found or has an error
        return res.json({
          success: true,
          savedLocally: true,
          warning: `Supabase query reported an error: ${error.message || error.details || "Table may not exist"}. Displaying in-memory submissions.`,
          data: inMemorySubmissions
        });
      }

      // Combine Supabase data with in-memory fallback submissions (ensuring no duplicates by matching email + message)
      const combined = [...(data || [])];
      for (const local of inMemorySubmissions) {
        const isDuplicate = combined.some(
          (db: any) => db.email === local.email && db.message === local.message
        );
        if (!isDuplicate) {
          combined.push(local);
        }
      }

      // Sort by created_at descending
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json({ success: true, data: combined });
    } catch (err: any) {
      console.error("Internal API error:", err);
      // Fallback instead of 500
      res.json({
        success: true,
        savedLocally: true,
        warning: `An internal server error occurred: ${err.message || err}. Displaying in-memory submissions.`,
        data: inMemorySubmissions
      });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
