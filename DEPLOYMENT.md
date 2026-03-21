# Deployment Guide - Render

## Required Environment Variables

Set these in your **Render Dashboard** → Service Settings → Environment:

### Backend Service (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://prekjainsha190994_db_user:navkarservice@cluster0.mjujx3s.mongodb.net/
FRONTEND_URL=https://your-frontend-domain.onrender.com
NODE_ENV=production
JWT_SECRET=replace_with_a_long_random_secret
AUTH_JWT_SECRET=replace_with_a_long_random_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your@gmail.com
```

### Frontend Service (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.onrender.com
```

## Build Command

**Root:** `npm run build`

This will execute the workspace build which routes to Frontend.

## Start Command

**Frontend:** `npm run start --workspace Frontend`

## Deployment Steps

1. **Connect GitHub Repository** to Render
2. **Create Backend Service**
   - Build Command: `npm install && npm run build --workspace Backend` (or leave empty if Backend is Node/Express)
   - Start Command: `npm run start --workspace Backend`
3. **Create Frontend Service**
   - Build Command: `npm run build`
   - Start Command: `npm run start --workspace Frontend`
4. **Set Environment Variables** in Render Dashboard for each service
5. **Link Services** (optional): Configure Backend service URL in Frontend env vars
6. **Deploy** - Render will auto-deploy on push

## Common Issues

### npm Configuration Error
- ✅ `.npmrc` is configured with `legacy-peer-deps=true` for React dependencies
- ✅ Network timeouts set for slow deploys

### Missing Environment Variables
- Ensure `NEXT_PUBLIC_API_BASE_URL` is set for Frontend if API calls fail
- Ensure `MONGO_URI` is set for Backend database connection
- Ensure `FRONTEND_URL` is set in Backend for CORS and auth redirects

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes Render's IP range
- Use the full `mongodb+srv://` connection string from MongoDB Atlas

## Notes

- Both services need to be deployed separately on Render
- Frontend is a static Next.js build
- Backend is a Node.js/Express server
- Environment variables are service-specific, not shared across Render services
