import { isLlmConfigured, generateText } from "../../common/llm/gemini.js";
import { worldState } from "../../simulation/worldState.js";
import {
  fetchCauseChains,
  fetchCitizenPlaces,
  fetchCitizenStats,
  fetchRecentEvents,
  fetchRecentTrades,
  fetchWorldNode,
} from "./chatRepository.js";

export interface RetrievedEvent {
  id: string;
  type: string;
  message: string;
  tick: number;
}

export interface CauseChain {
  causeType: string;
  causeMessage: string;
  effectType: string;
  effectMessage: string;
  tick: number;
}

export interface TradeSummary {
  buyer: string;
  seller: string;
  item: string;
  count: number;
  lastPrice: number;
  tick: number;
}

export interface CitizenPlaceSummary {
  id: string;
  name: string;
  job: string;
  home: string | null;
  work: string | null;
}

export interface RetrievedContext {
  origin: "graph" | "memory";
  tick: number;
  food: number;
  gold: number;
  population: number;
  foodPrice: number;
  demand: number;
  stats: { population: number; avgHappiness: number; avgFoodLevel: number };
  events: RetrievedEvent[];
  causeChains: CauseChain[];
  trades: TradeSummary[];
  places: CitizenPlaceSummary[];
}

export interface ChatAnswer {
  question: string;
  answer: string;
  source: "llm" | "graph";
  context: RetrievedContext;
}

const TOPIC_KEYWORDS: { keywords: string[]; eventTypes: string[] }[] = [
  {
    keywords: [
      "food",
      "price",
      "expensive",
      "hunger",
      "hungry",
      "starve",
      "starving",
      "shortage",
      "harvest",
      "yield",
      "crop",
    ],
    eventTypes: [
      "FoodShortage",
      "FarmYieldLow",
      "FoodBought",
      "Trade",
      "MarketBoom",
    ],
  },
  {
    keywords: ["happiness", "happy", "unhappy", "sad", "sick", "morale"],
    eventTypes: ["CitizenSick", "FoodShortage", "WorkerLeftJob"],
  },
  {
    keywords: [
      "population",
      "people",
      "citizen",
      "grow",
      "arriv",
      "family",
      "housing",
      "house",
    ],
    eventTypes: ["CitizenArrived", "BuildingBuilt"],
  },
  {
    keywords: ["job", "worker", "employ", "merchant", "farmer", "builder"],
    eventTypes: ["JobChanged", "WorkerLeftJob", "CitizenArrived"],
  },
  {
    keywords: ["market", "trade", "boom", "sell", "buy", "merchant"],
    eventTypes: ["Trade", "MarketBoom", "FoodBought"],
  },
  {
    keywords: ["build", "built", "king", "player", "governor", "policy"],
    eventTypes: ["BuildingBuilt"],
  },
];

const SYSTEM_PROMPT = [
  "You are the Historian of an AI civilization simulator.",
  "Answer the user's question using ONLY the provided graph context.",
  "Explain cause and effect chains where relevant, for example:",
  "food shortage -> higher prices -> hungry citizens -> lower happiness.",
  "Cite concrete event types, citizen and building ids, tick numbers, and trade relationships from the context.",
  "The context lists citizens with where they live (LIVES_IN) and work (WORKS_AT); use it to answer questions about a person's home or workplace.",
  "If the context does not contain enough information, say so plainly.",
  "Keep the answer under 150 words.",
].join(" ");

