/**
 * Application configuration
 *
 * NOTE: BUSY Bar firmware limits web UI settings fields to 64 bytes,
 * so long tokens (like WorkosCursorSessionToken ~450+ bytes) must be placed here.
 */
export const config = {
  /**
   * Your WorkosCursorSessionToken from cursor.com cookies (length ~450+ chars).
   * Paste your token between the quotes below:
   */
  sessionToken: "user_01KN948SGTF6TGJEC3NWWA5TJQ%3A%3AeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHx1c2VyXzAxS045NDhTR1RGNlRHSkVDM05XV0E1VEpRIiwidGltZSI6IjE3OTUxNDY2NjQiLCJyYW5kb21uZXNzIjoiNDRkMGViZDQtZDViNy00OTlkIiwiZXhwIjoxODAwMzMwNjY0LCJpc3MiOiJodHRwczovL2F1dGhlbnRpY2F0aW9uLmN1cnNvci5zaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MiLCJhdWQiOiJodHRwczovL2N1cnNvci5jb20iLCJ0eXBlIjoid2ViIiwid29ya29zVXNlcklkIjoidXNlcl8wMUtOOTQ4U0dURjZUR0pFQzNOV1dBNVRKUSIsIndvcmtvc1Nlc3Npb25JZCI6InNlc3Npb25fMDFNN1ZIOEpBMlRXRzJHSEJCNkpDQ0tHOEciLCJtaW50Q29udGV4dCI6eyJjb3VudHJ5IjoiRkkifX0.3dXlUECuMlQGi22ScwV74h0x9OAiUHEWtjeVh6-IHZM",

  /**
   * How often to refresh Cursor limits (in minutes).
   * Default: 5 minutes.
   */
  refreshIntervalMin: 5,

  /**
   * Default display mode on the front screen:
   * 'remaining' -> e.g. "55% LEFT"
   * 'used'      -> e.g. "45% USED"
   * 'reset'     -> e.g. "14D RESET"
   */
  defaultMode: "remaining" as const,
};
