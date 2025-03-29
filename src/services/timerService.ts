
import { toast } from "sonner";

// Define the base URL for your Supabase edge functions
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || "https://your-project-ref.supabase.co/functions/v1";

/**
 * Record timer stats for a completed coding level
 * @param levelId The ID of the completed level
 * @param timeSpent Time spent in seconds
 * @returns Promise with the response data
 */
export const recordTimerStats = async (levelId: string, timeSpent: number): Promise<any> => {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/timer-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header if your user is authenticated
        // 'Authorization': `Bearer ${supabaseClient.auth.session()?.access_token}`
      },
      body: JSON.stringify({
        levelId,
        timeSpent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to record timer stats');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error recording timer stats:', error);
    toast.error('Failed to record completion time');
    return null;
  }
};

/**
 * Fetch the expected time for a coding level
 * @param levelId The ID of the level
 * @returns Promise with the expected time data
 */
export const getExpectedTime = async (levelId: string): Promise<any> => {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/get-expected-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Include Authorization header if needed
      },
      body: JSON.stringify({
        levelId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expected time');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching expected time:', error);
    return null;
  }
};
