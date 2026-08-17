import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg";
import "./App.css";

export default function AuthForm({ isSignupMode, onAuthSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage("");
    setIsError(false);
  }, [isSignupMode]);

  const validatePasswordClient = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass))
      return "Password must contain at least one uppercase letter (A-Z).";
    if (!/[a-z]/.test(pass))
      return "Password must contain at least one lowercase letter (a-z).";
    if (!/[0-9]/.test(pass))
      return "Password must contain at least one number (0-9).";
    if (!/[^a-zA-Z0-9]/.test(pass))
      return "Password must contain at least one special character.";
    return null;
  };

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

    if (isSignupMode) {
      const passwordErr = validatePasswordClient(password);
      if (passwordErr) {
        setMessage(passwordErr);
        setIsError(true);
        return;
      }
    }

    const endpoint = isSignupMode ? "signup" : "login";

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/auth/${endpoint}/`,
        { username, password }
      );
      setMessage(res.data.message);
      setIsError(false);

      // Trigger navigation callback
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Connection error with the server."
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
        <div className="brand-header">
          <svg className="eye-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <h1 className="brand-title">Kamar Eye Care</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-subtitle">
            {isSignupMode ? "Registration" : "Portal Login"}
          </h2>

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
            {isSignupMode && (
              <span className="password-hint">
                Must be 8+ chars, include uppercase, lowercase, number & symbol.
              </span>
            )}
          </div>

          <button type="submit" className="btn-primary">
            {isSignupMode ? "Create Account" : "Log In"}
          </button>

          <div className="toggle-section">
            <span className="toggle-text">
              {isSignupMode ? "Already have an account?" : "Need to register?"}
            </span>
            <button
              type="button"
              className="btn-link"
              onClick={() => navigate(isSignupMode ? "/login" : "/signup")}
            >
              {isSignupMode ? "Log In" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
