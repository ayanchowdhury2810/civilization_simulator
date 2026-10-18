# FalkorDB Queries and Graph Algorithms

This document describes the graph structures and query/algorithm patterns
that the simulator actually uses. FalkorDB is the persistent source of truth;
the backend issues Cypher through FalkorDB's `GRAPH.QUERY` command using the
shared `graphQuery` helper in `backend/src/config/falkordb.ts`.

## Graph model

```text
(World)-[:HAS_BUILDING]->(Building)          optional link from build actions
(Citizen)-[:LIVES_IN]->(Building)
(Citizen)-[:WORKS_AT]->(Building)
(buyer:Citizen)-[:TRADED_WITH]->(seller:Citizen)
(Citizen)-[:INVOLVED_IN]->(Event)
(Building)-[:INVOLVED_IN]->(Event)
(cause:Event)-[:CAUSED]->(effect:Event)
(Mayor)-[:CREATED]->(Policy)
(Policy)-[:TRIGGERED_BY]->(Event)
(Player)-[:APPROVED]->(Policy)
(Player)-[:BUILT]->(Building)
```

`HAS_BUILDING` and `BUILT` are written by the direct building action path. The
world hydrator currently finds buildings by matching `Building` nodes directly,
so these links are not required to display or simulate a building.

| Label | Important properties |
|-------|----------------------|
| `World` | `id` (main world is `main`), `tick`, `food`, `gold`, `population`, `foodPrice`, `demand`, `lastTickAt` |
| `Citizen` | `id`, `name`, `job`, `foodLevel`, `money`, `happiness`, `currentAction`, `x`, `y` |
| `Building` | `id`, `type` (`House`, `Farm`, `Market`), `capacity`, `workerCount`, `food`, `x`, `y` |
| `Event` | `id`, `type`, `message`, `timestamp`, `tick`, optional `citizenId`, `buildingId` |
| `Policy` | `id`, `name`, `action`, `reason`, `createdTick`, `createdAt`, `status`, optional `approvedTick` |
| `Mayor` | `id` (`mayor_1`), `role` |
| `Player` | `id` (`player_1`), `role` |

The application does not currently create schema constraints or indexes. IDs
are generated in application code and nodes are written with `MERGE`.

## How to run an inspection query

Connect to the same FalkorDB Cloud instance configured in `backend/.env`. You
can open its Browser from the FalkorDB Cloud console and run the queries below
there. The `GRAPH.QUERY` command-line example uses placeholders; replace them
with the host, port, and username from the instance's Connectivity settings
and authenticate when prompted:

```sh
redis-cli -h YOUR_HOST -p YOUR_PORT --user YOUR_USERNAME --askpass GRAPH.QUERY civilization "MATCH (w:World {id: 'main'}) RETURN w"
```

The `civilization` argument is the graph name used by this project. If you
changed `FALKORDB_GRAPH`, use that graph name instead. The backend's current
ioredis connector does not explicitly enable TLS; if your cloud instance
requires TLS, use the secure connection options in its Browser/CLI and add TLS
support to the backend connector before expecting the app to connect.

The examples below use `$parameter` notation for clarity. The application's
`graphQuery` helper serializes its parameter object into a FalkorDB `CYPHER`
parameter prefix before sending `GRAPH.QUERY`. In FalkorDB Browser, replace
the parameters with literal values or use FalkorDB's supported `CYPHER`
parameter form.

### Visualize citizen-connected graph data

To view citizen nodes, their directly connected nodes, and the relationships
between them in FalkorDB Browser, run:

~~~cypher
MATCH (u:Citizen)-[r]-(related)
RETURN u, r, related
LIMIT 5000
~~~

The undirected pattern follows relationships in either direction. The result
is limited to records connected directly to a Citizen; isolated nodes and
parts of the graph with no citizen connection are not included. LIMIT 5000
caps the number of matched rows returned.

## Core Cypher query patterns

### 1. Read the world summary

Used to determine whether the persistent world exists and to retrieve the
resource/market snapshot.

```cypher
MATCH (w:World {id: $id})
RETURN w.tick, w.food, w.gold, w.population,
       w.foodPrice, w.demand, w.lastTickAt
LIMIT 1
```

The application passes `id = "main"`.

### 2. Hydrate citizens with their home and workplace

Used when reconstructing a fresh temporary simulation model from the graph.

