"""SQLite database setup, models, and seed data."""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from security import hash_password

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.getenv("LMS_DB_PATH", str(BASE_DIR / "library.db")))
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

LOAN_DAYS = 14
FINE_PER_DAY = 10.0

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    author: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="available")

    issues: Mapped[list["Issue"]] = relationship(back_populates="book")


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    borrower: Mapped[str] = mapped_column(String(120))
    issued_at: Mapped[datetime] = mapped_column(DateTime)
    due_at: Mapped[datetime] = mapped_column(DateTime)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fine_amount: Mapped[float] = mapped_column(Float, default=0.0)

    book: Mapped[Book] = relationship(back_populates="issues")


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def days_overdue(issue: Issue, now: datetime | None = None) -> int:
    now = now or utcnow()
    end = issue.returned_at or now
    if end <= issue.due_at:
        return 0
    return max(0, (end.date() - issue.due_at.date()).days)


def calculate_fine(issue: Issue, now: datetime | None = None) -> float:
    return round(days_overdue(issue, now) * FINE_PER_DAY, 2)


def refresh_overdue_status(db) -> None:
    now = utcnow()
    active = (
        db.query(Issue)
        .filter(Issue.returned_at.is_(None))
        .all()
    )
    for issue in active:
        if issue.due_at < now and issue.book.status != "overdue":
            issue.book.status = "overdue"
        elif issue.due_at >= now and issue.book.status == "overdue":
            issue.book.status = "borrowed"
    db.commit()


def next_book_code(db) -> str:
    books = db.query(Book).all()
    number = 1
    existing = {book.code for book in books}
    while True:
        code = f"B{number:03d}"
        if code not in existing:
            return code
        number += 1


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            db.add(
                User(
                    username="admin",
                    password_hash=hash_password("admin123"),
                )
            )

        if db.query(Book).count() == 0:
            samples = [
                ("B001", "Introduction to Python", "Mark Lutz", "available"),
                ("B002", "Database System Concepts", "Abraham Silberschatz", "borrowed"),
                ("B003", "Computer Networks", "Andrew S. Tanenbaum", "available"),
                ("B004", "Software Engineering", "Ian Sommerville", "borrowed"),
                ("B005", "Data Structures and Algorithms", "Robert Lafore", "available"),
                ("B006", "Web Technologies", "Uttam K. Roy", "available"),
                ("B007", "Operating Systems", "Abraham Silberschatz", "available"),
                ("B008", "Computer Organization", "Carl Hamacher", "overdue"),
            ]
            for code, title, author, status in samples:
                db.add(Book(code=code, title=title, author=author, status=status))
            db.flush()

            now = utcnow()
            borrowed = db.query(Book).filter(Book.code == "B002").one()
            borrowed2 = db.query(Book).filter(Book.code == "B004").one()
            overdue = db.query(Book).filter(Book.code == "B008").one()

            db.add(
                Issue(
                    book_id=borrowed.id,
                    borrower="Student A",
                    issued_at=now - timedelta(days=4),
                    due_at=now + timedelta(days=LOAN_DAYS - 4),
                )
            )
            db.add(
                Issue(
                    book_id=borrowed2.id,
                    borrower="Student B",
                    issued_at=now - timedelta(days=6),
                    due_at=now + timedelta(days=LOAN_DAYS - 6),
                )
            )
            db.add(
                Issue(
                    book_id=overdue.id,
                    borrower="Student C",
                    issued_at=now - timedelta(days=20),
                    due_at=now - timedelta(days=6),
                )
            )

        db.commit()
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
