"""Library Management System API."""

from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import (
    LOAN_DAYS,
    Book,
    Issue,
    User,
    calculate_fine,
    days_overdue,
    get_db,
    init_db,
    next_book_code,
    refresh_overdue_status,
    utcnow,
)
from security import create_access_token, decode_access_token, verify_password

BASE_DIR = Path(__file__).resolve().parent
bearer = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Library Management System", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=120)


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    author: str = Field(min_length=1, max_length=200)


class BookUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    author: str = Field(min_length=1, max_length=200)


class IssueRequest(BaseModel):
    book_id: int
    borrower: str = Field(min_length=1, max_length=120)


class ReturnRequest(BaseModel):
    book_id: int


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    username = decode_access_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def book_payload(book: Book, db: Session) -> dict:
    issue = (
        db.query(Issue)
        .filter(Issue.book_id == book.id, Issue.returned_at.is_(None))
        .first()
    )
    borrower = issue.borrower if issue else ""
    due_at = issue.due_at.isoformat() if issue else None
    overdue_days = days_overdue(issue) if issue else 0
    fine = calculate_fine(issue) if issue else 0.0
    return {
        "id": book.id,
        "code": book.code,
        "title": book.title,
        "author": book.author,
        "status": book.status,
        "borrower": borrower,
        "due_at": due_at,
        "days_overdue": overdue_days,
        "fine": fine,
    }


def issue_payload(issue: Issue) -> dict:
    overdue = days_overdue(issue)
    fine = issue.fine_amount if issue.returned_at else calculate_fine(issue)
    return {
        "id": issue.id,
        "book_id": issue.book_id,
        "book_code": issue.book.code,
        "title": issue.book.title,
        "borrower": issue.borrower,
        "issued_at": issue.issued_at.isoformat(),
        "due_at": issue.due_at.isoformat(),
        "returned_at": issue.returned_at.isoformat() if issue.returned_at else None,
        "status": "returned" if issue.returned_at else ("overdue" if overdue else "borrowed"),
        "days_overdue": overdue,
        "fine": fine,
    }


@app.post("/api/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return {
        "token": create_access_token(user.username),
        "username": user.username,
    }


@app.get("/api/me")
def me(user: User = Depends(current_user)):
    return {"username": user.username}


@app.get("/api/dashboard")
def dashboard(_: User = Depends(current_user), db: Session = Depends(get_db)):
    refresh_overdue_status(db)
    books = db.query(Book).all()
    issues = db.query(Issue).all()
    active = [item for item in issues if item.returned_at is None]
    overdue = [item for item in active if days_overdue(item) > 0]
    outstanding = sum(calculate_fine(item) for item in overdue)
    collected = sum(item.fine_amount for item in issues if item.returned_at and item.fine_amount)
    recent = (
        db.query(Issue)
        .order_by(Issue.issued_at.desc())
        .limit(6)
        .all()
    )
    return {
        "total_books": len(books),
        "available": sum(1 for book in books if book.status == "available"),
        "borrowed": sum(1 for book in books if book.status == "borrowed"),
        "overdue": len(overdue),
        "active_loans": len(active),
        "outstanding_fines": outstanding,
        "collected_fines": collected,
        "recent_issues": [issue_payload(item) for item in recent],
        "overdue_items": [issue_payload(item) for item in overdue],
    }


