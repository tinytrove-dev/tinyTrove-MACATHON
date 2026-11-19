import { axiosInstance } from "./axios";

export const contentApi = {
  // Returns { mode: "popular" | "personalized", items, has_more }
  getFeed: async (offset = 0, limit = 20) => {
    const response = await axiosInstance.get("/feed", { params: { offset, limit } });
    return response.data;
  },

  getComments: async (postId) => {
    const response = await axiosInstance.get(`/content/posts/${postId}/comments`);
    return response.data;
  },

  // Returns { communities, stores, treasures }
  search: async (query) => {
    const response = await axiosInstance.get("/content/search", { params: { q: query } });
    return response.data;
  },

  getPost: async (postId) => {
    const response = await axiosInstance.get(`/content/posts/${postId}`);
    return response.data;
  },

  getTreasures: async () => {
    const response = await axiosInstance.get("/content/treasures");
    return response.data;
  },

  getTreasurePosts: async (treasureId) => {
    const response = await axiosInstance.get(`/content/treasures/${treasureId}/posts`);
    return response.data;
  },

  getTreasureCommunity: async (treasureId) => {
    const response = await axiosInstance.get(`/content/treasures/${treasureId}/community`);
    return response.data;
  },

  // Returns { treasures, posts }
  getCommunityContent: async (communityId) => {
    const response = await axiosInstance.get(`/content/communities/${communityId}/content`);
    return response.data;
  },

  getStores: async () => {
    const response = await axiosInstance.get("/content/stores");
    return response.data;
  },

  createStore: async (name) => {
    const response = await axiosInstance.post("/content/stores", { name });
    return response.data;
  },
};
