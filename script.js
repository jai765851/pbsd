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
        "ai-assistant": "AI Intelligence",
    };
    pageTitle.textContent = labels[sectionId] || "Library";
    sidebar.classList.remove("open");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) backdrop.classList.remove("active");
    if (sectionId === "ai-assistant") {
        const input = document.getElementById("ai-query-input");
        if (input) setTimeout(() => input.focus(), 120);
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

let authMode = "login"; // "login" or "register"

function setAuthMode(mode) {
    authMode = mode;
    loginMessage.textContent = "";

    const isRegister = mode === "register";
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const authSectionLabel = document.getElementById("auth-section-label");
    const authHeadingMain = document.getElementById("auth-heading-main");
    const authHeadingAccent = document.getElementById("auth-heading-accent");
    const authSubtitle = document.getElementById("auth-subtitle");
    const confirmField = document.getElementById("confirm-password-field");
    const loginButtonText = document.getElementById("login-button-text");
    const authSwitchPromptText = document.getElementById("auth-switch-prompt-text");
    const authSwitchLink = document.getElementById("auth-switch-link");
    const loginDefaultHint = document.getElementById("login-default-hint");
    const passwordInput = document.getElementById("password");
    const passwordReqHint = document.getElementById("password-req-hint");

    if (tabLogin) {
        tabLogin.classList.toggle("active", !isRegister);
        tabLogin.setAttribute("aria-selected", !isRegister);
    }
    if (tabRegister) {
        tabRegister.classList.toggle("active", isRegister);
        tabRegister.setAttribute("aria-selected", isRegister);
    }
    if (authSectionLabel) {
        authSectionLabel.textContent = isRegister ? "NEW MEMBERSHIP" : "WELCOME BACK";
    }
    if (authHeadingMain) {
        authHeadingMain.textContent = isRegister ? "Create your " : "Enter your ";
    }
    if (authHeadingAccent) {
        authHeadingAccent.textContent = isRegister ? "account." : "library.";
    }
    if (authSubtitle) {
        authSubtitle.textContent = isRegister
            ? "Register a new account to access the digital catalog."
            : "Sign in to continue to your digital library.";
    }
    if (confirmField) {
        confirmField.classList.toggle("hidden", !isRegister);
    }
    if (loginButtonText) {
        loginButtonText.textContent = isRegister ? "Create Account" : "Access Library";
    }
    if (authSwitchPromptText) {
        authSwitchPromptText.textContent = isRegister ? "Already have an account?" : "Don't have an account?";
    }
    if (authSwitchLink) {
        authSwitchLink.textContent = isRegister ? "Sign In" : "Create Account";
    }
    if (loginDefaultHint) {
        loginDefaultHint.classList.toggle("hidden", isRegister);
    }
    if (passwordInput) {
        passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
    }
    if (passwordReqHint) {
        passwordReqHint.textContent = isRegister ? "Min 4 characters" : "Required";
    }
}

document.getElementById("tab-login")?.addEventListener("click", () => setAuthMode("login"));
document.getElementById("tab-register")?.addEventListener("click", () => setAuthMode("register"));
document.getElementById("auth-switch-link")?.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "";
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password")?.value || "";

    if (!username || !password) {
        loginMessage.textContent = "Please enter username and password.";
        return;
    }

    if (authMode === "register") {
        if (username.length < 3) {
            loginMessage.textContent = "Username must be at least 3 characters long.";
            return;
        }
        if (password.length < 4) {
            loginMessage.textContent = "Password must be at least 4 characters long.";
            return;
        }
        if (password !== confirmPassword) {
            loginMessage.textContent = "Passwords do not match.";
            return;
        }
    }

    loginButton.disabled = true;
    try {
        if (authMode === "register") {
            const data = await api("/api/register", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });
            setSession(data.token, data.username);
            showApp(data.username);
            await refreshAll();
            showToast(`Account created! Welcome, ${data.username}.`);
        } else {
            const data = await api("/api/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
            });
            setSession(data.token, data.username);
            showApp(data.username);
            await refreshAll();
            showToast(`Welcome, ${data.username}.`);
        }
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
    setAuthMode("login");
    showLogin();
    loginForm.reset();
    showToast("Signed out.", "Session");
});

navItems.forEach((item) => {
    item.addEventListener("click", () => goTo(item.dataset.section));
});

const sidebarBackdrop = document.getElementById("sidebar-backdrop");

menuToggle.addEventListener("click", () => {
    sidebar.classList.add("open");
    if (sidebarBackdrop) sidebarBackdrop.classList.add("active");
});

closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("open");
    if (sidebarBackdrop) sidebarBackdrop.classList.remove("active");
});

if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("active");
    });
}

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
        const backdrop = document.getElementById("sidebar-backdrop");
        if (backdrop) backdrop.classList.remove("active");
    }
});

// =========================================================
// AI LIBRARY INTELLIGENCE ASSISTANT
// =========================================================

const headerAiBtn = document.getElementById("header-ai-btn");
if (headerAiBtn) {
    headerAiBtn.addEventListener("click", () => {
        goTo("ai-assistant");
    });
}

const aiForm = document.getElementById("ai-query-form");
const aiInput = document.getElementById("ai-query-input");
const aiMessages = document.getElementById("ai-messages");
const aiLoading = document.getElementById("ai-loading");
const aiError = document.getElementById("ai-error");
const aiRetryBtn = document.getElementById("ai-retry-btn");
const aiClearBtn = document.getElementById("ai-clear-btn");
const aiSubmitBtn = document.getElementById("ai-submit-btn");

let lastAiQuery = "";

function parseMarkdown(text) {
    if (!text) return "";
    let html = escapeHTML(text);
    // Headings
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^# (.*$)/gim, "<h3>$1</h3>");
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Lists and paragraphs
    const lines = html.split("\n");
    let inList = false;
    const formatted = [];
    for (const line of lines) {
        if (/^\s*[-*]\s+(.*)/.test(line)) {
            if (!inList) {
                formatted.push("<ul>");
                inList = true;
            }
            formatted.push(line.replace(/^\s*[-*]\s+(.*)/, "<li>$1</li>"));
        } else {
            if (inList) {
                formatted.push("</ul>");
                inList = false;
            }
            if (line.trim().length > 0 && !line.startsWith("<h")) {
                formatted.push(`<p>${line}</p>`);
            } else {
                formatted.push(line);
            }
        }
    }
    if (inList) formatted.push("</ul>");
    return formatted.join("");
}

function appendUserMessage(text) {
    const welcome = aiMessages.querySelector(".ai-welcome-card");
    if (welcome) welcome.remove();

    const msg = document.createElement("div");
    msg.className = "ai-message user-message";
    msg.innerHTML = `
        <div class="ai-message-avatar">U</div>
        <div class="ai-message-bubble">
            <p>${escapeHTML(text)}</p>
        </div>
    `;
    aiMessages.appendChild(msg);
    aiMessages.scrollTop = aiMessages.scrollHeight;
    if (aiClearBtn) aiClearBtn.classList.remove("hidden");
}

function appendAssistantMessage(answer, referencedBooks = [], source = "gemini") {
    const welcome = aiMessages.querySelector(".ai-welcome-card");
    if (welcome) welcome.remove();

    const msg = document.createElement("div");
    msg.className = "ai-message assistant-message";

    let booksHtml = "";
    if (referencedBooks && referencedBooks.length > 0) {
        booksHtml = `
            <div class="ai-referenced-books">
                ${referencedBooks.map((b) => `
                    <div class="ai-book-card" data-book-id="${b.id}">
                        <div class="ai-book-card-header">
                            <span class="ai-book-code">${escapeHTML(b.code || "BOOK")}</span>
                            <span class="ai-book-status ${b.status}">${escapeHTML(b.status)}</span>
                        </div>
                        <div class="ai-book-title">${escapeHTML(b.title)}</div>
                        <div class="ai-book-author">by ${escapeHTML(b.author)}</div>
                        <button type="button" class="ai-book-action-btn" data-id="${b.id}">
                            View Book Record →
                        </button>
                    </div>
                `).join("")}
            </div>
        `;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const engineBadge = source === "gemini" ? "✦ Gemini AI Engine" : "◈ Library Intelligence";

    msg.innerHTML = `
        <div class="ai-message-avatar">✦</div>
        <div class="ai-message-bubble">
            ${parseMarkdown(answer)}
            ${booksHtml}
            <div class="ai-message-meta">
                <span>${engineBadge}</span>
                <span>•</span>
                <span>${timeStr}</span>
            </div>
        </div>
    `;
    aiMessages.appendChild(msg);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Attach click listeners to book action cards
    msg.querySelectorAll(".ai-book-action-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            if (id) openDetails(id);
        });
    });
}

