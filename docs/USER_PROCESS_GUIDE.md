# Rahul Traders — Complete User Process & Operations Manual
**GST Billing, Express POS, Purchases, Inventory, Accounting & Administration Platform**

---

## Table of Contents
1. [System Overview & Login](#1-system-overview--login)
2. [Dashboard & Key Business Indicators](#2-dashboard--key-business-indicators)
3. [Master Setup: Products & Inventory](#3-master-setup-products--inventory)
4. [Master Setup: Customers & Suppliers (Parties)](#4-master-setup-customers--suppliers-parties)
5. [Sales & GST Tax Invoices (Complete Flow)](#5-sales--gst-tax-invoices-complete-flow)
6. [Express POS Billing (Counter Sales)](#6-express-pos-billing-counter-sales)
7. [Non-GST / Cash Sales](#7-non-gst--cash-sales)
8. [Purchases & Goods Inward (Vendor Bills)](#8-purchases--goods-inward-vendor-bills)
9. [Payment In & Payment Out (Ledger Settlements)](#9-payment-in--payment-out-ledger-settlements)
10. [Daily Expenses & Operational Costs](#10-daily-expenses--operational-costs)
11. [GST Reports & Tax Compliance (GSTR-1, GSTR-3B)](#11-gst-reports--tax-compliance-gstr-1-gstr-3b)
12. [Financial Reports & Profit & Loss](#12-financial-reports--profit--loss)
13. [Business Settings, Bank & UPI QR Setup](#13-business-settings-bank--upi-qr-setup)
14. [Data Backup, Security & Multi-User Admin](#14-data-backup-security--multi-user-admin)
15. [Quick Keyboard Shortcuts & Operator Tips](#15-quick-keyboard-shortcuts--operator-tips)

---

## 1. System Overview & Login

### Accessing the Platform
- **Live URL**: `https://rahultrading.online`
- **Supported Devices**: Desktop PC, Laptop, POS Touch Terminals, Tablets, and Smartphones.
- **Supported Printers**: Standard A4 Laser/Inkjet Printers and 80mm / 58mm Thermal Receipt Printers.

### First-Time Onboarding
1. On initial access, if no business is configured, the system redirects to `/onboarding`.
2. Enter your **Business Name** (e.g. *Rahul Traders*), **GSTIN** (15-digit GST Number), **State**, **Registered Address**, **Phone**, and **Bank/UPI Details**.
3. Choose your default billing mode (**GST Invoicing** or **Dual GST + Non-GST Mode**).
4. Upon completion, you land directly on the central Executive Dashboard (`/app`).

---

## 2. Dashboard & Key Business Indicators (`/app`)

The dashboard provides a real-time command center for your business:
- **Top Financial KPI Cards**:
  - **Today's / Monthly Sales**: Total revenue generated with GST breakdown.
  - **Total Purchases**: Value of goods inward and vendor expenses.
  - **Net Profit**: Live calculation (`Sales Revenue - Cost of Goods Sold - Operational Expenses`).
  - **Stock Value**: Live valuation of all inventory in your warehouse (`Quantity × Purchase Price`).
  - **Total Receivables (Due from Customers)**: Outstanding credit waiting to be collected.
  - **Total Payables (Due to Suppliers)**: Outstanding payments owed to vendors.
- **Low Stock Alerts**: Automatically highlights products falling below safety thresholds.
- **Sales Analytics Chart**: Interactive monthly sales trends.
- **Recent Sales Table**: Direct preview and 1-click actions on recent bills.

---

## 3. Master Setup: Products & Inventory (`/app/items`)

Managing your items correctly ensures accurate stock levels, automated GST calculations, and correct profit reporting.

### Adding a New Item
1. Go to **Items / Products** (`/app/items`) and click **+ Add Product**.
2. Fill in the item details:
   - **Product Name**: e.g., *Jau Aata 1kg, Basmati Rice 5kg, Mustard Oil 1L*.
   - **Barcode / SKU**: Enter barcode or scan with a USB barcode scanner.
   - **Category**: Grocery, Grains, Edible Oil, Spices, FMCG, etc.
   - **HSN Code**: 4, 6, or 8-digit GST HSN code (e.g., `1101` for wheat/grain flours).
   - **Unit of Measure (UOM)**: `PCS`, `KG`, `BAG`, `BOX`, `LTR`, `PKT`, etc.
   - **Purchase Price (₹)**: Your inward cost rate excluding tax.
   - **Selling Price (₹)**: Base selling rate before tax.
   - **MRP (₹)**: Maximum Retail Price printed on packaging.
   - **GST Rate (%)**: `0%` (Exempt/Nil), `5%`, `12%`, `18%`, or `28%`.
   - **Opening Stock**: Starting physical quantity in warehouse.
   - **Low Stock Threshold**: Alert level (e.g. alert when stock falls below 10 units).
3. Click **Save Product**.

### Stock Movements & Adjustments
- Every sale **decrements** warehouse stock in real time.
- Every purchase inward **increments** warehouse stock in real time.
- For physical damage, spillage, expiry, or audit corrections, click **Adjust Stock** on any item to log manual additions or deductions with a reason note.

---

## 4. Master Setup: Customers & Suppliers (Parties) (`/app/parties`)

The Parties directory maintains your complete B2B and B2C contact book, GST numbers, and ledger accounts.

### Adding a Customer or Supplier
1. Navigate to **Parties** (`/app/parties`) and click **+ Add Party**.
2. Select **Party Type**:
   - `CUSTOMER`: For buyers, retail clients, wholesale dealers.
   - `SUPPLIER`: For distributors, manufacturers, grain mandis.
   - `BOTH`: For entities from whom you buy and to whom you sell.
3. Fill details:
   - **Party Name**: Firm name or individual name.
   - **GSTIN**: 15-digit GSTIN (e.g., `07AAAAA0000A1Z5`). If provided, state code and intra/inter-state tax rules apply automatically.
   - **Phone & Email**: For sending invoices via WhatsApp and Email.
   - **Billing & Shipping Address**: Complete postal address.
   - **State**: Critical for automatic CGST+SGST vs IGST tax split.
   - **Credit Limit & Opening Balance**: Enter existing balance (Debit if customer owes you; Credit if you owe supplier).
4. Click **Save Party**.

### Viewing Party Ledger Statement
- Click on any party row to view their **Running Account Ledger**:
  - Full history of invoices, payments received, purchase bills, and debit/credit balance.
  - Option to download or share the account statement via WhatsApp.

---

## 5. Sales & GST Tax Invoices (`/app/sales`)

### Creating a New GST Tax Invoice (`/app/sales/new`)
1. Click **Create Invoice** or press **Alt + S**.
2. **Customer Selection**:
   - Select an existing customer or type a new walk-in / cash customer name.
   - If customer has a GSTIN, enter it. The state is auto-filled.
3. **Invoice Date & Due Date**: Select invoice generation date and credit due date.
4. **Adding Line Items**:
   - In the **Item** box, type product name or scan barcode using the interactive search dropdown.
   - **Quantity**: Enter quantity.
   - **Unit Price**: Auto-filled from item master; can be modified on the fly.
   - **Discount (%)**: Enter line-item percentage discount if applicable.
   - **GST Rate (%)**: Auto-detected from item master (0%, 5%, 12%, 18%, 28%).
   - *Operator Advantage*: Clicking on Quantity, Rate, or Discount automatically selects all digits so you can type the new number directly without backspacing!
   - Click **+ Add Item** to add more line items.
5. **Tax Determination (Automatic)**:
   - If Seller State = Buyer State: System charges **CGST (half)** + **SGST (half)**.
   - If Seller State ≠ Buyer State: System charges **IGST (full)**.
6. **Payment Settlement**:
   - **Payment Mode**: Select `CASH`, `UPI`, `BANK`, `CARD`, `CHEQUE`, or `CREDIT`.
   - **Amount Received**:
     - If fully paid: Leave as total amount.
     - If partial payment: Enter received amount; remaining balance automatically posts to customer's ledger as receivable.
     - If Credit: Set mode to `CREDIT` (Amount received becomes ₹0; full amount added to customer balance).
7. **Notes**: Optional transporter note, vehicle number, or terms.
8. Click **Save & Generate Invoice**.

---

### Invoices Management Table & Actions
On `/app/sales`, every invoice features:
- **Clickable Invoice Number (`INV-...`)**: Clicking immediately opens the full A4 Tax Invoice modal.
- **Standardized Action Buttons**:
  1. 👁️ **View (Cyan)**: Opens A4 Invoice preview with customer details, GST breakdown, HSN summary, and amount in words.
  2. 🖨️ **Print (Slate)**: Instantly opens print dialog formatted for A4 paper.
  3. 🧾 **Thermal POS (Amber)**: Formats the invoice for 80mm / 58mm POS thermal printers.
  4. 🔗 **Share WhatsApp (Emerald)**: Generates crystal-clear PDF invoice and opens WhatsApp with pre-filled message and attachment.
  5. 📱 **UPI QR (Purple)**: Displays dynamic UPI QR code with pre-filled invoice amount for instant customer scanning via GPay, PhonePe, Paytm.
  6. ✏️ **Edit (Blue)**: Opens invoice editor with automated inventory and ledger balance reconciliation.
  7. 🗑️ **Delete (Rose)**: Deletes invoice and automatically restores product stock and customer balance.

---

## 6. Express POS Billing (`/app/pos`)

Optimized for high-speed retail checkout counters, supermarkets, and grocery stores.

### POS Workflow
1. Navigate to **POS** (`/app/pos`).
2. **Barcode Scanner Mode**:
   - Simply scan items with a barcode gun. Items are added to the cart instantly with beep confirmation.
   - Scanning the same item multiple times increments quantity automatically.
3. **Manual Item Search / Visual Catalog**:
   - Click on category pills (*Grains, Spices, Dairy, Oils*) or type in search box.
   - Click product card to add to cart.
4. **Cart Adjustments**:
   - Use `+` and `-` buttons or click quantity to enter custom weight / counts.
5. **Hold & Resume Bills**:
   - If a customer needs to pick another item while at counter, click **Hold Bill**.
   - Start billing the next customer immediately.
   - When the first customer returns, click **Resume Bill** to restore their cart with zero lost data!
6. **Quick Cash Settlement & Change Calculation**:
   - Click one-click cash buttons (`₹100`, `₹200`, `₹500`, `₹2000`) or type cash received.
   - Screen displays exact **Change to Return** in bold green letters.
7. **Thermal Slip Printing**:
   - Click **Complete & Print** for instant thermal receipt output (80mm/58mm).

---

## 7. Non-GST / Cash Sales (`/app/non-gst-sales`)

For retail cash transactions, composition scheme sales, or non-taxable sales vouchers.

### Workflow
1. Navigate to **Non-GST Sales** (`/app/non-gst-sales`) and click **Create Non-GST Bill**.
2. Enter Customer Name, Phone, and Item details (Quantity, Unit, Rate, Discount).
3. No GST rates or HSN compliance checks required.
4. Full support for **A4 Bill Memo**, **Thermal POS Slip**, **WhatsApp Sharing**, **Edit**, and **Delete**.

---

## 8. Purchases & Goods Inward (`/app/purchases`)

Every time you receive inventory from a supplier, mandis, or manufacturer, log it under Purchases to maintain accurate stock and claim Input Tax Credit (ITC).

### Recording a Purchase Bill
1. Go to **Purchases** (`/app/purchases`) and click **Record Purchase Bill**.
2. Select **Supplier** from the dropdown (or enter new supplier name & GSTIN).
3. Enter **Vendor Bill Number** (e.g. supplier's invoice number like `HUL/2026/0491`).
4. Add line items:
   - Select product, enter inward quantity, cost rate (₹), and GST %.
   - Auto-select feature allows typing directly on mouse click.
5. Choose **Payment Mode**:
   - `BANK`, `UPI`, `CASH`: Marks bill as paid.
   - `CREDIT`: Records bill as payable, updating supplier's credit ledger.
6. Click **Record Inward Bill**:
   - **Warehouse Stock Increments Automatically**.
   - Purchase price in item master updates to latest cost rate.
   - Stock movement ledger logs inward receipt.

### Viewing, Printing & Managing Purchases
- **Clickable Bill Number (`PUR/...`)**: Opens the **Purchase Inward Voucher / Bill** modal.
- Includes **Print Bill**, **Download PDF**, **Share WhatsApp**, **Edit**, and **Delete**.
- **Deleting a Purchase Bill**: Automatically reverses warehouse stock and adjusts supplier payable balance to prevent phantom inventory.

---

## 9. Payment In & Payment Out (`/app/payments`)

Manage accounts receivable collection and vendor bill clearances.

### Recording Payment In (From Customer)
1. Go to **Payments** (`/app/payments`) → **Payment In**.
2. Select Customer name.
3. Enter Amount received, Payment Date, Payment Mode (`CASH`, `UPI`, `BANK`, `CHEQUE`), and reference number (e.g. UTR or Cheque #).
4. Customer's balance automatically reduces.

### Recording Payment Out (To Supplier)
1. Select **Payment Out**.
2. Select Supplier name.
3. Enter amount paid, bank account or cash source, and transaction reference.
4. Supplier payable balance automatically settles.

---

## 10. Daily Expenses & Operational Costs (`/app/expenses`)

Track all overheads to ensure true net profit calculations.

### Adding an Expense
1. Navigate to **Expenses** (`/app/expenses`) and click **+ Add Expense**.
2. Select **Expense Category**:
   - *Shop Rent, Electricity Bill, Staff Salary, Tea & Refreshment, Packaging Material, Transporter / Cartage, Maintenance*.
3. Enter **Amount (₹)**, **Date**, **Payment Mode** (`CASH` or `BANK`), and notes.
4. Real-time impact: Expenses are deducted from Gross Profit to reflect true Net Profit in the P&L statement.

---

## 11. GST Reports & Tax Compliance (`/app/gst`)

Generate audit-ready tax summaries for CA filing and government portal upload.

### GSTR-1 (Outward Supplies / Sales)
- **Table 4: B2B Invoices**: All sales made to registered businesses with GST numbers.
- **Table 5 & 7: B2C Large & Small**: All consumer sales categorized by state code.
- **Table 12: HSN Summary**: Item-wise total quantity, taxable value, CGST, SGST, IGST.

### GSTR-3B (Monthly Self-Assessment)
- **Tax on Outward Supplies**: Total Output GST collected from sales.
- **Eligible Input Tax Credit (ITC)**: Total Input GST paid on vendor purchases.
- **Net GST Payable / ITC Carry Forward**:
  $$\text{Net Tax Payable} = \text{Output GST} - \text{Input GST (ITC)}$$

---

## 12. Financial Reports & Profit & Loss (`/app/accounting`)

- **Profit & Loss Statement (P&L)**:
  - **Revenue from Operations**: Total Net Sales.
  - **Cost of Goods Sold (COGS)**: Beginning Stock + Inward Purchases - Ending Stock.
  - **Gross Profit**: `Revenue - COGS`.
  - **Operating Expenses**: Rent, salaries, utilities.
  - **Net Profit**: Pure bottom-line profit.
- **Cash & Bank Balance Book**:
  - Live cash in hand balance and bank account balance.

---

## 13. Business Settings, Bank & UPI QR Setup (`/app/settings`)

Configure your business branding and dynamic payment QR code.

### Settings Configuration
1. Navigate to **Settings** (`/app/settings`).
2. Update:
   - **Business Name**: Printed prominently on all invoices.
   - **Legal Name & GSTIN**: Appears on tax invoices.
   - **Registered Address, Phone, Email**.
   - **Bank Account Details**: Bank Name, Account Number, IFSC Code, Branch.
   - **UPI ID (VPA)**: e.g. `rahultraders@icici` or `9876543210@paytm`.
3. *Benefit*: When a customer asks to pay via UPI, the system automatically generates an instant UPI QR code with your UPI ID and the exact invoice balance embedded!

---

## 14. Data Backup, Security & Multi-User Admin

### Database Backup (`/app/backup`)
- Regularly click **Download Database Backup** to save a complete, encrypted JSON/SQL archive of all invoices, parties, items, and transactions.
- You can restore backups anytime with 1-click.

### Multi-User Administration (`/admin`)
- Create role-based accounts:
  - `ADMIN`: Full access to settings, reports, profit margins, and user management.
  - `BILLER / CASHIER`: Restricted to creating sales invoices and POS billing.
  - `ACCOUNTANT`: Access to reports, ledgers, payments, and GST filing.
  - `STORE / WAREHOUSE`: Access to inventory, stock adjustments, and purchase inward.

---

## 15. Quick Keyboard Shortcuts & Operator Tips

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **Mouse Click on Number** | Auto-Select All | Click any Qty/Price/Discount to instantly overwrite without backspacing. |
| **Tab** | Next Field | Moves cursor to next input and auto-selects all digits. |
| **Enter** in POS Search | Add to Cart | Immediately adds selected search item to active POS cart. |
| **Alt + S** | New Sale | Navigates directly to New GST Invoice page. |
| **Alt + P** | Express POS | Opens POS counter billing screen. |
| **Ctrl + P** | Instant Print | Triggers standard A4 or POS receipt printing. |
| **Esc** | Close Modal | Closes any open preview, QR, or edit modal. |

---

*Manual maintained for Rahul Traders — Version 2.0 (Updated 2026)*
