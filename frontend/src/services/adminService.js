import axios from "axios";

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

// Get the Clerk session token
const getAuthHeaders = async () => {
  try {
    // When in browser environment
    if (typeof window !== "undefined") {
      // This checks if the Clerk global object is available
      if (window.Clerk && window.Clerk.session) {
        const token = await window.Clerk.session.getToken();
        return {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        };
      }
    }
    // Fallback to just cookies if we can't get the token
    return { withCredentials: true };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return { withCredentials: true };
  }
};

export const AdminService = {
  // Fetch all contests for admin view
  getContests: async () => {
    try {
      const authConfig = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/admin/contests`, authConfig);
      return response.data;
    } catch (error) {
      console.error("Error fetching contests for admin:", error);
      throw error;
    }
  },

  // Get a single contest by ID
  getContest: async (contestId) => {
    try {
      const authConfig = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/admin/contests/${contestId}`,
        authConfig
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching contest for admin:", error);
      throw error;
    }
  },

  // Create a new contest
  createContest: async (contestData) => {
    try {
      // Process dates to preserve local time exactly
      const processedData = processContestDates(contestData);

      const authConfig = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/admin/contests`,
        processedData,
        authConfig
      );
      return response.data;
    } catch (error) {
      console.error("Error creating contest:", error);
      throw error;
    }
  },

  // Update an existing contest
  updateContest: async (contestId, contestData) => {
    try {
      // Process dates to preserve local time exactly
      const processedData = processContestDates(contestData);

      const authConfig = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/admin/contests/${contestId}`,
        processedData,
        authConfig
      );
      return response.data;
    } catch (error) {
      console.error("Error updating contest:", error);
      throw error;
    }
  },

  // Delete a contest
  deleteContest: async (contestId) => {
    try {
      const authConfig = await getAuthHeaders();
      await axios.delete(`${API_URL}/admin/contests/${contestId}`, authConfig);
      return true;
    } catch (error) {
      console.error("Error deleting contest:", error);
      throw error;
    }
  },
};
