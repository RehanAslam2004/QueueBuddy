# QueueBuddy

QueueBuddy is an open-source, real-time multiplayer server browser and operational node coordinator with a tactical, voxel-themed design. It allows players to discover active lobbies, coordinate raids, and find teammates for Minecraft (and other games) instantly, without requiring a prolonged setup or login process.

## Features

- **Real-Time Tactical Feeds:** Live, interactive global chat and event logs built on Supabase Realtime subscriptions.
- **Server Monitoring:** Live ping and player count polling via the `mcsrvstat.us` API for seamless Minecraft instance observability.
- **Voxel-Themed UI:** Features a meticulously crafted, pixel-perfect design system inspired by Minecraft and command-line terminals using Tailwind CSS v4.
- **Minecraft Web Audio:** Authentic, immersive audio feedback loop integrated via the Web Audio API for UI interactions (Clicks, XP Dings, Alerts).
- **Raid Coordination:** Form squads with defined roles (Tank, DPS, Scout, Healer), setup operational notes, and seamlessly convert squad sessions directly into live servers.
- **Authentic Player Skins:** Dynamic extraction of Minecraft player avatars via `mc-heads.net` integration.

## Technology Stack

- **Framework:** Next.js (App Router, Server Actions, Client Components)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Database & Real-time Connectivity:** Supabase (PostgreSQL)
- **Typography:** Authentic Minecraft Font & Google Fonts (`Space Grotesk`, `Work Sans`)
- **Icons:** Google Material Symbols Outlined

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- A Supabase Project (Postgres Database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RehanAslam2004/QueueBuddy.git
   cd QueueBuddy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the environment:**
   Create a `.env.local` file in the root directory by renaming `.env.example` (if one exists) and populate it with your Supabase credentials. At a minimum, you'll need:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Note:** Your database instance should feature tables for `sessions`, `servers`, `session_players`, `server_players`, and `events`.

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Navigate to `localhost:3000` to access the application.

## Open Source Declaration

QueueBuddy is fully open-source. Anyone is encouraged to contribute to the codebase to improve performance, add new integrations, or polish the user experience. By submitting code to the repository, you agree to license your contributions under the project's MIT License.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
