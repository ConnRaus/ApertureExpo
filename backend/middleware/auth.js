export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  // Remove 'Bearer ' prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  req.headers.authorization = token;

  if (!req.auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
