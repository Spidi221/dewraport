import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { sendOnboardingEmail } from '@/lib/email';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      normalizeIdentifier: (identifier: string): string => {
        const [local, domain] = identifier.toLowerCase().trim().split('@');
        return `${local}@${domain}`;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error'
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        // Add developer info to session
        const developer = await prisma.developer.findUnique({
          where: { user: { id: user.id } }
        });
        
        session.user.id = user.id;
        session.user.developer = developer;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Check if this is a new user
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { developer: true }
      });

      // If new user, they'll need to complete developer profile
      if (!existingUser) {
        console.log('New user signing up:', user.email);
      }

      return true;
    }
  },
  events: {
    async createUser({ user }) {
      console.log('New user created:', user.email);
      // We'll trigger onboarding flow later when developer profile is created
    }
  },
  session: {
    strategy: 'database'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };