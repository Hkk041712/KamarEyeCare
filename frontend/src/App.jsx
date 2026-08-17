import { useState } from "react";
import axios from "axios";
import bgImage from "./assets/eyecare-bg.jpg"; // Importing image ensures Vite loads it
import "./App.css";

export default function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const endpoint = isSignup ? "signup" : "login";
    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/auth/${endpoint}/`,
        { username, password }
      );
      setMessage(res.data.message || "Success!");
      if (!isSignup) {
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "An error occurred.");
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
            {isSignup ? "Temporary Registration" : "Portal Login"}
          </h2>

          {message && <p className="status-msg">{message}</p>}

          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              type="text"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
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
            {isSignup ? "Create Account" : "Log In"}
          </button>

          <div className="toggle-section">
            <span className="toggle-text">
              {isSignup
                ? "Already have an account?"
                : "Need a temporary account?"}
            </span>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsSignup(!isSignup);
                setMessage("");
              }}
            >
              {isSignup ? "Log In" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
