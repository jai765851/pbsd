import express from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import {
  verifyPassword,
  findUserByUsername,
  createUser,
  ensureSupabaseSeeded,
  isSupabaseConnected,
  getDashboardData,
  getBooksCatalog,
  createBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getIssuesList,
  getReturnedList,
  getFinesSummary,
  getAvailabilityList,
} from "./supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize Gemini client securely on the server
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.warn("[Gemini] Failed to instantiate GoogleGenAI client:", err.message);
  }
}

app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.LMS_SECRET_KEY || "pbsd-library-dev-secret-change-in-production";
const ALGORITHM = "HS256";

function createAccessToken(username) {
  return jwt.sign({ sub: username }, SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: "12h",
  });
}

function decodeAccessToken(token) {
  try {
    const payload = jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
    return payload.sub || null;
  } catch {
    return null;
  }
}

// Authentication Middleware
async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  const token = authHeader.slice(7).trim();
  const username = decodeAccessToken(token);
  if (!username) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ detail: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] Error validating user:", err);
    return res.status(500).json({ detail: "Internal server error during authentication" });
  }
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

// FR-01: User Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(401).json({ detail: "Invalid username or password" });
    }
    const user = await findUserByUsername(String(username).trim());
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return res.status(401).json({ detail: "Invalid username or password" });
    }
    return res.json({
      token: createAccessToken(user.username),
      username: user.username,
    });
  } catch (err) {
    console.error("[API /api/login] Error:", err);
    return res.status(500).json({ detail: "Login failed" });
  }
});

// User Registration
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ detail: "Username and password are required" });
    }
    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ detail: "Username must be at least 3 characters long" });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ detail: "Password must be at least 4 characters long" });
    }
    const newUser = await createUser({ username: cleanUsername, password: String(password) });
    return res.status(201).json({
      token: createAccessToken(newUser.username),
      username: newUser.username,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("[API /api/register] Error:", err.message);
    const status = err.message.includes("already taken") ? 409 : 400;
    return res.status(status).json({ detail: err.message || "Registration failed" });
  }
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({ username: req.user.username });
});

// Dashboard Metrics
app.get("/api/dashboard", authRequired, async (req, res) => {
  try {
    const stats = await getDashboardData();
    res.json(stats);
  } catch (err) {
    console.error("[API /api/dashboard] Error:", err);
    res.status(500).json({ detail: "Failed to load dashboard metrics" });
  }
});

// FR-02: Book Management (Catalog & Search)
app.get("/api/books", authRequired, async (req, res) => {
  try {
    const search = String(req.query.q || "");
    const sort = String(req.query.sort || "default");
    const books = await getBooksCatalog(search, sort);
    res.json(books);
  } catch (err) {
    console.error("[API /api/books] Error:", err);
    res.status(500).json({ detail: "Failed to fetch books catalog" });
  }
});

app.post("/api/books", authRequired, async (req, res) => {
  try {
    const title = (req.body?.title || "").trim();
    const author = (req.body?.author || "").trim();
    if (!title || !author) {
      return res.status(400).json({ detail: "Title and author are required" });
    }
    const book = await createBook({ title, author });
    res.status(201).json(book);
  } catch (err) {
    console.error("[API POST /api/books] Error:", err);
    res.status(400).json({ detail: err.message || "Failed to create book" });
  }
});

app.put("/api/books/:book_id", authRequired, async (req, res) => {
  try {
    const bookId = parseInt(req.params.book_id, 10);
    const title = (req.body?.title || "").trim();
    const author = (req.body?.author || "").trim();
    if (!title || !author) {
      return res.status(400).json({ detail: "Title and author are required" });
    }
    const updated = await updateBook(bookId, { title, author });
    res.json(updated);
  } catch (err) {
    console.error("[API PUT /api/books/:id] Error:", err);
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ detail: err.message || "Failed to update book" });
  }
});

app.delete("/api/books/:book_id", authRequired, async (req, res) => {
  try {
    const bookId = parseInt(req.params.book_id, 10);
    await deleteBook(bookId);
    res.json({ ok: true });
  } catch (err) {
    console.error("[API DELETE /api/books/:id] Error:", err);
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ detail: err.message || "Cannot delete book" });
  }
});

// FR-03: Book Issue
app.post("/api/issues", authRequired, async (req, res) => {
  try {
    const bookId = parseInt(req.body?.book_id, 10);
    if (!bookId) {
      return res.status(400).json({ detail: "Valid book ID is required" });
    }
    const borrower = (req.body?.borrower || "").trim();
    if (!borrower) {
      return res.status(400).json({ detail: "Borrower name is required" });
    }
    const issue = await issueBook({ book_id: bookId, borrower });
    res.json(issue);
  } catch (err) {
    console.error("[API POST /api/issues] Error:", err);
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ detail: err.message || "Failed to issue book" });
  }
});

