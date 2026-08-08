# Graph Report - .  (2026-08-08)

## Corpus Check
- Corpus is ~7,053 words - fits in a single context window. You may not need a graph.

## Summary
- 172 nodes · 184 edges · 33 communities (12 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `react` - 11 edges
4. `supabase` - 7 edges
5. `useAuth()` - 6 edges
6. `scripts` - 5 edges
7. `useMFA()` - 5 edges
8. `plugins` - 4 edges
9. `Login()` - 4 edges
10. `POS()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/hooks/useAuth.ts
- `AuthGuard()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/hooks/useAuth.ts
- `AuthGuard()` --calls--> `useMFA()`  [EXTRACTED]
  src/App.tsx → src/hooks/useMFA.ts
- `Login()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/Login.tsx → src/hooks/useAuth.ts
- `POS()` --calls--> `useCategories()`  [EXTRACTED]
  src/pages/POS.tsx → src/hooks/useCategories.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **posxcafe template stack** — readme_react, readme_vite, readme_typescript, readme_oxlint [EXTRACTED 1.00]
- **Social Platform Icons** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_github_icon, public_icons_x_icon, public_icons_social_icon [INFERRED 0.85]

## Communities (33 total, 21 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (14): react, App(), AppLayout(), AuthGuard(), Profile, useAuth(), Category, useCategories() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (21): otplib, oxlint, devDependencies, otplib, oxlint, playwright, @playwright/test, @types/node (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (17): lucide-react, dependencies, lucide-react, qrcode.react, react, react-dom, react-router-dom, recharts (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 7 - "Community 7"
Cohesion: 0.38
Nodes (5): PerformanceStat, SalesStat, useStatistics(), Dashboard(), recentTransactions

### Community 8 - "Community 8"
Cohesion: 0.50
Nodes (3): /src/main.tsx, posxcafe, div#root

## Knowledge Gaps
- **100 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 2` to `Community 5`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 4` to `Community 5`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `react` connect `Community 1` to `Community 6`, `Community 7`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._