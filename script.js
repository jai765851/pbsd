// Sample/mock data for the frontend only.
// No backend or database is connected.

let books = [
    {
        id: "B001",
        title: "Introduction to Python",
        author: "Mark Lutz",
        status: "available",
        user: ""
    },
    {
        id: "B002",
        title: "Database System Concepts",
        author: "Abraham Silberschatz",
        status: "borrowed",
        user: "Student A"
    },
    {
        id: "B003",
        title: "Computer Networks",
        author: "Andrew S. Tanenbaum",
        status: "available",
        user: ""
    },
    {
        id: "B004",
        title: "Software Engineering",
        author: "Ian Sommerville",
        status: "borrowed",
        user: "Student B"
    },
    {
        id: "B005",
        title: "Data Structures and Algorithms",
        author: "Robert Lafore",
        status: "available",
        user: ""
    }
];

let returnedBooks = [];

let fines = [
    {
        book: "Database System Concepts",
        user: "Student A",
        daysOverdue: 4,
        fine: 40
    },
    {
        book: "Software Engineering",
        user: "Student B",
        daysOverdue: 2,
        fine: 20
    }
];

const loginPage = document.getElementById("login-page");
const app = document.getElementById("app");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const profileName = document.getElementById("profile-name");

const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".page-section");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");

const bookSearch = document.getElementById("book-search");
const availabilityFilter = document.getElementById("availability-filter");

const bookTableBody = document.getElementById("book-table-body");
const availabilityTableBody = document.getElementById("availability-table-body");
const issuedTableBody = document.getElementById("issued-table-body");
const returnedTableBody = document.getElementById("returned-table-body");
const fineTableBody = document.getElementById("fine-table-body");

const issueBookSelect = document.getElementById("issue-book");
const returnBookSelect = document.getElementById("return-book");

const issueForm = document.getElementById("issue-form");
const returnForm = document.getElementById("return-form");

const issueMessage = document.getElementById("issue-message");
const returnMessage = document.getElementById("return-message");

const bookModal = document.getElementById("book-modal");
const addBookButton = document.getElementById("add-book-button");
const closeModal = document.getElementById("close-modal");
const cancelModal = document.getElementById("cancel-modal");
const addBookForm = document.getElementById("add-book-form");


// Login
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // Frontend-only demonstration of authentication.
    // Any non-empty credentials are accepted because no backend exists yet.
    if (username && password) {
        loginPage.classList.add("hidden");
        app.classList.remove("hidden");

        profileName.textContent = username;
        loginMessage.textContent = "";

        renderAll();
    } else {
        loginMessage.textContent = "Please enter valid login credentials.";
    }
});


// Navigation
navItems.forEach(function (item) {
    item.addEventListener("click", function () {

        const sectionId = item.dataset.section;

        navItems.forEach(function (nav) {
            nav.classList.remove("active");
        });

        sections.forEach(function (section) {
            section.classList.remove("active-section");
        });

        item.classList.add("active");

        document
            .getElementById(sectionId)
            .classList.add("active-section");

        sidebar.classList.remove("open");
    });
});


// Mobile sidebar
menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("open");
});


// Search books
bookSearch.addEventListener("input", function () {
    renderBookTable(bookSearch.value);
});


// Availability filter
availabilityFilter.addEventListener("change", function () {
    renderAvailabilityTable();
});


// Add book
addBookButton.addEventListener("click", function () {
    bookModal.classList.remove("hidden");
});

closeModal.addEventListener("click", closeBookModal);
cancelModal.addEventListener("click", closeBookModal);

function closeBookModal() {
    bookModal.classList.add("hidden");
    addBookForm.reset();
}

addBookForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = document
        .getElementById("new-book-title")
        .value
        .trim();

    const author = document
        .getElementById("new-book-author")
        .value
        .trim();

    const newId =
        "B" + String(books.length + 1).padStart(3, "0");

    books.push({
        id: newId,
        title: title,
        author: author,
        status: "available",
        user: ""
    });

    closeBookModal();

    renderAll();
});


// Issue book
issueForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const bookId = issueBookSelect.value;

    const user = document
        .getElementById("issue-user")
        .value
        .trim();

    const book = books.find(function (item) {
        return item.id === bookId;
    });

    if (!book || book.status !== "available") {

        issueMessage.textContent =
            "The selected book is not available.";

        return;
    }

    book.status = "borrowed";
    book.user = user;

    issueMessage.style.color = "#15803d";

    issueMessage.textContent =
        "Book issue recorded successfully.";

    issueForm.reset();

    renderAll();
});


// Return book
returnForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const bookId = returnBookSelect.value;

    const book = books.find(function (item) {
        return item.id === bookId;
    });

    if (!book || book.status !== "borrowed") {

        returnMessage.textContent =
            "The selected book is not currently borrowed.";

        return;
    }

    returnedBooks.push({
        book: book.title,
        user: book.user
    });

    book.status = "available";
    book.user = "";

    returnMessage.style.color = "#15803d";

    returnMessage.textContent =
        "Book return recorded successfully.";

    returnForm.reset();

    renderAll();
});


// Fine calculation
function calculateFine(index) {

    const record = fines[index];

    // Sample frontend calculation.
    // ₹10 per overdue day.
    record.fine = record.daysOverdue * 10;

    renderFineTable();
}


// Render everything
function renderAll() {

    updateSummary();

    renderBookTable(bookSearch.value);

    renderAvailabilityTable();

    renderIssueSelect();

    renderReturnSelect();

    renderIssuedTable();

    renderReturnedTable();

    renderFineTable();
}


