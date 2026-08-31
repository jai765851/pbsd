1. Purpose and Scope
Purpose

The purpose of the Library Management System is to provide a simple system for managing users, books, members, book issues, returns, and fines using a centralized database.

In Scope
Student and librarian login.
Adding, editing, deleting, and searching books.
Adding, editing, and removing library members.
Recording issued books and due dates.
Recording returned books and updating availability.
Calculating fines for overdue books.
Out of Scope
Features not listed in the requirements.
Integration with external library systems or services.
Online payment processing.
Mobile application development.
2. Functional Requirements
FR-01: The system shall allow students and librarians to log in securely.
FR-02: The system shall allow users to add, edit, delete, and search books.
FR-03: The system shall allow users to add, edit, and remove library members.
FR-04: The system shall record books issued to members and their due dates.
FR-05: The system shall record returned books and update their availability.
FR-06: The system shall calculate fines for overdue books.
3. Non-Functional Requirements
NFR-01: The system shall complete standard operations within 2 seconds under normal usage.
NFR-02: The system shall require valid login credentials and allow access only to authenticated users.
NFR-03: The system shall provide clear labels and navigation so that a new user can perform basic operations within 5 minutes of use.
NFR-04: The system shall maintain 99% data consistency during normal database operations.
4. Assumptions
Users have valid login credentials.
The system is used by students and librarians.
Book and member information is entered correctly by authorized users.
The system runs on a computer with Python and SQLite installed.
The library uses a single local database.
5. Constraints
The system shall be developed using Python.
SQLite shall be used as the database.
The project is limited to the six specified features.
The first version is intended for a small college project and local use.