@app.get("/api/books")
def list_books(
    q: str = Query("", max_length=200),
    sort: str = Query("default"),
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    refresh_overdue_status(db)
    search = q.strip().lower()
    books = db.query(Book).all()
    items = [book_payload(book, db) for book in books]
    if search:
        items = [
            item
            for item in items
            if search in item["title"].lower()
            or search in item["author"].lower()
            or search in item["code"].lower()
        ]
    if sort == "title":
        items.sort(key=lambda item: item["title"].lower())
    elif sort == "author":
        items.sort(key=lambda item: item["author"].lower())
    elif sort == "status":
        items.sort(key=lambda item: item["status"])
    else:
        items.sort(key=lambda item: item["code"])
    return items


@app.post("/api/books", status_code=status.HTTP_201_CREATED)
def create_book(
    payload: BookCreate,
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    title = payload.title.strip()
    author = payload.author.strip()
    if not title or not author:
        raise HTTPException(status_code=400, detail="Title and author are required")
    book = Book(
        code=next_book_code(db),
        title=title,
        author=author,
        status="available",
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book_payload(book, db)


@app.put("/api/books/{book_id}")
def update_book(
    book_id: int,
    payload: BookUpdate,
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    title = payload.title.strip()
    author = payload.author.strip()
    if not title or not author:
        raise HTTPException(status_code=400, detail="Title and author are required")
    book.title = title
    book.author = author
    db.commit()
    db.refresh(book)
    return book_payload(book, db)


@app.delete("/api/books/{book_id}")
def delete_book(
    book_id: int,
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.status != "available":
        raise HTTPException(status_code=400, detail="A borrowed or overdue book cannot be deleted")
    if db.query(Issue).filter(Issue.book_id == book.id).first():
        raise HTTPException(status_code=400, detail="Cannot delete a book with issue history")
    db.delete(book)
    db.commit()
    return {"ok": True}


@app.post("/api/issues")
def issue_book(
    payload: IssueRequest,
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    refresh_overdue_status(db)
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.status != "available":
        raise HTTPException(status_code=400, detail="This book is not currently available")
    borrower = payload.borrower.strip()
    if not borrower:
        raise HTTPException(status_code=400, detail="Borrower name is required")
    now = utcnow()
    issue = Issue(
        book_id=book.id,
        borrower=borrower,
        issued_at=now,
        due_at=now + timedelta(days=LOAN_DAYS),
    )
    book.status = "borrowed"
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue_payload(issue)


@app.get("/api/issues")
def list_issues(
    active: bool = True,
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    refresh_overdue_status(db)
    query = db.query(Issue)
    if active:
        query = query.filter(Issue.returned_at.is_(None))
    items = query.order_by(Issue.issued_at.desc()).all()
    return [issue_payload(item) for item in items]


@app.post("/api/returns")
def return_book(
    payload: ReturnRequest,
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    refresh_overdue_status(db)
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    issue = (
        db.query(Issue)
        .filter(Issue.book_id == book.id, Issue.returned_at.is_(None))
        .first()
    )
    if not issue:
        raise HTTPException(status_code=400, detail="This book is not currently borrowed")
    now = utcnow()
    issue.returned_at = now
    issue.fine_amount = calculate_fine(issue, now)
    book.status = "available"
    db.commit()
    db.refresh(issue)
    return issue_payload(issue)


@app.get("/api/returns")
def list_returns(_: User = Depends(current_user), db: Session = Depends(get_db)):
    items = (
        db.query(Issue)
        .filter(Issue.returned_at.is_not(None))
        .order_by(Issue.returned_at.desc())
        .all()
    )
    return [issue_payload(item) for item in items]


@app.get("/api/fines")
def list_fines(_: User = Depends(current_user), db: Session = Depends(get_db)):
    refresh_overdue_status(db)
    issues = db.query(Issue).all()
    records = []
    total = 0.0
    for issue in issues:
        fine = issue.fine_amount if issue.returned_at else calculate_fine(issue)
        overdue = days_overdue(issue)
        if fine <= 0 and overdue <= 0:
            continue
        item = issue_payload(issue)
        records.append(item)
        total += item["fine"]
    records.sort(key=lambda item: item["fine"], reverse=True)
    return {
        "total": round(total, 2),
        "count": len(records),
        "items": records,
    }


@app.get("/api/availability")
def availability(
    status_filter: str = Query("all", alias="status"),
    _: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    refresh_overdue_status(db)
    books = [book_payload(book, db) for book in db.query(Book).all()]
    if status_filter == "available":
        books = [item for item in books if item["status"] == "available"]
    elif status_filter == "borrowed":
        books = [item for item in books if item["status"] in ("borrowed", "overdue")]
    elif status_filter == "overdue":
        books = [item for item in books if item["status"] == "overdue"]
    return books


@app.get("/")
def index():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/style.css")
def stylesheet():
    return FileResponse(BASE_DIR / "style.css", media_type="text/css")


@app.get("/script.js")
def javascript():
    return FileResponse(BASE_DIR / "script.js", media_type="text/javascript")


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

