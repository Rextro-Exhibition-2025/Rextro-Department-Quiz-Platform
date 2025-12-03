import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import jwt from 'jsonwebtoken';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Auth callback invoked');

      // Get allowed admin emails from environment variables
      const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
      const adminEmails = adminEmailsEnv.split(',').map(email => email.trim());
      
      // Check if user email is in admin list
      if (account?.provider === 'google' && user.email) {
        return adminEmails.includes(user.email);
      }
      return false;
    },
    async session({ session, token }) {
      // Add the token to the session object
      if (token) {
        // Create a custom JWT token with user info
        const customToken = jwt.sign(
          {
            email: token.email,
            name: token.name,
            sub: token.sub,
          },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: '15m' }
        );
        session.token = customToken;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Return the token - this contains all user info
      return token;
    },
  },
  pages: {
    signIn: '/admin-access',
    error: '/admin-access',
  },
  session: {
    strategy: 'jwt',
  },
}