/* =========================================================
   LIBRA — DIGITAL LIBRARY
   FRONTEND MOCK VERSION
========================================================= */


/* =========================================================
   MOCK DATA
========================================================= */

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
    },

    {
        id: "B006",
        title: "Web Technologies",
        author: "Uttam K. Roy",
        status: "available",
        user: ""
    },

    {
        id: "B007",
        title: "Operating Systems",
        author: "Abraham Silberschatz",
        status: "available",
        user: ""
    },

    {
        id: "B008",
        title: "Computer Organization",
        author: "Carl Hamacher",
        status: "borrowed",
        user: "Student C"
    }

];


/* =========================================================
   MOCK FINES
========================================================= */

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


let returnedBooks = [];


/* =========================================================
   DOM
========================================================= */

const loginPage =
    document.getElementById("login-page");

const app =
    document.getElementById("app");

const loginForm =
    document.getElementById("login-form");

const loginMessage =
    document.getElementById("login-message");

const profileName =
    document.getElementById("profile-name");

const profileAvatar =
    document.getElementById("profile-avatar");

const logoutButton =
    document.getElementById("logout-button");

const sidebar =
    document.getElementById("sidebar");

const menuToggle =
    document.getElementById("menu-toggle");

const closeSidebar =
    document.getElementById("close-sidebar");

const breadcrumbTitle =
    document.getElementById("breadcrumb-title");

const navItems =
    document.querySelectorAll(".nav-item");

const sections =
    document.querySelectorAll(".page-section");

const bookSearch =
    document.getElementById("book-search");

const clearSearch =
    document.getElementById("clear-search");

const headerSearchButton =
    document.getElementById(
        "header-search-button"
    );

const bookSort =
    document.getElementById("book-sort");

const bookCollection =
    document.getElementById(
        "book-collection"
    );

const bookTableBody =
    document.getElementById(
        "book-table-body"
    );

const availabilityGrid =
    document.getElementById(
        "availability-grid"
    );

const availabilityFilters =
    document.querySelectorAll(
        ".availability-filter"
    );

const issueForm =
    document.getElementById("issue-form");

const returnForm =
    document.getElementById("return-form");

const issueBookSelect =
    document.getElementById("issue-book");

const returnBookSelect =
    document.getElementById("return-book");

const issuedTableBody =
    document.getElementById(
        "issued-table-body"
    );

const returnedTableBody =
    document.getElementById(
        "returned-table-body"
    );

const fineTableBody =
    document.getElementById(
        "fine-table-body"
    );

const issueMessage =
    document.getElementById(
        "issue-message"
    );

const returnMessage =
    document.getElementById(
        "return-message"
    );

const addBookButton =
    document.getElementById(
        "add-book-button"
    );

const bookModal =
    document.getElementById(
        "book-modal"
    );

const addBookForm =
    document.getElementById(
        "add-book-form"
    );

const closeModal =
    document.getElementById(
        "close-modal"
    );

const cancelModal =
    document.getElementById(
        "cancel-modal"
    );

const detailModal =
    document.getElementById(
        "detail-modal"
    );

const closeDetail =
    document.getElementById(
        "close-detail"
    );

const detailUpdate =
    document.getElementById(
        "detail-update"
    );

const detailDelete =
    document.getElementById(
        "detail-delete"
    );

const togglePassword =
    document.getElementById(
        "toggle-password"
    );

const toast =
    document.getElementById("toast");

const toastTitle =
    document.getElementById(
        "toast-title"
    );

const toastMessage =
    document.getElementById(
        "toast-message"
    );

const toastIcon =
    document.getElementById(
        "toast-icon"
    );


/* =========================================================
   CURRENT STATE
========================================================= */

let currentDetailBookId = null;

let currentAvailabilityFilter = "all";

