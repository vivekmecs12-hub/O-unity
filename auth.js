// NOTE: This is a basic client-side login gate for convenience, not real security.
// Since this is a static site with no server, anyone who views the page source or
// calls the Apps Script URL directly can bypass this. Do not use it to protect sensitive data.

const USERS = [
  { username: "admin", passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", role: "admin" },
  { username: "user", passwordHash: "04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb", role: "user" },
];

async function sha256Hex(text) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getSession() {
  const raw = sessionStorage.getItem("ounity_session");
  return raw ? JSON.parse(raw) : null;
}

function setSession(username, role) {
  sessionStorage.setItem("ounity_session", JSON.stringify({ username, role }));
}

function logout() {
  sessionStorage.removeItem("ounity_session");
  window.location.href = "login.html";
}

// Redirects to login.html if not authenticated. Returns the session if authenticated.
function requireLogin() {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

// Redirects non-admins back to index.html. Returns the session if the user is an admin.
function requireAdmin() {
  const session = requireLogin();
  if (session && session.role !== "admin") {
    window.location.href = "index.html";
    return null;
  }
  return session;
}
