import serverless from "serverless-http";

import { createServer } from "../../server";

// Wrap the serverless handler to parse body before Express receives it
const expressHandler = serverless(createServer(), {
  binary: false
});

export const handler = async (event: any, context: any) => {
  console.log("=== Netlify Function Request Debug ===");
  console.log("Event body type:", typeof event.body);
  console.log("Event body:", event.body);
  console.log("Event isBase64Encoded:", event.isBase64Encoded);
  console.log("Event httpMethod:", event.httpMethod);
  console.log("Event path:", event.path);
  
  // Parse the body if it's a string
  if (event.body && typeof event.body === 'string' && !event.isBase64Encoded) {
    try {
      const parsed = JSON.parse(event.body);
      console.log("Successfully parsed body:", parsed);
      // Update the event with parsed body
      event.body = JSON.stringify(parsed); // Keep as string but ensure it's valid JSON
    } catch (e) {
      console.error("Failed to parse event body:", e);
    }
  }
  
  // Pass to Express handler
  return expressHandler(event, context);
};
