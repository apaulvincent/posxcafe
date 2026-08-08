# Olive Grounds Coffee POS System

A fast, modern, and **offline-first** Point of Sale (POS) web application designed specifically for **Olive Grounds Coffee**. This system allows the cafe to seamlessly take orders, manage inventory, and process sales even when the internet goes down, automatically syncing data to the cloud once a connection is restored.

## 🌟 Key Features

- **Offline-First Architecture**: Powered by [Dexie.js](https://dexie.org/), the POS remains fully functional during internet outages. Orders and notifications are cached locally and synced to the cloud via background workers when reconnected.
- **Real-Time Syncing**: Uses [Supabase](https://supabase.com/) to synchronize products, categories, orders, and system notifications across multiple terminals in real-time.
- **Interactive POS Terminal**: An intuitive cart interface supporting quick category filtering, search, and dynamic discount calculations (percentage or flat amount).
- **Order Management & Notifications**: Track "Pending" and "Ready" orders with real-time push notifications for new online orders or ready statuses.
- **Hardware Integrations**: ESC/POS thermal receipt printer support built-in for fast kitchen and customer ticketing.
- **Admin Dashboard**: Full CRUD interface for managing the product catalog and categories.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- A Supabase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/posxcafe.git
   cd posxcafe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory based on the provided `.env` template:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Local Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Cloud Backend**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime)

## 📁 Repository Structure

- `/src/components` - Reusable UI components (buttons, dialogs, dropdowns).
- `/src/pages` - Main application views (POS, Dashboard, Admin panels).
- `/src/hooks` - Custom React hooks for data fetching and state management (`useOrders`, `useNotifications`, etc.).
- `/src/lib` - Core utility libraries (Dexie DB configuration, Supabase client, Sync engine).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the issues page if you want to contribute.

## 📄 License

This project is licensed under the MIT License.
