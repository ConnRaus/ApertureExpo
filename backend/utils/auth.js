// Utility function to extract auth object from req.auth
// Handles both function and object forms of req.auth
export function getAuthFromRequest(req) {
  if (!req.auth) {
    return null;
  }

  // Handle both function and object forms of req.auth
  let auth = req.auth;
  if (typeof req.auth === "function") {
    auth = req.auth();
  }

  return auth;
}

// Utility function to get userId from request
export function getUserIdFromRequest(req) {
  const auth = getAuthFromRequest(req);
  return auth?.userId || null;
}
