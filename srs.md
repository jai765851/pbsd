

## 1. Purpose and Scope

### Purpose

The purpose of the Library Management System is to provide a simple system for managing user access, books, book issues, returns, fines, and book availability.

### In Scope

* User login
* Book management
* Book issue
* Book return
* Fine management
* Book availability

### Out of Scope

* Online payment
* Email or SMS notifications
* Online book reservation
* Integration with external library systems

## 2. Functional Requirements

**FR-01:** The system shall allow users to securely log in to the library management system.

**FR-02:** The system shall allow authorized users to add, update, delete, and search library books.

**FR-03:** The system shall record books issued to users and update their availability.

**FR-04:** The system shall record returned books and update their status.

**FR-05:** The system shall calculate fines for overdue books.

**FR-06:** The system shall allow users to check available and borrowed books.

## 3. Non-Functional Requirements

**NFR-01:** The system shall complete normal operations within **2 seconds**.

**NFR-02:** The system shall allow only authenticated users to access the system within **1 login attempt using valid credentials**.

**NFR-03:** The system shall allow users to access the main functions with **no more than 3 steps** from the main menu.

**NFR-04:** The system shall maintain **99% data reliability** during normal operation.

## 4. Assumptions

* Users have valid login credentials.
* Book information is entered correctly.
* The system is used on a computer with Python installed.
* SQLite is available for storing system data.

## 5. Constraints

* The system will be developed using **Python**.
* The database will use **SQLite**.
* The project must remain simple enough to complete within **a few weeks**.
* The system will contain only the **6 specified requirements**.
