# Civilization simulator — Graph-Powered Town Simulation

Civilization simulator is a small, self-running town simulation. You play as
the King: build houses, farms, and markets; review the Mayor's suggestions; and
ask the Historian why things happened in the town.

FalkorDB is the application's primary database and source of truth. The
backend reads the graph for dashboard requests and simulation operations, then
writes changes back to it. The graph is used for world persistence, citizen and
building relationships, event history and cause links, Mayor policies, trade
records, and graph-grounded chat and investigations. This is core application
behavior, not a visualization layered over another database.

## Features

- A continuously ticking simulation with citizens, jobs, hunger, food
  production, trade, taxes, market prices, random events, and arrivals.
- A Phaser town map, resource dashboard, event feed, chat, and citizen/building
  details.
- A rule-based Mayor that proposes a farm, house, or no action. Players can
  approve a suggestion or build directly.
- A Mayor investigation that explains the current suggestion with current
  metrics and persisted FalkorDB evidence, and reports missing evidence and
  limitations.
- Historian answers grounded in live graph records. Gemini optionally
  summarizes the graph context; when Gemini is not configured or fails, the
  backend returns a factual answer built from that context.
- Generic user-facing API error messages.
- Live dashboard polling every 2.5 seconds. Each successful request reads the
  current graph; the backend does not keep a persistent in-memory world cache.

## Architecture

```text
Next.js frontend (localhost:3000)
        │ HTTP / JSON
        ▼
Express + TypeScript backend (localhost:3001)
        │ ioredis / GRAPH.QUERY
        ▼
FalkorDB Cloud graph (configured endpoint)
```

The frontend polls the world, events, and Mayor endpoints. For each read, the
backend hydrates a temporary `WorldState` from FalkorDB to shape the response.
For mutations and simulation ticks, it hydrates the current graph, applies the
operation to that temporary model, and persists the result. FalkorDB remains
authoritative; the in-memory model is an implementation detail of the
simulation engine. See [GRAPH_QUERIES_AND_ALGORITHMS.md](GRAPH_QUERIES_AND_ALGORITHMS.md)
for the schema, Cypher patterns, and algorithms.

### Graph data model

| Node | Main properties |
|------|-----------------|
| `World` | `id`, `tick`, `food`, `gold`, `population`, `foodPrice`, `demand`, `lastTickAt` |
| `Citizen` | `id`, `name`, `job`, `foodLevel`, `money`, `happiness`, `currentAction`, `x`, `y` |
| `Building` | `id`, `type`, `capacity`, `workerCount`, `food`, `x`, `y` |
| `Event` | `id`, `type`, `message`, `timestamp`, `tick`, optional `citizenId`, `buildingId` |
| `Policy` | `id`, `name`, `action`, `reason`, `createdTick`, `createdAt`, `status`, `approvedTick` |
| `Mayor` | `id`, `role` |
| `Player` | `id`, `role` |

Relationships include `LIVES_IN`, `WORKS_AT`, `TRADED_WITH`, `INVOLVED_IN`,
`CAUSED`, `CREATED`, `TRIGGERED_BY`, `APPROVED`, `BUILT`, and
`HAS_BUILDING`. See the graph reference for the direction and use of each
relationship. For a quick visual view of citizen-connected graph data in
FalkorDB Browser, use the inspection query in
[GRAPH_QUERIES_AND_ALGORITHMS.md](GRAPH_QUERIES_AND_ALGORITHMS.md).

## Requirements

