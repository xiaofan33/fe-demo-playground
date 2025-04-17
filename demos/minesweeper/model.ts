import { arrayShuffle } from '@/lib/utils';

export interface Position {
  x: number;
  y: number;
}

export interface BoardProps {
  w: number /**board width */;
  h: number /**board height */;
  m: number /**mines count */;
}

export interface CellProps {
  readonly index: number;
  mine?: boolean;
  open?: boolean;
  mark?: boolean;
  boom?: boolean;
  aroundMines?: number;
}

export interface StorageData {
  board: BoardProps;
  cells: Array<[number, number]>;
  duration?: number;
}

export type BoardState = 'ready' | 'playing' | 'won' | 'lost';

export type OperationType = 'open' | 'mark' | 'openAround';

export class MinesweeperModel {
  state: BoardState = 'ready';
  timer: { duration: number; start?: number } = { duration: 0 };
  board: BoardProps = { w: 0, h: 0, m: 0 };
  cells: CellProps[] = [];
  minesIndexArr: number[] = [];
  marksIndexSet: Set<number> = new Set();
  siblingsCache: Map<number, number[]> = new Map();
  restOpenedCellsCount = 0;
  // prettier-ignore
  static readonly siblingsVec = [
    [-1, -1],[0, -1],[1, -1],
    [-1,  0],        [1,  0],
    [-1,  1],[0,  1],[1,  1]
  ];

  init(board: BoardProps = { w: 9, h: 9, m: 10 }) {
    const { w, h, m } = board;
    if (w !== this.board.w || h !== this.board.h) {
      this.siblingsCache.clear();
    }
    this.board = { w, h, m };
    this.cells = Array.from({ length: w * h }, (_, index) => ({ index }));
    this.minesIndexArr.length = 0;
    this.marksIndexSet.clear();
    this.restOpenedCellsCount = w * h - m;
    this.timer = { duration: 0 };
    this.state = 'ready';
  }

  load({ board, cells, duration = 0 }: StorageData) {
    this.init(board);
    const openedCells: number[] = [];
    cells.forEach(([index, bitmask]) => {
      const [open, mine, mark] = [1, 2, 4].map(bit => !!(bit & bitmask));
      if (open) openedCells.push(index);
      if (mine) this.minesIndexArr.push(index);
      if (mark) this.marksIndexSet.add(index);
      this.cells[index] = { index, open, mine, mark };
    });
    this.restOpenedCellsCount =
      this.board.w * this.board.h - this.board.m - openedCells.length;
    openedCells.forEach(index => {
      this.cells[index].aroundMines = this.getAroundMinesCount(index);
    });
    this.timer = { duration, start: Date.now() };
    this.state = 'playing';
  }

  dump() {
    const duration = this.timer.start
      ? Date.now() - this.timer.start + this.timer.duration
      : this.timer.duration;
    const cells = this.cells
      .map(({ index, open, mine, mark }) => {
        let bitmask = 0;
        if (open) bitmask |= 1;
        if (mine) bitmask |= 2;
        if (mark) bitmask |= 4;
        return bitmask > 0 ? [index, bitmask] : null;
      })
      .filter(item => item !== null);

    return { duration, cells, board: { ...this.board } };
  }

  restart() {
    if (this.state !== 'ready') {
      this.cells.forEach(cell => {
        cell.open = false;
        cell.mark = false;
        cell.boom = false;
      });
      this.marksIndexSet.clear();
      this.restOpenedCellsCount = this.board.w * this.board.h - this.board.m;
      this.timer = { duration: 0, start: Date.now() };
      this.state = 'playing';
    }
  }

  posToIndex({ x, y }: Position) {
    return y * this.board.w + x;
  }

  indexToPos(index: number) {
    return { x: index % this.board.w, y: Math.floor(index / this.board.w) };
  }

  operate(cell: CellProps, action: OperationType, allowOpenAround?: boolean) {
    if (action === 'openAround') {
      this.handleOpenAround(cell);
      return;
    }
    if (!this.checkAndInitializeMines(cell.index)) {
      return;
    }
    const isHandled =
      action === 'mark' || !!cell.mark
        ? this.handleMark(cell)
        : this.handleOpen(cell);
    if (!isHandled && allowOpenAround) {
      this.handleOpenAround(cell);
    }
  }

  private placeMines(excludedIndex: number) {
    const { w, h, m } = this.board;
    let length = w * h;
    let candidates = [...Array(length).keys()];
    [excludedIndex, ...this.getSiblings(excludedIndex)].forEach(index => {
      if (length >= m) {
        candidates[index] = -1;
        length--;
      }
    });
    candidates = candidates.filter(index => index !== -1);
    arrayShuffle(candidates)
      .slice(0, m)
      .forEach(index => {
        this.cells[index].mine = true;
        this.minesIndexArr.push(index);
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

  private handleOpenAround(cell: CellProps) {
    if (!cell.open || this.state !== 'playing') {
      return false;
    }
    const siblings = this.getSiblings(cell.index);
    let markedCount = 0;
    let unopenedCells: number[] = [];
    siblings.forEach(index => {
      if (this.cells[index].mark) {
        markedCount++;
      } else if (!this.cells[index].open) {
        unopenedCells.push(index);
      }
    });
    if (markedCount === this.getAroundMinesCount(cell.index, siblings)) {
      unopenedCells.forEach(index => this.doOpen(index));
      return true;
    }
    return false;
  }

  private handleMark(cell: CellProps) {
    if (cell.open) {
      return false;
    }
    cell.mark = !cell.mark;
    cell.mark
      ? this.marksIndexSet.add(cell.index)
      : this.marksIndexSet.delete(cell.index);
    return true;
  }

  private handleOpen(cell: CellProps) {
    if (cell.open) {
      return false;
    }
    this.doOpen(cell.index);
    return true;
  }

  private doOpen(index: number) {
    const cell = this.cells[index];
    cell.open = true;
    this.restOpenedCellsCount--;
    if (cell.mine) {
      cell.boom = true;
      this.doGameOver(false);
      return;
    }
    if (this.restOpenedCellsCount === 0) {
      this.doGameOver(true);
      return;
    }
    if (this.getAroundMinesCount(index) === 0) {
      this.getSiblings(index).forEach(siblingIndex => {
        const sibling = this.cells[siblingIndex];
        if (!sibling.open && !sibling.mark) {
          this.doOpen(siblingIndex);
        }
      });
    }
  }

  private doGameOver(isWin?: boolean) {
    if (!isWin) {
      this.state = 'lost';
      this.minesIndexArr.forEach(index => (this.cells[index].open = true));
      this.marksIndexSet.forEach(index => (this.cells[index].open = true));
    } else {
      this.state = 'won';
      this.marksIndexSet = new Set(this.minesIndexArr);
      this.cells.forEach(cell =>
        cell.mine ? (cell.mark = true) : (cell.open = true),
      );
    }
  }

  private getAroundMinesCount(index: number, siblings?: number[]) {
    const cell = this.cells[index];
    if (cell.aroundMines === undefined) {
      cell.aroundMines = (siblings || this.getSiblings(index)).reduce(
        (acc, index) => (this.cells[index].mine ? acc + 1 : acc),
        0,
      );
    }
    return cell.aroundMines;
  }

  getSiblings(index: number) {
    const cached = this.siblingsCache.get(index);
    if (cached) {
      return cached;
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
