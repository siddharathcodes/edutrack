# EduTrack

A study-abroad / visa application tracker built for UniConsultants Alliance (UCA), replacing the
`Application_Details_2082_83.xlsx` workbook (22 country tabs, ~880 applicants).

- **Country = Department.** Admin sees every country. Each staff member only sees the countries
  they're assigned to.
- **One login per staff email.**
- Full CRUD on applications, bulk stage-move / bulk delete, search & filters (including date
  range, with quick presets like "last month"), and a role-aware print view.
- **Countries are database-driven** — Admin adds/removes countries from the UI; new countries
  appear everywhere (dropdowns, filters, staff assignment) automatically.
- **Notifications** — Admin can send manual notices (to everyone, a country, or one staff
  member); the system also auto-generates alerts for applications stuck at "Visa Lodged" too
  long, checked daily.
- **Daily reports & to-do** — a small floating widget (bottom-right corner) where staff write a
  quick "what I did today" note and manage a running to-do list through the day. Edits never
  erase the previous version — only Admin can see the edit history; staff only see the current
  text. Auto-pulled stats (applications added/updated) are attached automatically.
- **AI analysis** — an on-demand, AI-written strengths/weaknesses summary of the current
  dashboard view (filtered by country/date), powered by the Claude API.

```
edutrack/
├── backend/      Express + MongoDB API
├── frontend/     React (Vite) app
└── data/         Your original Excel workbook, used by the one-time migration script
```

---

## 1. Set up MongoDB Atlas (free tier)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a free **M0 cluster** (pick a region close to Nepal, e.g. Mumbai/Singapore).
3. Under **Database Access**, create a database user with a strong password.
4. Under **Network Access**, add `0.0.0.0/0` for now (allow from anywhere) — you can restrict
   this later once you know which IPs your backend host uses.
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/edutrack?retryWrites=true&w=majority
   ```

## 2. Backend setup (local, before deploying)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` → the connection string from step 1 (make sure the database name is `edutrack`)
- `JWT_SECRET` → generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` → the first Admin login you'll use
- `ANTHROPIC_API_KEY` → optional, only needed for the AI Analysis feature. Get one at
  https://console.anthropic.com. If you leave this blank, the rest of the app works fine — the
  Analysis panel just shows a message explaining it isn't configured yet.

Create the first Admin account:
```bash
npm run seed:users
```

Populate the country list (one-time, makes countries database-driven going forward):
```bash
node scripts/seedCountries.js
```

Import your existing ~880 applicants from the Excel file (one-time migration):
```bash
npm run migrate -- ../data/Application_Details_2082_83.xlsx
```
- This is safe to inspect before committing: it only **inserts** records. If you need to start
  over, re-run with `--wipe` to clear the Application collection first:
  ```bash
  npm run migrate -- ../data/Application_Details_2082_83.xlsx --wipe
  ```

Run the API locally:
```bash
npm run dev
```
It starts on `http://localhost:5000`. Visit `http://localhost:5000/api/health` to confirm it's up.

## 3. Frontend setup (local)

```bash
cd frontend
npm install
cp .env.example .env
```
`.env` should point at your local backend:
```
VITE_API_URL=http://localhost:5000/api
```

Run it:
```bash
npm run dev
```
Visit `http://localhost:5173` and log in with the Admin email/password you set in step 2.

---

## 4. Deploying for real (free tiers first)

### Backend → Render
1. Push this project to a GitHub repository.
2. On https://render.com, create a **New Web Service**, connect your repo, set the root directory
   to `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add the same environment variables from your `.env` file (MONGO_URI, JWT_SECRET,
   ANTHROPIC_API_KEY, etc.) in Render's **Environment** tab — never commit `.env` to git.
5. Set `CORS_ORIGIN` to your future Vercel URL (you can update this after the step below).
6. Once deployed, note your API URL, e.g. `https://edutrack-api.onrender.com`.

> Free Render web services spin down after inactivity and take ~30–60 seconds to wake up on the
> next request. Fine for an internal tool; if that delay becomes annoying, Render's cheapest paid
> tier removes it. The daily auto-alert cron job is also best-effort on the free tier for the same
> reason — it only fires if the service happens to be awake at 6am server time.

### Frontend → Vercel
1. On https://vercel.com, import the same GitHub repo, set the root directory to `frontend`.
2. Framework preset: Vite.
3. Add an environment variable `VITE_API_URL` = `https://edutrack-api.onrender.com/api`
   (your real Render URL + `/api`).
4. Deploy. Vercel gives you a URL like `https://edutrack.vercel.app`.
5. Go back to Render and set `CORS_ORIGIN` to that exact Vercel URL, then redeploy the backend.

### Run the migration against production
Once Atlas/Render are live, run the migration script once from your own machine, pointed at the
production `MONGO_URI`:
```bash
cd backend
MONGO_URI="<your atlas production URI>" node scripts/seedCountries.js
MONGO_URI="<your atlas production URI>" node scripts/migrate.js ../data/Application_Details_2082_83.xlsx
MONGO_URI="<your atlas production URI>" node scripts/seedUsers.js
```

### Later, if you outgrow the free tiers
Buy a domain, point it at Vercel (frontend) with a CNAME, and either keep Render or move the
backend to a small VPS. The codebase doesn't need to change — only environment variables and
DNS.

---

## On B2B vs. B2C

This codebase is built specifically for UCA's internal workflow (country = department, UCA's
exact pipeline stages). If the goal later is to **sell** this — either to other consultancies
(B2B) or directly to students tracking their own applications (B2C) — those are genuinely
different products, not a feature flag on this one:

- **B2B** (other consultancies) needs multi-tenant data isolation (each company's data fully
  separated), configurable pipeline stages per customer, billing, and a support/onboarding
  process.
- **B2C** (students) needs a single-applicant view, a completely different UI (no bulk actions,
  no staff management), and its own pricing model.

The recommended path: prove this out for UCA first, in real daily use. A working, in-production
tool is also the best evidence to show future B2B customers ("we built this, we use it daily").
Turning it into a sellable product is a separate, later project — happy to help design that when
you're ready, as its own codebase sharing some backend logic with this one rather than a single
app trying to be both.

## Notes on the data migration

- Most country sheets follow the same column layout, but a few don't (Australia and New Zealand
  have extra steps like CoE and portal submission; India has a "Commencement Date" column instead
  of visa lodgement). `backend/scripts/migrate.js` has an explicit per-sheet column map and was
  verified row-by-row against the real file before being included here — see the comments in that
  file if you ever add a 23rd country sheet with a different layout.
- "Referred by" is free text in the original sheet with many inconsistent spellings for the same
  ~80 or so agents. Nothing in the migration cleans this up automatically (doing so silently could
  misattribute a real agent) — once the data's in the UI, it's worth doing a manual cleanup pass
  country by country.

