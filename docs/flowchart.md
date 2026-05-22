START
  ↓
User Logs In
  ↓
Load User Dashboard
  ↓
Fetch User Data From Database
  ├── Income Records
  ├── Budget Records
  ├── Expense Records
  ├── Savings Goals
  └── Recent Transactions
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
  │   Save Income
  │      ↓
  │   Refresh Dashboard Analytics
  │
  ├── Create Budget
  │      ↓
  │   Open Budget Modal
  │      ↓
  │   Validate Budget <= Income
  │      ↓
  │   Save Budget
  │      ↓
  │   Refresh Budget Progress
  │
  ├── Add Expense
  │      ↓
  │   Open Expense Modal
  │      ↓
  │   Match Expense Category
  │      ↓
  │   Deduct Expense From Budget
  │      ↓
  │   Update Remaining Balance
  │      ↓
  │   Refresh Charts & Transactions
  │
  ├── Add Savings
  │      ↓
  │   Open Savings Modal
  │      ↓
  │   Save Contribution
  │      ↓
  │   Update Savings Progress
  │      ↓
  │   Refresh Dashboard
  │
  ├── View Analytics
  │      ↓
  │   Open Analytics Page
  │
  ├── Generate Report
  │      ↓
  │   Export Monthly Summary
  │
  └── Logout
         ↓
        END