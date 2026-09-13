import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import axios from 'axios';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          console.log('Google login attempt with profile:', { 
            email: profile.email,
            name: profile.name,
            googleId: profile.sub,
            picture: profile.picture // Đảm bảo picture được log
          });
          
          // Send the Google profile data to your backend
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-login`, {
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
            
            // Đảm bảo avatar được gán từ Google nếu backend không trả về
            if (!account.backendUser.avatar && profile.picture) {
              account.backendUser.avatar = profile.picture;
            }
            
            return true;
          }
          console.error("Backend response invalid:", response.data);
          return false;
        } catch (error) {
          console.error("Error with Google login backend:", error.response?.data || error.message);
          return false;
        }
      } else if (account.provider === 'facebook') {
        try {
          console.log('Facebook login attempt with profile:', { 
            email: profile.email,
            name: profile.name,
            facebookId: profile.id 
          });
          
          // Send the Facebook profile data to your backend
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/facebook-login`, {
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
          console.error("Backend response invalid:", response.data);
          return false;
        } catch (error) {
          console.error("Error with Facebook login backend:", error.response?.data || error.message);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, user, profile }) {
      // Initial sign in
      if (account && (account.provider === 'google' || account.provider === 'facebook')) {
        if (account.backendToken) {
          console.log("Setting backend token in JWT:", account.backendToken);
          token.backendToken = account.backendToken;
          token.backendUser = account.backendUser;
          
          // Đảm bảo avatar được lưu trong token
          if (account.provider === 'google' && profile?.picture && (!token.backendUser.avatar || token.backendUser.avatar === "")) {
            console.log("Setting Google avatar in JWT token");
            token.backendUser.avatar = profile.picture;
            token.picture = profile.picture; // Cũng lưu trong token.picture để đảm bảo
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token.backendToken) {
        console.log("Setting backend token in session for client");
        session.backendToken = token.backendToken;
        if (token.backendUser) {
          // Merge NextAuth user with backend user
          session.user = { 
            ...session.user, 
            ...token.backendUser,
            // Make sure these fields are available
            id: token.backendUser._id || token.backendUser.id,
            _id: token.backendUser._id || token.backendUser.id,
            role: token.backendUser.role || "user",
          };
          
          // Đảm bảo avatar luôn có giá trị
          if (!session.user.avatar && session.user.image) {
            session.user.avatar = session.user.image;
          } else if (!session.user.avatar && token.picture) {
            session.user.avatar = token.picture;
          }
          
          // Log để debug avatar
          console.log("Final session user with avatar:", {
            avatar: session.user.avatar,
            image: session.user.image
          });
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error', 
  }
};

export default NextAuth(authOptions);