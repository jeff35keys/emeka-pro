# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Sign In" or "Sign Up"
3. Create a new project:
   - Project Name: `doctor-appointment-system`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to your location
4. Wait 2-3 minutes for project to initialize

## Step 2: Get Your Credentials

After project is created:

1. Go to **Settings** → **API** 
2. Copy these values and save to `.env`:
   - **Project URL** (Supabase URL)
   - **anon key** (public key)
   - **service_role key** (private key - keep secret!)

3. Go to **Settings** → **Database** → **Connection Pooling**
   - Enable connection pooling
   - Copy connection string

## Step 3: Update Backend .env

```
# Supabase Configuration
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=your_database_password

# Firebase/Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# General
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Step 4: Update Frontend .env

```
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 5: Backend Setup

Install Supabase packages:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-express dotenv
```

## Step 6: Frontend Setup

Install Supabase packages:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

## Step 7: Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Copy and run the SQL migration file provided: `backend/migrations/001_create_tables.sql`

## Step 8: Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Ensure "Email" provider is enabled
3. Configure email settings if needed

## Step 9: Test Connection

Run backend:
```bash
cd backend
npm install
npm run dev
```

You should see: "✅ Supabase connected successfully"

If you get an error, check:
- Supabase URL and keys are correct
- Database tables are created
- Network access is allowed

---

**Once completed, your system will have:**
✅ Supabase Auth for user registration/login
✅ PostgreSQL database for data storage
✅ Automatic user management
✅ Email verification
✅ Password reset functionality
✅ Session management
