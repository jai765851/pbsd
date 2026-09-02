/* =========================================================
   LIBRA — DIGITAL LIBRARY
   LEVEL 2 ENHANCED JAVASCRIPT
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
   DOM ELEMENTS
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
    document.getElementById("header-search-button");

const bookSort =
    document.getElementById("book-sort");

const bookCollection =
    document.getElementById("book-collection");

const bookTableBody =
    document.getElementById("book-table-body");

const availabilityGrid =
    document.getElementById("availability-grid");

const availabilityFilters =
    document.querySelectorAll(".availability-filter");

const issueForm =
    document.getElementById("issue-form");

const returnForm =
    document.getElementById("return-form");

const issueBookSelect =
    document.getElementById("issue-book");

const returnBookSelect =
    document.getElementById("return-book");

const issuedTableBody =
    document.getElementById("issued-table-body");

const returnedTableBody =
    document.getElementById("returned-table-body");

const fineTableBody =
    document.getElementById("fine-table-body");

const issueMessage =
    document.getElementById("issue-message");

const returnMessage =
    document.getElementById("return-message");

const addBookButton =
    document.getElementById("add-book-button");

const bookModal =
    document.getElementById("book-modal");

const addBookForm =
    document.getElementById("add-book-form");

const closeModal =
    document.getElementById("close-modal");

const cancelModal =
    document.getElementById("cancel-modal");

const detailModal =
    document.getElementById("detail-modal");

const closeDetail =
    document.getElementById("close-detail");

const detailUpdate =
    document.getElementById("detail-update");

const detailDelete =
    document.getElementById("detail-delete");

const togglePassword =
    document.getElementById("toggle-password");

const toast =
    document.getElementById("toast");

const toastTitle =
    document.getElementById("toast-title");

const toastMessage =
    document.getElementById("toast-message");

const toastIcon =
    document.getElementById("toast-icon");


/* =========================================================
   LEVEL 2 VIEW CONTROLS
   ========================================================= */

let catalogView = "grid";

let gridViewButton = null;
let listViewButton = null;


/* =========================================================
   CURRENT STATE
   ========================================================= */

let currentDetailBookId = null;

let currentAvailabilityFilter = "all";

