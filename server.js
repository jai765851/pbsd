import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.LMS_SECRET_KEY || "pbsd-library-dev-secret-change-in-production";
const ALGORITHM = "HS256";
const LOAN_DAYS = 14;
const FINE_PER_DAY = 10.0;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}$${digest}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes("$")) return false;
  const [salt, digest] = stored.split("$");
  const check = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return check === digest;
}

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

// In-Memory Database Store
const users = [
  {
    id: 1,
    username: "admin",
    password_hash: hashPassword("admin123"),
  },
];

let nextBookId = 9;
let nextIssueId = 4;

const books = [
  { id: 1, code: "B001", title: "Introduction to Python", author: "Mark Lutz", status: "available" },
  { id: 2, code: "B002", title: "Database System Concepts", author: "Abraham Silberschatz", status: "borrowed" },
  { id: 3, code: "B003", title: "Computer Networks", author: "Andrew S. Tanenbaum", status: "available" },
  { id: 4, code: "B004", title: "Software Engineering", author: "Ian Sommerville", status: "borrowed" },
  { id: 5, code: "B005", title: "Data Structures and Algorithms", author: "Robert Lafore", status: "available" },
  { id: 6, code: "B006", title: "Web Technologies", author: "Uttam K. Roy", status: "available" },
  { id: 7, code: "B007", title: "Operating Systems", author: "Abraham Silberschatz", status: "available" },
  { id: 8, code: "B008", title: "Computer Organization", author: "Carl Hamacher", status: "overdue" },
];

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFuture = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

const issues = [
  {
    id: 1,
    book_id: 2,
    borrower: "Student A",
    issued_at: daysAgo(4).toISOString(),
    due_at: daysFuture(LOAN_DAYS - 4).toISOString(),
    returned_at: null,
    fine_amount: 0.0,
  },
  {
    id: 2,
    book_id: 4,
    borrower: "Student B",
    issued_at: daysAgo(6).toISOString(),
    due_at: daysFuture(LOAN_DAYS - 6).toISOString(),
    returned_at: null,
    fine_amount: 0.0,
  },
  {
    id: 3,
    book_id: 8,
    borrower: "Student C",
    issued_at: daysAgo(20).toISOString(),
    due_at: daysAgo(6).toISOString(),
    returned_at: null,
    fine_amount: 0.0,
  },
];

function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

function daysOverdue(issue, customNow = new Date()) {
  const due = new Date(issue.due_at);
  const end = issue.returned_at ? new Date(issue.returned_at) : new Date(customNow);
  if (end <= due) return 0;
  const dueDateOnly = toDateOnly(due);
  const endDateOnly = toDateOnly(end);
  const diffMs = endDateOnly.getTime() - dueDateOnly.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function calculateFine(issue, customNow = new Date()) {
  return Math.round(daysOverdue(issue, customNow) * FINE_PER_DAY * 100) / 100;
}

function refreshOverdueStatus() {
  const current = new Date();
  for (const issue of issues) {
    if (!issue.returned_at) {
      const book = books.find((b) => b.id === issue.book_id);
      if (book) {
        const dueDate = new Date(issue.due_at);
        if (dueDate < current && book.status !== "overdue") {
          book.status = "overdue";
        } else if (dueDate >= current && book.status === "overdue") {
          book.status = "borrowed";
        }
      }
    }
  }
}

function nextBookCode() {
  const existing = new Set(books.map((b) => b.code));
  let num = 1;
  while (true) {
    const code = `B${String(num).padStart(3, "0")}`;
    if (!existing.has(code)) return code;
    num++;
  }
}

function bookPayload(book) {
  const activeIssue = issues.find((i) => i.book_id === book.id && !i.returned_at);
  const borrower = activeIssue ? activeIssue.borrower : "";
  const due_at = activeIssue ? activeIssue.due_at : null;
  const overdue_days = activeIssue ? daysOverdue(activeIssue) : 0;
  const fine = activeIssue ? calculateFine(activeIssue) : 0.0;
  return {
    id: book.id,
    code: book.code,
    title: book.title,
    author: book.author,
    status: book.status,
    borrower,
    due_at,
    days_overdue: overdue_days,
    fine,
  };
}

function issuePayload(issue) {
  const book = books.find((b) => b.id === issue.book_id);
  const overdue = daysOverdue(issue);
  const fine = issue.returned_at ? issue.fine_amount : calculateFine(issue);
  return {
    id: issue.id,
    book_id: issue.book_id,
    book_code: book ? book.code : "",
    title: book ? book.title : "",
    borrower: issue.borrower,
    issued_at: issue.issued_at,
    due_at: issue.due_at,
    returned_at: issue.returned_at || null,
    status: issue.returned_at ? "returned" : overdue > 0 ? "overdue" : "borrowed",
    days_overdue: overdue,
    fine,
  };
}

// Authentication Middleware
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  const token = authHeader.slice(7).trim();
  const username = decodeAccessToken(token);
  if (!username) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ detail: "User not found" });
  }
  req.user = user;
  next();
}

