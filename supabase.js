import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const LOAN_DAYS = 14;
const FINE_PER_DAY = 10.0;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const digest = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}$${digest}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes("$")) return false;
  const [salt, digest] = stored.split("$");
  const check = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return check === digest;
}

export function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

export function daysOverdue(issue, customNow = new Date()) {
  const due = new Date(issue.due_at);
  const end = issue.returned_at ? new Date(issue.returned_at) : new Date(customNow);
  if (end <= due) return 0;
  const dueDateOnly = toDateOnly(due);
  const endDateOnly = toDateOnly(end);
  const diffMs = endDateOnly.getTime() - dueDateOnly.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function calculateFine(issue, customNow = new Date()) {
  return Math.round(daysOverdue(issue, customNow) * FINE_PER_DAY * 100) / 100;
}

// ---------------------------------------------------------
// Local in-memory store for development/preview fallback
// ---------------------------------------------------------
const localStore = {
  users: [
    {
      id: 1,
      username: "admin",
      password_hash: "f7b192c308e9a2b847c9f80164c92b45$8bf88d7a47c2a30c57f7fbd840035b31eaeda7d8483564fd0b604bb95c33d062",
    },
  ],
  nextBookId: 9,
  nextIssueId: 4,
  books: [
    { id: 1, code: "B001", title: "Introduction to Python", author: "Mark Lutz", status: "available" },
    { id: 2, code: "B002", title: "Database System Concepts", author: "Abraham Silberschatz", status: "borrowed" },
    { id: 3, code: "B003", title: "Computer Networks", author: "Andrew S. Tanenbaum", status: "available" },
    { id: 4, code: "B004", title: "Software Engineering", author: "Ian Sommerville", status: "borrowed" },
    { id: 5, code: "B005", title: "Data Structures and Algorithms", author: "Robert Lafore", status: "available" },
    { id: 6, code: "B006", title: "Web Technologies", author: "Uttam K. Roy", status: "available" },
    { id: 7, code: "B007", title: "Operating Systems", author: "Abraham Silberschatz", status: "available" },
    { id: 8, code: "B008", title: "Computer Organization", author: "Carl Hamacher", status: "overdue" },
  ],
  issues: [
    {
      id: 1,
      book_id: 2,
      borrower: "Student A",
      issued_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      due_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      returned_at: null,
      fine_amount: 0.0,
    },
    {
      id: 2,
      book_id: 4,
      borrower: "Student B",
      issued_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      due_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      returned_at: null,
      fine_amount: 0.0,
    },
    {
      id: 3,
      book_id: 8,
      borrower: "Student C",
      issued_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      due_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      returned_at: null,
      fine_amount: 0.0,
    },
  ],
};

// ---------------------------------------------------------
// Supabase Client Initialization
// ---------------------------------------------------------
let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY
  )?.trim();

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log(`[Database] Connected to Supabase PostgreSQL at ${url}`);
      return supabaseClient;
    } catch (err) {
      console.error("[Database] Failed to initialize Supabase client:", err.message);
      return null;
    }
  }

  return null;
}

export function isSupabaseConnected() {
  return getSupabase() !== null;
}

