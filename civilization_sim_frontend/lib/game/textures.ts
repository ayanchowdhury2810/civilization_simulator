import Phaser from "phaser";
import { COLORS, TEXTURES } from "./palette";

type Graphics = Phaser.GameObjects.Graphics;

function fill(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  alpha = 1,
) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function outline(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  t = 2,
) {
  fill(g, x, y, w, t, color);
  fill(g, x, y + h - t, w, t, color);
  fill(g, x, y, t, h, color);
  fill(g, x + w - t, y, t, h, color);
}

function texture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (g: Graphics) => void,
) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

function buildGrass(scene: Phaser.Scene) {
  const tile = 20;
  const cols = 16;
  const rows = 12;
  texture(scene, TEXTURES.grass, tile * cols, tile * rows, (g) => {
    const rng = new Phaser.Math.RandomDataGenerator(["town-grass"]);
    for (let ty = 0; ty < rows; ty += 1) {
      for (let tx = 0; tx < cols; tx += 1) {
        const ox = tx * tile;
        const oy = ty * tile;
        fill(
          g,
          ox,
          oy,
          tile,
          tile,
          COLORS.grass[rng.between(0, COLORS.grass.length - 1)],
        );
        for (let s = 0; s < 7; s += 1) {
          const shade = rng.between(0, 2) === 0;
          fill(
            g,
            ox + rng.between(0, tile - 2),
            oy + rng.between(0, tile - 2),
            2,
            2,
            shade ? COLORS.grassLight : COLORS.grassShade,
          );
        }
        if (rng.between(0, 6) === 0) {
          fill(
            g,
            ox + rng.between(2, tile - 4),
            oy + rng.between(2, tile - 4),
            2,
            2,
            COLORS.flowers[rng.between(0, COLORS.flowers.length - 1)],
          );
        }
      }
    }
  });
}

function buildTree(scene: Phaser.Scene) {
  const W = 44;
  const H = 60;
  texture(scene, TEXTURES.tree, W, H, (g) => {
    fill(g, 18, 38, 8, 18, COLORS.treeTrunk);
    fill(g, 18, 38, 3, 18, COLORS.woodDark);
    const leaf = (x: number, y: number, w: number, h: number, c: number) => {
      fill(g, x, y, w, h, c);
    };
    leaf(6, 30, 32, 12, COLORS.treeLeaf[2]);
    leaf(4, 18, 36, 16, COLORS.treeLeaf[0]);
    leaf(10, 8, 24, 16, COLORS.treeLeaf[1]);
    leaf(16, 2, 12, 12, COLORS.treeLeaf[1]);
    leaf(8, 22, 6, 6, COLORS.treeLeaf[1]);
    leaf(32, 24, 6, 6, COLORS.treeLeaf[1]);
    outline(g, 4, 16, 36, 16, 0x24491a, 1);
  });
}

function buildRock(scene: Phaser.Scene) {
  const W = 28;
  const H = 22;
  texture(scene, TEXTURES.rock, W, H, (g) => {
    fill(g, 3, 8, 22, 12, COLORS.rock);
    fill(g, 6, 3, 16, 8, COLORS.rock);
    fill(g, 8, 5, 8, 4, COLORS.rockLight);
    fill(g, 3, 16, 22, 4, COLORS.rockDark);
    outline(g, 3, 6, 22, 14, 0x4a505a, 1);
  });
}

function buildHouse(scene: Phaser.Scene) {
  const W = 48;
  const H = 58;
  texture(scene, TEXTURES.building("House"), W, H, (g) => {
    fill(g, 6, 26, 36, 30, COLORS.wood);
    for (let y = 31; y < 55; y += 6) fill(g, 6, y, 36, 1, COLORS.woodLine);
    outline(g, 6, 26, 36, 30, COLORS.outline, 2);
    for (let i = 0; i < 8; i += 1) {
      const w = 6 + i * 6;
      const x = Math.round(24 - w / 2);
      const y = 2 + i * 3;
      fill(g, x, y, w, 3, i % 2 ? COLORS.roofDark : COLORS.roof);
    }
    fill(g, 4, 26, 40, 3, COLORS.roofLight);
    fill(g, 20, 42, 9, 14, COLORS.door);
    fill(g, 20, 42, 9, 2, COLORS.woodDark);
    fill(g, 11, 32, 9, 8, COLORS.window);
    fill(g, 29, 32, 9, 8, COLORS.window);
    outline(g, 11, 32, 9, 8, COLORS.outline, 1);
    outline(g, 29, 32, 9, 8, COLORS.outline, 1);
  });
}

