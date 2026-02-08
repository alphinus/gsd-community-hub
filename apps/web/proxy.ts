export { auth as proxy } from "@/lib/auth/auth";

export const config = {
  matcher: ["/(auth)/:path*", "/api/profile/:path*"],
};