let toastTimer = null;


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const username =
            document
                .getElementById("username")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value
                .trim();


        if (!username || !password) {

            loginMessage.textContent =
                "Please enter username and password.";

            return;
        }


        /*
            Frontend-only demo.

            Any non-empty credentials are accepted
            because there is currently no backend.
        */

        profileName.textContent =
            username;

        profileAvatar.textContent =
            username
                .charAt(0)
                .toUpperCase();


        loginPage.classList.add("hidden");

        app.classList.remove("hidden");

        loginMessage.textContent = "";


        renderAll();


        showToast(
            "Welcome to LIBRA",
            "Your library is ready.",
            "✓"
        );

    }
);


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

togglePassword.addEventListener(
    "click",
    function() {

        const password =
            document.getElementById(
                "password"
            );


        if (
            password.type === "password"
        ) {

            password.type = "text";

            togglePassword.textContent =
                "Hide";

        } else {

            password.type = "password";

            togglePassword.textContent =
                "Show";

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
    "click",
    function() {

        app.classList.add("hidden");

        loginPage.classList.remove("hidden");

        document
            .getElementById("password")
            .value = "";

        showToast(
            "Signed out",
            "You have left the library.",
            "↪"
        );

    }
);


/* =========================================================
   NAVIGATION
========================================================= */

navItems.forEach(
    function(item) {

        item.addEventListener(
            "click",
            function() {

                const sectionId =
                    item.dataset.section;


                navItems.forEach(
                    function(nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                sections.forEach(
                    function(section) {

                        section.classList.remove(
                            "active-section"
                        );

                    }
                );


                item.classList.add(
                    "active"
                );


                const targetSection =
                    document.getElementById(
                        sectionId
                    );


                if (targetSection) {

                    targetSection.classList.add(
                        "active-section"
                    );

                }


                const labels = {

                    "book-management":
                        "Collection",

                    "book-issue":
                        "Book Issue",

                    "book-return":
                        "Book Return",

                    "fine-management":
                        "Fine Management",

                    "book-availability":
                        "Book Availability"

                };


                breadcrumbTitle.textContent =
                    labels[sectionId] ||
                    "Library";


                sidebar.classList.remove(
                    "open"
                );

            }
        );

    }
);


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

menuToggle.addEventListener(
    "click",
    function() {

        sidebar.classList.add(
            "open"
        );

    }
);


closeSidebar.addEventListener(
    "click",
    function() {

        sidebar.classList.remove(
            "open"
        );

    }
);


/* =========================================================
   HEADER SEARCH
========================================================= */

headerSearchButton.addEventListener(
    "click",
    function() {

        goToCollectionSearch();

    }
);


function goToCollectionSearch() {

    const collectionNav =
        document.querySelector(
            '[data-section="book-management"]'
        );


    collectionNav.click();


    setTimeout(
        function() {

            bookSearch.focus();

        },
        100
    );

}


/* =========================================================
   KEYBOARD SEARCH
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "/" &&
            document.activeElement.tagName !== "INPUT" &&
            document.activeElement.tagName !== "SELECT" &&
            document.activeElement.tagName !== "TEXTAREA"
        ) {

            event.preventDefault();

            goToCollectionSearch();

        }

    }
);


/* =========================================================
   SEARCH
========================================================= */

bookSearch.addEventListener(
    "input",
    function() {

        const value =
            bookSearch.value.trim();


        if (value) {

            clearSearch.classList.add(
                "show"
            );

        } else {

            clearSearch.classList.remove(
                "show"
            );

        }


        renderBookCollection(
            value
        );

        renderBookTable(
            value
        );

    }
);


clearSearch.addEventListener(
    "click",
    function() {

        bookSearch.value = "";

        clearSearch.classList.remove(
            "show"
        );

        renderBookCollection();

        renderBookTable();

        bookSearch.focus();

    }
);


/* =========================================================
   SORT
========================================================= */

bookSort.addEventListener(
    "change",
    function() {

        renderBookCollection(
            bookSearch.value
        );

    }
);


/* =========================================================
   GET SORTED BOOKS
========================================================= */

function getProcessedBooks(
    searchText = ""
) {

    const search =
        searchText
            .toLowerCase()
            .trim();


    let filtered =
        books.filter(
            function(book) {

                return (

                    book.title
                        .toLowerCase()
                        .includes(search)

                    ||

                    book.author
                        .toLowerCase()
                        .includes(search)

                    ||

                    book.id
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    const sort =
        bookSort.value;


    if (sort === "title") {

        filtered.sort(
            function(a, b) {

                return a.title
                    .localeCompare(b.title);

            }
        );

    }


    if (sort === "author") {

        filtered.sort(
            function(a, b) {

                return a.author
                    .localeCompare(b.author);

            }
        );

    }


    if (sort === "status") {

        filtered.sort(
            function(a, b) {

                return a.status
                    .localeCompare(b.status);

            }
        );

    }


    return filtered;

}


/* =========================================================
   BOOK COLLECTION
========================================================= */

function renderBookCollection(
    searchText = ""
) {

    const filteredBooks =
        getProcessedBooks(
            searchText
        );


    document.getElementById(
        "book-result-count"
    ).textContent =
        `${filteredBooks.length} book${
            filteredBooks.length === 1
                ? ""
                : "s"
        }`;


    if (
        filteredBooks.length === 0
    ) {

        bookCollection.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⌕
                </div>

                <strong>
                    No books found
                </strong>

                <span>
                    Try another title, author or book ID.
                </span>

            </div>

        `;

        return;

    }


    bookCollection.innerHTML =
        filteredBooks
            .map(
                function(book) {

                    const shortTitle =
                        getCoverTitle(
                            book.title
                        );


                    return `

                        <article
                            class="book-card"
                        >

                            <div
                                class="book-cover"
                            >

                                <span
                                    class="cover-id"
                                >
                                    ${escapeHTML(book.id)}
                                </span>


                                <div
                                    class="cover-content"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            shortTitle
                                        )}
                                    </strong>

                                    <span>
                                        DIGITAL LIBRARY
                                    </span>

                                </div>

                            </div>


                            <div
                                class="book-card-info"
                            >

                                <div
                                    class="book-card-title"
                                >
                                    ${escapeHTML(
                                        book.title
                                    )}
                                </div>


                                <div
                                    class="book-card-author"
                                >
                                    ${escapeHTML(
                                        book.author
                                    )}
                                </div>


                                <div
                                    class="book-card-bottom"
                                >

                                    ${statusBadge(
                                        book.status
                                    )}


                                    <button
                                        class="card-more"
                                        title="View details"
                                        onclick="
                                            openBookDetails(
                                                '${book.id}'
                                            )
                                        "
                                    >
                                        →
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   COVER TITLE
========================================================= */

function getCoverTitle(title) {

    const words =
        title.split(" ");


    if (words.length <= 2) {

        return title.toUpperCase();

    }


    return words
        .slice(0, 3)
        .join(" ")
        .toUpperCase();

}


/* =========================================================
   BOOK TABLE
========================================================= */

function renderBookTable(
    searchText = ""
) {

    const filteredBooks =
        getProcessedBooks(
            searchText
        );


    if (
        filteredBooks.length === 0
    ) {

        bookTableBody.innerHTML = `

            <tr>

                <td colspan="5">
                    No books found.
                </td>

            </tr>

        `;

        return;

    }


    bookTableBody.innerHTML =
        filteredBooks
            .map(
                function(book) {

                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    book.id
                                )}
                            </td>


                            <td>

                                <div
                                    class="table-book"
                                >

                                    <div
                                        class="table-book-cover"
                                    >
                                        ${escapeHTML(
                                            book.id
                                        )}
                                    </div>

                                    <strong>
                                        ${escapeHTML(
                                            book.title
                                        )}
                                    </strong>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    book.author
                                )}
                            </td>


                            <td>
                                ${statusBadge(
                                    book.status
                                )}
                            </td>


                            <td>

                                <button
                                    class="table-action"
                                    onclick="
                                        openBookDetails(
                                            '${book.id}'
                                        )
                                    "
                                >
                                    View
                                </button>


                                <button
                                    class="table-action"
                                    onclick="
                                        updateBook(
                                            '${book.id}'
                                        )
                                    "
                                >
                                    Edit
                                </button>


                                <button
                                    class="table-action"
                                    onclick="
                                        deleteBook(
                                            '${book.id}'
                                        )
                                    "
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   STATUS BADGE
========================================================= */

function statusBadge(status) {

    if (
        status === "available"
    ) {

        return `
            <span class="status available">
                Available
            </span>
        `;

    }


    if (
        status === "borrowed"
    ) {

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


/* =========================================================
   ADD BOOK
========================================================= */

addBookButton.addEventListener(
    "click",
    function() {

        openAddBookModal();

    }
);


function openAddBookModal() {

    document.getElementById(
        "modal-title"
    ).textContent =
        "Add library book";


    addBookForm.reset();

    bookModal.classList.remove(
        "hidden"
    );


    setTimeout(
        function() {

            document
                .getElementById(
                    "new-book-title"
                )
                .focus();

        },
        100
    );

}


function closeBookModal() {

    bookModal.classList.add(
        "hidden"
    );

    addBookForm.reset();

}


closeModal.addEventListener(
    "click",
    closeBookModal
);


cancelModal.addEventListener(
    "click",
    closeBookModal
);


bookModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === bookModal
        ) {

            closeBookModal();

        }

    }
);


/* =========================================================
   ADD BOOK FORM
========================================================= */

addBookForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const title =
            document
                .getElementById(
                    "new-book-title"
                )
                .value
                .trim();


        const author =
            document
                .getElementById(
                    "new-book-author"
                )
                .value
                .trim();


        if (!title || !author) {

            return;

        }


        const newId =
            generateBookId();


        books.push({

            id: newId,

            title: title,

            author: author,

            status: "available",

            user: ""

        });


        closeBookModal();


        renderAll();


        showToast(
            "Book added",
            `"${title}" is now in your collection.`,
            "+"
        );

    }
);


/* =========================================================
   GENERATE BOOK ID
========================================================= */

function generateBookId() {

    let number =
        books.length + 1;


    let id =
        "B" +
        String(number)
            .padStart(3, "0");


    while (
        books.some(
            function(book) {

                return book.id === id;

            }
        )
    ) {

        number++;

        id =
            "B" +
            String(number)
                .padStart(3, "0");

    }


    return id;

}


/* =========================================================
   UPDATE BOOK
========================================================= */

function updateBook(
    bookId
) {

    const book =
        books.find(
            function(item) {

                return item.id === bookId;

            }
        );


    if (!book) {

        return;

    }


    const title =
        prompt(
            "Update book title:",
            book.title
        );


    if (
        title === null ||
        !title.trim()
    ) {

        return;

    }


    const author =
        prompt(
            "Update author:",
            book.author
        );


    if (
        author === null ||
        !author.trim()
    ) {

        return;

    }


    book.title =
        title.trim();

    book.author =
        author.trim();


    renderAll();


    showToast(
        "Book updated",
        `"${book.title}" was updated.`,
        "✓"
    );

}


/* =========================================================
   DELETE BOOK
========================================================= */

function deleteBook(
    bookId
) {

    const book =
        books.find(
            function(item) {

                return item.id === bookId;

            }
        );


    if (!book) {

        return;

    }


    if (
        book.status === "borrowed"
    ) {

        showToast(
            "Cannot delete",
            "A borrowed book cannot be deleted.",
            "!"
        );

        return;

    }


    const confirmed =
        confirm(
            `Delete "${book.title}" from the collection?`
        );


    if (!confirmed) {

        return;

    }


    books =
        books.filter(
            function(item) {

                return item.id !== bookId;

            }
        );


    closeDetailModal();


    renderAll();


    showToast(
        "Book deleted",
        "The book was removed from the collection.",
        "×"
    );

}


/* =========================================================
   BOOK DETAILS
========================================================= */

function openBookDetails(
    bookId
) {

    const book =
        books.find(
            function(item) {

                return item.id === bookId;

            }
        );


    if (!book) {

        return;

    }


    currentDetailBookId =
        bookId;


    document.getElementById(
        "detail-id"
    ).textContent =
        book.id;


    document.getElementById(
        "detail-cover-title"
    ).textContent =
        getCoverTitle(
            book.title
        );


    document.getElementById(
        "detail-title"
    ).textContent =
        book.title;


    document.getElementById(
        "detail-author"
    ).textContent =
        book.author;


    document.getElementById(
        "detail-book-id"
    ).textContent =
        book.id;


    document.getElementById(
        "detail-status"
    ).innerHTML =
        statusBadge(
            book.status
        );


    const userRow =
        document.getElementById(
            "detail-user-row"
        );


    if (
        book.user
    ) {

        userRow.classList.remove(
            "hidden"
        );

        document.getElementById(
            "detail-user"
        ).textContent =
            book.user;

    } else {

        userRow.classList.add(
            "hidden"
        );

    }


    detailModal.classList.remove(
        "hidden"
    );

}


function closeDetailModal() {

    detailModal.classList.add(
        "hidden"
    );

    currentDetailBookId =
        null;

}


closeDetail.addEventListener(
    "click",
    closeDetailModal
);


detailModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === detailModal
        ) {

            closeDetailModal();

        }

    }
);


