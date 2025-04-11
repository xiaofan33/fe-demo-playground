import { arrayShuffle } from '@/shared/utils';

export interface Position {
  x: number;
  y: number;
}

export interface BoardProps {
  w: number /**board width */;
  h: number /**board height */;
  m: number /**mines count */;
}

export interface GridProps {
  readonly index: number;
  mine?: boolean;
  open?: boolean;
  mark?: boolean;
  boom?: boolean;
  adjacentMines?: number;
}

export interface StorageData {
  board: BoardProps;
  grids: Array<[number, number]>;
  duration?: number;
}

export type BoardState = 'ready' | 'playing' | 'won' | 'lost';

export class MinesweeperModel {
  state: BoardState = 'ready';
  timer: { duration: number; start?: number } = { duration: 0 };
  board: BoardProps = { w: 0, h: 0, m: 0 };
  grids: GridProps[] = [];
  minesIndexSet: Set<number> = new Set();
  marksIndexSet: Set<number> = new Set();
  siblingsCache: Map<number, number[]> = new Map();
  waitOpenedGridsCount = 0;
  // prettier-ignore
  static readonly siblingsVec = [
    [-1, -1],[0, -1],[1, -1],
    [-1,  0],        [1,  0],
    [-1,  1],[0,  1],[1,  1]
  ];

  init(board: BoardProps = { w: 9, h: 9, m: 10 }) {
    const { w, h, m } = board;
    if (w !== this.board.w || h !== this.board.h) {
      this.grids = Array.from({ length: w * h }, (_, i) => ({ index: i }));
      this.siblingsCache.clear();
    } else {
      this.grids.forEach(
        grid => (grid.mine = grid.open = grid.mark = grid.boom = false),
      );
    }
    this.board = { w, h, m };
    this.minesIndexSet.clear();
    this.marksIndexSet.clear();
    this.waitOpenedGridsCount = w * h - m;
    this.timer = { duration: 0 };
    this.state = 'ready';
  }

  load({ board, grids, duration = 0 }: StorageData) {
    this.init(board);
    const openGrids: number[] = [];
    grids.forEach(([index, bitmask]) => {
      const [open, mine, mark] = [1, 2, 4].map(bit => !!(bit & bitmask));
      if (open) openGrids.push(index);
      if (mine) this.minesIndexSet.add(index);
      if (mark) this.marksIndexSet.add(index);
      this.grids[index] = { index, open, mine, mark };
    });
    openGrids.forEach(
      index =>
        (this.grids[index].adjacentMines = this.getAdjacentMinesCount(index)),
    );
    this.timer = { duration, start: Date.now() };
    this.state = 'playing';
  }

  dump() {
    const duration = this.timer.start
      ? Date.now() - this.timer.start + this.timer.duration
      : this.timer.duration;
    const grids = this.grids
      .map(({ index, open, mine, mark }) => {
        let bitmask = 0;
        if (open) bitmask |= 1;
        if (mine) bitmask |= 2;
        if (mark) bitmask |= 4;
        return bitmask > 0 ? [index, bitmask] : null;
      })
      .filter(item => item !== null);

    return JSON.stringify({ duration, grids, board: this.board });
  }

  restart() {
    if (this.state !== 'ready') {
      this.grids.forEach(grid => (grid.open = grid.mark = grid.boom = false));
      this.marksIndexSet.clear();
      this.timer = { duration: 0, start: Date.now() };
      this.state = 'playing';
    }
  }

  posToIndex(pos: Position) {
    return pos.y * this.board.w + pos.x;
  }

  indexToPos(index: number) {
    return { x: index % this.board.w, y: Math.floor(index / this.board.w) };
  }

  operate(grid: GridProps, action: 'open' | 'mark', allowOpenAdjacent = false) {
    if (!this.checkAndInitializeMines(grid.index)) {
      return;
    }
    const isHandled =
      action === 'mark' || grid.mark
        ? this.handleMark(grid)
        : this.handleOpen(grid);
    if (!isHandled && allowOpenAdjacent && grid.open) {
      this.openAdjacent(grid);
    }
  }

