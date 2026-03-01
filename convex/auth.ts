import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

const ALLOWED_DOMAIN = "@colossyan.com";

const resendProvider = Resend({});
const originalSend = resendProvider.sendVerificationRequest!;
resendProvider.sendVerificationRequest = async (params) => {
  if (!params.identifier.endsWith(ALLOWED_DOMAIN)) {
    throw new Error("Only @colossyan.com accounts are allowed");
  }
  return originalSend(params);
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [resendProvider],
});