detailUpdate.addEventListener(
    "click",
    function() {

        if (
            currentDetailBookId
        ) {

            const id =
                currentDetailBookId;

            closeDetailModal();

            updateBook(id);

        }

    }
);


detailDelete.addEventListener(
    "click",
    function() {

        if (
            currentDetailBookId
        ) {

            deleteBook(
                currentDetailBookId
            );

        }

    }
);


/* =========================================================
   ISSUE SELECT
========================================================= */

function renderIssueSelect() {

    const availableBooks =
        books.filter(
            function(book) {

                return (
                    book.status === "available"
                );

            }
        );


    if (
        availableBooks.length === 0
    ) {

        issueBookSelect.innerHTML = `

            <option value="">
                No available books
            </option>

        `;

        return;

    }


    issueBookSelect.innerHTML = `

        <option value="">
            Select a book
        </option>

        ${
            availableBooks
                .map(
                    function(book) {

                        return `

                            <option
                                value="${escapeHTML(
                                    book.id
                                )}"
                            >
                                ${escapeHTML(
                                    book.title
                                )}
                            </option>

                        `;

                    }
                )
                .join("")
        }

    `;

}


/* =========================================================
   RETURN SELECT
========================================================= */

function renderReturnSelect() {

    const borrowedBooks =
        books.filter(
            function(book) {

                return (
                    book.status === "borrowed"
                );

            }
        );


    if (
        borrowedBooks.length === 0
    ) {

        returnBookSelect.innerHTML = `

            <option value="">
                No borrowed books
            </option>

        `;

        return;

    }


    returnBookSelect.innerHTML = `

        <option value="">
            Select a book
        </option>

        ${
            borrowedBooks
                .map(
                    function(book) {

                        return `

                            <option
                                value="${escapeHTML(
                                    book.id
                                )}"
                            >
                                ${escapeHTML(
                                    book.title
                                )}
                            </option>

                        `;

                    }
                )
                .join("")
        }

    `;

}


