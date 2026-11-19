import express from "express";
import { createPost, createCommunity, createTag } from "../controllers/postController.js";
import { uploadImage } from "../controllers/uploadController.js";
import { setCheck, clearCheck, addComment } from "../controllers/engagementController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);
router.post("/create-post", createPost);
router.post("/create-community", createCommunity);
router.post("/create-tag", createTag);
router.post("/upload-image", uploadImage);
router.put("/:postId/check", setCheck);
router.delete("/:postId/check", clearCheck);
router.post("/:postId/comments", addComment);

export default router;
