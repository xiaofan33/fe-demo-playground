import { arrayShuffle } from '@/shared/utils';

export interface TileProps {
  id?: number;
  x: number;
  y: number;
  value: number;
}

export interface ModelOptions {
  boardWidth: number;
  popupStart: number;
  popupMoved: number;
  score: number;
  steps: number;
}

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

export type MoveConfigs = {
  prop: 'x' | 'y';
  reverse: boolean;
  getTiles: (i: number) => Array<TileProps | null>;
};

export class G2048Model {
  static id = 0;
  static defaultOptions: ModelOptions = {
    boardWidth: 4,
    popupStart: 2,
    popupMoved: 1,
    score: 0,
    steps: 0,
  };

  gg = false;
  options: ModelOptions = { ...G2048Model.defaultOptions };
  tiles: TileProps[] = [];
  cells: Array<TileProps | null>[] = [];
  prevState: { score: number; tiles: string } | null = null;
  moveConfigMap: Record<MoveDirection, MoveConfigs> = {
    up: {
      prop: 'y',
      reverse: true,
      getTiles: (x: number) => this.cells.map(row => row[x]),
    },
    down: {
      prop: 'y',
      reverse: false,
      getTiles: (x: number) => this.cells.map(row => row[x]),
    },
    left: {
      prop: 'x',
      reverse: true,
      getTiles: (y: number) => this.cells[y],
    },
    right: {
      prop: 'x',
      reverse: false,
      getTiles: (y: number) => this.cells[y],
    },
  };

  constructor() {
    this.init();
  }

  init(props?: { tiles?: TileProps[]; options?: Partial<ModelOptions> }) {
    this.options = { ...G2048Model.defaultOptions, ...props?.options };
    this.tiles = props?.tiles || [];
    this.updateCells();
    this.gg = false;
    this.prevState = null;
    this.tiles.length === 0
      ? this.popup(this.options.popupStart)
      : this.tiles.forEach(t => (t.id = G2048Model.id++));
  }

  move(direction: MoveDirection, allowPopup = true) {
    if (this.gg) {
      return;
    }
    const score = this.options.score;
    const tiles = JSON.stringify(this.tiles);
    this.doMoveTiles(this.moveConfigMap[direction]);
    if (score === this.options.score && tiles === JSON.stringify(this.tiles)) {
      return;
    }
    this.options.steps++;
    this.prevState = { score, tiles };
    this.updateCells();
    allowPopup && this.popup(this.options.popupMoved);
  }

  back() {
    if (this.prevState) {
      this.options.score = this.prevState.score;
      this.options.steps--;
      this.tiles = JSON.parse(this.prevState.tiles);
      this.prevState = null;
      this.gg = false;
      this.updateCells();
    }
  }

  popup(n: number) {
    const emptyCells = this.getEmptyCells();
    const maximum = emptyCells.length;
    if (maximum < n) {
      return;
    }
    const getInitialValue = () => (Math.random() < 0.9 ? 2 : 4);
    arrayShuffle(emptyCells)
      .slice(0, n)
      .forEach(index => {
        const id = G2048Model.id++;
        const x = index % this.options.boardWidth;
        const y = Math.floor(index / this.options.boardWidth);
        const tile = { id, x, y, value: getInitialValue() };
        this.tiles.push(tile);
        this.cells[y][x] = tile;
      });
    this.gg = maximum === n && !this.canMove();
  }

  canBack() {
    return !!this.prevState;
  }

  canMove() {
    const length = this.options.boardWidth;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length; j++) {
        const value = this.cells[i][j]?.value;
        if (
          (i < length - 1 && value === this.cells[i + 1][j]?.value) ||
          (j < length - 1 && value === this.cells[i][j + 1]?.value)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  updateCells() {
    const length = this.options.boardWidth;
    if (this.cells?.length === length && this.cells[0]?.length === length) {
      this.cells.forEach(row => row.fill(null));
    } else {
      this.cells = Array.from({ length }, () =>
        Array.from({ length }, () => null),
      );
    }
    this.tiles.forEach(t => (this.cells[t.y][t.x] = t));
  }

  getEmptyCells() {
    return this.cells
      .flat()
      .map((cell, index) => (cell ? null : index))
      .filter(Boolean) as number[];
  }

  doMoveTiles({ prop, reverse, getTiles }: MoveConfigs) {
    const length = this.options.boardWidth;
    for (let i = 0; i < length; i++) {
      let tiles = getTiles(i).filter(Boolean) as TileProps[];
      let offset: number;
      if (reverse) {
        tiles = this.getMergedTilesOnLine(tiles.reverse()).reverse();
        offset = 0;
      } else {
        tiles = this.getMergedTilesOnLine(tiles);
        offset = length - tiles.length;
      }
      tiles.forEach((t, index) => (t[prop] = index + offset));
    }
    this.tiles = this.tiles.filter(t => t.value > 0);
  }

  getMergedTilesOnLine(tiles: TileProps[]) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const current = tiles[i];
      const prev = tiles[i - 1];
      if (current.value === prev.value) {
        prev.value += current.value;
        current.value = 0;
        this.options.score += prev.value;
        i--;
      }
    }
    return tiles.filter(t => t.value > 0);
  }
}

export function tilesToBoard(tiles: TileProps[], length: number) {
  const board = Array.from({ length }, () => Array.from({ length }, () => 0));
  tiles.forEach(t => (board[t.y][t.x] = t.value));
  return board;
}

export function boardToTiles(board: number[][]) {
  const { length } = board;
  return board
    .flat()
    .map((value, index) =>
      value === 0
        ? null
        : {
            x: index % length,
            y: Math.floor(index / length),
            value,
          },
    )
    .filter(Boolean) as TileProps[];
}
