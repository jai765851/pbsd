const TOKEN_KEY = "lms_token";
const USER_KEY = "lms_user";

const loginPage = document.getElementById("login-page");
const app = document.getElementById("app");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginButton = document.getElementById("login-button");
const profileName = document.getElementById("profile-name");
const profileAvatar = document.getElementById("profile-avatar");
const logoutButton = document.getElementById("logout-button");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");
const closeSidebar = document.getElementById("close-sidebar");
const pageTitle = document.getElementById("breadcrumb-title");
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".page-section");
const bookSearch = document.getElementById("book-search");
const bookSort = document.getElementById("book-sort");
const bookCollection = document.getElementById("book-collection");
const bookTableWrap = document.getElementById("catalog-data-panel");
const bookTableBody = document.getElementById("book-table-body");
const availabilityGrid = document.getElementById("availability-grid");
const issueForm = document.getElementById("issue-form");
const returnForm = document.getElementById("return-form");
const issueBookSelect = document.getElementById("issue-book");
const returnBookSelect = document.getElementById("return-book");
const issuedTableBody = document.getElementById("issued-table-body");
const returnedTableBody = document.getElementById("returned-table-body");
const fineTableBody = document.getElementById("fine-table-body");
const issueMessage = document.getElementById("issue-message");
const returnMessage = document.getElementById("return-message");
const addBookButton = document.getElementById("add-book-button");
const bookModal = document.getElementById("book-modal");
const bookForm = document.getElementById("add-book-form");
const bookFormMessage = document.getElementById("book-form-message");
const detailModal = document.getElementById("detail-modal");
const toast = document.getElementById("toast");
const gridViewButton = document.getElementById("grid-view-btn");
const listViewButton = document.getElementById("list-view-btn");

let catalogView = "grid";
let books = [];
let catalog = [];
let currentBook = null;
let availabilityFilter = "all";
let toastTimer = null;
let searchTimer = null;

function token() {
    return localStorage.getItem(TOKEN_KEY);
}

function setSession(accessToken, username) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, username);
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function showLogin() {
    app.classList.add("hidden");
    loginPage.classList.remove("hidden");
}

function showApp(username) {
    profileName.textContent = username;
    profileAvatar.textContent = username.charAt(0).toUpperCase();
    loginPage.classList.add("hidden");
    app.classList.remove("hidden");
}

async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    const access = token();
    if (access) {
        headers.Authorization = `Bearer ${access}`;
    }
    const response = await fetch(path, { ...options, headers });
    let data = null;
    const text = await response.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { detail: text };
        }
    }
    if (response.status === 401) {
        clearSession();
        showLogin();
        throw new Error(data && data.detail ? String(data.detail) : "Not authenticated");
    }
    if (!response.ok) {
        const detail = data && data.detail ? data.detail : "Request failed";
        throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    return data;
}

function money(value) {
    return `₹${Number(value || 0).toFixed(0)}`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }
    return String(value).slice(0, 10);
}

function statusBadge(status) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return `<span class="status ${status}">${label}</span>`;
}

