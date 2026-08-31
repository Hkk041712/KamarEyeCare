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

// Auth Card Component holding Login & Forgot Password
function AuthCard() {
  const navigate = useNavigate();
  const [view, setView] = useState("login");

  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("rememberMe") === "true"
  );
  const [username, setUsername] = useState(
    () => localStorage.getItem("savedUsername") || ""
  );
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("accessToken") && view === "login") {
      navigate("/dashboard");
    }
  }, [navigate, view]);

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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const emailError = validateEmailFormat(resetEmail);
    if (emailError) {
      setMessage(`Validation Error: ${emailError}`);
      setIsError(true);
      return;
    }

    try {
      const res = await api.post("/auth/request-reset-otp/", {
        username: resetEmail,
      });
      setMessage(res.data.message);
      setResetStep(2);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP code.");
      setIsError(true);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsError(true);
      return;
    }

    try {
      await api.post("/auth/confirm-reset/", {
        username: resetEmail,
        otp: otpCode,
        new_password: newPassword,
      });

      setMessage("Password updated successfully! You can now log in.");
      setIsError(false);
      setTimeout(() => {
        setResetStep(1);
        setView("login");
      }, 2000);
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Reset failed. Invalid or expired OTP."
      );
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
        {view === "login" && (
          <>
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
                <div style={{ position: "relative" }}>
                  <input
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "0.2rem 0 0.8rem 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
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
                <button
                  type="button"
                  className="btn-link"
                  style={{ fontSize: "0.82rem", color: "#38bdf8" }}
                  onClick={() => {
                    setMessage("");
                    setIsError(false);
                    setView("forgot-password");
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="btn-primary">
                Log In
              </button>
            </form>
          </>
        )}

        {view === "forgot-password" && (
          <>
            <BrandHeader subtitle="Reset Access" />
            {resetStep === 1 ? (
              <form onSubmit={handleRequestOTP} className="auth-form">
                <h2 className="form-subtitle">Request Verification Code</h2>
                {message && (
                  <div
                    className={
                      isError
                        ? "status-msg error-msg"
                        : "status-msg success-msg"
                    }
                    style={{ fontSize: "0.8rem", textAlign: "left" }}
                  >
                    {message}
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">Account Email</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ marginTop: "0.5rem" }}
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  className="btn-link"
                  style={{ marginTop: "0.4rem", alignSelf: "center" }}
                  onClick={() => setView("login")}
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="auth-form">
                <h2 className="form-subtitle">Enter OTP & New Password</h2>
                {message && (
                  <div
                    className={
                      isError
                        ? "status-msg error-msg"
                        : "status-msg success-msg"
                    }
                    style={{ fontSize: "0.8rem", textAlign: "left" }}
                  >
                    {message}
                  </div>
                )}
                <div className="input-group">
                  <label className="input-label">6-Digit OTP Code</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="auth-input"
                      style={{ paddingRight: "2.5rem" }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                      }}
                    >
                      {showNewPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="auth-input"
                      style={{ paddingRight: "2.5rem" }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                      }}
                    >
                      {showConfirmPassword ? (
                        <EyeClosedIcon />
                      ) : (
                        <EyeOpenIcon />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ marginTop: "0.5rem" }}
                >
                  Update Password
                </button>
                <button
                  type="button"
                  className="btn-link"
                  style={{ marginTop: "0.4rem", alignSelf: "center" }}
                  onClick={() => setResetStep(1)}
                >
                  Back
                </button>
              </form>
            )}
          </>
        )}
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
