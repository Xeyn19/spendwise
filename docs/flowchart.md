```text
START
  ↓
User Logs In
  ↓
Load User Dashboard
  ├── Online: fetch current server data
  └── Offline reload: restore cached dashboard document
  ↓
Fetch User Data From Database
  ├── Income Records
  ├── Budget Records
  ├── Expense Records
  ├── Savings Goals
  ├── Savings Entries
  ├── Unified Recent Transactions
  ├── Analytics
  └── Monthly Reports
  ↓
Compare With Per-User IndexedDB State
  ├── Restore newer local dashboard snapshot
  └── Count pending mutation outbox entries
  ↓
Calculate Dashboard Analytics
  ├── Total Income
  ├── Total Budget
  ├── Total Expenses
  ├── Total Savings
  ├── Remaining Balance
  └── Budget Remaining
  ↓
Display Navbar
  ├── SpendWise Logo
  ├── Current Page Title
  ├── Notification Icon
  └── User Profile Dropdown
  ↓
Display Sidebar Navigation
  ├── Dashboard
  ├── Income
  ├── Budgets
  ├── Expenses
  ├── Savings
  ├── Analytics
  ├── Reports
  ├── Settings
  └── Logout
  ↓
Display Dashboard Summary Cards
  ├── Total Income
  ├── Total Budget
  ├── Total Expenses
  ├── Total Savings
  └── Remaining Balance
  ↓
Display Charts Section
  ├── Income vs Expenses Chart
  ├── Expense Categories Pie Chart
  └── Budget Usage Progress
  ↓
Display Budget Progress Section
  ├── Food Budget
  ├── Bills Budget
  ├── Transportation Budget
  ├── Savings Budget
  └── Other Categories
  ↓
Display Savings Goals Section
  ├── Goal Name
  ├── Target Amount
  ├── Current Saved Amount
  └── Progress Percentage
  ↓
Display Recent Transactions Table
  ├── Date
  ├── Transaction Type
  ├── Category
  ├── Amount
  └── Note
  ↓
Display Quick Action Buttons
  ├── Add Income
  ├── Create Budget
  ├── Add Expense
  ├── Add Savings
  └── Generate Report
  ↓
User Action?
  ├── Add Income
  │      ↓
  │   Open Add Income Modal
  │      ↓
  │   Save Income To IndexedDB Outbox
  │      ↓
  │   Refresh Dashboard Analytics
  │
  ├── Create Budget
  │      ↓
  │   Open Budget Modal
  │      ↓
  │   Validate Budget <= Income
  │      ↓
  │   Save Budget To IndexedDB Outbox
  │      ↓
  │   Refresh Budget Progress
  │
  ├── Add Expense
  │      ↓
  │   Open Expense Modal
  │      ↓
  │   Match Expense Category
  │      ↓
  │   Save Expense To IndexedDB Outbox
  │      ↓
  │   Derive Updated Budget Usage
  │      ↓
  │   Update Remaining Balance
  │      ↓
  │   Refresh Charts & Transactions
  │
  ├── Add Savings
  │      ↓
  │   Open Savings Modal
  │      ↓
  │   Save Contribution To IndexedDB Outbox
  │      ↓
  │   Update Savings Progress
  │      ↓
  │   Refresh Dashboard
  │
  ├── View Analytics
  │      ↓
  │   Display Analytics Dashboard Section
  │
  ├── Generate Report
  │      ↓
  │   Export Monthly Summary
  │
  └── Logout
         ↓
      Clear Cached Private Dashboard Document
         ↓
        END

Pending Mutations?
  ├── Offline
  │      ↓
  │   Keep Changes On Device And Show Pending Count
  │
  └── Online
         ↓
      Replay Mutations In Creation Order
         ├── Accepted: remove mutation and apply canonical server result
         └── Rejected: keep mutation and show retry/error status
```
