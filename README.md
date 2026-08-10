# POSXCAFE POS System

A fast, modern, and **offline-first** Point of Sale (POS) Progressive Web Application (PWA). 

---

## 🎯 The Problem It Solves

Modern cafes and retail environments increasingly rely on cloud-based POS systems for centralized management, multi-device syncing, and real-time analytics. However, typical cloud POS systems become sluggish or fail completely when the internet connection drops or becomes unstable. This leads to lost sales, frustrated staff, and a poor customer experience.

**This system solves the "cloud dependency" problem by utilizing a local-first architecture.** It is designed to operate exactly like a traditional, locally-installed POS system when the network goes down, but retains all the benefits of a modern cloud application when connected. Staff can continue ringing up customers, modifying the cart, generating order numbers, and printing receipts without interruption, regardless of internet stability.

## 🌟 Core Capabilities

- **Resilient Offline Mode**: Continue taking orders, browsing the product catalog, and managing the cart even during complete internet outages. The app runs directly out of the browser's cache and local database.
- **Background Auto-Sync**: Once the connection is restored, the POS automatically queues and synchronizes local changes (like new offline orders or status updates) with the cloud backend without requiring manual intervention.
- **Real-Time Cross-Terminal Sync**: Uses WebSockets to synchronize live orders, product inventory updates, and system notifications across multiple iPads or POS terminals instantly.
- **Progressive Web App (PWA)**: Installable directly to the device (Windows, iPadOS, Android) to act like a native application with no browser UI, a dedicated icon, and isolated local storage.
- **Lightning-Fast POS Interface**: An intuitive cart interface supporting quick category filtering, global search, and dynamic discount calculations (percentage or flat amounts).
- **Thermal Receipt Printing**: Built-in integrations for ESC/POS thermal receipt printers for fast kitchen ticketing and customer receipts.
- **Admin & Catalog Management**: A comprehensive dashboard for managing the product catalog, categorized items, and sales statistics. Includes an embedded image cropper and media library for product photos.
- **Advanced Security**: Integrated Multi-Factor Authentication (MFA) and OTP support for secure staff and admin logins.

## 🛠️ Technicalities & Architecture

The application is built on a **Local-First, Sync-Later** architecture, bridging the gap between local speed and cloud redundancy.

- **Local Storage Layer (`Dexie.js`)**: Instead of fetching data directly from the cloud on every render, the app reads and writes exclusively to a local IndexedDB database using `Dexie.js`. This guarantees zero-latency UI updates and absolute offline capability.
- **Cloud Backend (`Supabase`)**: Serves as the central source of truth. It utilizes a PostgreSQL database for persistent storage and Supabase Realtime for WebSocket subscriptions.
- **Sync Engine**: A custom built synchronization engine (`src/lib/sync.ts`) listens to both Dexie observability hooks and Supabase Realtime channels. It manages local mutations, handles background queuing, and automatically pushes local changes to the cloud whenever `navigator.onLine` is true.
- **Service Workers**: Powered by `vite-plugin-pwa`, the application aggressively caches HTML, JS, CSS, and static assets so the app can be loaded entirely from disk on subsequent visits without hitting the network.
- **Frontend Stack**: Built with React 18, TypeScript, and Vite for lightning-fast HMR and optimized builds. The UI is constructed with Tailwind CSS and Radix UI (`shadcn/ui`) for accessible, unstyled components.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm
- A Supabase project (with PostgreSQL database setup)

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
   Create a `.env.local` file in the root directory based on the provided `.env.example` template:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the issues page if you want to contribute.
