// Change between sections

function showSection(sectionName) {

    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(sectionName).classList.add("active");
}


// Search books

function searchBooks() {

    const input = document
        .getElementById("searchBook")
        .value
        .toLowerCase();

    const rows = document.querySelectorAll("#bookTable tbody tr");

    rows.forEach(row => {

        const text = row.innerText.toLowerCase();

        if (text.includes(input)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });
}


// Issue / Return

function processBook() {

    const student =
        document.getElementById("studentName").value;

    const book =
        document.getElementById("bookName").value;

    const action =
        document.getElementById("action").value;

    const message =
        document.getElementById("message");


    if (student === "" || book === "") {

        message.innerText =
            "Please enter student and book details.";

        message.style.color = "red";

        return;
    }


    message.innerText =
        book + " has been " + action.toLowerCase() +
        "ed to/from " + student + ".";

    message.style.color = "green";


    document.getElementById("studentName").value = "";
    document.getElementById("bookName").value = "";
}


// Add book

function openBookForm() {

    const title = prompt("Enter book title:");

    if (title === null || title.trim() === "") {
        return;
    }

    alert(
        "Book '" + title +
        "' added successfully!"
    );
}


// Add member

function addMember() {

    const name = prompt("Enter member name:");

    if (name === null || name.trim() === "") {
        return;
    }

    alert(
        "Member '" + name +
        "' added successfully!"
    );
}


// Logout

function logout() {

    const confirmLogout =
        confirm("Are you sure you want to logout?");

    if (confirmLogout) {
        alert("You have been logged out.");
    }
} 