export async function answerQuestion(question: string): Promise<ChatAnswer> {
  const context = await retrieveContext(question);

  if (isLlmConfigured()) {
    try {
      const answer = await generateText(
        SYSTEM_PROMPT,
        buildPrompt(question, context),
      );
      return { question, answer, source: "llm", context };
    } catch (error) {
      console.warn(
        `[chat] LLM answer failed, using graph fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return {
    question,
    answer: buildFallbackAnswer(context),
    source: "graph",
    context,
  };
}

async function retrieveContext(question: string): Promise<RetrievedContext> {
  try {
    const fromGraph = await retrieveFromGraph(question);
    if (fromGraph) return fromGraph;
  } catch (error) {
    console.warn(
      `[chat] graph retrieval failed, using in-memory fallback: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return retrieveFromMemory(question);
}

async function retrieveFromGraph(
  question: string,
): Promise<RetrievedContext | null> {
  const [world, events, chains, trades, stats, places] = await Promise.all([
    fetchWorldNode(),
    fetchRecentEvents(80),
    fetchCauseChains(40),
    fetchRecentTrades(25),
    fetchCitizenStats(),
    fetchCitizenPlaces(200),
  ]);

  if (!world && events.length === 0) return null;

  const eventList: RetrievedEvent[] = events.map((event) => ({
    id: event.id,
    type: event.type,
    message: event.message,
    tick: event.tick,
  }));

  return {
    origin: "graph",
    tick: world?.tick ?? 0,
    food: world?.food ?? 0,
    gold: world?.gold ?? 0,
    population: world?.population ?? stats?.population ?? 0,
    foodPrice: world?.foodPrice ?? 0,
    demand: world?.demand ?? 0,
    stats: {
      population: stats?.population ?? 0,
      avgHappiness: Math.round(stats?.avgHappiness ?? 0),
      avgFoodLevel: Math.round(stats?.avgFoodLevel ?? 0),
    },
    events: filterEvents(eventList, matchTopics(question)),
    causeChains: chains.map((chain) => ({
      causeType: chain.causeType,
      causeMessage: chain.causeMessage,
      effectType: chain.effectType,
      effectMessage: chain.effectMessage,
      tick: chain.effectTick,
    })),
    trades: trades.map((trade) => ({
      buyer: trade.buyerName,
      seller: trade.sellerName,
      item: trade.item,
      count: trade.count,
      lastPrice: trade.lastPrice,
      tick: trade.lastTick,
    })),
    places: selectPlaces(
      places.map((place) => ({
        id: place.id,
        name: place.name,
        job: place.job,
        home: placeLabel(place.homeId, place.homeType),
        work: placeLabel(place.workId, place.workType),
      })),
      question,
    ),
  };
}

function retrieveFromMemory(question: string): RetrievedContext {
  const events: RetrievedEvent[] = [...worldState.events]
    .reverse()
    .map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      tick: event.tick,
    }));

  const causeChains: CauseChain[] = [];
  for (const event of worldState.events) {
    if (!event.causedByEventId) continue;
    const cause = worldState.getEventById(event.causedByEventId);
    if (!cause) continue;
    causeChains.push({
      causeType: cause.type,
      causeMessage: cause.message,
      effectType: event.type,
      effectMessage: event.message,
      tick: event.tick,
    });
  }
  causeChains.reverse();

  return {
    origin: "memory",
    tick: worldState.tick,
    food: worldState.resources.food,
    gold: worldState.resources.gold,
    population: worldState.resources.population,
    foodPrice: worldState.market.foodPrice,
    demand: worldState.market.demand,
    stats: summarizeCitizens(),
    events: filterEvents(events, matchTopics(question)),
    causeChains,
    trades: worldState.recentTrades(25).map((trade) => ({
      buyer: worldState.citizens.get(trade.buyerId)?.name ?? trade.buyerId,
      seller: worldState.citizens.get(trade.sellerId)?.name ?? trade.sellerId,
      item: trade.item,
      count: 1,
      lastPrice: trade.price,
      tick: trade.tick,
    })),
    places: selectPlaces(
      [...worldState.citizens.values()].map((citizen) => {
        const home = citizen.livesInBuildingId
          ? worldState.buildings.get(citizen.livesInBuildingId)
          : null;
        const work = citizen.worksAtBuildingId
          ? worldState.buildings.get(citizen.worksAtBuildingId)
          : null;
        return {
          id: citizen.id,
          name: citizen.name,
          job: citizen.job,
          home: home ? placeLabel(home.id, home.type) : null,
          work: work ? placeLabel(work.id, work.type) : null,
        };
      }),
      question,
    ),
  };
}

function placeLabel(id: string | null, type: string | null): string | null {
  if (!id || !type) return null;
  const match = id.match(/_(\d+)$/);
  return match ? `${type} ${match[1]}` : `${type} ${id}`;
}

function selectPlaces(
  places: CitizenPlaceSummary[],
  question: string,
): CitizenPlaceSummary[] {
  const query = question.toLowerCase();
  const matched = places.filter((place) => {
    const name = place.name.toLowerCase();
    if (query.includes(name)) return true;
    const first = name.split(/\s+/)[0];
    return first.length > 2 && query.includes(first);
  });
  return matched.length > 0 ? matched.slice(0, 40) : places.slice(0, 25);
}

function summarizeCitizens(): RetrievedContext["stats"] {
  const citizens = [...worldState.citizens.values()];
  const population = citizens.length;
  if (population === 0) {
    return { population, avgHappiness: 0, avgFoodLevel: 0 };
  }
  const happinessTotal = citizens.reduce(
    (total, citizen) => total + citizen.happiness,
    0,
  );
  const foodLevelTotal = citizens.reduce(
    (total, citizen) => total + citizen.foodLevel,
    0,
  );
  return {
    population,
    avgHappiness: Math.round(happinessTotal / population),
    avgFoodLevel: Math.round(foodLevelTotal / population),
  };
}