// ---------------------------------------------------------
// Data Mapping & Helpers
// ---------------------------------------------------------
export function buildBookPayload(book, activeIssue = null) {
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

export function buildIssuePayload(issue, book = null) {
  const overdue = daysOverdue(issue);
  const fine = issue.returned_at ? Number(issue.fine_amount || 0) : calculateFine(issue);
  return {
    id: issue.id,
    book_id: issue.book_id,
    book_code: book ? book.code : issue.book_code || "",
    title: book ? book.title : issue.title || "",
    borrower: issue.borrower,
    issued_at: issue.issued_at,
    due_at: issue.due_at,
    returned_at: issue.returned_at || null,
    status: issue.returned_at ? "returned" : overdue > 0 ? "overdue" : "borrowed",
    days_overdue: overdue,
    fine,
  };
}

// Generate next code (B001, B002, ...)
export async function getNextBookCode() {
  const client = getSupabase();
  if (client) {
    const { data: booksData, error } = await client.from("books").select("code");
    if (!error && booksData) {
      const existing = new Set((booksData || []).map((b) => b.code));
      let num = 1;
      while (true) {
        const code = `B${String(num).padStart(3, "0")}`;
        if (!existing.has(code)) return code;
        num++;
      }
    }
  }

  const existing = new Set(localStore.books.map((b) => b.code));
  let num = 1;
  while (true) {
    const code = `B${String(num).padStart(3, "0")}`;
    if (!existing.has(code)) return code;
    num++;
  }
}

// ---------------------------------------------------------
// Seed Check for Supabase (Ensures admin and seeds exist)
// ---------------------------------------------------------
export async function ensureSupabaseSeeded() {
  const client = getSupabase();
  if (!client) return;

  try {
    const { count: userCount, error: userError } = await client
      .from("users")
      .select("*", { count: "exact", head: true });

    if (!userError && userCount === 0) {
      console.log("[Database] Seeding default admin user into Supabase...");
      await client.from("users").insert([
        {
          username: "admin",
          password_hash: "f7b192c308e9a2b847c9f80164c92b45$8bf88d7a47c2a30c57f7fbd840035b31eaeda7d8483564fd0b604bb95c33d062",
        },
      ]);
    }

    const { count: bookCount, error: bookError } = await client
      .from("books")
      .select("*", { count: "exact", head: true });

    if (!bookError && bookCount === 0) {
      console.log("[Database] Seeding sample catalog books into Supabase...");
      const { data: insertedBooks } = await client.from("books").insert(localStore.books).select();

      if (insertedBooks && insertedBooks.length >= 8) {
        const bookMap = {};
        insertedBooks.forEach((b) => {
          bookMap[b.code] = b.id;
        });

        const seedIssues = [
          {
            book_id: bookMap["B002"] || 2,
            borrower: "Student A",
            issued_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            due_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            returned_at: null,
            fine_amount: 0.0,
          },
          {
            book_id: bookMap["B004"] || 4,
            borrower: "Student B",
            issued_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            due_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            returned_at: null,
            fine_amount: 0.0,
          },
          {
            book_id: bookMap["B008"] || 8,
            borrower: "Student C",
            issued_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            due_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            returned_at: null,
            fine_amount: 0.0,
          },
        ];
        await client.from("issues").insert(seedIssues);
      }
    }
  } catch (err) {
    console.warn("[Database] Supabase auto-seed notice (tables may not be created yet):", err.message);
  }
}

export function isTableMissingError(error) {
  if (!error) return false;
  const msg = String(error.message || "");
  return (
    msg.includes("Could not find the table") ||
    (msg.includes("relation") && msg.includes("does not exist")) ||
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205"
  );
}

// ---------------------------------------------------------
// User Operations
// ---------------------------------------------------------
export async function findUserByUsername(username) {
  const cleanUsername = String(username || "").trim();
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("users")
      .select("*")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (!error && data) return data;
  }

  return localStore.users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase()) || null;
}

export async function createUser({ username, password }) {
  const cleanUsername = String(username || "").trim();
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error("Username must be at least 3 characters long");
  }
  if (!password || password.length < 4) {
    throw new Error("Password must be at least 4 characters long");
  }

  const existing = await findUserByUsername(cleanUsername);
  if (existing) {
    throw new Error("Username is already taken");
  }

  const password_hash = hashPassword(password);
  const client = getSupabase();

  if (client) {
    const { data, error } = await client
      .from("users")
      .insert([{ username: cleanUsername, password_hash }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Username is already taken");
      }
      if (isTableMissingError(error)) {
        console.warn("[Database] Supabase 'users' table not found. Using local store fallback.");
      } else {
        throw new Error(error.message);
      }
    } else if (data) {
      return { id: data.id, username: data.username };
    }
  }

  const newUser = {
    id: localStore.users.length + 1,
    username: cleanUsername,
    password_hash,
  };
  localStore.users.push(newUser);
  return { id: newUser.id, username: newUser.username };
}

