import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    token?: string; // Add token property to Session
  
  }
}