# Requirements

This file restates the in-scope requirements from `srs.md`. The application implements only these items.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | Users can log in securely with valid credentials. |
| FR-02 | Authorized users can add, update, delete, and search books. |
| FR-03 | The system records books issued to borrowers and updates availability. |
| FR-04 | The system records returned books and updates status. |
| FR-05 | The system calculates fines for overdue books. |
| FR-06 | Users can check available and borrowed books. |

## Operational rules used to meet FR-03 to FR-05

- Loan period: 14 days from the issue date
- Fine: ₹10 per day after the due date
- Borrowed books cannot be deleted
- Books with circulation history cannot be deleted

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | Normal operations complete within 2 seconds. |
| NFR-02 | Only authenticated users can use the system; one successful login with valid credentials grants access. |
| NFR-03 | Main functions are reachable in no more than 3 steps from the menu. |
| NFR-04 | Data is stored in SQLite during normal operation. |

## Out of scope

- Online payment
- Email or SMS notifications
- Online book reservation
- Integration with external library systems