app.get("/api/issues", authRequired, async (req, res) => {
  try {
    const active = req.query.active !== "false" && req.query.active !== false;
    const issues = await getIssuesList(active);
    res.json(issues);
  } catch (err) {
    console.error("[API GET /api/issues] Error:", err);
    res.status(500).json({ detail: "Failed to fetch issues list" });
  }
});

// FR-04: Book Return
app.post("/api/returns", authRequired, async (req, res) => {
  try {
    const bookId = parseInt(req.body?.book_id, 10);
    if (!bookId) {
      return res.status(400).json({ detail: "Valid book ID is required" });
    }
    const result = await returnBook({ book_id: bookId });
    res.json(result);
  } catch (err) {
    console.error("[API POST /api/returns] Error:", err);
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ detail: err.message || "Failed to return book" });
  }
});

app.get("/api/returns", authRequired, async (req, res) => {
  try {
    const returns = await getReturnedList();
    res.json(returns);
  } catch (err) {
    console.error("[API GET /api/returns] Error:", err);
    res.status(500).json({ detail: "Failed to fetch returns history" });
  }
});

// FR-05: Fine Management
app.get("/api/fines", authRequired, async (req, res) => {
  try {
    const fines = await getFinesSummary();
    res.json(fines);
  } catch (err) {
    console.error("[API GET /api/fines] Error:", err);
    res.status(500).json({ detail: "Failed to fetch fines summary" });
  }
});

// FR-06: Book Availability
app.get("/api/availability", authRequired, async (req, res) => {
  try {
    const statusFilter = String(req.query.status || "all");
    const list = await getAvailabilityList(statusFilter);
    res.json(list);
  } catch (err) {
    console.error("[API GET /api/availability] Error:", err);
    res.status(500).json({ detail: "Failed to fetch availability" });
  }
});