function showToast(message, title = "Success") {
    document.getElementById("toast-title").textContent = title;
    document.getElementById("toast-message").textContent = message;
    document.getElementById("toast-icon").textContent = title === "Error" ? "!" : "✓";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function emptyRow(cols, text) {
    return `<tr><td colspan="${cols}">${text}</td></tr>`;
}

function emptyState(text) {
    return `<div class="empty-state"><strong>${text}</strong></div>`;
}

function coverWord(title) {
    const word = String(title || "BOOK").trim().split(/\s+/)[0] || "BOOK";
    return word.slice(0, 12).toUpperCase();
}

async function loadCatalog() {
    catalog = await api("/api/books");
    document.getElementById("sidebar-total").textContent =
        `${catalog.length} ${catalog.length === 1 ? "book" : "books"}`;
    renderIssueSelect();
    renderReturnSelect();
}

async function loadBooks() {
    const params = new URLSearchParams();
    const query = bookSearch.value.trim();
    if (query) {
        params.set("q", query);
    }
    params.set("sort", bookSort.value);
    books = await api(`/api/books?${params.toString()}`);
    renderBooks();
}

function renderBooks() {
    document.getElementById("book-result-count").textContent =
        `${books.length} book${books.length === 1 ? "" : "s"}`;

    const showGrid = catalogView === "grid";
    bookCollection.classList.toggle("hidden", !showGrid);
    bookTableWrap.classList.toggle("hidden", showGrid);

    if (!books.length) {
        bookCollection.innerHTML = emptyState("No books match this search.");
        bookTableBody.innerHTML = emptyRow(5, "No books found.");
        return;
    }

    bookCollection.innerHTML = books.map((book) => `
        <article class="book-card" data-id="${book.id}">
            <div class="book-cover">
                <span class="cover-id">${escapeHTML(book.code)}</span>
                <div class="cover-content">
                    <strong>${escapeHTML(coverWord(book.title))}</strong>
                    <span>${escapeHTML(book.author)}</span>
                </div>
            </div>
            <div class="book-card-info">
                <div class="book-card-title">${escapeHTML(book.title)}</div>
                <div class="book-card-author">${escapeHTML(book.author)}</div>
                <div class="book-card-bottom">
                    ${statusBadge(book.status)}
                    <span class="card-more">›</span>
                </div>
            </div>
        </article>
    `).join("");

    bookCollection.querySelectorAll(".book-card").forEach((card) => {
        card.addEventListener("click", () => openDetails(Number(card.dataset.id)));
    });

    bookTableBody.innerHTML = books.map((book) => `
        <tr>
            <td>${escapeHTML(book.code)}</td>
            <td>${escapeHTML(book.title)}</td>
            <td>${escapeHTML(book.author)}</td>
            <td>${statusBadge(book.status)}</td>
            <td>
                <button type="button" class="table-action" data-act="view" data-id="${book.id}">View</button>
                <button type="button" class="table-action" data-act="edit" data-id="${book.id}">Edit</button>
                <button type="button" class="table-action" data-act="delete" data-id="${book.id}">Delete</button>
            </td>
        </tr>
    `).join("");

    bookTableBody.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            if (button.dataset.act === "view") openDetails(id);
            if (button.dataset.act === "edit") openBookModal(id);
            if (button.dataset.act === "delete") deleteBook(id);
        });
    });
}

function renderIssueSelect() {
    const available = catalog.filter((book) => book.status === "available");
    if (!available.length) {
        issueBookSelect.innerHTML = `<option value="">No available books</option>`;
        return;
    }
    issueBookSelect.innerHTML = `<option value="">Select a book</option>` +
        available.map((book) => `<option value="${book.id}">${escapeHTML(book.code)} — ${escapeHTML(book.title)}</option>`).join("");
}

function renderReturnSelect() {
    const borrowed = catalog.filter((book) => book.status === "borrowed" || book.status === "overdue");
    if (!borrowed.length) {
        returnBookSelect.innerHTML = `<option value="">No borrowed books</option>`;
        return;
    }
    returnBookSelect.innerHTML = `<option value="">Select a book</option>` +
        borrowed.map((book) => `<option value="${book.id}">${escapeHTML(book.code)} — ${escapeHTML(book.title)}</option>`).join("");
}

async function loadDashboard() {
    const data = await api("/api/dashboard");
    document.getElementById("dash-total-books").textContent = data.total_books;
    document.getElementById("dash-available").textContent = data.available;
    document.getElementById("dash-borrowed").textContent = data.borrowed;
    document.getElementById("dash-overdue").textContent = data.overdue;
    document.getElementById("dash-outstanding").textContent = money(data.outstanding_fines);
    document.getElementById("dash-collected").textContent = money(data.collected_fines);
    document.getElementById("total-books").textContent = data.total_books;
    document.getElementById("available-books").textContent = data.available;
    document.getElementById("borrowed-books").textContent = data.borrowed;
    document.getElementById("overdue-books").textContent = data.overdue;

    document.getElementById("recent-table-body").innerHTML = data.recent_issues.length
        ? data.recent_issues.map((item) => `
            <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(item.borrower)}</td>
                <td>${statusBadge(item.status)}</td>
            </tr>`).join("")
        : emptyRow(3, "No circulation yet.");

    document.getElementById("overdue-table-body").innerHTML = data.overdue_items.length
        ? data.overdue_items.map((item) => `
            <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${item.days_overdue}</td>
                <td>${money(item.fine)}</td>
            </tr>`).join("")
        : emptyRow(3, "No overdue books.");
}

