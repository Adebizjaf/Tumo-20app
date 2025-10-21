import serverless from "serverless-http";
import { createServer } from "../../server";

// Create the Express app once
const app = createServer();

// Wrap with serverless-http
const handler = serverless(app, {
  binary: false,
  provider: "aws", // Netlify uses AWS Lambda
  basePath: "",
  // Manually parse body for Netlify
  request: (req: any, event: any) => {
    if (event.body && typeof event.body === "string") {
      try {
        req.body = JSON.parse(event.body);
      } catch (e) {
        console.error("Malformed JSON in request body:", e);
      }
    }
  },
});

// Export the handler with proper body parsing
export { handler };
