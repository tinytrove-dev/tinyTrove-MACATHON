import express from "express";
import { signIn, signUp, signOut, refreshSession, getProfile, getUserPosts, getUserCommunities, joinCommunity,  leaveCommunity, isMember} from "../controllers/userAuthController.js";
import { updateAvatar } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Public
router.post("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/refresh", refreshSession);

// Signed-in users only
router.use(requireAuth);
router.post("/sign-out", signOut);
router.get("/profile/:userId", getProfile);
router.patch("/profile/avatar", updateAvatar);
router.get("/posts/:userId", getUserPosts);
router.get("/communities/:userId", getUserCommunities);
router.post("/join-community", joinCommunity);
router.post("/leave-community", leaveCommunity);
router.get("/is-member/:communityId", isMember);

export default router;
