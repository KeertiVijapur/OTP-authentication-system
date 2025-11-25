const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// In-memory stores
// key: emailOrPhone => { otp, expiresAt, attempts }
const otpStore = {};
// key: emailOrPhone => blockedUntil timestamp (ms)
const blockList = {};
// key: token => user info
const sessionStore = {};

// Helpers
function generateOtp() {
  // 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
  return Date.now() + "-" + Math.random().toString(36).slice(2);
}

function isBlocked(identifier) {
  const blockedUntil = blockList[identifier];
  if (!blockedUntil) return false;
  const now = Date.now();
  if (now > blockedUntil) {
    // unblock after time passes
    delete blockList[identifier];
    return false;
  }
  return true;
}

app.get("/", (req, res) => {
  res.send("OTP Auth Backend is running...");
});

// 1) Request OTP
app.post("/auth/request-otp", (req, res) => {
  const { identifier } = req.body; // email or phone

  if (!identifier) {
    return res.status(400).json({ message: "identifier (email/phone) is required" });
  }

  if (isBlocked(identifier)) {
    return res.status(429).json({
      message: "Too many attempts. This identifier is blocked for 10 minutes.",
    });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore[identifier] = {
    otp,
    expiresAt,
    attempts: 0,
  };

  // Mock sending: just log it on the server
  console.log(`OTP for ${identifier}: ${otp}`);

  return res.json({
    message: "OTP generated and 'sent' (check server console).",
  });
});

// 2) Verify OTP
app.post("/auth/verify-otp", (req, res) => {
  const { identifier, otp } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ message: "identifier and otp are required" });
  }

  if (isBlocked(identifier)) {
    return res.status(429).json({
      message: "Too many attempts. This identifier is blocked for 10 minutes.",
    });
  }

  const record = otpStore[identifier];

  if (!record) {
    return res.status(400).json({ message: "No OTP requested for this identifier." });
  }

  const now = Date.now();

  if (now > record.expiresAt) {
    delete otpStore[identifier];
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  if (record.otp !== otp) {
    record.attempts += 1;

    if (record.attempts >= 3) {
      // block for 10 minutes
      blockList[identifier] = Date.now() + 10 * 60 * 1000;
      delete otpStore[identifier];
      return res.status(429).json({
        message: "Maximum attempts exceeded. You are blocked for 10 minutes.",
      });
    }

    return res.status(400).json({
      message: `Invalid OTP. Attempts left: ${3 - record.attempts}`,
    });
  }

  // OTP valid
  delete otpStore[identifier];

  const token = generateToken();
  // mock user info
  const user = {
    id: 1,
    identifier,
    name: "Demo User",
  };
  sessionStore[token] = user;

  return res.json({
    message: "OTP verified successfully.",
    token,
  });
});

// 3) Get current user info
app.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const token = parts[1];
  const user = sessionStore[token];

  if (!user) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  return res.json({
    user,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});