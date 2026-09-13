import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import axios from 'axios';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          // Send the Google profile data to your backend
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google-login`, {
            email: profile.email,
            name: profile.name,
            googleId: profile.sub,
            picture: profile.picture
          });
          
          // Store the token from your backend
          if (response.data && response.data.token) {
            // We'll access this in the jwt callback below
            account.backendToken = response.data.token;
            account.backendUser = response.data.user;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error with Google login backend:", error);
          return false;
        }
      } else if (account.provider === 'facebook') {
        try {
          // Send the Facebook profile data to your backend
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/facebook-login`, {
            email: profile.email,
            name: profile.name,
            facebookId: profile.id,
            picture: profile.picture?.data?.url
          });
          
          // Store the token from your backend
          if (response.data && response.data.token) {
            account.backendToken = response.data.token;
            account.backendUser = response.data.user;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error with Facebook login backend:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && (account.provider === 'google' || account.provider === 'facebook') && account.backendToken) {
        token.backendToken = account.backendToken;
        token.backendUser = account.backendUser;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token.backendToken) {
        session.backendToken = token.backendToken;
        session.user = { ...session.user, ...token.backendUser };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-here',
});