// Summary cards
function updateSummary() {

    const total = books.length;

    const available = books.filter(function (book) {
        return book.status === "available";
    }).length;

    const borrowed = books.filter(function (book) {
        return book.status === "borrowed";
    }).length;

    document.getElementById("total-books").textContent =
        total;

    document.getElementById("available-books").textContent =
        available;

    document.getElementById("borrowed-books").textContent =
        borrowed;

    document.getElementById("overdue-books").textContent =
        fines.length;
}


// Book management table
function renderBookTable(searchText = "") {

    const search = searchText.toLowerCase();

    const filteredBooks = books.filter(function (book) {

        return (
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search)
        );

    });

    if (filteredBooks.length === 0) {

        bookTableBody.innerHTML = `
            <tr>
                <td colspan="5">No books found.</td>
            </tr>
        `;

        return;
    }

    bookTableBody.innerHTML =
        filteredBooks.map(function (book) {

            return `
                <tr>
                    <td>${book.id}</td>

                    <td>
                        <strong>${book.title}</strong>
                    </td>

                    <td>${book.author}</td>

                    <td>
                        ${statusBadge(book.status)}
                    </td>

                    <td>
                        <button
                            class="table-action"
                            onclick="updateBook('${book.id}')">
                            Update
                        </button>

                        <button
                            class="table-action"
                            onclick="deleteBook('${book.id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;

        }).join("");
}


// Update book
function updateBook(bookId) {

    const book = books.find(function (item) {
        return item.id === bookId;
    });

    if (!book) {
        return;
    }

    const newTitle = prompt(
        "Enter updated book title:",
        book.title
    );

    if (newTitle === null || !newTitle.trim()) {
        return;
    }

    const newAuthor = prompt(
        "Enter updated author:",
        book.author
    );

    if (newAuthor === null || !newAuthor.trim()) {
        return;
    }

    book.title = newTitle.trim();

    book.author = newAuthor.trim();

    renderAll();
}


// Delete book
function deleteBook(bookId) {

    const book = books.find(function (item) {
        return item.id === bookId;
    });

    if (!book) {
        return;
    }

    if (book.status === "borrowed") {

        alert(
            "A borrowed book cannot be deleted in this sample interface."
        );

        return;
    }

    books = books.filter(function (item) {
        return item.id !== bookId;
    });

    renderAll();
}


// Issue select
function renderIssueSelect() {

    const availableBooks = books.filter(function (book) {
        return book.status === "available";
    });

    issueBookSelect.innerHTML = availableBooks.length

        ? availableBooks.map(function (book) {

            return `
                <option value="${book.id}">
                    ${book.title}
                </option>
            `;

        }).join("")

        : `<option value="">No available books</option>`;
}


// Return select
function renderReturnSelect() {

    const borrowedBooks = books.filter(function (book) {
        return book.status === "borrowed";
    });

    returnBookSelect.innerHTML = borrowedBooks.length

        ? borrowedBooks.map(function (book) {

            return `
                <option value="${book.id}">
                    ${book.title}
                </option>
            `;

        }).join("")

        : `<option value="">No borrowed books</option>`;
}


// Issued books table
function renderIssuedTable() {

    const issuedBooks = books.filter(function (book) {
        return book.status === "borrowed";
    });

    issuedTableBody.innerHTML = issuedBooks.length

        ? issuedBooks.map(function (book) {

            return `
                <tr>
                    <td>${book.title}</td>

                    <td>${book.user}</td>

                    <td>
                        ${statusBadge("borrowed")}
                    </td>
                </tr>
            `;

        }).join("")

        : `
            <tr>
                <td colspan="3">
                    No borrowed books.
                </td>
            </tr>
        `;
}


// Returned books table
function renderReturnedTable() {

    returnedTableBody.innerHTML = returnedBooks.length

        ? returnedBooks.map(function (record) {

            return `
                <tr>
                    <td>${record.book}</td>

                    <td>${record.user}</td>

                    <td>
                        ${statusBadge("available")}
                    </td>
                </tr>
            `;

        }).join("")

        : `
            <tr>
                <td colspan="3">
                    No returned books recorded in this session.
                </td>
            </tr>
        `;
}


// Fine table
function renderFineTable() {

    fineTableBody.innerHTML = fines.length

        ? fines.map(function (record, index) {

            return `
                <tr>

                    <td>${record.book}</td>

                    <td>${record.user}</td>

                    <td>${record.daysOverdue}</td>

                    <td>₹${record.fine}</td>

                    <td>
                        <button
                            class="table-action"
                            onclick="calculateFine(${index})">
                            Calculate
                        </button>
                    </td>

                </tr>
            `;

        }).join("")

        : `
            <tr>
                <td colspan="5">
                    No overdue books.
                </td>
            </tr>
        `;
}


// Availability table
function renderAvailabilityTable() {

    const filter = availabilityFilter.value;

    const filteredBooks = books.filter(function (book) {

        return (
            filter === "all" ||
            book.status === filter
        );

    });

    availabilityTableBody.innerHTML =
        filteredBooks.length

            ? filteredBooks.map(function (book) {

                return `
                    <tr>

                        <td>${book.id}</td>

                        <td>${book.title}</td>

                        <td>${book.author}</td>

                        <td>
                            ${statusBadge(book.status)}
                        </td>

                    </tr>
                `;

            }).join("")

            : `
                <tr>
                    <td colspan="4">
                        No books found.
                    </td>
                </tr>
            `;
}


// Status badge
function statusBadge(status) {

    if (status === "available") {

        return `
            <span class="status available">
                Available
            </span>
        `;
    }

    if (status === "borrowed") {

        return `
            <span class="status borrowed">
                Borrowed
            </span>
        `;
    }

    return `
        <span class="status overdue">
            Overdue
        </span>
    `;
}