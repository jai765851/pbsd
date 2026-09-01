// ========================================
// SECTION NAVIGATION
// ========================================

function showSection(sectionName) {

    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const selectedSection =
        document.getElementById(sectionName);

    if (selectedSection) {
        selectedSection.classList.add("active");
    }

}


// ========================================
// LOAD BOOKS FROM MYSQL
// ========================================

function loadBooks() {

    fetch("get_books.php")

        .then(response => {

            if (!response.ok) {
                throw new Error("Unable to load books.");
            }

            return response.json();

        })

        .then(books => {

            const bookList =
                document.getElementById("bookList");

            bookList.innerHTML = "";


            // If there are no books

            if (books.length === 0) {

                bookList.innerHTML = `
                    <tr>
                        <td colspan="5">
                            No books found.
                        </td>
                    </tr>
                `;

                return;
            }


            // Add books to table

            books.forEach(book => {

                let status;

                if (Number(book.available_copies) > 0) {

                    status =
                        `<span class="available">
                            Available
                        </span>`;

                } else {

                    status =
                        `<span class="issued">
                            Issued
                        </span>`;

                }


                const row = `

                    <tr>

                        <td>
                            B${String(book.book_id).padStart(3, "0")}
                        </td>

                        <td>
                            ${book.title}
                        </td>

                        <td>
                            ${book.author}
                        </td>

                        <td>
                            ${book.category || "N/A"}
                        </td>

                        <td>
                            ${status}
                        </td>

                    </tr>

                `;


                bookList.innerHTML += row;

            });


            // Update dashboard

            updateDashboard(books);

        })


        .catch(error => {

            console.error(
                "Error loading books:",
                error
            );

            const bookList =
                document.getElementById("bookList");

            bookList.innerHTML = `

                <tr>

                    <td colspan="5">

                        Unable to load books.

                    </td>

                </tr>

            `;

        });

}


// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard(books) {

    let totalCopies = 0;
    let availableCopies = 0;


    books.forEach(book => {

        totalCopies +=
            Number(book.total_copies) || 0;

        availableCopies +=
            Number(book.available_copies) || 0;

    });


    const issuedCopies =
        totalCopies - availableCopies;


    document.getElementById("totalBooks")
        .innerText = totalCopies;


    document.getElementById("availableBooks")
        .innerText = availableCopies;


    document.getElementById("issuedBooks")
        .innerText = issuedCopies;

}


// ========================================
// SEARCH BOOKS
// ========================================

function searchBooks() {

    const input =
        document.getElementById("searchBook")
        .value
        .toLowerCase();


    const rows =
        document.querySelectorAll(
            "#bookTable tbody tr"
        );


    rows.forEach(row => {

        const text =
            row.innerText.toLowerCase();


        if (text.includes(input)) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}


// ========================================
// ISSUE / RETURN
// ========================================

function processBook() {

    const student =
        document.getElementById("studentName")
        .value
        .trim();


    const book =
        document.getElementById("bookName")
        .value
        .trim();


    const action =
        document.getElementById("action")
        .value;


    const message =
        document.getElementById("message");


    if (student === "" || book === "") {

        message.innerText =
            "Please enter student and book details.";

        message.style.color = "red";

        return;

    }


    if (action === "Issue") {

        message.innerText =
            `"${book}" has been issued to ${student}.`;

    } else {

        message.innerText =
            `"${book}" has been returned by ${student}.`;

    }


    message.style.color = "green";


    document.getElementById("studentName")
        .value = "";


    document.getElementById("bookName")
        .value = "";

}


// ========================================
// ADD BOOK
// ========================================

function openBookForm() {

    const title =
        prompt("Enter book title:");


    if (!title || title.trim() === "") {

        return;

    }


    alert(
        "Book '" +
        title +
        "' added successfully!"
    );

}


// ========================================
// ADD MEMBER
// ========================================

function addMember() {

    const name =
        prompt("Enter member name:");


    if (!name || name.trim() === "") {

        return;

    }


    alert(
        "Member '" +
        name +
        "' added successfully!"
    );

}


// ========================================
// LOGOUT
// ========================================

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (confirmLogout) {

        alert(
            "You have been logged out."
        );

    }
}