```cypher
MATCH (c:Citizen)
OPTIONAL MATCH (c)-[:LIVES_IN]->(home:Building)
OPTIONAL MATCH (c)-[:WORKS_AT]->(work:Building)
RETURN c.id, c.name, c.job,
       coalesce(c.foodLevel, c.hunger), c.money, c.happiness,
       c.currentAction, c.x, c.y, home.id, work.id
```

The hydrator rebuilds each building's worker list from the `WORKS_AT` matches.
The `coalesce` keeps compatibility with older records that used `hunger`.

### 3. Read buildings, events, policies, and trades

```cypher
MATCH (b:Building)
RETURN b.id, b.type, b.capacity, b.x, b.y, coalesce(b.food, 0)
```

```cypher
MATCH (e:Event)
RETURN e.id, e.type, e.message, e.timestamp, e.tick, e.citizenId, e.buildingId
ORDER BY e.tick DESC, e.timestamp DESC
LIMIT $limit
```

```cypher
MATCH (p:Policy)
RETURN p.id, p.name, p.action, p.reason, p.createdTick, p.createdAt,
       p.status, p.approvedTick
ORDER BY p.createdTick DESC, p.createdAt DESC
LIMIT $limit
```

```cypher
MATCH (buyer:Citizen)-[t:TRADED_WITH]->(seller:Citizen)
RETURN buyer.name, seller.name, t.item, t.count, t.lastPrice, t.lastTick
ORDER BY t.lastTick DESC
LIMIT $limit
```

The world hydrator also reads `CAUSED` and `TRIGGERED_BY` links so it can
restore event cause references and policy trigger references.

### 4. Find a citizen's home, work, and event history

```cypher
MATCH (c:Citizen {id: $citizenId})
OPTIONAL MATCH (c)-[:LIVES_IN]->(home:Building)
OPTIONAL MATCH (c)-[:WORKS_AT]->(work:Building)
RETURN c, home, work
```

```cypher
MATCH (c:Citizen {id: $citizenId})-[:INVOLVED_IN]->(e:Event)
RETURN e.id, e.type, e.message, e.tick, e.timestamp
ORDER BY e.tick DESC
LIMIT 50
```

The first pattern reflects the links used by citizen-detail and chat retrieval.
The second is a useful graph exploration query; the current chat also retrieves
events globally and filters them in application code.

### 5. Trace recorded event causes

```cypher
MATCH (cause:Event)-[:CAUSED]->(effect:Event)
RETURN cause.id, cause.type, cause.message,
       effect.id, effect.type, effect.message, effect.tick
ORDER BY effect.tick DESC
LIMIT $limit
```

Only explicitly stored `CAUSED` edges appear in this query. The application
also has a heuristic that proposes a cause link when an event is created; see
the event-cause algorithm below. These links are rule-based associations, not
proof that the earlier event scientifically caused the later event.

### 6. Inspect a Mayor policy and its connected records

```cypher
MATCH (p:Policy {id: $policyId})-[r]-(n)
RETURN p.id, type(r), n.id, labels(n)
LIMIT 40
```

The investigation endpoint combines policy neighbors with current world
metrics, recent events, and event-related `CAUSED`/`INVOLVED_IN` links:

```cypher
MATCH (a)-[r:CAUSED|INVOLVED_IN]-(b)
WHERE (a:Event OR b:Event)
RETURN a.id, labels(a), type(r), b.id, labels(b)
LIMIT 60
```

The service considers up to 40 recent events, 40 policy relationships, and 60
event relationships, then selects evidence relevant to the current finding.
It labels each item as a current metric, persisted FalkorDB record, or
rule-based inference and reports evidence limitations.

### 7. Follow the Historian's graph retrieval

For each question, the chat repository fetches these graph slices in parallel:

```cypher
MATCH (w:World {id: $id})
RETURN w.tick, w.food, w.gold, w.population, w.foodPrice, w.demand, w.lastTickAt
```

```cypher
MATCH (cause:Event)-[:CAUSED]->(effect:Event)
RETURN cause.type, cause.message, effect.type, effect.message, effect.tick
ORDER BY effect.tick DESC
LIMIT $limit
```

```cypher
MATCH (c:Citizen)
RETURN count(c), avg(c.happiness), avg(coalesce(c.foodLevel, c.hunger))
```