// ---------------------------------------------------------
// API ROUTES
// ---------------------------------------------------------

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(401).json({ detail: "Invalid username or password" });
  }
  const user = users.find((u) => u.username === String(username).trim());
  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return res.status(401).json({ detail: "Invalid username or password" });
  }
  return res.json({
    token: createAccessToken(user.username),
    username: user.username,
  });
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({ username: req.user.username });
});

app.get("/api/dashboard", authRequired, (req, res) => {
  refreshOverdueStatus();
  const active = issues.filter((item) => !item.returned_at);
  const overdue = active.filter((item) => daysOverdue(item) > 0);
  const outstanding = overdue.reduce((sum, item) => sum + calculateFine(item), 0);
  const collected = issues
    .filter((item) => item.returned_at && item.fine_amount)
    .reduce((sum, item) => sum + item.fine_amount, 0);
  const recent = issues
    .slice()
    .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())
    .slice(0, 6);

  res.json({
    total_books: books.length,
    available: books.filter((b) => b.status === "available").length,
    borrowed: books.filter((b) => b.status === "borrowed").length,
    overdue: overdue.length,
    active_loans: active.length,
    outstanding_fines: Math.round(outstanding * 100) / 100,
    collected_fines: Math.round(collected * 100) / 100,
    recent_issues: recent.map(issuePayload),
    overdue_items: overdue.map(issuePayload),
  });
});

app.get("/api/books", authRequired, (req, res) => {
  refreshOverdueStatus();
  const search = String(req.query.q || "").trim().toLowerCase();
  const sort = req.query.sort || "default";

  let items = books.map(bookPayload);
  if (search) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.author.toLowerCase().includes(search) ||
        item.code.toLowerCase().includes(search)
    );
  }

  if (sort === "title") {
    items.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "author") {
    items.sort((a, b) => a.author.localeCompare(b.author));
  } else if (sort === "status") {
    items.sort((a, b) => a.status.localeCompare(b.status));
  } else {
    items.sort((a, b) => a.code.localeCompare(b.code));
  }

  res.json(items);
});

app.post("/api/books", authRequired, (req, res) => {
  const title = (req.body?.title || "").trim();
  const author = (req.body?.author || "").trim();
  if (!title || !author) {
    return res.status(400).json({ detail: "Title and author are required" });
  }

  const book = {
    id: nextBookId++,
    code: nextBookCode(),
    title,
    author,
    status: "available",
  };
  books.push(book);
  res.status(201).json(bookPayload(book));
});

app.put("/api/books/:book_id", authRequired, (req, res) => {
  const bookId = parseInt(req.params.book_id, 10);
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ detail: "Book not found" });
  }

  const title = (req.body?.title || "").trim();
  const author = (req.body?.author || "").trim();
  if (!title || !author) {
    return res.status(400).json({ detail: "Title and author are required" });
  }

  book.title = title;
  book.author = author;
  res.json(bookPayload(book));
});