// ---------------------------------------------------------
// AI INTELLIGENCE ASSISTANT (Natural Language Search, Circulation Insights & Recommendations)
// ---------------------------------------------------------
app.post("/api/ai/query", authRequired, async (req, res) => {
  try {
    const query = String(req.body?.query || "").trim();
    if (!query) {
      return res.status(400).json({ detail: "Query is required" });
    }

    // Gather live library data context
    const [stats, catalog, fines, availability, issues] = await Promise.all([
      getDashboardData(),
      getBooksCatalog("", "default"),
      getFinesSummary(),
      getAvailabilityList("all"),
      getIssuesList(true),
    ]);

    const activeFinesTotal = fines?.total || 0;
    const catalogSummary = catalog.map((b) => ({
      code: b.code,
      title: b.title,
      author: b.author,
      status: b.status,
      borrower: b.borrower || null,
    }));

    let answer = "";
    let source = "gemini";

    // Attempt Gemini API call if client is available
    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are "LIBRA Intelligence", the built-in AI Assistant for the LIBRA Digital Library Management System.
You have real-time access to the library's live database and circulation state:
- Metrics: Total Books: ${stats.total_books}, Available: ${stats.available}, Borrowed: ${stats.borrowed}, Overdue: ${stats.overdue}, Outstanding Fines: ₹${stats.outstanding_fines}, Collected Fines: ₹${stats.collected_fines}.
- Books in Catalog (${catalog.length}):
${JSON.stringify(catalogSummary, null, 2)}
- Active Loans (${issues.length}):
${JSON.stringify(issues.map((i) => ({ code: i.code, title: i.title, borrower: i.borrower, due_at: i.due_at, status: i.status })), null, 2)}
- Overdue Fines Report (${fines.count} items, Total: ₹${activeFinesTotal}):
${JSON.stringify(fines.items, null, 2)}

Provide concise, friendly, and structured responses with Markdown formatting:
- If asked to search or find books, check titles, authors, and availability, quoting book codes (e.g. B001, B002).
- If asked for recommendations, consider availability and explain why the book fits their interest.
- If asked about overdue books or fines, list who owes what and advise returning them.
- If asked about library performance or bottlenecks, provide 2-3 data-driven recommendations.
- Keep tone professional, futuristic, and helpful. Always cite book codes accurately.`;

        const response = await genAI.models.generateContent({
          model: "gemini-3.8-flash",
          contents: query,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        answer = response.text || "";
      } catch (geminiErr) {
        console.warn("[Gemini API Warning] Falling back to local intelligence engine:", geminiErr.message);
        source = "local_intelligence";
      }
    } else {
      source = "local_intelligence";
    }

    // Deterministic fallback engine if Gemini is offline or not configured
    if (!answer) {
      const qLower = query.toLowerCase();

      if (qLower.includes("fine") || qLower.includes("overdue") || qLower.includes("owing") || qLower.includes("due")) {
        if (fines.items && fines.items.length > 0) {
          const fineList = fines.items
            .map((f) => `- **${f.title}** (${f.borrower}): ${f.days_overdue} days overdue — Fine: ₹${f.fine}`)
            .join("\n");
          answer = `### 📋 Overdue Fines Report\n\nThere are currently **${fines.count}** overdue book(s) with **₹${fines.total}** in outstanding fines:\n\n${fineList}\n\n*Tip: You can navigate to **Fine Management** to record returns and clear outstanding liabilities.*`;
        } else {
          answer = `### 📋 Overdue Fines Report\n\nAll loans are in good standing! There are currently **no overdue books** and outstanding fines are **₹0**.`;
        }
      } else if (qLower.includes("available") || qLower.includes("in stock") || qLower.includes("free")) {
        const availableBooks = catalog.filter((b) => b.status === "available");
        const list = availableBooks
          .map((b) => `- **${b.code}**: "${b.title}" by ${b.author}`)
          .join("\n");
        answer = `### 📚 Available Books (${availableBooks.length}/${catalog.length})\n\nThe following books are ready for checkout:\n\n${list}\n\n*You can issue any of these books immediately from the **Book Issue** section.*`;
      } else if (qLower.includes("recommend") || qLower.includes("suggestion") || qLower.includes("what should i read")) {
        const available = catalog.filter((b) => b.status === "available");
        const picks = available.slice(0, 3);
        const list = picks
          .map((b) => `- **${b.code} — ${b.title}** by ${b.author}: Status: **Available**`)
          .join("\n");
        answer = `### ✦ Recommended Reading\n\nBased on our current collection availability, here are top picks:\n\n${list}\n\n*Would you like to issue any of these or search for a specific domain like Databases, AI, or Networking?*`;
      } else if (qLower.includes("metric") || qLower.includes("stat") || qLower.includes("health") || qLower.includes("overview") || qLower.includes("summary")) {
        answer = `### 📊 Library Circulation Summary\n\n- **Total Collection:** ${stats.total_books} books\n- **Available for Loan:** ${stats.available} books (${Math.round((stats.available / (stats.total_books || 1)) * 100)}%)\n- **Currently Borrowed:** ${stats.borrowed} books\n- **Overdue Books:** ${stats.overdue} books\n- **Outstanding Fines:** ₹${stats.outstanding_fines}\n- **Collected Fines:** ₹${stats.collected_fines}\n\n*Collection health is stable. Regular returns maintain high book circulation turnaround.*`;
      } else {
        // Natural language catalog search
        const matches = catalog.filter((b) => {
          const matchTitle = qLower.split(/\s+/).some((term) => term.length > 2 && b.title.toLowerCase().includes(term));
          const matchAuthor = qLower.split(/\s+/).some((term) => term.length > 2 && b.author.toLowerCase().includes(term));
          return matchTitle || matchAuthor;
        });

        if (matches.length > 0) {
          const list = matches
            .map((b) => `- **${b.code}**: "${b.title}" by ${b.author} [${b.status.toUpperCase()}]${b.borrower ? ` (borrowed by ${b.borrower})` : ""}`)
            .join("\n");
          answer = `### 🔍 Catalog Search Results\n\nFound **${matches.length}** matching book(s) in the library collection:\n\n${list}`;
        } else {
          answer = `### ✦ LIBRA Intelligence\n\nI searched the library collection for "${query}". Currently, no exact title or author match was found in the ${catalog.length} cataloged titles.\n\n**Quick suggestions:**\n- Ask: *"Which books are available?"*\n- Ask: *"Show overdue fines"* \n- Ask: *"Recommend programming books"*`;
        }
      }
    }

    // Extract any referenced books for interactive UI cards
    const referencedBooks = catalog.filter((b) => {
      const codeRegex = new RegExp(`\\b${b.code}\\b`, "i");
      const titleLower = b.title.toLowerCase();
      return codeRegex.test(answer) || answer.toLowerCase().includes(titleLower);
    });

    res.json({
      query,
      answer,
      source,
      referencedBooks: referencedBooks.slice(0, 4),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[API POST /api/ai/query] Error:", err);
    res.status(500).json({ detail: "AI assistant query failed: " + err.message });
  }
});

// ---------------------------------------------------------
// STATIC ASSETS, PWA & HEALTH
// ---------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: isSupabaseConnected() ? "supabase_postgresql" : "local_fallback",
  });
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "icons", "icon-192.png"));
});

app.get("/manifest.webmanifest", (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  res.sendFile(path.join(__dirname, "manifest.webmanifest"));
});

app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  res.sendFile(path.join(__dirname, "manifest.webmanifest"));
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(path.join(__dirname, "sw.js"));
});

app.use("/icons", express.static(path.join(__dirname, "icons")));

app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname));

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`LIBRA server running on http://0.0.0.0:${PORT}`);
  if (isSupabaseConnected()) {
    console.log("[Database] Initializing Supabase seed check...");
    await ensureSupabaseSeeded();
  } else {
    console.log("[Database] Running with local database store (configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to connect to Supabase PostgreSQL).");
  }
});
