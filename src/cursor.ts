export interface CursorUsage {
  plan: string;
  usedPercent: number;
  remainingPercent: number;
  autoPercent: number;
  apiPercent: number;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
  daysToReset: number | null;
  lastUpdated: number;
}

/**
 * Fetches user usage summary from Cursor API.
 * Uses the WorkosCursorSessionToken cookie.
 */
export async function fetchCursorUsage(rawToken: string): Promise<CursorUsage> {
  const token = rawToken.trim();
  if (!token) {
    throw new Error("No session token provided");
  }

  // Format cookie properly (in case user pasted full cookie string or raw token)
  const cookieValue = token.includes("WorkosCursorSessionToken=")
    ? token
    : `WorkosCursorSessionToken=${token}`;

  const response = await fetch("https://cursor.com/api/usage-summary", {
    method: "GET",
    headers: {
      Cookie: cookieValue,
      Accept: "application/json",
      "User-Agent": "BUSY-Bar/1.0",
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Token expired or invalid");
    }
    throw new Error(`API error ${response.status}`);
  }

  const data = (await response.json()) as {
    membershipType?: string;
    billingCycleStart?: string;
    billingCycleEnd?: string;
    individualUsage?: {
      plan?: {
        autoPercentUsed?: number;
        apiPercentUsed?: number;
        totalPercentUsed?: number;
      };
    };
  };

  const planUsage = data.individualUsage?.plan;
  const autoPercent = planUsage?.autoPercentUsed ?? 0;
  const apiPercent = planUsage?.apiPercentUsed ?? 0;
  const usedPercent = planUsage?.totalPercentUsed ?? autoPercent;
  const remainingPercent = Math.max(0, Math.min(100, 100 - usedPercent));

  let daysToReset: number | null = null;
  if (data.billingCycleEnd) {
    const endMs = new Date(data.billingCycleEnd).getTime();
    if (!isNaN(endMs)) {
      const diffMs = endMs - Date.now();
      daysToReset = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    plan: data.membershipType ?? "pro",
    usedPercent,
    remainingPercent,
    autoPercent,
    apiPercent,
    billingCycleStart: data.billingCycleStart ?? null,
    billingCycleEnd: data.billingCycleEnd ?? null,
    daysToReset,
    lastUpdated: Date.now(),
  };
}
