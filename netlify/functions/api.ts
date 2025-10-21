import serverless from "serverless-http";

import { createServer } from "../../server";

// Configure serverless-http with proper options for Netlify
export const handler = serverless(createServer(), {
  binary: false,
  request: (request: any, event: any) => {
    console.log("=== Netlify Function Request Debug ===");
    console.log("Event body type:", typeof event.body);
    console.log("Event body:", event.body);
    console.log("Event isBase64Encoded:", event.isBase64Encoded);
    console.log("Request body type:", typeof request.body);
    console.log("Request body:", request.body);
    
    // Ensure the request body is properly parsed
    if (request.body && typeof request.body === 'string') {
      try {
        request.body = JSON.parse(request.body);
        console.log("Parsed request body:", request.body);
      } catch (e) {
        console.error("Failed to parse request body:", e);
      }
    }
  }
});
