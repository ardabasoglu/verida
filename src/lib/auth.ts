import { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import type { Adapter } from 'next-auth/adapters'
import { ActivityLogger, ActivityAction, ResourceType } from '@/lib/activity-logger'

const providers = []

// Add email provider if SMTP is configured
if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  )
}

// Add development credentials provider for testing
if (process.env.NODE_ENV === 'development') {
  providers.push(
    CredentialsProvider({
      id: 'dev-login',
      name: 'Development Login',
      credentials: {
        email: { label: 'Email', type: 'email' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.email.endsWith('@dgmgumruk.com')) {
          return null
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              role: 'MEMBER',
              emailVerified: new Date(),
            }
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers,
  callbacks: {
    async signIn({ user }) {
      // @dgmgumruk.com domain restriction for both registration and login
      if (user.email && !user.email.endsWith('@dgmgumruk.com')) {
        return false
      }
      
      // In development, auto-create users if they don't exist
      if (process.env.NODE_ENV === 'development' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })
        
        if (!existingUser) {
          // Create user with MEMBER role by default
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: 'MEMBER',
              emailVerified: new Date(),
            }
          })
        }
      }
      
      return true
    },
    async session({ session }) {
      // Add user role and id to session
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, role: true, name: true }
        })
        
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.role = dbUser.role
          session.user.name = dbUser.name
        }
      }
      
      return session
    },
    async jwt({ token, user }) {
      // Add user info to JWT token
      if (user) {
        token.id = user.id
        token.role = (user as { role: UserRole }).role
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  events: {
    async createUser({ user }) {
      // Log user creation activity
      if (user.id && user.email) {
        await ActivityLogger.log({
          userId: user.id,
          action: ActivityAction.USER_CREATED,
          resourceType: ResourceType.USER,
          resourceId: user.id,
          details: {
            email: user.email,
            registrationMethod: 'email',
          },
        })
      }
    },
    async signIn({ user, account, isNewUser }) {
      // Log user login activity
      if (user.id) {
        await ActivityLogger.log({
          userId: user.id,
          action: ActivityAction.USER_LOGIN,
          resourceType: ResourceType.USER,
          resourceId: user.id,
          details: {
            email: user.email,
            provider: account?.provider,
            isNewUser: isNewUser || false,
          },
        })
      }
    },
  },
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}