/* =========================================================
   ISSUE BOOK
========================================================= */

issueForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const bookId =
            issueBookSelect.value;


        const user =
            document
                .getElementById(
                    "issue-user"
                )
                .value
                .trim();


        if (
            !bookId ||
            !user
        ) {

            issueMessage.textContent =
                "Please select a book and enter the user name.";

            issueMessage.style.color =
                "var(--red)";

            return;

        }


        const book =
            books.find(
                function(item) {

                    return item.id === bookId;

                }
            );


        if (
            !book ||
            book.status !== "available"
        ) {

            issueMessage.textContent =
                "The selected book is no longer available.";

            issueMessage.style.color =
                "var(--red)";

            return;

        }


        book.status =
            "borrowed";

        book.user =
            user;


        issueForm.reset();


        issueMessage.textContent =
            "Book issue recorded successfully.";

        issueMessage.style.color =
            "var(--green)";


        renderAll();


        showToast(
            "Book issued",
            `"${book.title}" is now borrowed by ${user}.`,
            "↗"
        );

    }
);


/* =========================================================
   RETURN BOOK
========================================================= */

returnForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const bookId =
            returnBookSelect.value;


        if (!bookId) {

            returnMessage.textContent =
                "Please select a borrowed book.";

            returnMessage.style.color =
                "var(--red)";

            return;

        }


        const book =
            books.find(
                function(item) {

                    return item.id === bookId;

                }
            );


        if (
            !book ||
            book.status !== "borrowed"
        ) {

            returnMessage.textContent =
                "The selected book is not currently borrowed.";

            returnMessage.style.color =
                "var(--red)";

            return;

        }


        const previousUser =
            book.user;


        returnedBooks.unshift({

            book: book.title,

            user: previousUser

        });


        book.status =
            "available";

        book.user =
            "";


        returnForm.reset();


        returnMessage.textContent =
            "Book return recorded successfully.";

        returnMessage.style.color =
            "var(--green)";


        renderAll();


        showToast(
            "Book returned",
            `"${book.title}" is available again.`,
            "✓"
        );

    }
);


