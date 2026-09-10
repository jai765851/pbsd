from datetime import datetime, timedelta

from fastapi.testclient import TestClient
import pytest

from database import FINE_PER_DAY, LOAN_DAYS, Issue, calculate_fine, days_overdue
from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def auth_headers(client):
    response = client.post("/api/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# FR-01: User Login & Authentication
# ==============================================================================

def test_login_success_and_me(client):
    response = client.post("/api/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["username"] == "admin"

    headers = {"Authorization": f"Bearer {data['token']}"}
    me = client.get("/api/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["username"] == "admin"


def test_login_failures(client):
    # Invalid password
    bad_pass = client.post("/api/login", json={"username": "admin", "password": "wrongpassword"})
    assert bad_pass.status_code == 401

    # Nonexistent user
    bad_user = client.post("/api/login", json={"username": "nobody", "password": "admin123"})
    assert bad_user.status_code == 401

    # Unauthenticated endpoints
    assert client.get("/api/books").status_code == 401
    assert client.get("/api/dashboard").status_code == 401
    assert client.get("/api/fines").status_code == 401
    assert client.get("/api/availability").status_code == 401


# ==============================================================================
# FR-02: Book Management (Add, Update, Delete, Search)
# ==============================================================================

def test_book_crud_lifecycle(client):
    headers = auth_headers(client)

    # Add book (code generated automatically, status="available")
    created = client.post(
        "/api/books",
        json={"title": "Introduction to Algorithms", "author": "Thomas H. Cormen"},
        headers=headers,
    )
    assert created.status_code == 201
    book = created.json()
    assert book["title"] == "Introduction to Algorithms"
    assert book["author"] == "Thomas H. Cormen"
    assert book["status"] == "available"
    assert book["code"].startswith("B")
    book_id = book["id"]
    book_code = book["code"]

    # Search by title
    search_title = client.get("/api/books", params={"q": "Algorithms"}, headers=headers)
    assert search_title.status_code == 200
    assert any(b["id"] == book_id for b in search_title.json())

    # Search by author
    search_author = client.get("/api/books", params={"q": "Cormen"}, headers=headers)
    assert search_author.status_code == 200
    assert any(b["id"] == book_id for b in search_author.json())

    # Search by code
    search_code = client.get("/api/books", params={"q": book_code}, headers=headers)
    assert search_code.status_code == 200
    assert any(b["id"] == book_id for b in search_code.json())

    # Sorting
    for sort_key in ["title", "author", "status", "default"]:
        sort_res = client.get("/api/books", params={"sort": sort_key}, headers=headers)
        assert sort_res.status_code == 200
        assert len(sort_res.json()) > 0

    # Update book
    updated = client.put(
        f"/api/books/{book_id}",
        json={"title": "Introduction to Algorithms, 4th Ed.", "author": "Thomas H. Cormen"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Introduction to Algorithms, 4th Ed."

    # Delete book (available with no issue history)
    deleted = client.delete(f"/api/books/{book_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json() == {"ok": True}

    # Verify deleted
    after_delete = client.get("/api/books", params={"q": book_code}, headers=headers)
    assert not any(b["id"] == book_id for b in after_delete.json())


def test_book_validation_errors(client):
    headers = auth_headers(client)

    # Empty / whitespace title or author rejected with 400
    empty_title = client.post("/api/books", json={"title": "   ", "author": "Valid Author"}, headers=headers)
    assert empty_title.status_code == 400

    empty_author = client.post("/api/books", json={"title": "Valid Title", "author": "   "}, headers=headers)
    assert empty_author.status_code == 400

    # Nonexistent book update / delete returns 404
    assert client.put("/api/books/99999", json={"title": "T", "author": "A"}, headers=headers).status_code == 404
    assert client.delete("/api/books/99999", headers=headers).status_code == 404


def test_book_delete_restrictions(client):
    headers = auth_headers(client)

    # Create a book
    res = client.post("/api/books", json={"title": "Restricted Book", "author": "Author R"}, headers=headers)
    book_id = res.json()["id"]

    # Issue book -> status is now "borrowed"
    client.post("/api/issues", json={"book_id": book_id, "borrower": "Borrower 1"}, headers=headers)

    # Rule: Borrowed books cannot be deleted
    del_borrowed = client.delete(f"/api/books/{book_id}", headers=headers)
    assert del_borrowed.status_code == 400
    assert "borrowed or overdue" in del_borrowed.json()["detail"]

    # Return book
    client.post("/api/returns", json={"book_id": book_id}, headers=headers)

    # Rule: Books with circulation history cannot be deleted
    del_history = client.delete(f"/api/books/{book_id}", headers=headers)
    assert del_history.status_code == 400
    assert "issue history" in del_history.json()["detail"]


# ==============================================================================
# FR-03: Book Issue & Loan Tracking
# ==============================================================================

def test_book_issue_lifecycle(client):
    headers = auth_headers(client)

    # Create book
    book = client.post("/api/books", json={"title": "Issue Test Book", "author": "Author I"}, headers=headers).json()
    book_id = book["id"]

    # Issue book (loan period is 14 days)
    issued = client.post(
        "/api/issues",
        json={"book_id": book_id, "borrower": "Student X"},
        headers=headers,
    )
    assert issued.status_code == 200
    issue_data = issued.json()
    assert issue_data["borrower"] == "Student X"
    assert issue_data["status"] == "borrowed"
    assert issue_data["book_id"] == book_id

    # Check due date is ~14 days from issue date
    issue_dt = datetime.fromisoformat(issue_data["issued_at"])
    due_dt = datetime.fromisoformat(issue_data["due_at"])
    assert (due_dt - issue_dt).days == LOAN_DAYS

    # Rule: Cannot issue already borrowed book
    second_issue = client.post("/api/issues", json={"book_id": book_id, "borrower": "Student Y"}, headers=headers)
    assert second_issue.status_code == 400

    # Rule: Cannot issue with empty borrower name
    empty_borrower = client.post("/api/issues", json={"book_id": book_id, "borrower": "   "}, headers=headers)
    assert empty_borrower.status_code == 400

    # Rule: Nonexistent book issue returns 404
    assert client.post("/api/issues", json={"book_id": 99999, "borrower": "Student Z"}, headers=headers).status_code == 404

    # Active issues listing
    issues_list = client.get("/api/issues", params={"active": True}, headers=headers)
    assert issues_list.status_code == 200
    assert any(item["id"] == issue_data["id"] for item in issues_list.json())


# ==============================================================================
# FR-04: Book Return & Availability Restoration
# ==============================================================================

def test_book_return_lifecycle(client):
    headers = auth_headers(client)

    # Create and issue book
    book = client.post("/api/books", json={"title": "Return Test Book", "author": "Author R"}, headers=headers).json()
    book_id = book["id"]
    client.post("/api/issues", json={"book_id": book_id, "borrower": "Student Return"}, headers=headers)

    # Return book
    ret_res = client.post("/api/returns", json={"book_id": book_id}, headers=headers)
    assert ret_res.status_code == 200
    ret_data = ret_res.json()
    assert ret_data["status"] == "returned"
    assert ret_data["returned_at"] is not None

    # Verify book status restored to "available"
    books_res = client.get("/api/books", params={"q": "Return Test Book"}, headers=headers)
    matched = [b for b in books_res.json() if b["id"] == book_id]
    assert len(matched) == 1
    assert matched[0]["status"] == "available"

    # Rule: Cannot return an unborrowed book
    repeat_return = client.post("/api/returns", json={"book_id": book_id}, headers=headers)
    assert repeat_return.status_code == 400

    # Rule: Nonexistent book return returns 404
    assert client.post("/api/returns", json={"book_id": 99999}, headers=headers).status_code == 404

    # Returned items listing
    returns_list = client.get("/api/returns", headers=headers)
    assert returns_list.status_code == 200
    assert any(item["book_id"] == book_id for item in returns_list.json())


# ==============================================================================
# FR-05: Fine Calculation & Management
# ==============================================================================

def test_fine_calculation_helpers():
    due = datetime(2026, 1, 1, 12, 0, 0)

    # On or before due date: 0 fine
    issue_on_time = Issue(book_id=1, borrower="T", issued_at=due - timedelta(days=14), due_at=due)
    assert days_overdue(issue_on_time, due) == 0
    assert calculate_fine(issue_on_time, due) == 0.0

    # 5 days overdue: 5 * 10 = ₹50
    now = due + timedelta(days=5)
    assert days_overdue(issue_on_time, now) == 5
    assert calculate_fine(issue_on_time, now) == 5 * FINE_PER_DAY


def test_fines_endpoint(client):
    headers = auth_headers(client)

    fines_res = client.get("/api/fines", headers=headers)
    assert fines_res.status_code == 200
    data = fines_res.json()
    assert "total" in data
    assert "count" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    if data["items"]:
        # Should be ordered descending by fine amount
        fines = [item["fine"] for item in data["items"]]
        assert fines == sorted(fines, reverse=True)


# ==============================================================================
# FR-06: Book Availability
# ==============================================================================

def test_book_availability_filters(client):
    headers = auth_headers(client)

    # All books
    all_books = client.get("/api/availability", params={"status": "all"}, headers=headers)
    assert all_books.status_code == 200
    assert len(all_books.json()) > 0

    # Available filter
    avail_books = client.get("/api/availability", params={"status": "available"}, headers=headers)
    assert avail_books.status_code == 200
    assert all(b["status"] == "available" for b in avail_books.json())

    # Borrowed filter (includes borrowed and overdue)
    borrowed_books = client.get("/api/availability", params={"status": "borrowed"}, headers=headers)
    assert borrowed_books.status_code == 200
    assert all(b["status"] in ("borrowed", "overdue") for b in borrowed_books.json())

    # Overdue filter
    overdue_books = client.get("/api/availability", params={"status": "overdue"}, headers=headers)
    assert overdue_books.status_code == 200
    assert all(b["status"] == "overdue" for b in overdue_books.json())


# ==============================================================================
# Dashboard & Reports
# ==============================================================================

def test_dashboard_metrics_and_reports(client):
    headers = auth_headers(client)

    dashboard = client.get("/api/dashboard", headers=headers)
    assert dashboard.status_code == 200
    data = dashboard.json()

    # Verify all expected metric cards and reports are present
    required_keys = [
        "total_books",
        "available",
        "borrowed",
        "overdue",
        "active_loans",
        "outstanding_fines",
        "collected_fines",
        "recent_issues",
        "overdue_items",
    ]
    for key in required_keys:
        assert key in data, f"Missing dashboard key: {key}"

    assert data["total_books"] >= 0
    assert data["available"] >= 0
    assert data["borrowed"] >= 0
    assert data["overdue"] >= 0
    assert data["outstanding_fines"] >= 0.0
    assert data["collected_fines"] >= 0.0
    assert isinstance(data["recent_issues"], list)
    assert isinstance(data["overdue_items"], list)


# ==============================================================================
# Static Assets & Health Check
# ==============================================================================

def test_static_and_health_endpoints(client):
    assert client.get("/health").status_code == 200

    # Favicon returns 204 No Content
    fav = client.get("/favicon.ico")
    assert fav.status_code == 204

    # HTML home
    home = client.get("/")
    assert home.status_code == 200
    assert "LIBRARY MANAGEMENT SYSTEM" in home.text or "Library Management System" in home.text

    # CSS
    css = client.get("/style.css")
    assert css.status_code == 200
    assert "text/css" in css.headers["content-type"]

    # JS
    js = client.get("/script.js")
    assert js.status_code == 200
    assert "text/javascript" in js.headers["content-type"]