// ---------------------------------------------------------
// Refresh Overdue Statuses
// ---------------------------------------------------------
export async function refreshOverdueStatus() {
  const current = new Date();
  const client = getSupabase();

  if (client) {
    const { data: activeIssues } = await client
      .from("issues")
      .select("*, books(*)")
      .is("returned_at", null);

    if (activeIssues && activeIssues.length) {
      for (const issue of activeIssues) {
        const dueDate = new Date(issue.due_at);
        const book = issue.books;
        if (book) {
          if (dueDate < current && book.status !== "overdue") {
            await client.from("books").update({ status: "overdue" }).eq("id", book.id);
          } else if (dueDate >= current && book.status === "overdue") {
            await client.from("books").update({ status: "borrowed" }).eq("id", book.id);
          }
        }
      }
    }
    return;
  }

  for (const issue of localStore.issues) {
    if (!issue.returned_at) {
      const book = localStore.books.find((b) => b.id === issue.book_id);
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

// ---------------------------------------------------------
// Dashboard Operations
// ---------------------------------------------------------
export async function getDashboardData() {
  await refreshOverdueStatus();
  const client = getSupabase();

  if (client) {
    const { data: booksData, error: bErr } = await client.from("books").select("*");
    const { data: issuesData, error: iErr } = await client
      .from("issues")
      .select("*, books(code, title)")
      .order("issued_at", { ascending: false });

    if (!isTableMissingError(bErr) && !isTableMissingError(iErr) && booksData && issuesData) {
      const allBooks = booksData || [];
      const allIssues = issuesData || [];

      const active = allIssues.filter((i) => !i.returned_at);
      const overdue = active.filter((i) => daysOverdue(i) > 0);
      const outstanding = overdue.reduce((sum, item) => sum + calculateFine(item), 0);
      const collected = allIssues
        .filter((i) => i.returned_at && i.fine_amount)
        .reduce((sum, item) => sum + Number(item.fine_amount), 0);
      const recent = allIssues.slice(0, 6);

      return {
        total_books: allBooks.length,
        available: allBooks.filter((b) => b.status === "available").length,
        borrowed: allBooks.filter((b) => b.status === "borrowed").length,
        overdue: overdue.length,
        active_loans: active.length,
        outstanding_fines: Math.round(outstanding * 100) / 100,
        collected_fines: Math.round(collected * 100) / 100,
        recent_issues: recent.map((item) => buildIssuePayload(item, item.books)),
        overdue_items: overdue.map((item) => buildIssuePayload(item, item.books)),
      };
    }
  }

  const active = localStore.issues.filter((item) => !item.returned_at);
  const overdue = active.filter((item) => daysOverdue(item) > 0);
  const outstanding = overdue.reduce((sum, item) => sum + calculateFine(item), 0);
  const collected = localStore.issues
    .filter((item) => item.returned_at && item.fine_amount)
    .reduce((sum, item) => sum + item.fine_amount, 0);
  const recent = localStore.issues
    .slice()
    .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())
    .slice(0, 6);

  return {
    total_books: localStore.books.length,
    available: localStore.books.filter((b) => b.status === "available").length,
    borrowed: localStore.books.filter((b) => b.status === "borrowed").length,
    overdue: overdue.length,
    active_loans: active.length,
    outstanding_fines: Math.round(outstanding * 100) / 100,
    collected_fines: Math.round(collected * 100) / 100,
    recent_issues: recent.map((item) => {
      const b = localStore.books.find((book) => book.id === item.book_id);
      return buildIssuePayload(item, b);
    }),
    overdue_items: overdue.map((item) => {
      const b = localStore.books.find((book) => book.id === item.book_id);
      return buildIssuePayload(item, b);
    }),
  };
}

// ---------------------------------------------------------
// Book Operations
// ---------------------------------------------------------
export async function getBooksCatalog(search = "", sort = "default") {
  await refreshOverdueStatus();
  const client = getSupabase();

  let items = [];

  if (client) {
    const { data: booksData, error: bErr } = await client.from("books").select("*");
    const { data: activeIssues } = await client
      .from("issues")
      .select("*")
      .is("returned_at", null);

    if (!isTableMissingError(bErr) && booksData) {
      const issueMap = {};
      (activeIssues || []).forEach((issue) => {
        issueMap[issue.book_id] = issue;
      });

      items = (booksData || []).map((book) => buildBookPayload(book, issueMap[book.id]));
    } else {
      items = localStore.books.map((book) => {
        const activeIssue = localStore.issues.find((i) => i.book_id === book.id && !i.returned_at);
        return buildBookPayload(book, activeIssue);
      });
    }
  } else {
    items = localStore.books.map((book) => {
      const activeIssue = localStore.issues.find((i) => i.book_id === book.id && !i.returned_at);
      return buildBookPayload(book, activeIssue);
    });
  }

  if (search) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
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

  return items;
}

export async function createBook({ title, author }) {
  const code = await getNextBookCode();
  const client = getSupabase();

  if (client) {
    const { data, error } = await client
      .from("books")
      .insert([
        {
          code,
          title: title.trim(),
          author: author.trim(),
          status: "available",
        },
      ])
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        console.warn("[Database] Supabase 'books' table not found. Using local store fallback.");
      } else {
        throw new Error(error.message);
      }
    } else if (data) {
      return buildBookPayload(data);
    }
  }

  const book = {
    id: localStore.nextBookId++,
    code,
    title: title.trim(),
    author: author.trim(),
    status: "available",
  };
  localStore.books.push(book);
  return buildBookPayload(book);
}