/* =========================================================
   ISSUED TABLE
========================================================= */

function renderIssuedTable() {

    const issuedBooks =
        books.filter(
            function(book) {

                return (
                    book.status === "borrowed"
                );

            }
        );


    document.getElementById(
        "issue-count"
    ).textContent =
        issuedBooks.length;


    if (
        issuedBooks.length === 0
    ) {

        issuedTableBody.innerHTML = `

            <tr>

                <td colspan="3">
                    No books are currently borrowed.
                </td>

            </tr>

        `;

        return;

    }


    issuedTableBody.innerHTML =
        issuedBooks
            .map(
                function(book) {

                    return `

                        <tr>

                            <td>

                                <div class="table-book">

                                    <div
                                        class="table-book-cover"
                                    >
                                        ${escapeHTML(
                                            book.id
                                        )}
                                    </div>

                                    <strong>
                                        ${escapeHTML(
                                            book.title
                                        )}
                                    </strong>

                                </div>

                            </td>

                            <td>
                                ${escapeHTML(
                                    book.user
                                )}
                            </td>

                            <td>
                                ${statusBadge(
                                    "borrowed"
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   RETURN TABLE
========================================================= */

function renderReturnedTable() {

    if (
        returnedBooks.length === 0
    ) {

        returnedTableBody.innerHTML = `

            <tr>

                <td colspan="3">
                    No returned books recorded in this session.
                </td>

            </tr>

        `;

        return;

    }


    returnedTableBody.innerHTML =
        returnedBooks
            .map(
                function(record) {

                    return `

                        <tr>

                            <td>

                                <div class="table-book">

                                    <div
                                        class="table-book-cover"
                                    >
                                        ✓
                                    </div>

                                    <strong>
                                        ${escapeHTML(
                                            record.book
                                        )}
                                    </strong>

                                </div>

                            </td>

                            <td>
                                ${escapeHTML(
                                    record.user
                                )}
                            </td>

                            <td>
                                ${statusBadge(
                                    "available"
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FINE TABLE
========================================================= */

function renderFineTable() {

    if (
        fines.length === 0
    ) {

        fineTableBody.innerHTML = `

            <tr>

                <td colspan="5">
                    No overdue books.
                </td>

            </tr>

        `;

        return;

    }


    fineTableBody.innerHTML =
        fines
            .map(
                function(record, index) {

                    return `

                        <tr>

                            <td>

                                <div class="table-book">

                                    <div
                                        class="table-book-cover"
                                    >
                                        ₹
                                    </div>

                                    <strong>
                                        ${escapeHTML(
                                            record.book
                                        )}
                                    </strong>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    record.user
                                )}
                            </td>


                            <td>
                                ${record.daysOverdue}
                            </td>


                            <td>

                                <strong
                                    style="
                                        color: var(--red);
                                    "
                                >
                                    ₹${record.fine}
                                </strong>

                            </td>


                            <td>

                                <button
                                    class="table-action"
                                    onclick="
                                        calculateFine(
                                            ${index}
                                        )
                                    "
                                >
                                    Calculate
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FINE CALCULATION
========================================================= */

function calculateFine(index) {

    const record =
        fines[index];


    if (!record) {

        return;

    }


    /*
       IMPORTANT:

       The SRS says the system must calculate fines
       for overdue books, but it does NOT specify
       the fine rate.

       Therefore this frontend does not invent a
       ₹10/day rule.

       The sample record already contains a mock
       fine amount, so we display that amount.
    */


    showToast(
        "Fine record",
        `${record.book}: recorded fine is ₹${record.fine}.`,
        "₹"
    );

}


/* =========================================================
   AVAILABILITY
========================================================= */

function renderAvailability() {

    let filteredBooks =
        books;


    if (
        currentAvailabilityFilter !== "all"
    ) {

        filteredBooks =
            books.filter(
                function(book) {

                    return (
                        book.status ===
                        currentAvailabilityFilter
                    );

                }
            );

    }


    if (
        filteredBooks.length === 0
    ) {

        availabilityGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ◉
                </div>

                <strong>
                    No books found
                </strong>

                <span>
                    There are no books in this category.
                </span>

            </div>

        `;

        return;

    }


    availabilityGrid.innerHTML =
        filteredBooks
            .map(
                function(book) {

                    return `

                        <div
                            class="availability-item"
                        >

                            <div
                                class="availability-cover"
                            >
                                ${escapeHTML(
                                    book.id
                                )}
                            </div>


                            <div
                                class="availability-info"
                            >

                                <strong>
                                    ${escapeHTML(
                                        book.title
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        book.author
                                    )}
                                </span>

                                ${
                                    book.user
                                    ?
                                    `
                                        <span
                                            class="
                                                availability-user
                                            "
                                        >
                                            Borrowed by
                                            ${escapeHTML(
                                                book.user
                                            )}
                                        </span>
                                    `
                                    :
                                    ""
                                }

                            </div>


                            ${statusBadge(
                                book.status
                            )}

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   AVAILABILITY FILTER
========================================================= */

availabilityFilters.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                availabilityFilters.forEach(
                    function(item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentAvailabilityFilter =
                    button.dataset.filter;


                renderAvailability();

            }
        );

    }
);


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const total =
        books.length;


    const available =
        books.filter(
            function(book) {

                return (
                    book.status === "available"
                );

            }
        ).length;


    const borrowed =
        books.filter(
            function(book) {

                return (
                    book.status === "borrowed"
                );

            }
        ).length;


    const overdue =
        fines.length;


    document.getElementById(
        "total-books"
    ).textContent =
        total;


    document.getElementById(
        "available-books"
    ).textContent =
        available;


    document.getElementById(
        "borrowed-books"
    ).textContent =
        borrowed;


    document.getElementById(
        "overdue-books"
    ).textContent =
        overdue;


    document.getElementById(
        "sidebar-total"
    ).textContent =
        `${total} book${
            total === 1
                ? ""
                : "s"
        }`;


    const totalFine =
        fines.reduce(
            function(sum, record) {

                return (
                    sum +
                    Number(record.fine)
                );

            },
            0
        );


    document.getElementById(
        "total-fine"
    ).textContent =
        `₹${totalFine}`;


    document.getElementById(
        "fine-book-count"
    ).textContent =
        overdue;

}


/* =========================================================
   RETURN CURRENT USER COUNT
========================================================= */

function updateOperationMessages() {

    const issueCount =
        books.filter(
            function(book) {

                return (
                    book.status === "borrowed"
                );

            }
        ).length;


    document.getElementById(
        "issue-count"
    ).textContent =
        issueCount;

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    updateSummary();

    updateOperationMessages();

    renderBookCollection(
        bookSearch.value
    );

    renderBookTable(
        bookSearch.value
    );

    renderIssueSelect();

    renderReturnSelect();

    renderIssuedTable();

    renderReturnedTable();

    renderFineTable();

    renderAvailability();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    icon = "✓"
) {

    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;

    toastIcon.textContent =
        icon;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            3200
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ESCAPE MODALS WITH ESC
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            if (
                !bookModal.classList.contains(
                    "hidden"
                )
            ) {

                closeBookModal();

            }


            if (
                !detailModal.classList.contains(
                    "hidden"
                )
            ) {

                closeDetailModal();

            }

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

renderAll();