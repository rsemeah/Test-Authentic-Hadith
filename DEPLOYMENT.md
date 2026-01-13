# Authentic Hadith - Deployment Guide

## 🎯 What You Have

A production-ready hadith verification platform with constitutional enforcement via QBos TruthSerum™.

### Core Features
- **Constitutional Gates**: Every operation validated by QBos backend
- **Import Hadith**: Scholars can import with source verification
- **Verify Hadith**: Scholars verify with methodology documentation
- **Publish Hadith**: Requires 2+ verifications + moderator approval
- **Delete Hadith**: Admin-only with written justification
- **Search Hadith**: Public with rate limiting
- **Receipt System**: Every operation generates immutable proof

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# QBos Backend (should be running on port 3001)
QBOS_BACKEND_URL=http://localhost:3001
QBOS_API_KEY=your_qbos_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3002
NODE_ENV=development
```

### 3. Set Up Supabase Database

1. Create a Supabase project at https://supabase.com
2. Run the migration:

```bash
# Copy the SQL from supabase/migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and execute
```

3. Create initial admin user:

```sql
INSERT INTO users (email, name, role, qbos_user_id)
VALUES ('admin@authentichadith.com', 'Admin User', 'admin', NULL);
```

### 4. Start QBos Backend

In your QBos repository:

```bash
cd QBos---Master-Founder-Repo/apps/proof-harness
npm run dev  # Starts on port 3000
```

Then start the Rob UI:

```bash
cd QBos---Master-Founder-Repo/apps/rob-ui
npm run dev  # Starts on port 3001
```

### 5. Start Authentic Hadith

```bash
npm run dev  # Starts on port 3002
```

Visit http://localhost:3002

## 📡 API Endpoints

All endpoints require headers:
- `x-user-id`: User UUID
- `x-user-role`: `admin` | `scholar` | `moderator` | `viewer`
- `x-session-id`: Session UUID (optional)

### Import Hadith
```bash
POST /api/hadith/import
Content-Type: application/json
x-user-id: <user-uuid>
x-user-role: scholar

{
  "text_arabic": "قال رسول الله...",
  "text_translation": "The Prophet said...",
  "source_id": "<source-uuid>",
  "chain_of_narration": "عن أبي هريرة...",
  "metadata": {}
}
```

### Verify Hadith
```bash
POST /api/hadith/verify
Content-Type: application/json
x-user-id: <user-uuid>
x-user-role: scholar

{
  "hadith_id": "<hadith-uuid>",
  "grade": "sahih",
  "methodology": "Analyzed chain of narration...",
  "reasoning": "All narrators are reliable..."
}
```

### Publish Hadith
```bash
POST /api/hadith/publish
Content-Type: application/json
x-user-id: <user-uuid>
x-user-role: moderator

{
  "hadith_id": "<hadith-uuid>"
}
```

### Search Hadiths
```bash
GET /api/hadith/search?query=prayer&grade=sahih&limit=20
```

### Delete Hadith
```bash
DELETE /api/hadith/<hadith-uuid>
Content-Type: application/json
x-user-id: <user-uuid>
x-user-role: admin

{
  "reason": "Duplicate entry found with stronger chain of narration"
}
```

## 🔐 Constitutional Rules

### Import Gate
- **Who**: Scholars, Moderators, Admins
- **Requirements**: Valid source_id
- **Receipt**: Import proof with timestamp

### Verification Gate
- **Who**: Scholars, Admins
- **Requirements**: Scholar credentials
- **Receipt**: Verification proof with methodology

### Publishing Gate
- **Who**: Moderators, Admins
- **Requirements**: Minimum 2 verifications (sahih or hasan)
- **Receipt**: Publication proof with verification count

### Deletion Gate
- **Who**: Admins only
- **Requirements**: Written justification (min 20 characters)
- **Receipt**: Deletion proof with full hadith snapshot

## 🧪 Testing Gates

### Test Import
```bash
curl -X POST http://localhost:3002/api/hadith/import \
  -H "Content-Type: application/json" \
  -H "x-user-id: <your-user-id>" \
  -H "x-user-role: scholar" \
  -d '{
    "text_arabic": "Test hadith text",
    "source_id": "<source-id>"
  }'
```

### Test Health
```bash
curl http://localhost:3002/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T...",
  "services": {
    "qbos": true,
    "supabase": true
  }
}
```

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── hadith/
│   │   │   │   ├── import/route.ts       # Import gate
│   │   │   │   ├── verify/route.ts       # Verification gate
│   │   │   │   ├── publish/route.ts      # Publishing gate
│   │   │   │   ├── search/route.ts       # Search (public)
│   │   │   │   └── [id]/route.ts         # Delete gate
│   │   │   └── health/route.ts           # Health check
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Homepage
│   │   └── globals.css                   # Tailwind styles
│   ├── lib/
│   │   ├── qbos/
│   │   │   └── truth.ts                  # QBos gateway integration
│   │   └── supabase/
│   │       └── client.ts                 # Supabase client
│   └── types/
│       └── hadith.ts                     # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # Database schema
├── proof/                                # Receipt storage
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Next Steps

1. **Add More Sources**: Insert Bukhari, Muslim, etc. into `sources` table
2. **Create Scholars**: Add users with `scholar` role
3. **Import Hadiths**: Use `/api/hadith/import`
4. **Verify**: Get 2+ scholars to verify each hadith
5. **Publish**: Moderators publish verified hadiths
6. **View Proof**: Check `proof/` directory for receipts

## 🔧 Troubleshooting

### QBos Connection Failed
- Ensure QBos backend is running on port 3001
- Check `QBOS_BACKEND_URL` in `.env.local`
- Test: `curl http://localhost:3001/api/health`

### Supabase Errors
- Verify credentials in `.env.local`
- Check RLS policies are enabled
- Ensure migrations ran successfully

### Gate Rejections
- Check user role matches requirement
- Verify `x-user-role` header is correct
- For publishing, ensure 2+ verifications exist

## 📜 License

MIT

---

**Built with QBos TruthSerum™**  
*No claims without proof. No verification without receipts.*