export async function updateBook(id, { title, author }) {
  const bookId = parseInt(id, 10);
  const client = getSupabase();

  if (client) {
    const { data, error } = await client
      .from("books")
      .update({
        title: title.trim(),
        author: author.trim(),
      })
      .eq("id", bookId)
      .select()
      .single();

    if (error) {
      if (!isTableMissingError(error)) throw new Error(error?.message || "Book not found");
    } else if (data) {
      const { data: activeIssue } = await client
        .from("issues")
        .select("*")
        .eq("book_id", bookId)
        .is("returned_at", null)
        .maybeSingle();

      return buildBookPayload(data, activeIssue);
    }
  }

  const book = localStore.books.find((b) => b.id === bookId);
  if (!book) throw new Error("Book not found");

  book.title = title.trim();
  book.author = author.trim();

  const activeIssue = localStore.issues.find((i) => i.book_id === book.id && !i.returned_at);
  return buildBookPayload(book, activeIssue);
}

export async function deleteBook(id) {
  const bookId = parseInt(id, 10);
  const client = getSupabase();

  if (client) {
    const { data: book, error: bErr } = await client.from("books").select("*").eq("id", bookId).maybeSingle();
    if (!isTableMissingError(bErr) && book) {
      if (book.status !== "available") {
        throw new Error("A borrowed or overdue book cannot be deleted");
      }

      const { count: issueHistoryCount } = await client
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("book_id", bookId);

      if (issueHistoryCount && issueHistoryCount > 0) {
        throw new Error("Cannot delete a book with issue history");
      }

      const { error } = await client.from("books").delete().eq("id", bookId);
      if (error && !isTableMissingError(error)) throw new Error(error.message);
      return { ok: true };
    }
  }

  const bookIndex = localStore.books.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) throw new Error("Book not found");

  const book = localStore.books[bookIndex];
  if (book.status !== "available") {
    throw new Error("A borrowed or overdue book cannot be deleted");
  }

  const hasHistory = localStore.issues.some((i) => i.book_id === book.id);
  if (hasHistory) {
    throw new Error("Cannot delete a book with issue history");
  }

  localStore.books.splice(bookIndex, 1);
  return { ok: true };
}

// ---------------------------------------------------------
// Issue & Return Operations
// ---------------------------------------------------------
export async function issueBook({ book_id, borrower }) {
  await refreshOverdueStatus();
  const bookId = parseInt(book_id, 10);
  const client = getSupabase();

  if (client) {
    const { data: book, error: bErr } = await client.from("books").select("*").eq("id", bookId).maybeSingle();
    if (!isTableMissingError(bErr) && book) {
      if (book.status !== "available") {
        throw new Error("This book is not currently available");
      }

      const issueNow = new Date();
      const dueDate = new Date(issueNow.getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);

      const { data: issue, error: issueError } = await client
        .from("issues")
        .insert([
          {
            book_id: book.id,
            borrower: borrower.trim(),
            issued_at: issueNow.toISOString(),
            due_at: dueDate.toISOString(),
            returned_at: null,
            fine_amount: 0.0,
          },
        ])
        .select()
        .single();

      if (issueError) {
        if (!isTableMissingError(issueError)) throw new Error(issueError.message);
      } else {
        await client.from("books").update({ status: "borrowed" }).eq("id", book.id);
        return buildIssuePayload(issue, book);
      }
    }
  }

  const book = localStore.books.find((b) => b.id === bookId);
  if (!book) throw new Error("Book not found");
  if (book.status !== "available") {
    throw new Error("This book is not currently available");
  }

  const issueNow = new Date();
  const dueDate = new Date(issueNow.getTime() + LOAN_DAYS * 24 * 60 * 60 * 1000);

  const issue = {
    id: localStore.nextIssueId++,
    book_id: book.id,
    borrower: borrower.trim(),
    issued_at: issueNow.toISOString(),
    due_at: dueDate.toISOString(),
    returned_at: null,
    fine_amount: 0.0,
  };

  book.status = "borrowed";
  localStore.issues.push(issue);
  return buildIssuePayload(issue, book);
}

