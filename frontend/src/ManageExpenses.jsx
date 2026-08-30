import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg";
import "./ManageExpenses.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/auth";

export default function ManageExpenses({ onBack, currentUser }) {
  const [activeTab, setActiveTab] = useState("view"); // 'view', 'add'

  // State for expense list and form
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", isError: false });
  const [searchTerm, setSearchTerm] = useState("");

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
  });

  // Table Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Fetch Expenses from DB
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/`);
      setExpenses(response.data || []);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) {
        await fetchExpenses();
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchExpenses]);

  // Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  // Add New Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: "", isError: false });

    const payload = {
      description: expenseForm.description.trim(),
      amount: parseFloat(expenseForm.amount),
      created_by: currentUser || "Admin",
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/expenses/`, payload);
      setStatusMsg({
        text: response.data?.message || "Expense recorded successfully!",
        isError: false,
      });

      // Reset form & reload list
      setExpenseForm({ description: "", amount: "" });
      fetchExpenses();

      setTimeout(() => setActiveTab("view"), 1200);
    } catch (err) {
      setStatusMsg({
        text: err.response?.data?.error || "Failed to record expense.",
        isError: true,
      });
    }
  };

  // Delete Expense Record
  const handleDeleteExpense = async (id) => {
    if (
      !window.confirm(`Are you sure you want to delete expense record #${id}?`)
    )
      return;

    try {
      await axios.delete(`${API_BASE_URL}/expenses/${id}/`);
      setStatusMsg({
        text: "Expense deleted successfully!",
        isError: false,
      });
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete expense record.");
    }
  };

  // Sorting Handler
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  // Search & Sorting Filter
  const processedExpenses = [...expenses]
    .filter((item) => {
      const search = searchTerm.toLowerCase();
      return (
        String(item.id || "")
          .toLowerCase()
          .includes(search) ||
        String(item.description || "")
          .toLowerCase()
          .includes(search) ||
        String(item.amount || "")
          .toLowerCase()
          .includes(search) ||
        String(item.created_by || "")
          .toLowerCase()
          .includes(search)
      );
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key] ?? "";
      let bVal = b[key] ?? "";

      if (key === "id" || key === "amount") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  // Calculate Total Expenses
  const totalExpenseSum = processedExpenses.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  return (
    <div
      className="expenses-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${bgImage})`,
      }}
    >
      <div className="expenses-container">
        {/* Header Section */}
        <div className="expenses-header">
          <div className="header-title-group">
            <svg
              className="header-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1H6.32c.12 2.07 1.64 3.48 3.68 3.91V21h3v-2.15c2.07-.4 3.7-1.63 3.7-3.7 0-2.84-2.43-3.81-4.9-4.25z" />
            </svg>
            <div>
              <h1 className="header-title">Expense Management</h1>
              <p className="header-subtitle">
                Track Store Outgoings & Operating Costs
              </p>
            </div>
          </div>
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => setActiveTab("view")}
          >
            <span className="tab-icon">📊</span> Expense Ledger (
            {expenses.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            <span className="tab-icon">+</span> Record New Expense
          </button>
        </div>

        {/* TAB 1: VIEW EXPENSES DIRECTORY */}
        {activeTab === "view" && (
          <div className="tab-card">
            <div className="card-header-row">
              <div>
                <h2 className="card-heading">Expenses Record</h2>
                <span className="total-badge">
                  Total: ${totalExpenseSum.toFixed(2)}
                </span>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search description, amount, creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => requestSort("id")}
                      className="sortable-th"
                    >
                      ID{getSortIndicator("id")}
                    </th>
                    <th
                      onClick={() => requestSort("description")}
                      className="sortable-th"
                    >
                      Description{getSortIndicator("description")}
                    </th>
                    <th
                      onClick={() => requestSort("amount")}
                      className="sortable-th"
                    >
                      Amount ($){getSortIndicator("amount")}
                    </th>
                    <th
                      onClick={() => requestSort("created_at")}
                      className="sortable-th"
                    >
                      Date Created{getSortIndicator("created_at")}
                    </th>
                    <th
                      onClick={() => requestSort("created_by")}
                      className="sortable-th"
                    >
                      Created By{getSortIndicator("created_by")}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="table-empty">
                        Loading expense records...
                      </td>
                    </tr>
                  ) : processedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-empty">
                        No expense records found.
                      </td>
                    </tr>
                  ) : (
                    processedExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="id-badge">#{exp.id}</td>
                        <td className="font-semibold">{exp.description}</td>
                        <td className="amount-text">
                          ${parseFloat(exp.amount).toFixed(2)}
                        </td>
                        <td>
                          {exp.created_at
                            ? exp.created_at.split("T")[0]
                            : "N/A"}
                        </td>
                        <td>
                          <span className="creator-badge">
                            {exp.created_by || "System"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteExpense(exp.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RECORD NEW EXPENSE */}
        {activeTab === "add" && (
          <div className="tab-card">
            <h2 className="card-heading">Add New Expense Record</h2>
            {statusMsg.text && (
              <p
                className={
                  statusMsg.isError
                    ? "status-msg error-msg"
                    : "status-msg success-msg"
                }
              >
                {statusMsg.text}
              </p>
            )}

            <form onSubmit={handleAddExpense} className="expenses-form">
              <div className="form-grid">
                <div className="input-group full-width">
                  <label className="input-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="expenses-input"
                    value={expenseForm.description}
                    onChange={handleInputChange}
                    placeholder="e.g. Office Stationery, Monthly Electricity Bill"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    className="expenses-input"
                    value={expenseForm.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Created By (User)</label>
                  <input
                    type="text"
                    className="expenses-input disabled"
                    value={currentUser || "Admin"}
                    readOnly
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary-expenses">
                Save Expense Entry
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