async function loadIssues() {
    const items = await api("/api/issues?active=true");
    document.getElementById("issue-count").textContent = String(items.length);
    issuedTableBody.innerHTML = items.length
        ? items.map((item) => `
            <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(item.borrower)}</td>
                <td>${formatDate(item.due_at)}</td>
                <td>${statusBadge(item.status)}</td>
            </tr>`).join("")
        : emptyRow(4, "No active loans.");
}

async function loadReturns() {
    const items = await api("/api/returns");
    returnedTableBody.innerHTML = items.length
        ? items.map((item) => `
            <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(item.borrower)}</td>
                <td>${money(item.fine)}</td>
                <td>${statusBadge("returned")}</td>
            </tr>`).join("")
        : emptyRow(4, "No returned books yet.");
}

async function loadFines() {
    const data = await api("/api/fines");
    document.getElementById("total-fine").textContent = money(data.total);
    document.getElementById("fine-book-count").textContent = String(data.count);
    fineTableBody.innerHTML = data.items.length
        ? data.items.map((item) => {
            const canReturn = item.status !== "returned";
            const action = canReturn
                ? `<button type="button" class="table-action" data-return="${item.book_id}">Return</button>`
                : "—";
            return `
            <tr>
                <td>${escapeHTML(item.title)}</td>
                <td>${escapeHTML(item.borrower)}</td>
                <td>${item.days_overdue}</td>
                <td>${money(item.fine)}</td>
                <td>${action}</td>
            </tr>`;
        }).join("")
        : emptyRow(5, "No overdue fines recorded.");

    fineTableBody.querySelectorAll("[data-return]").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                const result = await api("/api/returns", {
                    method: "POST",
                    body: JSON.stringify({ book_id: Number(button.dataset.return) }),
                });
                await refreshAll();
                const fineNote = result.fine > 0 ? ` Fine: ${money(result.fine)}.` : "";
                showToast(`Book returned.${fineNote}`);
            } catch (error) {
                showToast(error.message, "Error");
            }
        });
    });
}

async function loadAvailability() {
    const items = await api(`/api/availability?status=${availabilityFilter}`);
    if (!items.length) {
        availabilityGrid.innerHTML = emptyState("No books in this category.");
        return;
    }
    availabilityGrid.innerHTML = items.map((book) => `
        <article class="availability-item">
            <div class="availability-cover">${escapeHTML(book.code)}</div>
            <div class="availability-info">
                <strong>${escapeHTML(book.title)}</strong>
                <span>${escapeHTML(book.author)}</span>
                ${book.borrower ? `<span class="availability-user">${escapeHTML(book.borrower)}</span>` : ""}
            </div>
            ${statusBadge(book.status)}
        </article>
    `).join("");
}

async function refreshAll() {
    await loadCatalog();
    await loadBooks();
    await Promise.all([loadDashboard(), loadIssues(), loadReturns(), loadFines(), loadAvailability()]);
}

function findBook(id) {
    return books.find((book) => book.id === id) || catalog.find((book) => book.id === id);
}