export async function returnBook({ book_id }) {
  await refreshOverdueStatus();
  const bookId = parseInt(book_id, 10);
  const client = getSupabase();

  if (client) {
    const { data: book, error: bErr } = await client.from("books").select("*").eq("id", bookId).maybeSingle();
    if (!isTableMissingError(bErr) && book) {
      const { data: issue } = await client
        .from("issues")
        .select("*")
        .eq("book_id", bookId)
        .is("returned_at", null)
        .maybeSingle();

      if (!issue) throw new Error("This book is not currently borrowed");

      const returnNow = new Date();
      const fineAmount = calculateFine(issue, returnNow);

      const { data: updatedIssue, error } = await client
        .from("issues")
        .update({
          returned_at: returnNow.toISOString(),
          fine_amount: fineAmount,
        })
        .eq("id", issue.id)
        .select()
        .single();

      if (error) {
        if (!isTableMissingError(error)) throw new Error(error.message);
      } else {
        await client.from("books").update({ status: "available" }).eq("id", book.id);
        return buildIssuePayload(updatedIssue, book);
      }
    }
  }

  const book = localStore.books.find((b) => b.id === bookId);
  if (!book) throw new Error("Book not found");

  const issue = localStore.issues.find((i) => i.book_id === book.id && !i.returned_at);
  if (!issue) throw new Error("This book is not currently borrowed");

  const returnNow = new Date();
  issue.returned_at = returnNow.toISOString();
  issue.fine_amount = calculateFine(issue, returnNow);
  book.status = "available";

  return buildIssuePayload(issue, book);
}

export async function getIssuesList(activeOnly = true) {
  await refreshOverdueStatus();
  const client = getSupabase();

  if (client) {
    let query = client.from("issues").select("*, books(code, title)").order("issued_at", { ascending: false });
    if (activeOnly) {
      query = query.is("returned_at", null);
    }
    const { data, error } = await query;
    if (!isTableMissingError(error) && data) {
      return data.map((item) => buildIssuePayload(item, item.books));
    }
  }

  let items = localStore.issues.filter((item) => (activeOnly ? item.returned_at === null : true));
  items.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime());
  return items.map((item) => {
    const book = localStore.books.find((b) => b.id === item.book_id);
    return buildIssuePayload(item, book);
  });
}

export async function getReturnedList() {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("issues")
      .select("*, books(code, title)")
      .not("returned_at", "is", null)
      .order("returned_at", { ascending: false });

    if (!isTableMissingError(error) && data) {
      return data.map((item) => buildIssuePayload(item, item.books));
    }
  }

  const items = localStore.issues
    .filter((item) => item.returned_at != null)
    .sort((a, b) => new Date(b.returned_at).getTime() - new Date(a.returned_at).getTime());

  return items.map((item) => {
    const book = localStore.books.find((b) => b.id === item.book_id);
    return buildIssuePayload(item, book);
  });
}

export async function getFinesSummary() {
  await refreshOverdueStatus();
  const client = getSupabase();

  if (client) {
    const { data, error } = await client.from("issues").select("*, books(code, title)");
    if (!isTableMissingError(error) && data) {
      const records = [];
      let total = 0.0;

      for (const item of data || []) {
        const fine = item.returned_at ? Number(item.fine_amount || 0) : calculateFine(item);
        const overdue = daysOverdue(item);
        if (fine <= 0 && overdue <= 0) continue;

        const payload = buildIssuePayload(item, item.books);
        records.push(payload);
        total += payload.fine;
      }

      records.sort((a, b) => b.fine - a.fine);
      return {
        total: Math.round(total * 100) / 100,
        count: records.length,
        items: records,
      };
    }
  }

  const records = [];
  let total = 0.0;

  for (const issue of localStore.issues) {
    const fine = issue.returned_at ? issue.fine_amount : calculateFine(issue);
    const overdue = daysOverdue(issue);
    if (fine <= 0 && overdue <= 0) continue;

    const book = localStore.books.find((b) => b.id === issue.book_id);
    const payload = buildIssuePayload(issue, book);
    records.push(payload);
    total += payload.fine;
  }

  records.sort((a, b) => b.fine - a.fine);

  return {
    total: Math.round(total * 100) / 100,
    count: records.length,
    items: records,
  };
}

export async function getAvailabilityList(statusFilter = "all") {
  await refreshOverdueStatus();
  let items = await getBooksCatalog();

  if (statusFilter === "available") {
    items = items.filter((b) => b.status === "available");
  } else if (statusFilter === "borrowed") {
    items = items.filter((b) => b.status === "borrowed" || b.status === "overdue");
  } else if (statusFilter === "overdue") {
    items = items.filter((b) => b.status === "overdue");
  }

  return items;
}
