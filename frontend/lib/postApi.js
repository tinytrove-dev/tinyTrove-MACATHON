import { authApi } from "./authApi";
import { axiosInstance } from "./axios";

export const postApi = {
  // 1. Add userId as the FIRST argument here
  createPost: async (userId, image, description, location, tags) => {
    //console.log("postapi", tags);
    try {
      const response = await axiosInstance.post("/post/create-post", {
        userId, // 2. Add userId to the payload being sent
        image,
        description,
        location,
        tags,
      });
      return response.data;
    } catch (err) {
      console.log("Create Post Error: ", err);
      // 3. CRITICAL: You must throw the error so your Post.js file knows it failed!
      throw err;
    }
  },
  createCommunity: async (
    userId,
    name,
    description,
    photoUrl,
    bannerUrl,
    tags,
    themeColor
  ) => {
    try {
      // Make sure this URL matches exactly what is in your Express backend!
      const response = await axiosInstance.post("/post/create-community", {
        userId: userId,
        name: name,
        description: description,
        photo_url: photoUrl,
        banner_url: bannerUrl,
        tags: tags,
        theme_color: themeColor
      });

      return response.data;

    } catch (err) {
      console.log("Create Community Error: ", err);
      throw err;
    }
  },
  createTag: async (userId, name, description, photoUrl, communityId) => {
    try {
      const response = await axiosInstance.post("/post/create-tag", {
        userId,
        name,
        description,
        photo_url: photoUrl,
        communityId, // <--- This must be here!
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  },
  // bucket: "Posts" | "ProfilePictures". base64 is the image's base64 data.
  // The backend uploads it as the signed-in user and returns the image's public URL.
  uploadImage: async (bucket, base64) => {
    const response = await axiosInstance.post("/post/upload-image", { bucket, base64 });
    return response.data.url;
  },
};
