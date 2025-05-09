import axios from "axios";

// Make sure we get the correct API URL, with a fallback for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Process all dates in contest data to ensure they're preserved exactly as entered
 * by adding explicit timezone offset information
 */
const processContestDates = (contestData) => {
  if (!contestData) return contestData;

  // Create a copy of the data to avoid modifying the original
  const processed = { ...contestData };
  const dateFields = [
    "startDate",
    "endDate",
    "votingStartDate",
    "votingEndDate",
  ];

  // Process each date field that exists in the data
  dateFields.forEach((field) => {
    if (processed[field]) {
      // Get the date string from the input (which is in local time format: YYYY-MM-DDTHH:MM)
      const localDateString = processed[field];

      // Parse parts of the date string
      const [datePart, timePart] = localDateString.split("T");
      const [hours, minutes] = timePart.split(":").map(Number);
      const [year, month, day] = datePart.split("-").map(Number);

      // Create a Date object using the local components
      // Month is 0-based in JavaScript Date, so subtract 1
      const date = new Date(year, month - 1, day, hours, minutes);

      // Convert to ISO string which will include timezone information
      processed[field] = date.toISOString();
    }
  });

  return processed;
};

// Create axios instance with specific config
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for auth cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const AdminService = {
  // Fetch all contests for admin view
  getContests: async () => {
    try {
      const response = await apiClient.get(`/admin/contests`);
      return response.data;
    } catch (error) {
      // Log error but remove details in production
      console.error("Error fetching contests for admin");
      throw error;
    }
  },

  // Get a single contest by ID
  getContest: async (contestId) => {
    try {
      const response = await apiClient.get(`/admin/contests/${contestId}`);
      return response.data;
    } catch (error) {
      // Log error but remove details in production
      console.error("Error fetching contest for admin");
      throw error;
    }
  },

  // Create a new contest
  createContest: async (contestData) => {
    try {
      // Process dates to preserve local time exactly
      const processedData = processContestDates(contestData);

      const response = await apiClient.post(`/admin/contests`, processedData);
      return response.data;
    } catch (error) {
      // Log error but remove details in production
      console.error("Error creating contest");
      throw error;
    }
  },

  // Update an existing contest
  updateContest: async (contestId, contestData) => {
    try {
      // Process dates to preserve local time exactly
      const processedData = processContestDates(contestData);

      const response = await apiClient.put(
        `/admin/contests/${contestId}`,
        processedData
      );
      return response.data;
    } catch (error) {
      // Log error but remove details in production
      console.error("Error updating contest");
      throw error;
    }
  },

  // Delete a contest
  deleteContest: async (contestId) => {
    try {
      await apiClient.delete(`/admin/contests/${contestId}`);
      return true;
    } catch (error) {
      // Log error but remove details in production
      console.error("Error deleting contest");
      throw error;
    }
  },
};