app.delete("/api/books/:book_id", authRequired, (req, res) => {
  const bookId = parseInt(req.params.book_id, 10);
  const bookIndex = books.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) {
    return res.status(404).json({ detail: "Book not found" });
  }

  const book = books[bookIndex];
  if (book.status !== "available") {
    return res.status(400).json({ detail: "A borrowed or overdue book cannot be deleted" });
  }

  const hasHistory = issues.some((i) => i.book_id === book.id);
  if (hasHistory) {
    return res.status(400).json({ detail: "Cannot delete a book with issue history" });
  }

  books.splice(bookIndex, 1);
  res.json({ ok: true });
});

app.post("/api/issues", authRequired, (req, res) => {
  refreshOverdueStatus();
  const bookId = parseInt(req.body?.book_id, 10);
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ detail: "Book not found" });
  }
  if (book.status !== "available") {
    return res.status(400).json({ detail: "This book is not currently available" });
  }

  const borrower = (req.body?.borrower || "").trim();
  if (!borrower) {
    return res.status(400).json({ detail: "Borrower name is required" });
  }

  const issueNow = new Date();
  const dueDate = new Date(issueNow.getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);

  const issue = {
    id: nextIssueId++,
    book_id: book.id,
    borrower,
    issued_at: issueNow.toISOString(),
    due_at: dueDate.toISOString(),
    returned_at: null,
    fine_amount: 0.0,
  };

  book.status = "borrowed";
  issues.push(issue);
  res.json(issuePayload(issue));
});

app.get("/api/issues", authRequired, (req, res) => {
  refreshOverdueStatus();
  const active = req.query.active !== "false" && req.query.active !== false;
  let items = issues.filter((item) => (active ? item.returned_at === null : true));
  items.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  res.json(items.map(issuePayload));
});

app.post("/api/returns", authRequired, (req, res) => {
  refreshOverdueStatus();
  const bookId = parseInt(req.body?.book_id, 10);
  const book = books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ detail: "Book not found" });
  }

  const issue = issues.find((i) => i.book_id === book.id && !i.returned_at);
  if (!issue) {
    return res.status(400).json({ detail: "This book is not currently borrowed" });
  }

  const returnNow = new Date();
  issue.returned_at = returnNow.toISOString();
  issue.fine_amount = calculateFine(issue, returnNow);
  book.status = "available";

  res.json(issuePayload(issue));
});

app.get("/api/returns", authRequired, (req, res) => {
  const items = issues
    .filter((item) => item.returned_at != null)
    .sort((a, b) => new Date(b.returned_at).getTime() - new Date(a.returned_at).getTime());
  res.json(items.map(issuePayload));
});

app.get("/api/fines", authRequired, (req, res) => {
  refreshOverdueStatus();
  const records = [];
  let total = 0.0;

  for (const issue of issues) {
    const fine = issue.returned_at ? issue.fine_amount : calculateFine(issue);
    const overdue = daysOverdue(issue);
    if (fine <= 0 && overdue <= 0) continue;

    const payload = issuePayload(issue);
    records.push(payload);
    total += payload.fine;
  }

  records.sort((a, b) => b.fine - a.fine);

  res.json({
    total: Math.round(total * 100) / 100,
    count: records.length,
    items: records,
  });
});

app.get("/api/availability", authRequired, (req, res) => {
  refreshOverdueStatus();
  const statusFilter = req.query.status || "all";
  let items = books.map(bookPayload);

  if (statusFilter === "available") {
    items = items.filter((b) => b.status === "available");
  } else if (statusFilter === "borrowed") {
    items = items.filter((b) => b.status === "borrowed" || b.status === "overdue");
  } else if (statusFilter === "overdue") {
    items = items.filter((b) => b.status === "overdue");
  }

  res.json(items);
});

// ---------------------------------------------------------
// STATIC ASSETS & HEALTH
// ---------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LIBRA server running on http://0.0.0.0:${PORT}`);
});