function matchTopics(question: string): string[] {
  const query = question.toLowerCase();
  const types = new Set<string>();
  for (const topic of TOPIC_KEYWORDS) {
    if (topic.keywords.some((keyword) => query.includes(keyword))) {
      for (const type of topic.eventTypes) types.add(type);
    }
  }
  return [...types];
}

function filterEvents(
  events: RetrievedEvent[],
  types: string[],
): RetrievedEvent[] {
  if (types.length === 0) return events.slice(0, 25);
  const matched = events
    .filter((event) => types.includes(event.type))
    .slice(0, 30);
  return matched.length > 0 ? matched : events.slice(0, 20);
}

function buildPrompt(question: string, context: RetrievedContext): string {
  return `Question: ${question}\n\nGraph context (source: ${context.origin}):\n${buildContextText(context)}`;
}

function buildContextText(context: RetrievedContext): string {
  const lines: string[] = [];
  lines.push(
    `World: tick=${context.tick}, food=${context.food}, gold=${context.gold}, ` +
      `population=${context.population}, foodPrice=${context.foodPrice}, demand=${context.demand}`,
  );
  lines.push(
    `Citizens: population=${context.stats.population}, ` +
      `avgHappiness=${context.stats.avgHappiness}, avgFoodLevel=${context.stats.avgFoodLevel}`,
  );

  lines.push("Recent key events (newest first):");
  if (context.events.length === 0) lines.push("- none");
  for (const event of context.events.slice(0, 20)) {
    lines.push(`- [tick ${event.tick}] ${event.type}: ${event.message}`);
  }

  lines.push("Cause chains (cause -> effect):");
  if (context.causeChains.length === 0) lines.push("- none");
  for (const chain of context.causeChains.slice(0, 12)) {
    lines.push(
      `- ${chain.causeType} "${chain.causeMessage}" -> ${chain.effectType} "${chain.effectMessage}" (tick ${chain.tick})`,
    );
  }

  lines.push("Trade relationships:");
  if (context.trades.length === 0) lines.push("- none");
  for (const trade of context.trades.slice(0, 10)) {
    lines.push(
      `- ${trade.buyer} -> ${trade.seller}: ${trade.item} x${trade.count} (last price ${trade.lastPrice}, tick ${trade.tick})`,
    );
  }

  lines.push("Citizens and where they live or work:");
  if (context.places.length === 0) lines.push("- none");
  for (const place of context.places) {
    lines.push(
      `- ${place.name} (${place.job}, id ${place.id}): lives in ${place.home ?? "no home"}, works at ${place.work ?? "no workplace"}`,
    );
  }

  return lines.join("\n");
}

function buildFallbackAnswer(context: RetrievedContext): string {
  const lines: string[] = [];
  lines.push(
    `World at tick ${context.tick}: food ${context.food}, gold ${context.gold}, ` +
      `population ${context.population}, food price ${context.foodPrice} (demand ${context.demand}).`,
  );
  lines.push(
    `Average happiness ${context.stats.avgHappiness}, average food level ${context.stats.avgFoodLevel}.`,
  );

  if (context.causeChains.length > 0) {
    const chain = context.causeChains[0];
    lines.push(
      `Likely cause chain: ${chain.causeType} ("${chain.causeMessage}") led to ` +
        `${chain.effectType} ("${chain.effectMessage}") at tick ${chain.tick}.`,
    );
  }

  if (context.events.length > 0) {
    const highlights = context.events
      .slice(0, 5)
      .map((event) => `[tick ${event.tick}] ${event.type}: ${event.message}`)
      .join(" ");
    lines.push(`Relevant events: ${highlights}`);
  } else {
    lines.push("No matching events were found in the event history.");
  }

  if (context.trades.length > 0) {
    const trade = context.trades[0];
    lines.push(
      `Recent trade: ${trade.buyer} bought ${trade.item} from ${trade.seller} ` +
        `for ${trade.lastPrice} gold (tick ${trade.tick}).`,
    );
  }

  if (context.places.length > 0) {
    const place = context.places[0];
    lines.push(
      `${place.name} lives in ${place.home ?? "no home"} and works at ` +
        `${place.work ?? "no workplace"}.`,
    );
  }

  lines.push("This answer is derived directly from the world graph.");
  return lines.join(" ");
}
