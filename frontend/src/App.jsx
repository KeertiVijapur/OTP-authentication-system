import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

function App() {
  const [step, setStep] = useState("login"); // 'login' | 'otp' | 'welcome'
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  // On load, try to restore token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      validateToken(savedToken);
    }
  }, []);

  async function validateToken(savedToken) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (!res.ok) {
        // token invalid
        localStorage.removeItem("auth_token");
        setStep("login");
        return;
      }

      const data = await res.json();
      setToken(savedToken);
      setUser(data.user);
      setStep("welcome");
    } catch (err) {
      console.error(err);
      setStep("login");
    }
  }

  async function handleRequestOtp(e) {
    e.preventDefault();
    setMessage("");

    if (!identifier.trim()) {
      setMessage("Please enter your email or phone number.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to request OTP.");
        return;
      }

      setMessage(data.message);
      setStep("otp");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Please try again.");
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setMessage("");

    if (!otp.trim()) {
      setMessage("Please enter the OTP.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to verify OTP.");
        return;
      }

      setMessage(data.message);
      localStorage.setItem("auth_token", data.token);
      setToken(data.token);
      // fetch user info
      await validateToken(data.token);
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Please try again.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setIdentifier("");
    setOtp("");
    setMessage("");
    setStep("login");
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>OTP Login Demo</h1>

        {step === "login" && (
          <form onSubmit={handleRequestOtp} style={styles.form}>
            <div style={styles.loginHeader}>
              <div style={styles.lockIcon}>🔐</div>
              <h2 style={styles.loginTitle}>Secure Login</h2>
              <p style={styles.loginSub}>
                Enter your email or phone to receive a one-time password.
              </p>
            </div>

            <label style={styles.label}>
              Email or Phone
              <input
                style={styles.input}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or phone"
              />
            </label>

            <button type="submit" style={styles.button}>
              Request OTP
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <p style={styles.text}>
              OTP sent to: <strong>{identifier}</strong> (check server console)
            </p>
            <label style={styles.label}>
              Enter OTP
              <input
                style={styles.input}
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
              />
            </label>
            <button type="submit" style={styles.button}>
              Verify OTP
            </button>
            <button
              type="button"
              style={styles.linkButton}
              onClick={() => setStep("login")}
            >
              Change identifier
            </button>
          </form>
        )}

        {step === "welcome" && (
          <div style={styles.welcomeBox}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.welcomeTitle}>Login Successful</h2>
            <p style={styles.welcomeSub}>
              You have been securely authenticated.
            </p>

            <div style={styles.userCard}>
              <p>
                <strong>User:</strong> {user?.name}
              </p>
              <p>
                <strong>Email / Phone:</strong> {user?.identifier}
              </p>
            </div>

            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        )}

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#ffffff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: "1.2rem",
    fontWeight: 600,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
  },
  input: {
    marginTop: "0.3rem",
    padding: "0.5rem 0.75rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    background: "#4f46e5",
    color: "#ffffff",
  },
  linkButton: {
    padding: "0.4rem 0.5rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "0.9rem",
    cursor: "pointer",
    background: "transparent",
    textDecoration: "underline",
  },
  text: {
    fontSize: "0.9rem",
  },
  message: {
    marginTop: "1rem",
    fontSize: "0.9rem",
    textAlign: "center",
  },

  // Login page extra styles
  loginHeader: {
    textAlign: "center",
    marginBottom: "0.5rem",
  },
  lockIcon: {
    fontSize: "2.2rem",
  },
  loginTitle: {
    margin: "0.3rem 0",
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "#111",
  },
  loginSub: {
    fontSize: "0.85rem",
    color: "#666",
    lineHeight: "1.4",
  },

  // Welcome screen extra styles
  welcomeBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.8rem",
  },
  successIcon: {
    fontSize: "2.5rem",
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "1.4rem",
    color: "#111",
  },
  welcomeSub: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "1rem",
    textAlign: "center",
  },
  userCard: {
    width: "100%",
    background: "#f9fafb",
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontSize: "0.9rem",
    lineHeight: "1.6",
  },
  logoutButton: {
    marginTop: "1rem",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
    background: "#ef4444",
    color: "#ffffff",
  },
};

export default App;