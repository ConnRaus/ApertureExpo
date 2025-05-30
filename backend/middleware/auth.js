import { requireAuth } from "@clerk/express";

// Middleware to authenticate user using Clerk
export const authenticateUser = requireAuth();