async function handleAiQuery(queryText) {
    const query = String(queryText || "").trim();
    if (!query) return;

    lastAiQuery = query;
    if (aiError) aiError.classList.add("hidden");
    appendUserMessage(query);
    if (aiInput) aiInput.value = "";
    if (aiSubmitBtn) aiSubmitBtn.disabled = true;
    if (aiLoading) aiLoading.classList.remove("hidden");
    aiMessages.scrollTop = aiMessages.scrollHeight;

    try {
        const result = await api("/api/ai/query", {
            method: "POST",
            body: JSON.stringify({ query }),
        });
        if (aiLoading) aiLoading.classList.add("hidden");
        if (aiSubmitBtn) aiSubmitBtn.disabled = false;
        appendAssistantMessage(result.answer, result.referencedBooks, result.source);

        const statusEl = document.getElementById("ai-engine-status");
        if (statusEl && result.source) {
            statusEl.textContent = result.source === "gemini" ? "Gemini 2.5 Flash Connected" : "Local Intelligence Active";
        }
    } catch (err) {
        if (aiLoading) aiLoading.classList.add("hidden");
        if (aiSubmitBtn) aiSubmitBtn.disabled = false;
        if (aiError) {
            aiError.classList.remove("hidden");
            const errorMsgEl = document.getElementById("ai-error-message");
            if (errorMsgEl) errorMsgEl.textContent = err.message || "Failed to process query.";
        }
    }
}

if (aiForm) {
    aiForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (aiInput) handleAiQuery(aiInput.value);
    });
}

if (aiRetryBtn) {
    aiRetryBtn.addEventListener("click", () => {
        if (lastAiQuery) handleAiQuery(lastAiQuery);
    });
}

if (aiClearBtn) {
    aiClearBtn.addEventListener("click", () => {
        aiMessages.innerHTML = `
            <div class="ai-welcome-card">
                <div class="ai-welcome-icon">✦</div>
                <div class="ai-welcome-content">
                    <h3>Welcome to LIBRA Intelligence</h3>
                    <p>I am your library intelligence copilot, connected directly to your live books catalog, circulation ledger, active loans, and fine records.</p>
                </div>
            </div>
        `;
        aiClearBtn.classList.add("hidden");
        if (aiError) aiError.classList.add("hidden");
    });
}

document.querySelectorAll(".ai-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        const query = chip.dataset.query;
        if (query) {
            goTo("ai-assistant");
            handleAiQuery(query);
        }
    });
});

// =========================================================
// PROGRESSIVE WEB APP (PWA) & SERVICE WORKER
// =========================================================

let deferredPrompt = null;
const headerInstallBtn = document.getElementById("header-install-btn");
const sidebarInstallBtn = document.getElementById("sidebar-pwa-install-button");
const iosModal = document.getElementById("ios-guide-modal");
const closeIosBtn = document.getElementById("close-ios-guide");
const dismissIosBtn = document.getElementById("dismiss-ios-guide");
const offlineToast = document.getElementById("offline-toast");

// Service worker registration
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
            (reg) => console.log("[PWA] ServiceWorker registered with scope:", reg.scope),
            (err) => console.warn("[PWA] ServiceWorker registration failed:", err)
        );
    });
}

const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

function showInstallButtons() {
    if (isStandalone) return;
    if (headerInstallBtn) headerInstallBtn.classList.remove("hidden");
    if (sidebarInstallBtn) sidebarInstallBtn.classList.remove("hidden");
}

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButtons();
});

if (isIos && !isStandalone) {
    showInstallButtons();
}

async function triggerInstallFlow() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA] Install prompt outcome:", outcome);
        deferredPrompt = null;
        if (headerInstallBtn) headerInstallBtn.classList.add("hidden");
        if (sidebarInstallBtn) sidebarInstallBtn.classList.add("hidden");
    } else if (isIos) {
        if (iosModal) iosModal.classList.remove("hidden");
    } else {
        showToast("To install LIBRA, use your browser's 'Add to Home screen' or 'Install' menu.", "Info");
    }
}

if (headerInstallBtn) headerInstallBtn.addEventListener("click", triggerInstallFlow);
if (sidebarInstallBtn) sidebarInstallBtn.addEventListener("click", triggerInstallFlow);
if (closeIosBtn) closeIosBtn.addEventListener("click", () => iosModal.classList.add("hidden"));
if (dismissIosBtn) dismissIosBtn.addEventListener("click", () => iosModal.classList.add("hidden"));

window.addEventListener("online", () => {
    if (offlineToast) offlineToast.classList.add("hidden");
    showToast("Connected to live library services.", "Online");
});

window.addEventListener("offline", () => {
    if (offlineToast) offlineToast.classList.remove("hidden");
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
