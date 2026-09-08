# Database & Data Persistence Rule (STRICT & PERMANENT)

## Core Directive
Under NO circumstances must existing data in the database (Sales, Non-GST Invoices, Purchases, Inventory Stocks, Parties, Customers, Payments, Ledger accounts, or Business profiles) be wiped, overwritten, or replaced during feature updates, bug fixes, or deployments.

---

### Strict Guidelines:

1. **Zero Data Loss on Deployments**:
   - Deployment archives (`deploy.tar.gz`) must ALWAYS exclude SQLite database files (`*.db`, `*.db-journal`, `*.db-wal`, `*.db-shm`, `dev.db`).
   - The live production database on Hostinger (`public_html/prisma/dev.db`) must remain completely persistent and untouched across all deployments.

2. **No Destructive Database Commands**:
   - NEVER run `prisma migrate reset`
   - NEVER run `prisma db push --force-reset`
   - NEVER run seed scripts that perform `deleteMany()` on existing tables in a production environment.
   - Any database schema changes must be purely additive (e.g. optional fields with defaults).

3. **Inventory (In / Out) Integrity**:
   - Every purchase increases stock (`stock + qty`).
   - Every sale decreases stock (`stock - qty`).
   - Every cancellation/deletion safely rolls back stock without touching other items or resetting inventory numbers.
   - Item base records, current stock, and transaction history must be preserved.

4. **Invoice & Transaction Persistence**:
   - All generated invoices (GST Tax Invoices, Non-GST Bills, Purchase Inward Bills) must remain permanent.
   - Editing an invoice must only update that specific invoice record and its associated line items via atomic transactions (`prisma.$transaction`).
   - Counter sequences (Next Invoice Number, Next Bill Number) must never reset to 1 if previous invoices exist.

5. **Business Profile & Settings**:
   - Updates to business details (e.g. via `/api/business`) must update the existing record by ID (`prisma.business.update`) and NEVER wipe existing company data or split records.
