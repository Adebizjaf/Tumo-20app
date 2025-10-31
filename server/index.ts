import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { translationRouter } from "./routes/translation";

export function createServer() {
  const app = express();

  // Security headers for Web Speech API (requires HTTPS/secure context in production)
  app.use((req, res, next) => {
    // Enforce HTTPS in production (max-age allows caching of this policy)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Allow upgrading insecure requests to HTTPS
    res.setHeader('Content-Security-Policy', 'upgrade-insecure-requests');
    // Allow CORS for translation APIs
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  // Middleware
  app.use(cors());
  
  // Handle request aborts gracefully - catch before body parsing
  app.use((req, res, next) => {
    req.on('aborted', () => {
      // Silently ignore - client navigated away
    });
    next();
  });
  
  // Wrap body parsers to catch abort errors
  app.use((req, res, next) => {
    express.json()(req, res, (err) => {
      if (err && err.message && err.message.includes('aborted')) {
        // Request was aborted, don't propagate error
        return;
      }
      next(err);
    });
  });
  
  app.use((req, res, next) => {
    express.urlencoded({ extended: true })(req, res, (err) => {
      if (err && err.message && err.message.includes('aborted')) {
        // Request was aborted, don't propagate error
        return;
      }
      next(err);
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.use("/api/translation", translationRouter);

  // Global error handler - catch any remaining errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Silently ignore abort errors
    if (err && (err.message?.includes('aborted') || err.code === 'ECONNRESET')) {
      return;
    }
    // Log other errors
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
}
