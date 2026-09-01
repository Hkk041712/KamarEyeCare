import { useState, useEffect } from "react";
import api from "./api";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import bgImage from "./assets/eyecare-bg.jpg";
import ManageProducts from "./ManageProducts";
import ManagePatients from "./ManagePatients";
import ManageExpenses from "./ManageExpenses";
import "./App.css";

// Protected Route Guard Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Eye Icons
const EyeOpenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const BrandHeader = ({ subtitle }) => (
  <div className="brand-header">
    <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
    <h1 className="brand-title">Kamar Eye Care</h1>
    {subtitle && (
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
        {subtitle}
      </p>
    )}
  </div>
);

// Auth Card Component
function AuthCard() {
  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("rememberMe") === "true"
  );
  const [username, setUsername] = useState(
    () => localStorage.getItem("savedUsername") || ""
  );
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const emailError = validateEmailFormat(username);
    if (emailError) {
      setMessage(`Validation Error: ${emailError}`);
      setIsError(true);
      return;
    }

    try {
      const res = await api.post("/auth/login/", {
        username,
        password,
      });
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedUsername", username);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedUsername");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error details:", err);

      if (err.code === "ERR_NETWORK") {
        setMessage(
          "Server connection failed. If Render was asleep, please wait 30 seconds and try again."
        );
      } else {
        setMessage(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            "Login failed. Check your credentials."
        );
      }
      setIsError(true);
    }
  };

  return (
    <div
      className="auth-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${bgImage})`,
      }}
    >
      <div className="auth-card">
        <BrandHeader />
        <form onSubmit={handleLogin} className="auth-form">
          <h2 className="form-subtitle">Portal Login</h2>

          {message && (
            <div
              className={
                isError ? "status-msg error-msg" : "status-msg success-msg"
              }
              style={{
                wordBreak: "break-word",
                fontSize: "0.8rem",
                textAlign: "left",
              }}
            >
              {message}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-username" className="input-label">
              Username (Email format)
            </label>
            <input
              id="login-username"
              name="username"
              autoComplete="username"
              type="email"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                name="password"
                autoComplete="current-password"
                type={showLoginPassword ? "text" : "password"}
                className="auth-input"
                style={{ paddingRight: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                {showLoginPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              margin: "0.2rem 0 0.8rem 0",
            }}
          >
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "#0284c7" }}
            />
            <label
              htmlFor="rememberMe"
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Remember me
            </label>
          </div>

          <button type="submit" className="btn-primary">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard View Component
function DashboardView({ onLogout }) {
  const navigate = useNavigate();

  return (
    <div
      className="auth-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${bgImage})`,
      }}
    >
      <div className="auth-card">
        <BrandHeader subtitle="Management Portal" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            marginTop: "0.25rem",
          }}
        >
          <button
            className="btn-primary"
            style={{ textAlign: "left", padding: "0.75rem 1rem" }}
            onClick={() => navigate("/products")}
          >
            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              Manage Products
            </span>
          </button>
          <button
            className="btn-primary"
            style={{ textAlign: "left", padding: "0.75rem 1rem" }}
            onClick={() => navigate("/expenses")}
          >
            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              Manage Expenses
            </span>
          </button>
          <button
            className="btn-primary"
            style={{ textAlign: "left", padding: "0.75rem 1rem" }}
            onClick={() => navigate("/patients")}
          >
            <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
              Manage Patients
            </span>
          </button>
        </div>
        <button
          className="btn-link"
          style={{ marginTop: "0.25rem", alignSelf: "center" }}
          onClick={onLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

// Main App Router Component
export default function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const username = localStorage.getItem("savedUsername") || "";

  return (
    <Routes>
      <Route path="/login" element={<AuthCard />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardView onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ManageProducts onBack={() => navigate("/dashboard")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <ManagePatients onBack={() => navigate("/dashboard")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <ManageExpenses
              onBack={() => navigate("/dashboard")}
              currentUser={username}
            />
          </ProtectedRoute>
        }
      />
      {/* Wildcard redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
