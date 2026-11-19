import express from "express";
import userAuthRoutes from "./routes/userAuthRoute.js";
import postRoutes from "./routes/postRoute.js";
import contentRoutes from "./routes/contentRoute.js";
import feedRoutes from "./routes/feedRoute.js";
import cors from "cors";

const app = express();

// Raised limit so base64 image uploads fit
app.use(express.json({ limit: "15mb" }));
app.use(cors());

app.use("/api/user-auth", userAuthRoutes);
app.use("/api/post", postRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/feed", feedRoutes);

const port = process.env.PORT || 3000;

const server = app.listen(port, () =>
  console.log(`Server running at localhost:${port}`)
);
