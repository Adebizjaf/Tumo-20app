import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { translationRouter } from "./routes/translation";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  
  // Add body parsing BEFORE json middleware for debugging
  app.use((req, res, next) => {
    console.log("=== Express Middleware Debug ===");
    console.log("req.body (before json()):", req.body);
    console.log("req.body type:", typeof req.body);
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Log after json parsing
  app.use((req, res, next) => {
    console.log("req.body (after json()):", req.body);
    console.log("req.body type:", typeof req.body);
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.use("/api/translation", translationRouter);

  return app;
}
