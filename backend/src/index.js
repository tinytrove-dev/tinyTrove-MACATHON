import express from "express";
import userAuthRoutes from "./routes/userAuthRoute.js";
import postRoutes from "./routes/postRoute.js";
import cors from "cors";

const app = express();

// Raised limit so base64 image uploads fit
app.use(express.json({ limit: "15mb" }));
app.use(cors());

app.use("/api/user-auth", userAuthRoutes);
app.use("/api/post", postRoutes);

const server = app.listen(3000, () =>
  console.log("Server running at localhost:3000")
);