```cypher
MATCH (c:Citizen)
OPTIONAL MATCH (c)-[:LIVES_IN]->(home:Building)
OPTIONAL MATCH (c)-[:WORKS_AT]->(work:Building)
RETURN c.id, c.name, c.job, home.id, home.type, work.id, work.type
LIMIT $limit
```

It also retrieves recent events and trades. Keyword matching in TypeScript
selects relevant event types and citizen names; the resulting context is sent
to Gemini when configured. If Gemini is unavailable, a deterministic answer
is assembled directly from the same graph context. There is no alternate
in-memory factual cache.

## Graph and application algorithms

The project does not call a separate graph-algorithm package for PageRank,
community detection, shortest paths, or centrality. Its graph reasoning uses
Cypher traversals and application-side rules over the returned records.

### Event-cause linking

`backend/src/simulation/eventGraph.ts` defines a mapping from each event type
to event types that may explain it. When a new event is added, `inferCause`
examines at most the 20 most recent events, newest first, and chooses the
first event whose type is in that allowlist. It stores the selected event id
as `causedByEventId`; the event repository persists that as
`(cause)-[:CAUSED]->(effect)`. If no candidate matches, the event has no cause
link.

### Mayor recommendation rules

`backend/src/simulation/mayor.ts` evaluates a fresh state loaded from
FalkorDB. It applies the first matching rule:

1. If population is nonzero and food per citizen is below `1.5`, recommend a
   farm.
2. Otherwise, if population has reached housing capacity, recommend a house.
3. Otherwise, if average happiness is below `50`, recommend a farm.
4. Otherwise recommend no action.

The Mayor is rule-based; it does not use Gemini to make the recommendation.
The separate Mayor investigation explains the rule's result with current
measurements and graph evidence.

### Historian retrieval and response

1. Read the saved world snapshot, latest events, recorded cause links, trades,
   citizen statistics, and citizen home/work relationships from FalkorDB.
2. Match question keywords to relevant event categories and match citizen
   names when places are requested.
3. If Gemini is configured, ask it to phrase an answer using only this graph
   context. If the request fails or Gemini is not configured, generate a
   deterministic answer from the context.
4. If the graph context is insufficient, the response says so instead of
   consulting a second factual store.

### Simulation tick

The tick engine is implemented in TypeScript and writes its resulting state
back to FalkorDB:

1. Increase the tick counter; produce farm food with up to 10% random yield
   variation and update demand/food price from food per citizen.
2. Reduce citizen food level. Citizens buy when hungry and able to pay, work
   when below the money threshold, or wander otherwise. Purchases update food,
   money, happiness, shop stock, tax, and trade history.
3. Collect town tax, attempt a resident arrival when housing is available,
   resolve job seeking/switching, and possibly generate minor events.
4. Update population and timestamp, then persist the snapshot and new graph
   events/relationships.

The detailed constants live in `backend/src/common/constants/index.ts`;
the citizen decision thresholds are in `backend/src/simulation/citizenAi.ts`.

## Write patterns and source of truth

- `MERGE` by application id creates or updates `World`, `Citizen`, `Building`,
  `Event`, `Policy`, `Mayor`, and `Player` records.
- `LIVES_IN` and `WORKS_AT` links are rebuilt from the hydrated state on
  world persistence. Trades, event links, policy links, approvals, and
  construction links are persisted as their corresponding operations happen.
- World reads query FalkorDB on each request. The temporary `WorldState` is
  not a shared response cache.
- External graph edits are visible on a later successful frontend poll. An
  edit to records that the simulation later overwrites may be replaced by the
  next simulation mutation; FalkorDB remains authoritative at read time.

## Project entry points

- `backend/src/config/falkordb.ts` — `GRAPH.QUERY` connection and parameter
  serialization.
- `backend/src/modules/world/worldRepository.ts` — world persistence and
  hydration queries.
- `backend/src/modules/chat/chatRepository.ts` — Historian retrieval queries.
- `backend/src/modules/mayor/mayorInvestigationRepository.ts` — Mayor evidence
  queries.
- `backend/src/modules/events/eventsRepository.ts` — event, involvement, and
  cause-link persistence.
- `backend/src/simulation/eventGraph.ts` — event-cause inference rules.
- `backend/src/simulation/mayor.ts` — deterministic recommendation rules.
- `backend/src/simulation/tickEngine.ts` and `dynamicWorld.ts` — simulation
  algorithms.
