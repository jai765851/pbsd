import express from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
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
// STATIC ASSETS & HEALTH
// ---------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: isSupabaseConnected() ? "supabase_postgresql" : "local_fallback",
  });
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

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
