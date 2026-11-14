import { axiosInstance, setAccessToken } from "./axios";

export const authApi = {
  signIn: async (email, password) => {
    const response = await axiosInstance.post("/user-auth/sign-in", {
      email,
      password,
    });
    setAccessToken(response.data.session?.access_token);
    return response.data;
  },

  signUp: async (email, password, username, displayName) => {
    const response = await axiosInstance.post("/user-auth/sign-up", {
      email,
      password,
      username,
      displayName,
    });
    setAccessToken(response.data.session?.access_token);
    return response.data;
  },

  signOut: async () => {
    const response = await axiosInstance.post("/user-auth/sign-out");
    setAccessToken(null);
    return response.data;
  },

  // Saves the picture the backend just uploaded as the signed-in user's profile picture
  updateAvatar: async (avatarUrl) => {
    const response = await axiosInstance.put("/user-auth/avatar", { avatar_url: avatarUrl });
    return response.data;
  },

  getProfile: async (userId) => {
    const response = await axiosInstance.get(`/user-auth/profile/${userId}`);
    return response.data;
  },

  getPosts: async (userId) => {
    const response = await axiosInstance.get(`/user-auth/posts/${userId}`);
    return response.data;
  },

  getUserCommunities: async (userId) => {
    const response = await axiosInstance.get(`/user-auth/communities/${userId}`);
    return response.data;
  },

  joinCommunity: async (userId, communityId) => {
  const response = await axiosInstance.post("/user-auth/join-community", { userId, communityId });
  return response.data;
  },

  leaveCommunity: async (userId, communityId) => {
    const response = await axiosInstance.post("/user-auth/leave-community", { userId, communityId });
    return response.data;
  },
};
