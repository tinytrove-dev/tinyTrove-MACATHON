import express from "express";
import { createPost, createCommunity, createTag } from "../controllers/postController.js";
import { uploadImage } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/create-post", createPost);
router.post("/create-community", createCommunity);
router.post("/create-tag", createTag);
router.post("/upload-image", requireAuth, uploadImage);

export default router;
