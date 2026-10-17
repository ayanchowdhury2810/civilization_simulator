export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 600;

export const GROUND_DEPTH = -10000;
export const SELECTION_DEPTH = 1000000;

export const COLORS = {
  grass: [0x5f9e3f, 0x63a544, 0x58963a] as number[],
  grassShade: 0x4d8233,
  grassLight: 0x74b451,
  flowers: [0xf4d35e, 0xef476f, 0xf6f7fb] as number[],

  wood: 0xc79a63,
  woodLine: 0xa87c46,
  woodDark: 0x8a6437,
  outline: 0x5b3d21,

  roof: 0xa5382c,
  roofDark: 0x7d281f,
  roofLight: 0xc4503f,

  door: 0x5a3a1e,
  window: 0x8ecae6,

  soil: 0x7a5330,
  soilDark: 0x5f3f24,
  crop: 0x6faa3c,
  cropTip: 0xd9c15a,

  awningA: 0xe24b4b,
  awningB: 0xf4f1e8,
  crate: 0xb07a3c,

  treeTrunk: 0x6b4a2a,
  treeLeaf: [0x3f7d2e, 0x4f9a3a, 0x396f28] as number[],

  rock: 0x8b929c,
  rockDark: 0x646b74,
  rockLight: 0xafb6c0,

  skin: 0xe3b083,
  hair: 0x3b2a1a,
  pants: 0x39445a,
  boots: 0x232a38,
  shirt: {
    Farmer: 0x4caf50,
    Merchant: 0xffb300,
    Builder: 0x2196f3,
    Unemployed: 0x9e9e9e,
  } as Record<string, number>,
};

export const TEXTURES = {
  grass: "tex-grass",
  tree: "tex-tree",
  rock: "tex-rock",
  house: "tex-house",
  farm: "tex-farm",
  market: "tex-market",
  shadow: "tex-shadow",
  citizen: (job: string) => `tex-citizen-${job}`,
  building: (type: string) => `tex-building-${type}`,
};

export const DECOR = [
  { key: TEXTURES.tree, x: 6, y: 12 },
  { key: TEXTURES.tree, x: 12, y: 30 },
  { key: TEXTURES.tree, x: 5, y: 62 },
  { key: TEXTURES.tree, x: 14, y: 82 },
  { key: TEXTURES.tree, x: 30, y: 90 },
  { key: TEXTURES.tree, x: 50, y: 93 },
  { key: TEXTURES.tree, x: 70, y: 91 },
  { key: TEXTURES.tree, x: 86, y: 84 },
  { key: TEXTURES.tree, x: 93, y: 66 },
  { key: TEXTURES.tree, x: 88, y: 40 },
  { key: TEXTURES.tree, x: 94, y: 18 },
  { key: TEXTURES.tree, x: 78, y: 8 },
  { key: TEXTURES.tree, x: 22, y: 7 },
  { key: TEXTURES.rock, x: 18, y: 50 },
  { key: TEXTURES.rock, x: 82, y: 55 },
  { key: TEXTURES.rock, x: 40, y: 86 },
  { key: TEXTURES.rock, x: 60, y: 12 },
  { key: TEXTURES.rock, x: 34, y: 16 },
  { key: TEXTURES.rock, x: 66, y: 86 },
];