let toastTimer = null;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    createCatalogViewControls();

    renderAll();

});


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
    "submit",
    function (event) {

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
            Frontend-only demonstration.

            Any non-empty username and password
            are accepted because there is currently
            no backend authentication.
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


        /*
            Small reset so the application
            entrance animation plays again.
        */

        app.classList.remove("app-enter");

        void app.offsetWidth;

        app.classList.add("app-enter");


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
    function () {

        const password =
            document.getElementById("password");


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
    function () {

        app.classList.add("hidden");

        loginPage.classList.remove("hidden");

        document
            .getElementById("password")
            .value = "";

        document
            .getElementById("username")
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
    function (item) {

        item.addEventListener(
            "click",
            function () {

                const sectionId =
                    item.dataset.section;


                navItems.forEach(
                    function (nav) {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                sections.forEach(
                    function (section) {

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
    function () {

        sidebar.classList.add(
            "open"
        );

    }
);


closeSidebar.addEventListener(
    "click",
    function () {

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
    function () {

        goToCollectionSearch();

    }
);


function goToCollectionSearch() {

    const collectionNav =
        document.querySelector(
            '[data-section="book-management"]'
        );


    if (collectionNav) {

        collectionNav.click();

    }


    setTimeout(
        function () {

            if (bookSearch) {

                bookSearch.focus();

            }

        },
        100
    );

}


/* =========================================================
   KEYBOARD SEARCH
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "/" &&
            document.activeElement.tagName !== "INPUT" &&
            document.activeElement.tagName !== "SELECT" &&
            document.activeElement.tagName !== "TEXTAREA"
        ) {

            event.preventDefault();

            goToCollectionSearch();

        }

        /*
            Escape closes open modals/sidebar.
        */

        if (event.key === "Escape") {

            closeBookModal();

            closeDetailModal();

            sidebar.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   SEARCH
   ========================================================= */

bookSearch.addEventListener(
    "input",
    function () {

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
    function () {

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
    function () {

        renderBookCollection(
            bookSearch.value
        );

        renderBookTable(
            bookSearch.value
        );

    }
);


/* =========================================================
   LEVEL 2 — GRID / LIST VIEW
   ========================================================= */

function createCatalogViewControls() {

    const toolbar =
        document.querySelector(
            ".collection-toolbar"
        );


    if (!toolbar) {
        return;
    }


    /*
        Don't create duplicate controls
        if they already exist in HTML.
    */

    if (
        document.getElementById(
            "catalog-view-controls"
        )
    ) {

        gridViewButton =
            document.getElementById(
                "grid-view-btn"
            );

        listViewButton =
            document.getElementById(
                "list-view-btn"
            );

        setupViewButtons();

        return;
    }


    const controls =
        document.createElement("div");

    controls.id =
        "catalog-view-controls";

    controls.className =
        "catalog-view-controls";


    controls.innerHTML = `

        <button
            type="button"
            id="grid-view-btn"
            class="view-button active"
            title="Grid view"
            aria-label="Grid view"
        >
            ▦
        </button>

        <button
            type="button"
            id="list-view-btn"
            class="view-button"
            title="List view"
            aria-label="List view"
        >
            ☰
        </button>

    `;


    /*
        Put the controls before Add Book.
    */

    const toolbarActions =
        toolbar.querySelector(
            ".toolbar-actions"
        );


    if (toolbarActions) {

        toolbarActions.prepend(
            controls
        );

    } else {

        toolbar.appendChild(
            controls
        );

    }


    gridViewButton =
        document.getElementById(
            "grid-view-btn"
        );

    listViewButton =
        document.getElementById(
            "list-view-btn"
        );


    setupViewButtons();

}


function setupViewButtons() {

    if (
        !gridViewButton ||
        !listViewButton
    ) {

        return;

    }


    gridViewButton.addEventListener(
        "click",
        function () {

            setCatalogView("grid");

        }
    );


    listViewButton.addEventListener(
        "click",
        function () {

            setCatalogView("list");

        }
    );

}


function setCatalogView(view) {

    catalogView = view;


    if (
        gridViewButton &&
        listViewButton
    ) {

        gridViewButton.classList.toggle(
            "active",
            view === "grid"
        );

        listViewButton.classList.toggle(
            "active",
            view === "list"
        );

    }


    if (bookCollection) {

        bookCollection.classList.toggle(
            "list-view",
            view === "list"
        );

        bookCollection.classList.toggle(
            "grid-view",
            view === "grid"
        );

    }


    renderBookCollection(
        bookSearch.value
    );

}


/* =========================================================
   GET SORTED / FILTERED BOOKS
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
            function (book) {

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
            function (a, b) {

                return a.title
                    .localeCompare(b.title);

            }
        );

    }


    if (sort === "author") {

        filtered.sort(
            function (a, b) {

                return a.author
                    .localeCompare(b.author);

            }
        );

    }


    if (sort === "status") {

        filtered.sort(
            function (a, b) {

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

    if (!bookCollection) {
        return;
    }


    const filteredBooks =
        getProcessedBooks(
            searchText
        );


    const resultCount =
        document.getElementById(
            "book-result-count"
        );


    if (resultCount) {

        resultCount.textContent =
            `${filteredBooks.length} book${
                filteredBooks.length === 1
                    ? ""
                    : "s"
            }`;

    }


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


    /*
        Level 2 premium cards.
    */

    bookCollection.innerHTML =
        filteredBooks
            .map(
                function (book, index) {

                    const shortTitle =
                        getCoverTitle(
                            book.title
                        );


                    const statusClass =
                        book.status === "available"
                            ? "available"
                            : book.status === "borrowed"
                                ? "borrowed"
                                : "overdue";


                    const statusText =
                        book.status === "available"
                            ? "Available"
                            : book.status === "borrowed"
                                ? "Borrowed"
                                : "Overdue";


                    /*
                        Different visual accent for
                        different cards.
                    */

                    const coverClass =
                        "cover-style-" +
                        ((index % 6) + 1);


                    return `

                        <article
                            class="book-card ${coverClass}"
                            data-book-id="${escapeHTML(book.id)}"
                            style="--card-index:${index};"
                        >

                            <div
                                class="book-cover"
                            >

                                <div class="cover-glow"></div>

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


                                <div class="cover-lines"></div>

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

                                    <span
                                        class="book-status ${statusClass}"
                                    >
                                        <span class="status-dot"></span>
                                        ${statusText}
                                    </span>


                                    <button
                                        type="button"
                                        class="card-more"
                                        data-action="details"
                                        data-id="${escapeHTML(book.id)}"
                                        title="View book details"
                                        aria-label="View book details"
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


    /*
        Event listeners are attached with JavaScript
        rather than relying on inline onclick handlers.
    */

    bookCollection
        .querySelectorAll(".book-card")
        .forEach(
            function (card) {

                card.addEventListener(
                    "click",
                    function () {

                        const bookId =
                            card.dataset.bookId;

                        openBookDetails(
                            bookId
                        );

                    }
                );

            }
        );


    bookCollection
        .querySelectorAll(
            '[data-action="details"]'
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                        openBookDetails(
                            button.dataset.id
                        );

                    }
                );

            }
        );

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
                function (book) {

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
                                    type="button"
                                    class="table-action"
                                    data-action="view"
                                    data-id="${escapeHTML(book.id)}"
                                >
                                    View
                                </button>


                                <button
                                    type="button"
                                    class="table-action"
                                    data-action="edit"
                                    data-id="${escapeHTML(book.id)}"
                                >
                                    Edit
                                </button>


                                <button
                                    type="button"
                                    class="table-action"
                                    data-action="delete"
                                    data-id="${escapeHTML(book.id)}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    /*
        Table actions.
    */

    bookTableBody
        .querySelectorAll(
            '[data-action="view"]'
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        openBookDetails(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    bookTableBody
        .querySelectorAll(
            '[data-action="edit"]'
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        updateBook(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    bookTableBody
        .querySelectorAll(
            '[data-action="delete"]'
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        deleteBook(
                            button.dataset.id
                        );

                    }
                );

            }
        );

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
    function () {

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
        function () {

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
    function (event) {

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
    function (event) {

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
            function (book) {

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
            function (item) {

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
            function (item) {

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
            function (item) {

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
            function (item) {

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
    function (event) {

        if (
            event.target === detailModal
        ) {

            closeDetailModal();

        }

    }
);


detailUpdate.addEventListener(
    "click",
    function () {

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
    function () {

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
            function (book) {

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
                    function (book) {

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
            function (book) {

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
                    function (book) {

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
    function (event) {

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


        if (!bookId || !user) {

            issueMessage.textContent =
                "Please select a book and enter a user.";

            return;

        }


        const book =
            books.find(
                function (item) {

                    return item.id === bookId;

                }
            );


        if (!book) {

            return;

        }


        if (
            book.status !== "available"
        ) {

            issueMessage.textContent =
                "This book is not currently available.";

            return;

        }


        book.status =
            "borrowed";

        book.user =
            user;


        issueMessage.textContent =
            "";


        document
            .getElementById(
                "issue-user"
            )
            .value = "";


        issueBookSelect.value =
            "";


        renderAll();


        showToast(
            "Book issued",
            `"${book.title}" was issued to ${user}.`,
            "↗"
        );

    }
);


/* =========================================================
   RETURN BOOK
   ========================================================= */

returnForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const bookId =
            returnBookSelect.value;


        if (!bookId) {

            returnMessage.textContent =
                "Please select a borrowed book.";

            return;

        }


        const book =
            books.find(
                function (item) {

                    return item.id === bookId;

                }
            );


        if (!book) {

            return;

        }


        const previousUser =
            book.user;


        returnedBooks.unshift({

            book: book.title,

            user: previousUser || "Unknown",

            status: "Returned"

        });


        book.status =
            "available";

        book.user =
            "";


        returnMessage.textContent =
            "";


        returnBookSelect.value =
            "";


        renderAll();


        showToast(
            "Book returned",
            `"${book.title}" is available again.`,
            "✓"
        );

    }
);


/* =========================================================
   ISSUE TABLE
   ========================================================= */

function renderIssuedTable() {

    const borrowedBooks =
        books.filter(
            function (book) {

                return (
                    book.status === "borrowed"
                );

            }
        );


    if (
        borrowedBooks.length === 0
    ) {

        issuedTableBody.innerHTML = `

            <tr>

                <td colspan="3">
                    No active loans.
                </td>

            </tr>

        `;

        return;

    }


    issuedTableBody.innerHTML =
        borrowedBooks
            .map(
                function (book) {

                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    book.title
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    book.user
                                )}
                            </td>

                            <td>
                                ${statusBadge(
                                    book.status
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   RETURNED TABLE
   ========================================================= */

function renderReturnedTable() {

    if (
        returnedBooks.length === 0
    ) {

        returnedTableBody.innerHTML = `

            <tr>

                <td colspan="3">
                    No returned books in this session.
                </td>

            </tr>

        `;

        return;

    }


    returnedTableBody.innerHTML =
        returnedBooks
            .map(
                function (record) {

                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    record.book
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    record.user
                                )}
                            </td>

                            <td>
                                <span class="status available">
                                    Returned
                                </span>
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
                    No overdue fines recorded.
                </td>

            </tr>

        `;

        return;

    }


    fineTableBody.innerHTML =
        fines
            .map(
                function (record, index) {

                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    record.book
                                )}
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
                                ₹${record.fine}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="table-action"
                                    data-fine-index="${index}"
                                >
                                    Review
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    fineTableBody
        .querySelectorAll(
            "[data-fine-index]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                button.dataset.fineIndex
                            );

                        reviewFine(index);

                    }
                );

            }
        );

}


/* =========================================================
   REVIEW FINE
   ========================================================= */

function reviewFine(index) {

    const record =
        fines[index];


    if (!record) {
        return;
    }


    showToast(
        "Fine record",
        `${record.book} • ₹${record.fine} • ${record.daysOverdue} days overdue.`,
        "₹"
    );

}


/* =========================================================
   AVAILABILITY
   ========================================================= */

availabilityFilters.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                availabilityFilters.forEach(
                    function (item) {

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


function renderAvailability() {

    let filteredBooks =
        books;


    if (
        currentAvailabilityFilter !== "all"
    ) {

        filteredBooks =
            books.filter(
                function (book) {

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
                    No books in this category
                </strong>

                <span>
                    Try another availability filter.
                </span>

            </div>

        `;

        return;

    }


    availabilityGrid.innerHTML =
        filteredBooks
            .map(
                function (book, index) {

                    const statusClass =
                        book.status === "available"
                            ? "available"
                            : book.status === "borrowed"
                                ? "borrowed"
                                : "overdue";


                    const statusText =
                        book.status === "available"
                            ? "Available"
                            : book.status === "borrowed"
                                ? "Borrowed"
                                : "Overdue";


                    return `

                        <div
                            class="availability-card"
                            style="--card-index:${index};"
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


                                <div
                                    class="availability-bottom"
                                >

                                    <span
                                        class="book-status ${statusClass}"
                                    >
                                        <span class="status-dot"></span>
                                        ${statusText}
                                    </span>

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   METRICS
   ========================================================= */

function renderMetrics() {

    const total =
        books.length;


    const available =
        books.filter(
            function (book) {

                return book.status === "available";

            }
        ).length;


    const borrowed =
        books.filter(
            function (book) {

                return book.status === "borrowed";

            }
        ).length;


    const overdue =
        books.filter(
            function (book) {

                return book.status === "overdue";

            }
        ).length;


    const totalBooks =
        document.getElementById(
            "total-books"
        );

    const availableBooks =
        document.getElementById(
            "available-books"
        );

    const borrowedBooks =
        document.getElementById(
            "borrowed-books"
        );

    const overdueBooks =
        document.getElementById(
            "overdue-books"
        );


    if (totalBooks) {
        animateNumber(
            totalBooks,
            total
        );
    }


    if (availableBooks) {
        animateNumber(
            availableBooks,
            available
        );
    }


    if (borrowedBooks) {
        animateNumber(
            borrowedBooks,
            borrowed
        );
    }


    if (overdueBooks) {
        animateNumber(
            overdueBooks,
            overdue
        );
    }


    const sidebarTotal =
        document.getElementById(
            "sidebar-total"
        );


    if (sidebarTotal) {

        sidebarTotal.textContent =
            `${total} ${total === 1 ? "book" : "books"}`;

    }


    const issueCount =
        document.getElementById(
            "issue-count"
        );


    if (issueCount) {

        issueCount.textContent =
            borrowed;

    }


    const fineBookCount =
        document.getElementById(
            "fine-book-count"
        );


    if (fineBookCount) {

        fineBookCount.textContent =
            fines.length;

    }


    const totalFine =
        fines.reduce(
            function (sum, record) {

                return sum + record.fine;

            },
            0
        );


    const totalFineElement =
        document.getElementById(
            "total-fine"
        );


    if (totalFineElement) {

        totalFineElement.textContent =
            `₹${totalFine}`;

    }

}


/* =========================================================
   NUMBER ANIMATION
   ========================================================= */

function animateNumber(
    element,
    target
) {

    const duration = 500;

    const start =
        Number(
            element.textContent
                .replace(/\D/g, "")
        ) || 0;


    const startTime =
        performance.now();


    function update(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) /
                duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        const value =
            Math.round(
                start +
                (target - start) *
                eased
            );


        element.textContent =
            value;


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                update
            );

        }

    }


    requestAnimationFrame(
        update
    );

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll() {

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

    renderMetrics();

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
   TOAST
   ========================================================= */

function showToast(
    title,
    message,
    icon = "✓"
) {

    if (!toast) {
        return;
    }


    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;

    toastIcon.textContent =
        icon;


    toast.classList.remove(
        "show"
    );


    void toast.offsetWidth;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   WINDOW CLICK
   ========================================================= */

window.addEventListener(
    "click",
    function (event) {

        /*
            Close sidebar when clicking outside it
            on smaller screens.
        */

        if (
            window.innerWidth <= 760 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    function () {

        if (
            window.innerWidth > 760
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);