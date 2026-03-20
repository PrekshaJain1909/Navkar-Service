const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AUTH_COOKIE_NAME } = require("../middleware/auth");
const { sendEmail } = require("../utils/sendEmail");

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET || null;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getPasswordStrengthError(password) {
  const value = String(password || "");

  if (value.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include at least one uppercase letter";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must include at least one lowercase letter";
  }

  if (!/\d/.test(value)) {
    return "Password must include at least one number";
  }

  return null;
}

function signToken(user, jwtSecret) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: TOKEN_MAX_AGE_SECONDS }
  );
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.cookie(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

function buildResetPasswordEmail(name, resetLink) {
  const safeName = name || "there";

  return {
    subject: "Reset your password",
    text:
      `Hi ${safeName},\n\n` +
      "We received a request to reset your password. " +
      `Use this link to reset it: ${resetLink}\n\n` +
      "This link expires in 15 minutes.\n" +
      "If you did not request this, you can ignore this email.",
    html:
      `<p>Hi ${safeName},</p>` +
      "<p>We received a request to reset your password.</p>" +
      `<p><a href=\"${resetLink}\">Click here to reset your password</a></p>` +
      "<p>This link expires in 15 minutes.</p>" +
      "<p>If you did not request this, you can ignore this email.</p>",
  };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    const jwtSecret = getJwtSecret();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!jwtSecret) {
      return res.status(500).json({ message: "Authentication is not configured on the server" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const passwordError = getPasswordStrengthError(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name: String(name).trim(),
      username: normalizedEmail,
      email: normalizedEmail,
      password,
    });

    const token = signToken(user, jwtSecret);
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Registration failed:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const jwtSecret = getJwtSecret();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!jwtSecret) {
      return res.status(500).json({ message: "Authentication is not configured on the server" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user, jwtSecret);
    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Login failed" });
  }
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.json({ success: true, message: "Logged out successfully" });
}

async function me(req, res) {
  const user = await User.findById(req.user.sub).select("_id name email");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(formatUser(user));
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const passwordError = getPasswordStrengthError(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password failed:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;
    const emailPayload = buildResetPasswordEmail(user.name, resetLink);

    try {
      await sendEmail({
        to: user.email,
        ...emailPayload,
      });
    } catch (sendError) {
      console.error("Failed to send reset email:", sendError);

      return res.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
        ...(process.env.NODE_ENV !== "production" ? {
          resetLink,
          warning: "Email could not be sent. Check SMTP configuration.",
        } : {}),
      });
    }

    return res.json({
      success: true,
      message: "If an account exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return res.status(500).json({ message: "Failed to process forgot password request" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const passwordError = getPasswordStrengthError(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password failed:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};
