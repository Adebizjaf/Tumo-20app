import serverless from "serverless-http";

import { createServer } from "../../server";

const expressHandler = serverless(createServer(), {
  binary: false,
});

// Wrap the serverless-http handler to parse the body before passing to Express
export const handler = async (event: any, context: any) => {
  console.log("=== Netlify Function Request Debug ===");
  console.log("Event body type:", typeof event.body);
  console.log("Event body:", event.body);
  console.log("Event isBase64Encoded:", event.isBase64Encoded);
  console.log("Event httpMethod:", event.httpMethod);
  console.log("Event path:", event.path);
  
  // Parse JSON body if it's a string
  if (event.body && typeof event.body === 'string' && event.httpMethod === 'POST') {
    try {
      const parsedBody = JSON.parse(event.body);
      console.log("Parsed body:", parsedBody);
      // Create a new event object with parsed body
      event = {
        ...event,
        body: JSON.stringify(parsedBody), // serverless-http expects string
      };
    } catch (e) {
      console.error("Failed to parse body:", e);
    }
  }
  
  return expressHandler(event, context);
};
