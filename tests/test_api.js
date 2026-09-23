import assert from "assert/strict";

const BASE_URL = "http://127.0.0.1:3000";

async function runTests() {
  console.log("=== Starting LIBRA End-to-End API Test Suite ===");
  let authToken = "";

  // 1. Health check
  console.log("\n[Test 1] Health Check...");
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.equal(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.equal(healthData.status, "ok");
  console.log("✓ Health Check passed:", healthData);

  // 2. FR-01: Authentication with valid credentials
  console.log("\n[Test 2] FR-01: Login with valid credentials (admin / admin123)...");
  const loginRes = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.token);
  assert.equal(loginData.username, "admin");
  authToken = loginData.token;
  console.log("✓ Valid login successful, token acquired.");

  // 3. FR-01: Authentication rejection with invalid credentials
  console.log("\n[Test 3] FR-01: Login with invalid credentials...");
  const badLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrongpassword" }),
  });
  assert.equal(badLoginRes.status, 401);
  console.log("✓ Bad login rejected with 401 Unauthorized.");

  // 3a. FR-01: User Registration
  console.log("\n[Test 3a] User Registration (Create New Account)...");
  const testUser = `newuser_${Date.now()}`;
  const regRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: "password123" }),
  });
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.ok(regData.token);
  assert.equal(regData.username, testUser);
  console.log("✓ New user registered successfully:", testUser);

  // 3b. Duplicate registration rejection
  console.log("\n[Test 3b] Duplicate Registration Rejection...");
  const dupRes = await fetch(`${BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: "password123" }),
  });
  assert.equal(dupRes.status, 409);
  console.log("✓ Duplicate username rejected with 409 Conflict.");

  // 3c. Login with newly created credentials
  console.log("\n[Test 3c] Login with newly created user credentials...");
  const newLoginRes = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: "password123" }),
  });
  assert.equal(newLoginRes.status, 200);
  const newLoginData = await newLoginRes.json();
  assert.equal(newLoginData.username, testUser);
  console.log("✓ Successfully logged in with newly created account credentials.");

  // 4. Auth headers helper
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  // 5. FR-01: Check /api/me
  console.log("\n[Test 4] Check /api/me session...");
  const meRes = await fetch(`${BASE_URL}/api/me`, { headers: authHeaders });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.username, "admin");
  console.log("✓ Authenticated user profile matches.");

  // 6. Dashboard metrics
  console.log("\n[Test 5] Dashboard metrics...");
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, { headers: authHeaders });
  assert.equal(dashRes.status, 200);
  const dash = await dashRes.json();
  assert.ok(typeof dash.total_books === "number");
  assert.ok(typeof dash.available === "number");
  assert.ok(typeof dash.borrowed === "number");
  assert.ok(typeof dash.overdue === "number");
  assert.ok(Array.isArray(dash.recent_issues));
  console.log("✓ Dashboard metrics verified. Total books:", dash.total_books);

  // 7. FR-02: Get books catalog and search
  console.log("\n[Test 6] FR-02: Books Catalog & Search...");
  const booksRes = await fetch(`${BASE_URL}/api/books`, { headers: authHeaders });
  assert.equal(booksRes.status, 200);
  const allBooks = await booksRes.json();
  assert.ok(allBooks.length >= 8);

  const searchRes = await fetch(`${BASE_URL}/api/books?q=Python`, { headers: authHeaders });
  assert.equal(searchRes.status, 200);
  const searchResults = await searchRes.json();
  assert.ok(searchResults.some((b) => b.title.includes("Python")));
  console.log("✓ Books catalog & search verified.");

  // 8. FR-02: Add new book
  console.log("\n[Test 7] FR-02: Add new book...");
  const newBookRes = await fetch(`${BASE_URL}/api/books`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Design Patterns in Practice",
      author: "Erich Gamma",
    }),
  });
  assert.equal(newBookRes.status, 201);
  const newBook = await newBookRes.json();
  assert.ok(newBook.id);
  assert.ok(newBook.code);
  assert.equal(newBook.status, "available");
  assert.equal(newBook.title, "Design Patterns in Practice");
  console.log("✓ New book added with code:", newBook.code, "ID:", newBook.id);

  // 9. FR-02: Update book
  console.log("\n[Test 8] FR-02: Update book...");
  const updateRes = await fetch(`${BASE_URL}/api/books/${newBook.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Design Patterns: Elements of Reusable Object-Oriented Software",
      author: "Gang of Four",
    }),
  });
  assert.equal(updateRes.status, 200);
  const updatedBook = await updateRes.json();
  assert.equal(updatedBook.title, "Design Patterns: Elements of Reusable Object-Oriented Software");
  assert.equal(updatedBook.author, "Gang of Four");
  console.log("✓ Book updated successfully.");

  // 10. FR-03: Issue the book
  console.log("\n[Test 9] FR-03: Issue book to borrower...");
  const issueRes = await fetch(`${BASE_URL}/api/issues`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      book_id: newBook.id,
      borrower: "Alice Smith",
    }),
  });
  assert.equal(issueRes.status, 200);
  const issueData = await issueRes.json();
  assert.equal(issueData.book_id, newBook.id);
  assert.equal(issueData.borrower, "Alice Smith");
  assert.equal(issueData.status, "borrowed");
  console.log("✓ Book issued successfully to Alice Smith.");

  // 11. Operational rule: Cannot delete borrowed book
  console.log("\n[Test 10] Operational Rule: Cannot delete borrowed book...");
  const delBorrowedRes = await fetch(`${BASE_URL}/api/books/${newBook.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  assert.equal(delBorrowedRes.status, 400);
  console.log("✓ Deleting borrowed book correctly rejected with 400.");

  // 12. FR-04: Return the book
  console.log("\n[Test 11] FR-04: Return book...");
  const returnRes = await fetch(`${BASE_URL}/api/returns`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ book_id: newBook.id }),
  });
  assert.equal(returnRes.status, 200);
  const returnData = await returnRes.json();
  assert.equal(returnData.book_id, newBook.id);
  assert.equal(returnData.status, "returned");
  console.log("✓ Book returned successfully.");

  // 13. Operational rule: Cannot delete book with circulation history
  console.log("\n[Test 12] Operational Rule: Cannot delete book with circulation history...");
  const delHistoryRes = await fetch(`${BASE_URL}/api/books/${newBook.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  assert.equal(delHistoryRes.status, 400);
  console.log("✓ Deleting book with history correctly rejected with 400.");

  // 14. FR-05: Fines management
  console.log("\n[Test 13] FR-05: Fines management calculation...");
  const finesRes = await fetch(`${BASE_URL}/api/fines`, { headers: authHeaders });
  assert.equal(finesRes.status, 200);
  const finesData = await finesRes.json();
  assert.ok(typeof finesData.total === "number");
  assert.ok(Array.isArray(finesData.items));
  console.log("✓ Fines report verified. Active fine records:", finesData.count, "Total fine: ₹" + finesData.total);

  // 15. FR-06: Availability filter
  console.log("\n[Test 14] FR-06: Availability catalog...");
  const availRes = await fetch(`${BASE_URL}/api/availability?status=available`, { headers: authHeaders });
  assert.equal(availRes.status, 200);
  const availableBooks = await availRes.json();
  assert.ok(availableBooks.every((b) => b.status === "available"));
  console.log("✓ Availability filtering verified. Available books:", availableBooks.length);

  // 16. Uncirculated book deletion
  console.log("\n[Test 15] Operational Rule: Deleting an uncirculated book...");
  const tempBookRes = await fetch(`${BASE_URL}/api/books`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ title: "Temporary Book", author: "Anon" }),
  });
  const tempBook = await tempBookRes.json();
  const delTempRes = await fetch(`${BASE_URL}/api/books/${tempBook.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  assert.equal(delTempRes.status, 200);
  console.log("✓ Uncirculated book successfully deleted.");

  // 17. AI Intelligence query endpoint
  console.log("\n[Test 16] AI Intelligence: Natural Language Query & Recommendations...");
  // 16a. Unauthenticated check
  const unauthAi = await fetch(`${BASE_URL}/api/ai/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Available books" }),
  });
  assert.equal(unauthAi.status, 401);

  // 16b. Empty query validation
  const emptyAi = await fetch(`${BASE_URL}/api/ai/query`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ query: "" }),
  });
  assert.equal(emptyAi.status, 400);

  // 16c. Realistic query: catalog availability
  const aiQueryRes = await fetch(`${BASE_URL}/api/ai/query`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ query: "Which books on Python or programming are currently available?" }),
  });
  assert.equal(aiQueryRes.status, 200);
  const aiData = await aiQueryRes.json();
  assert.ok(aiData.answer && typeof aiData.answer === "string");
  assert.ok(Array.isArray(aiData.referencedBooks));
  assert.ok(["gemini", "local_intelligence"].includes(aiData.source));
  console.log("✓ AI query answered successfully via [" + aiData.source + "]. Referenced books count:", aiData.referencedBooks.length);

  // 16d. PWA assets verification
  console.log("\n[Test 17] PWA Compliance: Manifest and Service Worker Assets...");
  const manifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
  assert.equal(manifestRes.status, 200);
  const manifestJson = await manifestRes.json();
  assert.equal(manifestJson.name, "LIBRA | Digital Library Management System");
  assert.equal(manifestJson.display, "standalone");
  assert.ok(manifestJson.icons.length >= 2);

  const swRes = await fetch(`${BASE_URL}/sw.js`);
  assert.equal(swRes.status, 200);
  console.log("✓ PWA Manifest and Service Worker validated.");

  console.log("\n🎉 ALL 17 AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("\n❌ Test Suite Failed:", err);
  process.exit(1);
});
