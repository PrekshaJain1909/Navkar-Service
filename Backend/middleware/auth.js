const jwt = require("jsonwebtoken");

const AUTH_COOKIE_NAME = "auth_token";

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET || null;
}

function getTokenFromCookies(cookieHeader = "") {
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === AUTH_COOKIE_NAME) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return { token: authHeader.slice(7), source: "header" };
  }

  const tokenFromCookie = getTokenFromCookies(req.headers.cookie);
  if (tokenFromCookie) {
    return { token: tokenFromCookie, source: "cookie" };
  }

  return { token: null, source: null };
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

function authenticateToken(req, res, next) {
  const { token, source } = getTokenFromRequest(req);
  const secret = getJwtSecret();

  if (!secret) {
    return res.status(500).json({ message: "Authentication is not configured on the server" });
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (error) {
    if (source === "cookie") {
      // Remove stale cookies so frontend middleware no longer treats the user as authenticated.
      clearAuthCookie(res);
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = {
  AUTH_COOKIE_NAME,
  authenticateToken,
};