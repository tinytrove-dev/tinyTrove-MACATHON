import { axiosInstance, setSession, clearSession } from "./axios";

export const authApi = {
  signIn: async (email, password) => {
    const response = await axiosInstance.post("/user-auth/sign-in", {
      email,
      password,
    });
    setSession(response.data.session);
    return response.data;
  },

  signUp: async (email, password, username, displayName) => {
    const response = await axiosInstance.post("/user-auth/sign-up", {
      email,
      password,
      username,
      displayName,
    });
    // No session when Supabase requires email confirmation first
    if (response.data.session) setSession(response.data.session);
    return response.data;
  },

  signOut: async () => {
    try {
      const response = await axiosInstance.post("/user-auth/sign-out");
      return response.data;
    } finally {
      clearSession();
    }
  },

  getProfile: async (userId) => {
    const response = await axiosInstance.get(`/user-auth/profile/${userId}`);
    return response.data;
  },

  updateAvatar: async (avatarUrl) => {
    const response = await axiosInstance.patch("/user-auth/profile/avatar", { avatar_url: avatarUrl });
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

  isMember: async (communityId) => {
    const response = await axiosInstance.get(`/user-auth/is-member/${communityId}`);
    return response.data.isMember;
  },

  joinCommunity: async (communityId) => {
    const response = await axiosInstance.post("/user-auth/join-community", { communityId });
    return response.data;
  },

  leaveCommunity: async (communityId) => {
    const response = await axiosInstance.post("/user-auth/leave-community", { communityId });
    return response.data;
  },
};
