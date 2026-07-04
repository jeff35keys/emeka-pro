# Supabase Setup - Quick Reference

## 1. Create Supabase Account
- Go to https://supabase.com
- Sign up with email
- Create new project (takes 3-5 minutes)

## 2. Get Credentials
Settings → API:
- Project URL: `SUPABASE_URL`
- Anon Key: `SUPABASE_ANON_KEY`
- Service Role Key: `SUPABASE_SERVICE_ROLE_KEY`

## 3. Create Database Schema
1. SQL Editor → New Query
2. Copy from `backend/config/database.sql`
3. Paste and Run
4. Wait for completion

## 4. Configure Files

### Backend .env
```bash
cp backend/.env.supabase.example backend/.env
```
Update with your credentials

### Frontend .env
```bash
cp frontend/.env.supabase.example frontend/.env
```
Update with your credentials

## 5. Install & Start

### Backend
```bash
cd backend
npm install @supabase/supabase-js
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 6. Test

Register at http://localhost:3000/register

## Supabase Dashboard Features

| Feature | Use |
|---------|-----|
| Table Editor | View/Edit data |
| SQL Editor | Run queries |
| Authentication | User management |
| Policies | Row Level Security |
| Logs | Monitor queries |
| Backups | Database backups |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect | Check .env credentials |
| RLS error | Add user authentication |
| Tables not found | Run database.sql again |
| Auth fails | Verify email/password format |

---

See SUPABASE_MIGRATION_GUIDE.md for detailed instructions.