function openDetails(id) {
    const book = findBook(id);
    if (!book) return;
    currentBook = book;
    document.getElementById("detail-id").textContent = book.code;
    document.getElementById("detail-cover-title").textContent = coverWord(book.title);
    document.getElementById("detail-title").textContent = book.title;
    document.getElementById("detail-author").textContent = book.author;
    document.getElementById("detail-book-id").textContent = book.code;
    document.getElementById("detail-status").innerHTML = statusBadge(book.status);
    const userRow = document.getElementById("detail-user-row");
    if (book.borrower) {
        userRow.classList.remove("hidden");
        document.getElementById("detail-user").textContent = book.borrower;
    } else {
        userRow.classList.add("hidden");
    }
    detailModal.classList.remove("hidden");
}

function closeDetail() {
    detailModal.classList.add("hidden");
    currentBook = null;
}

function openBookModal(id = null) {
    bookForm.reset();
    bookFormMessage.textContent = "";
    const book = id ? findBook(id) : null;
    document.getElementById("modal-title").textContent = book ? "Update library book" : "Add library book";
    document.getElementById("book-save").textContent = book ? "Save changes" : "Add Book";
    document.getElementById("edit-book-id").value = book ? String(book.id) : "";
    document.getElementById("modal-preview-title").textContent = book ? "Update collection item" : "New collection item";
    document.getElementById("modal-preview-note").textContent = book
        ? "Title and author will be updated."
        : "It will be added as available.";
    if (book) {
        document.getElementById("new-book-title").value = book.title;
        document.getElementById("new-book-author").value = book.author;
    }
    bookModal.classList.remove("hidden");
    document.getElementById("new-book-title").focus();
}

function closeBookModal() {
    bookModal.classList.add("hidden");
    bookForm.reset();
}

async function deleteBook(id) {
    const book = findBook(id);
    if (!book) return;
    if (!window.confirm(`Delete "${book.title}" from the catalog?`)) return;
    try {
        await api(`/api/books/${id}`, { method: "DELETE" });
        closeDetail();
        await refreshAll();
        showToast("Book deleted.");
    } catch (error) {
        showToast(error.message, "Error");
    }
}

function setCatalogView(view) {
    catalogView = view;
    gridViewButton.classList.toggle("active", view === "grid");
    listViewButton.classList.toggle("active", view === "list");
    renderBooks();
}

function goTo(sectionId) {
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.section === sectionId));
    sections.forEach((section) => section.classList.toggle("active-section", section.id === sectionId));
    const labels = {
        dashboard: "Dashboard",
        "book-management": "Collection",
        "book-issue": "Book Issue",
        "book-return": "Book Return",
        "fine-management": "Fine Management",
        "book-availability": "Availability",
    };
    pageTitle.textContent = labels[sectionId] || "Library";
    sidebar.classList.remove("open");
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "";
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (!username || !password) {
        loginMessage.textContent = "Please enter username and password.";
        return;
    }
    loginButton.disabled = true;
    try {
        const data = await api("/api/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });
        setSession(data.token, data.username);
        showApp(data.username);
        await refreshAll();
        showToast(`Welcome, ${data.username}.`);
    } catch (error) {
        loginMessage.textContent = error.message;
    } finally {
        loginButton.disabled = false;
    }
});

document.getElementById("toggle-password").addEventListener("click", () => {
    const field = document.getElementById("password");
    const hidden = field.type === "password";
    field.type = hidden ? "text" : "password";
    document.getElementById("toggle-password").textContent = hidden ? "Hide" : "Show";
});

logoutButton.addEventListener("click", () => {
    clearSession();
    showLogin();
    loginForm.reset();
    showToast("Signed out.", "Session");
});

navItems.forEach((item) => {
    item.addEventListener("click", () => goTo(item.dataset.section));
});

menuToggle.addEventListener("click", () => sidebar.classList.add("open"));
closeSidebar.addEventListener("click", () => sidebar.classList.remove("open"));

