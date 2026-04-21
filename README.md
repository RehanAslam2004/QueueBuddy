# 🕹️ QueueBuddy

> A modern, real-time gaming lobby and raid management system built for high-performance coordination.

---

### 📖 Overview

**QueueBuddy** is a purpose-built platform designed for gaming communities, streamers, and competitive organizers. It streamlines the entire lifecycle of a gaming session—from scheduling massive raids to managing active gameplay lobbies—all within a unified, tactical interface.

Built with a focus on low-latency synchronization and visual clarity, QueueBuddy ensures that teams are organized and ready to launch without the friction of manual coordination.

---

### ✨ Features

*   📡 **Live Lobby Management** — Real-time tracking of player counts, server status, and tactical connection info.
*   ⚔️ **Raid-to-Lobby Conversion** — Single-click workflow to launch scheduled raids into active, tracked lobbies.
*   🏷️ **Tactical Tagging** — Advanced filtering with support for custom tags like `#PvP`, `#EU`, or `#Hardcore`.
*   🛡️ **Admin Command Center** — Oversight dashboard for server moderation, session termination, and live stats.
*   🌑 **Voxel Tactical UI** — High-density, dark-mode specialized design for maximum information visibility.

---

### 🛠️ Tech Stack

| Layer      | Technology                                    |
| :--------- | :-------------------------------------------- |
| **Core**   | Next.js (App Router), React 19, TypeScript   |
| **Logic**  | JavaScript (ES6+), Zustand (State)           |
| **Styling**| Tailwind CSS 4.0, Lucide React (Icons)       |
| **Backend**| Supabase (Auth, Realtime, Database)          |
| **DB Core**| PostgreSQL (Supabase)                        |
| **Scripts**| Node.js, `pg` (PostgreSQL Client)            |

---

### 🚀 Getting Started

#### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   A [Supabase](https://supabase.com/) project with PostgreSQL.

#### Installation
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/RehanAslam2004/QueueBuddy.git
    cd QueueBuddy
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    DATABASE_URL=your_postgresql_connection_string
    ```

4.  **Initialize Database**
    ```bash
    node db-setup.js
    node alter-db-servers.js
    ```

#### Access the App
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 📁 Project Structure

```text
QueueBuddy/
├── app/                # Next.js App Router (Pages & Routes)
├── components/         # Tactical UI Components
├── hooks/              # Custom React Hooks
├── lib/                # Supabase Client & Shared Utilities
├── public/             # Static Assets & Icons
├── scratch/            # Development Analytics & Testing
├── .env.local          # Local Environment Secrets (Excluded)
├── db-setup.js         # Core Database Initialization
├── alter-db-servers.js # Server Schema Migration
└── package.json        # Project Metadata & Dependencies
```

---

### 🎯 Who Is This For?

*   **Clan Organizers** managing multiple raids and game servers.
*   **Streamers** looking for a clean way to organize community play-alongs.
*   **Developers** building or learning real-time synchronization systems.
*   **Gaming Communities** needing a centralized "Command Center" for sessions.

---

### ⚠️ Disclaimer

This application is under active development. Ensure you have properly configured your Supabase security policies (RLS) before deploying to a public-facing production environment.

---

### 📄 License

Distributed under the **MIT License**. This means you are free to use, modify, and contribute to this project as long as you provide attribution to the original author.

---

### 👤 Author

**Muhammad Rehan**
*   GitHub: [@RehanAslam2004](https://github.com/RehanAslam2004)
