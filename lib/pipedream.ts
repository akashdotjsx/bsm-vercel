import { PipedreamClient as Pipedream, ProjectEnvironment } from "@pipedream/sdk";

// Initialize backend Pipedream client
export const pd = new Pipedream({
  projectId: process.env.PIPEDREAM_PROJECT_ID as string,
  projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT as ProjectEnvironment) || "development",
  clientId: process.env.PIPEDREAM_CLIENT_ID!,
  clientSecret: process.env.PIPEDREAM_CLIENT_SECRET!,
});

// Create a connect token for frontend
export const createConnectToken = async (userId: string) => {
  const response = await pd.tokens.create({
    externalUserId: userId,
  });

  return {
    token: response.token,
    expires_at: response.expiresAt,
    connectLinkUrl: response.connectLinkUrl,
  };
};
