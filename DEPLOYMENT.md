# TicketOps Deployment Guide

## 🚀 Deployment to Vercel

### Prerequisites
- GitHub account with repository access
- Vercel account (free at https://vercel.com)
- Supabase account (free at https://supabase.com)

### Step 1: Deploy to Vercel

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Connect your GitHub account and select `aiops-arch/TicketOps`
4. Click "Deploy"

Your application will be deployed at: `https://ticketops-silk.vercel.app` (or your custom domain)

### Step 2: Configure Environment Variables in Vercel

After deployment, add these environment variables:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
```

## 🗄️ Supabase Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Project name: `TicketOps`
   - Database password: Create a strong password
   - Region: Select closest to you
4. Click "Create new project"

### Step 2: Get Your Credentials

1. Go to Settings → API
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_KEY`
   - `service_role` key → `SUPABASE_SECRET_KEY`

### Step 3: Create Database Tables

Go to the SQL Editor and run:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  post TEXT,
  role TEXT DEFAULT 'technician',
  created_at TIMESTAMP DEFAULT now()
);

-- Outlets table
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  impact TEXT,
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
```

### Step 4: Enable Authentication

1. In Supabase dashboard, go to Authentication → Providers
2. Enable "Email" provider
3. Go to Settings → Auth and configure:
   - Site URL: `https://your-vercel-app.vercel.app`
   - Redirect URLs: `https://your-vercel-app.vercel.app/dashboard`

## 📋 Deployment Checklist

- [x] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Create Supabase project
- [ ] Configure environment variables in Vercel
- [ ] Create database tables in Supabase
- [ ] Test login functionality
- [ ] Monitor Vercel logs for errors
- [ ] Set up custom domain (optional)

## 🔗 Live URLs

After deployment, your application will be available at:
- **Web App**: https://your-vercel-app.vercel.app
- **API**: https://your-vercel-app.vercel.app/api
- **Supabase Dashboard**: https://app.supabase.com

## ⚠️ Important Security Notes

1. Never commit `.env` file to GitHub
2. Always use environment variables for sensitive data
3. Enable RLS (Row Level Security) on all database tables
4. Regularly rotate JWT secrets
5. Monitor Supabase logs for suspicious activity

## 🆘 Troubleshooting

### App shows "Cannot GET /"
- Check that `server.js` is properly configured
- Verify `vercel.json` routes are correct

### Database connection fails
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check that Supabase project is active
- Verify database table names match your code

### Authentication not working
- Verify redirect URLs in Supabase auth settings
- Check JWT_SECRET is set in environment
- Clear browser cache and cookies

## 📞 Support

For issues, visit:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: https://github.com/aiops-arch/TicketOps/issues
