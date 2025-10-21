import serverless from "serverless-http";
import { createServer } from "../../server";

// Create the Express app once
const app = createServer();

// Wrap with serverless-http
const handler = serverless(app, {
  binary: false,
  provider: 'aws', // Netlify uses AWS Lambda
  basePath: '',
});

// Export the handler with proper body parsing
export { handler };
