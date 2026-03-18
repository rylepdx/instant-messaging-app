import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
  },
  title: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "32px",
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "15px",
    marginBottom: "16px",
    boxSizing: "border-box",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    transition: "opacity 0.2s",
  },
  error: {
    background: "rgba(255,80,80,0.15)",
    border: "1px solid rgba(255,80,80,0.3)",
    color: "#ff8080",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "16px",
  },
};

function Profile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setError("");
    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post("/api/auth/update-profile", {
        firstName,
        lastName,
      });
      if (response.status === 200) {
        navigate("/chat");
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Missing required fields.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Set up profile</h1>
        <p style={styles.subtitle}>Tell us your name to get started</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>First Name</label>
        <input
          type="text"
          placeholder="John"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Last Name</label>
        <input
          type="text"
          placeholder="Doe"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          style={styles.input}
        />

        <button
          onClick={handleSave}
          disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}

export default Profile;