import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!ok) return null;

        return {
          id:    user._id.toString(),
          email: user.email,
          name:  user.name,
          role:  user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * jwt() runs on every sign-in and every token refresh.
     *
     * For Google sign-in the `user` object NextAuth provides carries
     * user.id = Google's OAuth "sub" (e.g. "113456789012345678901"),
     * NOT our MongoDB _id.  We must look up our DB record by email
     * and overwrite token.id with the real Mongo ObjectId string so
     * that every downstream call to session.user.id is safe to pass
     * into User.findById() / DigitalDeposit.create({ user: … }) etc.
     *
     * For credentials sign-in `authorize()` already returns the real
     * Mongo _id as user.id, so we skip the DB lookup for that path.
     */
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          // Google path: look up (or create) the DB user and use its _id
          await connectDB();
          let dbUser = await User.findOne({ email: user.email });
          if (!dbUser) {
            dbUser = await User.create({
              name:       user.name,
              email:      user.email,
              avatar:     user.image,
              isVerified: true,
              role:       "user",
            });
          }
          token.id   = dbUser._id.toString();          // real Mongo ObjectId
          token.role = (dbUser.role as string) ?? "user";
        } else {
          // Credentials path: authorize() already resolved the Mongo _id
          token.id   = user.id;
          token.role = (user as { role?: string }).role ?? "user";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    /**
     * signIn() still runs for Google to handle the upsert, but the
     * actual user.id fixup now happens in jwt() so we keep this
     * callback minimal — just return true to allow sign-in.
     *
     * NOTE: existing Google users who have an active JWT session
     * containing the old (Google sub) id will need to sign out and
     * back in once for their token to be re-issued with the correct
     * Mongo _id.  New sign-ins after this deploy are automatically
     * correct.
     */
    async signIn({ account }) {
      // Allow all sign-ins; DB upsert is handled in jwt() for Google
      if (account?.provider === "google") return true;
      return true;
    },
  },
  pages: {
    signIn:  "/auth/login",
    signOut: "/auth/login",
    error:   "/auth/login",
  },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
