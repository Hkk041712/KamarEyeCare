import { useState } from "react";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg";
import "./App.css";

export default function App() {
  const [view, setView] = useState("login"); // 'login' | 'dashboard'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const lowerUsername = username.toLowerCase();
    const hasValidDomain = ["@gmail", "@outlook", "@hotmail"].some((domain) =>
      lowerUsername.includes(domain)
    );

    if (!hasValidDomain) {
      setMessage("Username must contain @gmail, @outlook, or @hotmail");
      setIsError(true);
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/auth/login/", {
        username,
        password,
      });

      setView("dashboard");
      setMessage("");
      setIsError(false);
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Connection error with the server."
      );
      setIsError(true);
    }
  };

  // Render Dashboard View
  if (view === "dashboard") {
    const menuItems = [
      {
        id: "products",
        title: "Manage Products",
        desc: "Inventory, frame stock & optical lens supplies",
      },
      {
        id: "expenses",
        title: "Manage Expenses",
        desc: "Financial logs, overhead & vendor billing",
      },
      {
        id: "patients",
        title: "Manage Patients",
        desc: "Eye exams, prescriptions & medical records",
      },
      {
        id: "users",
        title: "Manage Users",
        desc: "Staff access permissions & system roles",
      },
    ];

    return (
      <div
        className="auth-page-wrapper"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${bgImage})`,
        }}
      >
        <div className="auth-card">
          <div className="brand-header">
            <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <h1 className="brand-title">Kamar Eye Care</h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#38bdf8",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginTop: "0.1rem",
              }}
            >
              Management Portal
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
              marginTop: "0.25rem",
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="btn-primary"
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                }}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 400,
                    opacity: 0.85,
                  }}
                >
                  {item.desc}
                </span>
              </button>
            ))}
          </div>

          <button
            className="btn-link"
            style={{ marginTop: "0.25rem", alignSelf: "center" }}
            onClick={() => {
              setView("login");
              setUsername("");
              setPassword("");
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  // Render Login View
  return (
    <div
      className="auth-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${bgImage})`,
      }}
    >
      <div className="auth-card">
        <div className="brand-header">
          <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <h1 className="brand-title">Kamar Eye Care</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-subtitle">Portal Login</h2>

          {message && (
            <p
              className={
                isError ? "status-msg error-msg" : "status-msg success-msg"
              }
            >
              {message}
            </p>
          )}

          <div className="input-group">
            <label className="input-label">Username (Email format)</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