- Node.js 20.9 or later. Next.js 16 requires Node.js 20.9 or later ([official
  Next.js requirements](https://nextjs.org/docs/app/getting-started/installation)).
- npm.
- An active FalkorDB Cloud instance and its connection details. Find the
  hostname, port, username, and password in the instance's Connectivity
  settings ([FalkorDB connection guide](https://www.falkordb.com/blog/graph-database-deployment-guide/)).
- Optional: a Gemini API key. The app works without one; Historian answers
  fall back to graph-derived text.

## Run locally

FalkorDB is hosted in the cloud, so you do not need to install or start a local
database. Run the backend and frontend in two separate terminals on your
computer; the backend connects to your cloud instance.

### 1. Configure the backend's cloud connection

Create `backend/.env`. Copy the connection values for your existing cloud
instance into `FALKORDB_HOST`, `FALKORDB_PORT`, `FALKORDB_USERNAME`, and
`FALKORDB_PASSWORD`. Use the hostname only in `FALKORDB_HOST` (no `redis://`
or `rediss://` prefix), the numeric port in `FALKORDB_PORT`, and the graph
name used by this application in `FALKORDB_GRAPH` (defaults to `civilization`).

```dotenv
NODE_ENV=development
PORT=3001

FALKORDB_HOST=your-cloud-instance-hostname
FALKORDB_PORT=6379
FALKORDB_USERNAME=your-cloud-username
FALKORDB_PASSWORD=your-cloud-password
FALKORDB_GRAPH=civilization

TICK_INTERVAL_MS=5000
AUTO_TICK=true
MAYOR_INTERVAL_MS=120000
AUTO_MAYOR=true

# Optional. Leave empty to use graph-based Historian answers without Gemini.
GEMINI_API_KEY=
LLM_MODEL=gemini-2.0-flash
LLM_TIMEOUT_MS=15000
```

Do not commit `backend/.env` or share its credentials. Confirm that the cloud
instance is running and reachable from your network. The current backend
connector (`backend/src/config/falkordb.ts`) uses ioredis with host, port,
username, and password settings and does not explicitly enable TLS. If the
connection details for your instance require a TLS-only connection, the
connector must be configured for TLS as well; environment values alone cannot
enable it.

### 2. Start the backend

From the repository root, open a terminal and run:

```sh
cd backend
npm ci
npm run dev
```

The backend listens on [http://localhost:3001](http://localhost:3001). Check
[http://localhost:3001/health](http://localhost:3001/health) for a health
response. FalkorDB Cloud must be reachable before the backend starts; the
backend exits if its startup connection check fails.

On first startup, if the graph has no `World {id: "main"}` record, the backend
creates and saves a seeded town. If the graph is later emptied while the
server is running, a subsequent request that loads world state seeds a new
town. This does not restore data that was deleted.

### 3. Start the frontend

In a second terminal, from the repository root:

```sh
cd civilization_sim_frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend defaults to
the API at `http://localhost:3001`. To use a different backend address, create
`civilization_sim_frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Restart the frontend after changing `.env.local`.

## Useful commands

```sh
# Backend production compile
cd backend
npm run build

# Frontend lint
cd civilization_sim_frontend
npm run lint

# Frontend production build
npm run build
```

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Backend health check. |
| `GET` | `/api/world` | Current world snapshot. |
| `POST` | `/api/tick` | Run one simulation tick. |
| `GET` | `/api/citizen/:id` | Citizen details and home/work links. |
| `GET` | `/api/building` | List buildings. |
| `POST` | `/api/building` | Build a House, Farm, or Market. `/api/build` is an alias. |
| `GET` | `/api/events?limit=50` | Recent events. |
| `GET` | `/api/mayor` | Active Mayor suggestion and recent policies. |
| `GET` | `/api/mayor/investigation` | Graph-grounded investigation of the active suggestion. |
| `POST` | `/api/mayor/approve` | Approve a Mayor suggestion. |
| `POST` | `/api/chat` | Ask the Historian about the town. |

Successful responses use `{ "success": true, "data": ... }`. Failed
responses use a generic error message with an error code.

## Troubleshooting

- **Backend exits or reports FalkorDB is unavailable:** confirm the cloud
  instance is running and that the host, port, username, password, and graph
  name in `backend/.env` match its Connectivity settings. Check whether the
  instance requires TLS; this repository's current connector does not enable
  TLS explicitly.
- **Frontend says it cannot connect:** check that the backend health URL works
  and that `NEXT_PUBLIC_API_URL` points to the backend.
- **Unexpected initial town appears after clearing the graph:** the backend
  seeds a fresh starter world when the `World` record is missing. The seed is
  initialization behavior, not a cache restore.
- **Historian still works without Gemini:** this is expected; the graph-based
  answer path is the fallback.

## Hackathon submission notes

The [Graph Hacks rules](https://www.wemakedevs.org/hackathons/falkordb/rules)
require FalkorDB to be the primary graph database, a README with setup and data
model, documentation of the Cypher queries or graph algorithms used, a demo
video, and the submitted track name. This repository now has the local setup
and graph reference documents; add the demo link and confirm the track below
before submission.

- **Suggested track:** Agents That Act on Connected Data. Confirm or change
  this to match the team’s submission.
- **Demo video:** add the public link here when available.
- **Repository:** make the source repository public for submission.
- **AI assistance disclosure:** AI coding assistants were used to help with
  implementation and documentation. Team members should review the code and be
  ready to explain the graph model, queries, architecture, and technical
  decisions.

## Project structure

```text
backend/
  src/config/       Environment and FalkorDB connection
  src/modules/      World, simulation APIs, Mayor, chat, events
  src/simulation/   Tick, citizen, market, event, and Mayor rules
civilization_sim_frontend/
  app/              Next.js app shell
  components/       Dashboard panels and interactions
  lib/              API client, polling hook, labels, Phaser map
GRAPH_QUERIES_AND_ALGORITHMS.md
  FalkorDB schema, Cypher patterns, and application algorithms
```
