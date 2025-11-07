const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class XPService {
  constructor(getToken) {
    this.getToken = getToken;
  }

  /**
   * Get current user's XP stats
   */
  async getUserXPStats() {
    try {
      const token = await this.getToken();
      const response = await fetch(`${API_BASE}/xp/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user XP stats:", error);
      throw error;
    }
  }

  /**
   * Get XP leaderboard with timeframe support
   */
  async getLeaderboard(timeframe = "all", limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE}/xp/leaderboard?timeframe=${timeframe}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching XP leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get user's XP for a specific timeframe
   */
  async getUserTimeframeXP(timeframe) {
    try {
      const token = await this.getToken();
      const response = await fetch(
        `${API_BASE}/xp/user-timeframe/${timeframe}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${timeframe} XP:`, error);
      throw error;
    }
  }

  /**
   * Get specific user's XP for a timeframe (public endpoint)
   */
  async getUserTimeframeXPByUserId(userId, timeframe) {
    try {
      const response = await fetch(
        `${API_BASE}/xp/user/${userId}/timeframe/${timeframe}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${userId} ${timeframe} XP:`, error);
      throw error;
    }
  }

  /**
   * Get XP rewards information
   */
  async getXPRewards() {
    try {
      const response = await fetch(`${API_BASE}/xp/rewards`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching XP rewards info:", error);
      throw error;
    }
  }

  /**
   * Get recent XP transactions for current user
   */
  async getRecentTransactions(limit = 20) {
    try {
      const token = await this.getToken();
      const response = await fetch(
        `${API_BASE}/xp/transactions/recent?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      throw error;
    }
  }

  /**
   * Calculate level from XP (for client-side display)
   */
  static calculateLevelFromXP(currentXP) {
    let level = 0;
    while (this.getXpForLevel(level + 1) <= currentXP) {
      level++;
    }
    return level;
  }

  /**
   * Calculate required XP for a given level (for client-side display)
   * Uses exponential growth: level^2 * 50
   * Cleaner numbers than fractional exponents while keeping progression achievable
   */
  static getXpForLevel(level) {
    return Math.floor(Math.pow(level, 2) * 50);
  }

  /**
   * Get XP progress for current level (for client-side display)
   */
  static getXPProgress(currentXP, level) {
    const currentLevelXP = this.getXpForLevel(level);
    const nextLevelXP = this.getXpForLevel(level + 1);
    const xpInCurrentLevel = currentXP - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentXP;
    const progressPercent =
      (xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100;

    return {
      currentLevelXP,
      nextLevelXP,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent: Math.round(progressPercent * 100) / 100,
    };
  }

  /**
   * Format XP number for display
   */
  static formatXP(xp) {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + "M";
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + "K";
    }
    return xp.toString();
  }

  /**
   * Get level color for UI display
   */
  static getLevelColor(level) {
    if (level >= 50) return "#FFD700"; // Gold
    if (level >= 30) return "#C0C0C0"; // Silver
    if (level >= 20) return "#CD7F32"; // Bronze
    if (level >= 10) return "#9966CC"; // Purple
    if (level >= 5) return "#4169E1"; // Blue
    return "#32CD32"; // Green
  }

  /**
   * Get level title based on level
   */
  static getLevelTitle(level) {
    if (level >= 50) return "Grandmaster";
    if (level >= 40) return "Master";
    if (level >= 30) return "Expert";
    if (level >= 20) return "Advanced";
    if (level >= 15) return "Skilled";
    if (level >= 10) return "Intermediate";
    if (level >= 5) return "Apprentice";
    return "Novice";
  }
}

// Legacy export for backward compatibility
const XPServiceStatic = XPService;
export default XPServiceStatic;