bookSearch.addEventListener("input", () => {
    document.getElementById("clear-search").classList.toggle("show", Boolean(bookSearch.value));
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadBooks().catch((error) => showToast(error.message, "Error")), 200);
});
document.getElementById("clear-search").addEventListener("click", () => {
    bookSearch.value = "";
    document.getElementById("clear-search").classList.remove("show");
    loadBooks().catch((error) => showToast(error.message, "Error"));
});
bookSort.addEventListener("change", () => loadBooks().catch((error) => showToast(error.message, "Error")));
gridViewButton.addEventListener("click", () => setCatalogView("grid"));
listViewButton.addEventListener("click", () => setCatalogView("list"));
addBookButton.addEventListener("click", () => openBookModal());
document.getElementById("close-modal").addEventListener("click", closeBookModal);
document.getElementById("cancel-modal").addEventListener("click", closeBookModal);
document.getElementById("close-detail").addEventListener("click", closeDetail);
document.getElementById("detail-update").addEventListener("click", () => {
    const id = currentBook && currentBook.id;
    closeDetail();
    if (id) openBookModal(id);
});
document.getElementById("detail-delete").addEventListener("click", () => {
    if (currentBook) deleteBook(currentBook.id);
});
document.getElementById("header-search-button").addEventListener("click", () => {
    goTo("book-management");
    bookSearch.focus();
});

bookModal.addEventListener("click", (event) => {
    if (event.target === bookModal) closeBookModal();
});
detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) closeDetail();
});

bookForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = document.getElementById("new-book-title").value.trim();
    const author = document.getElementById("new-book-author").value.trim();
    const editId = document.getElementById("edit-book-id").value;
    if (!title || !author) {
        bookFormMessage.textContent = "Title and author are required.";
        return;
    }
    try {
        if (editId) {
            await api(`/api/books/${editId}`, {
                method: "PUT",
                body: JSON.stringify({ title, author }),
            });
            showToast("Book updated.");
        } else {
            await api("/api/books", {
                method: "POST",
                body: JSON.stringify({ title, author }),
            });
            showToast("Book added.");
        }
        closeBookModal();
        await refreshAll();
    } catch (error) {
        bookFormMessage.textContent = error.message;
    }
});

issueForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    issueMessage.textContent = "";
    const bookId = Number(issueBookSelect.value);
    const borrower = document.getElementById("issue-user").value.trim();
    if (!bookId || !borrower) {
        issueMessage.textContent = "Select a book and enter a borrower name.";
        return;
    }
    try {
        await api("/api/issues", {
            method: "POST",
            body: JSON.stringify({ book_id: bookId, borrower }),
        });
        issueForm.reset();
        await refreshAll();
        showToast("Book issued.");
    } catch (error) {
        issueMessage.textContent = error.message;
    }
});

returnForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    returnMessage.textContent = "";
    const bookId = Number(returnBookSelect.value);
    if (!bookId) {
        returnMessage.textContent = "Select a borrowed book.";
        return;
    }
    try {
        const result = await api("/api/returns", {
            method: "POST",
            body: JSON.stringify({ book_id: bookId }),
        });
        returnForm.reset();
        await refreshAll();
        const fineNote = result.fine > 0 ? ` Fine: ${money(result.fine)}.` : "";
        showToast(`Book returned.${fineNote}`);
    } catch (error) {
        returnMessage.textContent = error.message;
    }
});

document.querySelectorAll(".availability-filter").forEach((button) => {
    button.addEventListener("click", async () => {
        document.querySelectorAll(".availability-filter").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        availabilityFilter = button.dataset.filter;
        try {
            await loadAvailability();
        } catch (error) {
            showToast(error.message, "Error");
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeBookModal();
        closeDetail();
        sidebar.classList.remove("open");
    }
    const typing = event.target.matches("input, textarea, select");
    if (event.key === "/" && !typing) {
        event.preventDefault();
        goTo("book-management");
        bookSearch.focus();
    }
});

window.addEventListener("click", (event) => {
    if (window.innerWidth <= 980 && sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
        sidebar.classList.remove("open");
    }
});

async function boot() {
    const saved = token();
    const username = localStorage.getItem(USER_KEY);
    if (!saved || !username) {
        showLogin();
        return;
    }
    try {
        await api("/api/me");
        showApp(username);
        await refreshAll();
    } catch {
        clearSession();
        showLogin();
    }
}

boot();
