# Deployment Guide for Tumo Translation App

## Fixed Netlify Deployment Issues

### Problem
The app was failing to deploy on Netlify with error:
```
Error: Cannot find module 'express'
```

### Root Cause
Netlify Functions couldn't find the required dependencies because:
1. `cors` was in devDependencies instead of dependencies
2. Netlify Functions need explicit dependency configuration

### Solutions Applied

#### 1. Fixed package.json Dependencies
Moved `cors` from devDependencies to dependencies:
```json
"dependencies": {
  "cors": "^2.8.5",
  "dotenv": "^17.2.1",
  "express": "^5.1.0",
  "tesseract.js": "^6.0.1",
  "zod": "^3.25.76"
}
```

#### 2. Created Functions-Specific package.json
Created `/netlify/functions/package.json` with only the dependencies needed for serverless functions:
- express
- cors
- dotenv
- serverless-http

#### 3. Updated netlify.toml
Updated build command to install function dependencies:
```toml
[build]
  command = "npm run build:client && cd netlify/functions && npm install"
  functions = "netlify/functions"
  publish = "dist/spa"

[functions]
  external_node_modules = ["express", "cors", "serverless-http", "dotenv"]
  node_bundler = "esbuild"
```

## Deployment Steps

### Option 1: Deploy to Netlify

1. **Install dependencies locally:**
   ```bash
   npm install
   ```

2. **Test the build:**
   ```bash
   npm run build
   ```

3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Netlify deployment dependencies"
   git push
   ```

4. **Deploy on Netlify:**
   - Connect your GitHub repo to Netlify
   - Netlify will automatically detect the `netlify.toml` configuration
   - Click "Deploy"

### Option 2: Local Testing with Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Test locally:**
   ```bash
   npm run build
   netlify dev
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

Don't forget to set these in Netlify dashboard under Site Settings > Environment Variables:

```
TRANSLATION_API_URL=https://libretranslate.com
TRANSLATION_TIMEOUT_MS=12000
```

## Verification

After deployment, test these endpoints:

1. **Health Check:**
   ```
   https://your-site.netlify.app/api/ping
   ```

2. **Translation:**
   ```bash
   curl -X POST https://your-site.netlify.app/api/translation/translate \
     -H "Content-Type: application/json" \
     -d '{"text":"hello","source":"en","target":"es"}'
   ```

## Troubleshooting

### If deployment still fails:

1. **Check Netlify build logs** for specific errors
2. **Verify all dependencies are installed:**
   ```bash
   cd netlify/functions
   npm install
   cd ../..
   ```
3. **Test the function locally:**
   ```bash
   netlify dev
   ```

### Common Issues:

- **Module not found**: Make sure the module is in `dependencies`, not `devDependencies`
- **Build timeout**: The translation API calls might timeout - the app will fall back to offline mode
- **CORS errors**: These are handled by the cors middleware in the Express server

## Notes

- The app will automatically use offline fallback if translation APIs fail
- Netlify Functions have a 10-second timeout by default
- The build includes both client and server code
- All API routes are proxied through `/.netlify/functions/api/*`
