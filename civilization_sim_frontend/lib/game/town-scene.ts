import Phaser from "phaser";
import type { SelectedEntity, WorldSnapshot } from "../types";
import { buildTownTextures } from "./textures";
import {
  DECOR,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_DEPTH,
  SELECTION_DEPTH,
  TEXTURES,
} from "./palette";

export const TOWN_SCENE_KEY = "TownScene";

const POLL_TWEEN_MS = 700;
const BOB_TWEEN_MS = 900;

interface EntityView {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  texture: string;
}

export interface TownSceneOptions {
  onSelect: (entity: SelectedEntity) => void;
}

export interface TownGame {
  applyWorld: (world: WorldSnapshot | null) => void;
  setSelected: (selected: SelectedEntity) => void;
  destroy: () => void;
}

function percentX(value: number) {
  return (value / 100) * GAME_WIDTH;
}

function percentY(value: number) {
  return (value / 100) * GAME_HEIGHT;
}

class TownScene extends Phaser.Scene {
  private readonly onSelect: (entity: SelectedEntity) => void;
  private readonly buildings = new Map<string, EntityView>();
  private readonly citizens = new Map<string, EntityView>();
  private world: WorldSnapshot | null = null;
  private selected: SelectedEntity = null;
  private ready = false;
  private selection?: Phaser.GameObjects.Graphics;

  constructor(options: TownSceneOptions) {
    super(TOWN_SCENE_KEY);
    this.onSelect = options.onSelect;
  }

  create() {
    buildTownTextures(this);

    this.add
      .tileSprite(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        TEXTURES.grass,
      )
      .setDepth(GROUND_DEPTH);

    for (const item of DECOR) {
      this.add
        .image(percentX(item.x), percentY(item.y), item.key)
        .setOrigin(0.5, 1)
        .setDepth(percentY(item.y));
    }

    this.selection = this.add.graphics().setDepth(SELECTION_DEPTH);

    this.input.on(
      "pointerdown",
      (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (over.length === 0) this.onSelect(null);
      },
    );

    this.ready = true;
    if (this.world) this.applyWorld(this.world);
    this.setSelected(this.selected);
  }

  applyWorld(world: WorldSnapshot | null) {
    if (world) this.world = world;
    if (!this.ready || !this.world) return;
    this.syncBuildings(this.world);
    this.syncCitizens(this.world);
  }

  setSelected(selected: SelectedEntity) {
    this.selected = selected;
  }

  update() {
    if (!this.selection) return;
    this.selection.clear();
    const view = this.findSelected();
    if (!view) return;
    const bounds = view.sprite.getBounds();
    const pad = 5;
    this.selection.lineStyle(2, 0x1b1b1b, 0.7);
    this.selection.strokeRect(
      bounds.x - pad - 2,
      bounds.y - pad - 2,
      bounds.width + pad * 2 + 4,
      bounds.height + pad * 2 + 4,
    );
    this.selection.lineStyle(3, 0xfff24a, 1);
    this.selection.strokeRect(
      bounds.x - pad,
      bounds.y - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
    );
  }

  private findSelected() {
    if (!this.selected) return undefined;
    return this.selected.kind === "citizen"
      ? this.citizens.get(this.selected.id)
      : this.buildings.get(this.selected.id);
  }

  private syncBuildings(world: WorldSnapshot) {
    const seen = new Set<string>();
    for (const building of world.buildings) {
      seen.add(building.id);
      const texture = TEXTURES.building(building.type);
      const x = percentX(building.x);
      const y = percentY(building.y);
      const existing = this.buildings.get(building.id);
      if (existing) {
        if (existing.texture !== texture) this.retarget(existing, texture);
        this.moveTo(existing, x, y);
      } else {
        this.buildings.set(
          building.id,
          this.createEntity("building", building.id, texture, x, y),
        );
      }
    }
    this.sweep(this.buildings, seen);
  }

  private syncCitizens(world: WorldSnapshot) {
    const seen = new Set<string>();
    for (const citizen of world.citizens) {
      seen.add(citizen.id);
      const texture = TEXTURES.citizen(citizen.job);
      const x = percentX(citizen.x);
      const y = percentY(citizen.y);
      const existing = this.citizens.get(citizen.id);
      if (existing) {
        if (existing.texture !== texture) this.retarget(existing, texture);
        this.moveTo(existing, x, y);
      } else {
        const view = this.createEntity("citizen", citizen.id, texture, x, y);
        this.tweens.add({
          targets: view.sprite,
          y: -4,
          duration: BOB_TWEEN_MS + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.citizens.set(citizen.id, view);
      }
    }
    this.sweep(this.citizens, seen);
  }

  private sweep(map: Map<string, EntityView>, seen: Set<string>) {
    for (const [id, view] of map) {
      if (!seen.has(id)) {
        view.container.destroy();
        map.delete(id);
      }
    }
  }

  private createEntity(
    kind: "building" | "citizen",
    id: string,
    texture: string,
    x: number,
    y: number,
  ): EntityView {
    const shadow = this.add.image(0, -2, TEXTURES.shadow).setOrigin(0.5, 0.5);
    const sprite = this.add.image(0, 0, texture).setOrigin(0.5, 1);
    const container = this.add.container(x, y, [shadow, sprite]);
    this.attachInteraction(container, sprite, kind, id);
    return { container, sprite, shadow, texture };
  }

  private attachInteraction(
    container: Phaser.GameObjects.Container,
    sprite: Phaser.GameObjects.Image,
    kind: "building" | "citizen",
    id: string,
  ) {
    const width = sprite.width;
    const height = sprite.height;
    container.setSize(width, height);
    container.setDepth(container.y);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
    container.on("pointerdown", () => this.onSelect({ kind, id }));
    container.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
      sprite.setScale(1.08);
    });
    container.on("pointerout", () => {
      this.input.setDefaultCursor("default");
      sprite.setScale(1);
    });
  }

  private retarget(view: EntityView, texture: string) {
    view.sprite.setTexture(texture);
    view.texture = texture;
    const width = view.sprite.width;
    const height = view.sprite.height;
    view.container.setSize(width, height);
    view.container.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  private moveTo(view: EntityView, x: number, y: number) {
    if (
      Math.abs(view.container.x - x) < 0.5 &&
      Math.abs(view.container.y - y) < 0.5
    ) {
      return;
    }
    this.tweens.killTweensOf(view.container);
    this.tweens.add({
      targets: view.container,
      x,
      y,
      duration: POLL_TWEEN_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => view.container.setDepth(view.container.y),
      onComplete: () => view.container.setDepth(view.container.y),
    });
  }
}

export function createTownGame(
  parent: HTMLElement,
  options: TownSceneOptions,
): TownGame {
  const scene = new TownScene(options);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#6bb7ff",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [scene],
  });
  return {
    applyWorld: (world) => scene.applyWorld(world),
    setSelected: (selected) => scene.setSelected(selected),
    destroy: () => game.destroy(true),
  };
}
