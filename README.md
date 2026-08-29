# 🌍 Wanderlust Atlas — Travel Bucket List & Travelogue Platform

**Wanderlust Atlas** is a premium, full-stack travel bucket list platform built with **Angular 17+ (Standalone Components, Signals, Strict Mode)** and **Supabase (PostgreSQL, Auth, Storage, Realtime)**.

Designed with a sleek, dark-mode aesthetic (Deep Navy `#0a0f1e`, Coral `#ff6b4a`, Amber `#f5c842`), glassmorphism UI elements, canvas particle animations, and video hero backgrounds.

---

## ✨ Features Overview

### 🗺️ Traveler Features
- **Landing Page (`/`)**: Particle background canvas, video hero section, live stats counters, featured destinations, and step-by-step workflow guide.
- **Explore Destinations (`/explore`)**:
  - Filter by category (*Adventure, Beach, Culture, Nature, Road Trip, City, Spiritual, Wildlife*).
  - Filter by continent, difficulty (*Easy, Moderate, Challenging*), season, and budget.
  - Live debounced search across names, countries, and descriptions.
  - Switch between **Grid** and **List** view layouts.
- **Suggest a Destination (`/suggest-destination`)**: Logged-in travelers can suggest new places with photo uploads, descriptions, mood tags, budget, and travel logistics (nearest airport, currency/language, visa info, must-try activities).
- **Interactive Bucket List Modal**: Add or update bucket list items with status (*Dreaming, Planning, Booked, Completed*), target year/month, priority, estimated budget, personal notes, and custom travel tips.
- **My Bucket List & Profile (`/profile`)**: Manage your saved destinations, edit profile bio & avatar, filter by travel stage, and see automatic Supabase Realtime live sync.
- **Public Traveler Profiles (`/profile/:username`)**: Explore public travel bucket lists and follow/unfollow fellow travelers.
- **Travelogues & PDF Journals (`/travelogues`)**:
  - Browse travel stories and guides.
  - Read travelogues with embedded inline PDF previews (`<iframe>`) and a **⬇ Download PDF** button.
  - Write and publish your own travel stories (`/travelogues/new`) with cover photos, destination tags, and PDF file attachments.

### ⚙️ Admin Features (`/admin`)
- **Overview Dashboard**: Live statistics for total users, approved places, and pending submissions.
- **⏳ Pending Approvals Queue**: 1-click **Approve** (instantly publishes to the platform) or **Reject** user-submitted destination suggestions.
- **Destination CRUD**: Create, edit, feature (`✦ Featured`), or delete destinations with full image upload capabilities.
- **User Management**: View all registered users and toggle Admin privileges.

---

## 🛠️ Technology Stack

- **Frontend**: Angular 17+ (Standalone Components, RxJS, Angular Signals, SCSS, RxJS Animations)
- **Backend / Database**: Supabase (PostgreSQL 15+, Row Level Security, Auth, Realtime)
- **Storage**: Supabase Storage Buckets (`avatars`, `destination-images`, `travelogue-pdfs`)
- **Typography & Styling**: Playfair Display, Inter, Vanilla SCSS with CSS custom properties (no heavy UI framework dependencies)

---

## 📁 Repository Structure

```
Wanderlust_Atlas/
├── README.md
├── .gitignore
├── supabase/
│   ├── schema.sql            # Complete PostgreSQL DDL, RLS Policies & Triggers
│   └── seed.sql              # Initial seed data for destinations
├── wanderlust-atlas/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/   # Auth & Admin route guards
│   │   │   │   ├── models/   # Domain TypeScript types & interfaces
│   │   │   │   └── services/ # Supabase, Auth, Destinations, BucketList, Profile, Travelogue
│   │   │   ├── features/     # Feature components (Landing, Explore, Detail, Auth, Profile, Admin, Travelogues, Suggest)
│   │   │   └── shared/       # Navbar, Footer, DestinationCard, AddModal, Toast, Directives, Pipes
│   │   ├── assets/           # Video files, logos, images
│   │   ├── environments/     # Supabase project URL & API keys
│   │   ├── styles.scss       # Global CSS design tokens & utilities
│   │   └── index.html
│   └── angular.json
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Project**: Free tier at [supabase.com](https://supabase.com)

### 2. Database & Storage Initialization
1. Log into your **Supabase Dashboard**.
2. Open the **SQL Editor** → Click **+ New query**.
3. Copy the contents of [`supabase/schema.sql`](file:///c:/Users/abhis/Desktop/Wanderlust_Atlas/supabase/schema.sql) into the query window and click **Run**.
4. Create another new query, copy the contents of [`supabase/seed.sql`](file:///c:/Users/abhis/Desktop/Wanderlust_Atlas/supabase/seed.sql), and click **Run**.

### 3. Environment Configuration
Your personal API keys are safely ignored by `.gitignore`.

When cloning this project, copy `src/environments/environment.template.ts` to `environment.ts` and `environment.prod.ts` and paste your own Supabase project keys:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_SUPABASE_PROJECT_ID.supabase.co',
  supabaseKey: 'YOUR_SUPABASE_PUBLISHABLE_KEY',
};
```

Or copy `.env.example` to `.env`:
```env
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

### 4. Running Locally

```bash
cd wanderlust-atlas

# Install dependencies
npm install

# Start local server
npm run start
```

Access the application in your browser at: **`http://localhost:4200`**

---

## 🔒 Security & RLS Policies

- **Profiles**: Public profiles viewable by everyone; updates restricted strictly to the profile owner (`auth.uid() = id`).
- **Destinations**: Publicly visible only when `approval_status = 'approved'`. Submitters can view their own pending destinations. Full CRUD restricted to Admins.
- **Bucket List**: RLS ensures users can only insert, update, or delete their own items (`auth.uid() = user_id`).
- **Travelogues**: Published travelogues visible to everyone. Creation and deletion restricted to the author.

---

## 📜 License
This project is licensed under the MIT License.