  openAdjacent(grid: GridProps) {
    if (!grid.open || this.state !== 'playing') {
      return;
    }
    const siblings = this.getSiblings(grid.index);
    let markedCount = 0;
    let unopenedGrids: number[] = [];
    siblings.forEach(index => {
      if (this.grids[index].mark) {
        markedCount++;
      } else if (!this.grids[index].open) {
        unopenedGrids.push(index);
      }
    });
    if (markedCount === this.getAdjacentMinesCount(grid.index, siblings)) {
      unopenedGrids.forEach(index => this.doOpen(index));
    }
  }

  private placeMines(excludedIndex?: number) {
    const { w, h, m } = this.board;
    let length = w * h;
    let candidates = [...Array(length).keys()];
    if (excludedIndex !== undefined) {
      [excludedIndex, ...this.getSiblings(excludedIndex)].forEach(index => {
        if (length >= m) {
          candidates[index] = -1;
          length--;
        }
      });
      candidates = candidates.filter(index => index !== -1);
    }
    arrayShuffle(candidates)
      .slice(0, m)
      .forEach(index => {
        this.grids[index].mine = true;
        this.minesIndexSet.add(index);
      });
  }

  private checkAndInitializeMines(index: number) {
    if (this.state === 'won' || this.state === 'lost') {
      return false;
    }
    if (this.state === 'ready') {
      this.placeMines(index);
      this.timer.start = Date.now();
      this.state = 'playing';
    }
    return true;
  }

  private handleMark(grid: GridProps) {
    if (grid.open) {
      return false;
    }
    grid.mark = !grid.mark;
    grid.mark
      ? this.marksIndexSet.add(grid.index)
      : this.marksIndexSet.delete(grid.index);
    return true;
  }

  private handleOpen(grid: GridProps) {
    if (grid.open) {
      return false;
    }
    this.doOpen(grid.index);
    return true;
  }

  private doOpen(index: number) {
    const grid = this.grids[index];
    if (grid.open) {
      return;
    }
    grid.open = true;
    this.waitOpenedGridsCount--;
    if (grid.mine) {
      grid.boom = true;
      this.doGameOver(false);
    } else if (this.waitOpenedGridsCount === 0) {
      this.doGameOver(true);
    } else if (this.getAdjacentMinesCount(index) === 0) {
      this.getSiblings(index).forEach(siblingIndex =>
        this.doOpen(siblingIndex),
      );
    }
  }

  private doGameOver(isWin = false) {
    if (!isWin) {
      this.state = 'lost';
      this.minesIndexSet.forEach(index => (this.grids[index].open = true));
      this.marksIndexSet.forEach(index => (this.grids[index].open = true));
    } else {
      this.state = 'won';
      this.minesIndexSet.forEach(index => (this.grids[index].mark = true));
      this.marksIndexSet = new Set(this.minesIndexSet);
    }
  }

  private getAdjacentMinesCount(index: number, siblings?: number[]) {
    const grid = this.grids[index];
    if (grid.adjacentMines === undefined) {
      grid.adjacentMines = (siblings || this.getSiblings(index)).reduce(
        (acc, index) => (this.minesIndexSet.has(index) ? acc + 1 : acc),
        0,
      );
    }
    return grid.adjacentMines;
  }

  private getSiblings(index: number) {
    if (this.siblingsCache.has(index)) {
      return this.siblingsCache.get(index)!;
    }
    const { w, h } = this.board;
    const { x, y } = this.indexToPos(index);
    const siblings = MinesweeperModel.siblingsVec
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter(({ x, y }) => x >= 0 && x < w && y >= 0 && y < h)
      .map(pos => this.posToIndex(pos));
    this.siblingsCache.set(index, siblings);
    return siblings;
  }
}
