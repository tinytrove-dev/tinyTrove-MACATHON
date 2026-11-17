import express from "express";
import { signIn, signUp, signOut, getProfile, getUserPosts, getUserCommunities, joinCommunity,  leaveCommunity, isMember} from "../controllers/userAuthController.js";
import { updateAvatar } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/sign-out", signOut);
router.get("/profile/:userId", getProfile);
router.get("/posts/:userId", getUserPosts);
router.get("/communities/:userId", getUserCommunities);
router.post("/join-community", joinCommunity);
router.post("/leave-community", leaveCommunity);
router.get("/is-member", isMember);
router.put("/avatar", requireAuth, updateAvatar);

export default router;
