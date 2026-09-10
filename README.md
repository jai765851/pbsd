# Library Management System

A complete Library Management System built with a **FastAPI** backend, **SQLite** database, and a responsive **HTML5/CSS3/JavaScript** frontend, implemented strictly in accordance with [srs.md](srs.md) and [REQUIREMENTS.md](REQUIREMENTS.md).

---

## Features (SRS & Functional Requirements)

| Requirement | Description |
| --- | --- |
| **FR-01: User Login** | Secure authentication with PBKDF2 password hashing and JWT access tokens. |
| **FR-02: Book Management** | Add new books (with auto-generated codes like `B001`), update titles/authors, delete uncirculated books, and search catalog by title, author, or code with multi-field sorting. |
| **FR-03: Book Issue** | Issue available books to borrowers with an automatic 14-day loan period and status tracking (`borrowed`). |
| **FR-04: Book Return** | Record returned books, restore book availability (`available`), and compute overdue duration and fines. |
| **FR-05: Fine Management** | Automatic overdue fine calculation (₹10 per day after the 14-day loan period) with fine summaries and reports. |
| **FR-06: Book Availability** | Real-time catalog filtering across `All`, `Available`, `Borrowed`, and `Overdue` titles. |

### Operational Rules
- **Loan period**: 14 days from the date and time of issue.
- **Overdue fine**: ₹10 per day after the due date.
- **Delete protection**: Borrowed or overdue books cannot be deleted.
- **History protection**: Books with past circulation history cannot be deleted.

### Out of Scope (per SRS)
- Online payment
- Email or SMS notifications
- Online book reservation
- Integration with external library systems

---

## Prerequisites

- **Python**: Version 3.10 or newer (tested on Python 3.13)
- **pip**: Package installer for Python
- Modern web browser (Chrome, Edge, Firefox, Safari)

---

## Installation & Setup

1. **Open a terminal in the project directory**:

   ```bash
   cd c:\pbsd
   ```

2. **Create and activate a virtual environment**:

   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```

   - **Windows (Command Prompt)**:
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate.bat
     ```

   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

---

## Running the Application

Start the FastAPI server with Uvicorn:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Once started:
- Open your browser to: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**
- Interactive API documentation (Swagger UI): **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

> [!IMPORTANT]
> Always access the application through `http://127.0.0.1:8000` (not via direct `file://` opening) so that API requests, token authentication, and database transactions function properly.

### Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

The SQLite database file (`library.db`) is automatically initialized and seeded with default administrative credentials and sample catalog items upon the first server launch.

---

## Running Automated Tests

Run the full automated test suite using `pytest`:

```bash
pytest -v
```

Or for concise output:

```bash
pytest -q
```

All 12 automated integration and unit test cases verify:
- User login, token generation, rejection of bad credentials, and session validation (`/api/me`)
- Book CRUD (create, auto-code assignment, update, delete constraints, validation errors)
- Book search (title, author, code) and sorting
- Book issue (14-day calculation, duplicate loan prevention, input validation)
- Book return (availability restoration, multiple returns prevention)
- Fine calculations (₹10/day overdue rule after 14 days, fine reporting)
- Book availability filters (`all`, `available`, `borrowed`, `overdue`)
- Dashboard metrics and circulation reports
- Static asset delivery (`/`, `/style.css`, `/script.js`, `/health`, `/favicon.ico`)

---

## API Reference Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/login` | Authenticate user & retrieve JWT token | No |
| `GET` | `/api/me` | Current authenticated user profile | Yes |
| `GET` | `/api/dashboard` | Collection metrics, active loans, overdue & fines | Yes |
| `GET` | `/api/books` | List & search catalog (`q`, `sort`) | Yes |
| `POST` | `/api/books` | Add a new library book | Yes |
| `PUT` | `/api/books/{id}` | Update book title and author | Yes |
| `DELETE` | `/api/books/{id}` | Delete book (if available and no history) | Yes |
| `POST` | `/api/issues` | Issue a book to a borrower | Yes |
| `GET` | `/api/issues` | List active book loans | Yes |
| `POST` | `/api/returns` | Return a borrowed book & compute fine | Yes |
| `GET` | `/api/returns` | List circulation return history | Yes |
| `GET` | `/api/fines` | Overdue fine report & totals | Yes |
| `GET` | `/api/availability` | Availability filter (`status=all|available|borrowed|overdue`) | Yes |
| `GET` | `/health` | Service health status check | No |

---

## Project Structure

```
.
├── main.py             # FastAPI application, route handlers, dependencies
├── database.py         # SQLAlchemy models (User, Book, Issue), SQLite connection, seed data
├── security.py         # PBKDF2 password hashing and JWT token handlers
├── index.html          # Single-page application interface (Dashboard, Catalog, Issue, Return, Fines, Availability)
├── style.css           # Application styling and responsive layout
├── script.js           # Frontend client logic, state management, and REST API integration
├── pytest.ini          # Pytest configuration file (pythonpath, testpaths)
├── requirements.txt    # Python package dependencies
├── library.db          # SQLite database file
├── srs.md              # Software Requirements Specification (source of truth)
├── REQUIREMENTS.md     # In-scope functional requirements & operational rules
├── tests/
│   ├── conftest.py     # Test fixtures and isolated test database setup
│   └── test_api.py     # Automated unit and integration test suite
└── README.md           # Project documentation and run instructions
```
