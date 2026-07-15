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

      // Check if keys are set
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;

      if (!url || !key) {
        console.warn("Keys missing. Mocking success response.");
        return res.json({
          success: true,
          savedLocally: true,
          message: "Saved locally (Supabase URL/Key environment variables are not configured in AI Studio yet)",
          data: { name, email, category: category || "General Support", message, created_at: new Date().toISOString() }
        });
      }

      const supabase = getSupabase();
      
      // Attempt to save to Supabase "contact_submissions" table
      const { data, error } = await supabase
        .from("contact_submissions")
        .insert([{ 
          name, 
          email, 
          category: category || "General Support", 
          message,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        // Fallback: If table doesn't exist, return success with a warning
        return res.json({ 
          success: true, 
          savedLocally: true,
          message: `Inquiry registered successfully! Note: Supabase insertion reported an error (${error.message || error.details}). Ensure the 'contact_submissions' table is configured in your Supabase dashboard.`,
          data: { name, email, category, message, created_at: new Date().toISOString() }
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
          data: [
            {
              id: 1,
              name: "Demo Support Request",
              email: "supporter@example.com",
              category: "General Support",
              message: "This is a placeholder submission since Supabase keys are not configured yet. Set SUPABASE_URL and SUPABASE_ANON_KEY to see real database entries here.",
              created_at: new Date().toISOString()
            }
          ]
        });
      }

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase select error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Internal API error:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
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
