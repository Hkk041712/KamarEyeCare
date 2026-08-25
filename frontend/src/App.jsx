import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000/api/auth";

// Reusable Brand Header
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

export default function App() {
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("rememberMe") === "true";
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem("savedUsername") || "";
  });

  const [password, setPassword] = useState("");

  const [view, setView] = useState(() => {
    const savedView =
      localStorage.getItem("appView") || sessionStorage.getItem("appView");
    return savedView || "login";
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Dynamic Users State from DB
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add User & Verification State
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [addStep, setAddStep] = useState(1);
  const [addStatus, setAddStatus] = useState("");
  const [isAddError, setIsAddError] = useState(false);

  // Sync active view to storage
  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem("appView", view);
    } else {
      sessionStorage.setItem("appView", view);
    }
  }, [view, rememberMe]);

  // Fetch registered users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/users/?t=${new Date().getTime()}`
      );
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (view === "manage-users" || view === "view-users") {
      let isMounted = true;
      const loadUsers = async () => {
        if (isMounted) {
          await fetchUsers();
        }
      };
      loadUsers();

      return () => {
        isMounted = false;
      };
    }
  }, [view, fetchUsers]);

  const validatePasswordConditions = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass))
      return "Password must contain at least one uppercase letter (A-Z).";
    if (!/[a-z]/.test(pass))
      return "Password must contain at least one lowercase letter (a-z).";
    if (!/[0-9]/.test(pass))
      return "Password must contain at least one number (0-9).";
    return null;
  };

  const validateEmailFormat = (email) => {
    const lower = email.toLowerCase();
    const validDomains = [
      "@gmail.com",
      "@outlook.com",
      "@hotmail.com",
      "@yahoo.com",
      "@icloud.com",
      "@aol.com",
      "@proton.me",
      "@protonmail.com",
      "@mail.com",
      "@gmx.com",
      "@zoho.com",
      "@yandex.com",
      "@live.com",
      "@msn.com",
      "@me.com",
      "@mac.com",
      "@fastmail.com",
      "@tutanota.com",
      "@hey.com",
    ];
    if (!validDomains.some((domain) => lower.includes(domain))) {
      return "Email must match a valid domain.";
    }
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const emailError = validateEmailFormat(username);
    if (emailError) {
      setMessage(emailError);
      setIsError(true);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/login/`, { username, password });

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedUsername", username);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedUsername");
      }

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

  const handleLogout = () => {
    localStorage.removeItem("appView");
    sessionStorage.removeItem("appView");

    if (!rememberMe) {
      setUsername("");
    }
    setPassword("");
    setView("login");
  };

  // Step 1: Send Verification Code
  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setAddStatus("");
    setIsAddError(false);

    const emailErr = validateEmailFormat(newEmail);
    if (emailErr) {
      setAddStatus(emailErr);
      setIsAddError(true);
      return;
    }

    const passErr = validatePasswordConditions(newPassword);
    if (passErr) {
      setAddStatus(passErr);
      setIsAddError(true);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/send-code/`, {
        username: newEmail,
        password: newPassword,
      });

      setAddStep(2);
      setAddStatus("Verification code sent to email! Valid for 3 minutes.");
      setIsAddError(false);
    } catch (err) {
      setAddStatus(err.response?.data?.error || "Failed to send code.");
      setIsAddError(true);
    }
  };

  // Step 2: Confirm Verification Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setAddStatus("");
    setIsAddError(false);

    try {
      const res = await axios.post(`${API_BASE_URL}/verify-user/`, {
        username: newEmail,
        code: verifyCode,
      });

      setAddStatus(res.data.message || "User verified and registered!");
      setIsAddError(false);

      setTimeout(() => {
        resetAddUserForm();
        setView("manage-users");
      }, 1500);
    } catch (err) {
      setAddStatus(err.response?.data?.error || "Verification failed.");
      setIsAddError(true);
    }
  };

  const handleRemoveUser = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}/`);
      await fetchUsers();
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await fetchUsers();
      } else {
        console.error("Delete request failed:", error);
      }
    }
  };

  const resetAddUserForm = () => {
    setNewEmail("");
    setNewPassword("");
    setVerifyCode("");
    setAddStep(1);
    setAddStatus("");
    setIsAddError(false);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="auth-page-wrapper"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url(${bgImage})`,
      }}
    >
      <div className="auth-card">
        {/* LOGIN VIEW */}
        {view === "login" && (
          <>
            <BrandHeader />
            <form onSubmit={handleLogin} className="auth-form">
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: "0.2rem 0 0.8rem 0",
                  cursor: "pointer",
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
          </>
        )}

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && (
          <>
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
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Manage Products
                </span>
              </button>
              <button
                className="btn-primary"
                style={{ textAlign: "left", padding: "0.75rem 1rem" }}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Manage Expenses
                </span>
              </button>
              <button
                className="btn-primary"
                style={{ textAlign: "left", padding: "0.75rem 1rem" }}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Manage Patients
                </span>
              </button>
              <button
                className="btn-primary"
                style={{ textAlign: "left", padding: "0.75rem 1rem" }}
                onClick={() => setView("manage-users")}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Manage Users
                </span>
              </button>
            </div>
            <button
              className="btn-link"
              style={{ marginTop: "0.25rem", alignSelf: "center" }}
              onClick={handleLogout}
            >
              Log Out
            </button>
          </>
        )}

        {/* MANAGE USERS MENU VIEW */}
        {view === "manage-users" && (
          <>
            <BrandHeader subtitle="User Management" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                className="btn-primary"
                style={{ textAlign: "center", padding: "0.85rem" }}
                onClick={() => {
                  resetAddUserForm();
                  setView("add-user");
                }}
              >
                + Add User
              </button>
              <button
                className="btn-primary"
                style={{
                  textAlign: "center",
                  padding: "0.85rem",
                  backgroundColor: "#0284c7",
                }}
                onClick={() => {
                  setSearchTerm("");
                  setView("view-users");
                }}
              >
                View Users ({users.length})
              </button>
            </div>
            <button
              className="btn-link"
              style={{ marginTop: "0.5rem", alignSelf: "center" }}
              onClick={() => setView("dashboard")}
            >
              ← Back to Dashboard
            </button>
          </>
        )}

        {/* ADD USER VIEW WITH VERIFICATION */}
        {view === "add-user" && (
          <>
            <BrandHeader
              subtitle={addStep === 1 ? "Add New User" : "Email Verification"}
            />

            {addStatus && (
              <p
                className={
                  isAddError ? "status-msg error-msg" : "status-msg success-msg"
                }
              >
                {addStatus}
              </p>
            )}

            {addStep === 1 ? (
              <form onSubmit={handleSendVerificationCode} className="auth-form">
                <div className="input-group">
                  <label className="input-label">Email / Username</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@eyecare.com"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, lowercase, & number"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary">
                  Send Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="auth-form">
                <div className="input-group">
                  <label className="input-label">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Enter code sent to email"
                    maxLength={6}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary">
                  Verify & Complete Registration
                </button>
                <button
                  type="button"
                  className="btn-link"
                  style={{ marginTop: "0.4rem", alignSelf: "center" }}
                  onClick={handleSendVerificationCode}
                >
                  Resend Code
                </button>
              </form>
            )}

            <button
              className="btn-link"
              style={{ marginTop: "0.25rem", alignSelf: "center" }}
              onClick={() => {
                resetAddUserForm();
                setView("manage-users");
              }}
            >
              ← Back to User Options
            </button>
          </>
        )}

        {/* VIEW / DELETE USERS VIEW */}
        {view === "view-users" && (
          <>
            <BrandHeader subtitle="Registered Users" />

            <div style={{ marginBottom: "0.6rem", marginTop: "0.2rem" }}>
              <input
                type="text"
                className="auth-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search user by username..."
                style={{
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.85rem",
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: "0.25rem",
              }}
            >
              {loadingUsers ? (
                <p
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    fontSize: "0.85rem",
                  }}
                >
                  Loading users...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p
                  style={{
                    color: "#94a3b8",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    padding: "0.5rem 0",
                  }}
                >
                  {users.length === 0
                    ? "No users found in database."
                    : "No matching users found."}
                </p>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentUser =
                    u.username.toLowerCase() === username.toLowerCase();
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.6rem 0.8rem",
                        backgroundColor: "#0f172a",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#ffffff",
                            fontWeight: 600,
                          }}
                        >
                          {u.username}{" "}
                          {isCurrentUser && (
                            <span
                              style={{ color: "#38bdf8", fontSize: "0.75rem" }}
                            >
                              (You)
                            </span>
                          )}
                        </span>
                      </div>

                      {!isCurrentUser && (
                        <button
                          onClick={() => handleRemoveUser(u.id)}
                          style={{
                            backgroundColor: "#7f1d1d",
                            color: "#fca5a5",
                            border: "1px solid #b91c1c",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <button
              className="btn-link"
              style={{ marginTop: "0.5rem", alignSelf: "center" }}
              onClick={() => {
                setSearchTerm("");
                setView("manage-users");
              }}
            >
              ← Back to User Options
            </button>
          </>
        )}
      </div>
    </div>
  );
}