function buildFarm(scene: Phaser.Scene) {
  const W = 48;
  const H = 46;
  texture(scene, TEXTURES.building("Farm"), W, H, (g) => {
    fill(g, 2, 10, 44, 34, COLORS.soil);
    for (let y = 14; y < 42; y += 6) fill(g, 4, y, 40, 2, COLORS.soilDark);
    outline(g, 2, 10, 44, 34, COLORS.outline, 2);
    for (let y = 13; y < 40; y += 8) {
      for (let x = 6; x < 44; x += 8) {
        fill(g, x, y - 4, 2, 5, COLORS.crop);
        fill(g, x - 1, y - 6, 4, 3, COLORS.cropTip);
      }
    }
  });
}

function buildMarket(scene: Phaser.Scene) {
  const W = 50;
  const H = 56;
  texture(scene, TEXTURES.building("Market"), W, H, (g) => {
    fill(g, 6, 20, 6, 34, COLORS.wood);
    fill(g, 38, 20, 6, 34, COLORS.wood);
    fill(g, 8, 40, 34, 14, COLORS.woodDark);
    fill(g, 12, 44, 8, 8, COLORS.crate);
    fill(g, 24, 44, 8, 8, COLORS.crate);
    for (let i = 0; i < 6; i += 1) {
      fill(g, 2 + i * 8, 8, 8, 14, i % 2 ? COLORS.awningA : COLORS.awningB);
    }
    outline(g, 2, 8, 46, 14, COLORS.outline, 2);
    outline(g, 6, 20, 6, 34, COLORS.outline, 1);
    outline(g, 38, 20, 6, 34, COLORS.outline, 1);
    outline(g, 8, 40, 34, 14, COLORS.outline, 2);
  });
}

function buildCitizen(scene: Phaser.Scene, job: string) {
  const W = 16;
  const H = 22;
  texture(scene, TEXTURES.citizen(job), W, H, (g) => {
    const shirt = COLORS.shirt[job] ?? COLORS.shirt.Unemployed;
    fill(g, 4, 16, 4, 5, COLORS.pants);
    fill(g, 9, 16, 4, 5, COLORS.pants);
    fill(g, 4, 20, 4, 2, COLORS.boots);
    fill(g, 9, 20, 4, 2, COLORS.boots);
    fill(g, 3, 9, 11, 8, shirt);
    fill(g, 2, 9, 1, 7, shirt);
    fill(g, 14, 9, 1, 7, shirt);
    fill(g, 4, 1, 9, 8, COLORS.skin);
    fill(g, 4, 1, 9, 3, COLORS.hair);
    fill(g, 6, 5, 1, 2, 0x2b2b2b);
    fill(g, 10, 5, 1, 2, 0x2b2b2b);
  });
}

function buildShadow(scene: Phaser.Scene) {
  texture(scene, TEXTURES.shadow, 36, 14, (g) => {
    fill(g, 0, 0, 36, 14, 0x000000, 0.001);
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(18, 7, 34, 12);
  });
}

export function buildTownTextures(scene: Phaser.Scene) {
  buildGrass(scene);
  buildTree(scene);
  buildRock(scene);
  buildHouse(scene);
  buildFarm(scene);
  buildMarket(scene);
  buildShadow(scene);
  (["Farmer", "Merchant", "Builder", "Unemployed"] as const).forEach((job) =>
    buildCitizen(scene, job),
  );
}
