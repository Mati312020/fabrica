/** Phase 5 texts (local or remote engine, token charts) in English. */
export const enPhase5 = {
  engine: {
    title: "Engine",
    local: "Local",
    remote: "Remote",
    localHelp: "The engine runs on this computer, inside the app.",
    remoteHelp: "The engine runs on a server. The project folder and the API key belong to the server, not to this computer.",
    url: "Remote engine URL",
    token: "Remote engine token",
    tokenPlaceholder: "Token (at least 32 bytes)",
    tokenSaved: "Token saved (leave empty to keep it)",
    apply: "Apply and restart",
    restarting: "Saved. The app is restarting to use the chosen engine…",
    errors: {
      invalid_url: "The URL must be wss://… (no user, query or #).",
      invalid_token: "The token must be at least 32 bytes long and have no spaces.",
      token_required: "The remote engine token is missing.",
      encryption_unavailable: "This system cannot encrypt secrets, so nothing was saved.",
    },
  },
};

/** API key text with a remote engine. */
export const enRemoteKey = "With a remote engine the API key is an environment variable on the server: it is not set here.";
