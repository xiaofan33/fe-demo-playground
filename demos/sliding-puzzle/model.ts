import { getRandomInt } from '@/shared/utils';

export interface Position {
  x: number;
  y: number;
}

export interface SliderProps {
  readonly target: Position;
  readonly id: number;
  x: number;
  y: number;
}

export interface ModelOptions {
  w: number;
  h: number;
  steps?: number;
  sliderIds?: number[];
  indexToPos: (index: number) => Position;
  posToIndex: (pos: Position) => number;
}

export class SlidingPuzzleModel {
  isSolved = false;
  steps = 0;
  sliders: SliderProps[] = [];
  blanked: Position = { x: 0, y: 0 };
  options: ModelOptions = {
    w: 3,
    h: 3,
    indexToPos: (index: number) => ({
      x: index % this.options.w,
      y: Math.floor(index / this.options.w),
    }),
    posToIndex: (pos: Position) => pos.x + pos.y * this.options.w,
  };

  init(options: Partial<ModelOptions> = {}) {
    this.options = { ...this.options, ...options };
    if (options.sliderIds?.length) {
      this.sliders = options.sliderIds
        .map((num, index) => {
          return num !== 0
            ? {
                id: index,
                target: this.options.indexToPos(index),
                ...this.options.indexToPos(num),
              }
            : null;
        })
        .filter(item => item !== null);
      this.blanked = this.options.indexToPos(options.sliderIds.indexOf(0));
    } else {
      const length = this.options.w * this.options.h - 1;
      this.sliders = Array.from({ length }, (_, index) => {
        const target = this.options.indexToPos(index);
        return { id: index, target, ...target };
      });
      this.blanked = this.options.indexToPos(length);
    }
    this.steps = options.steps ?? 0;
    this.isSolved = this._checkSolved();
  }

  move(id: number, passedCheckSolved?: boolean) {
    if (this.isSolved) {
      return;
    }
    const slider = this.sliders.find(s => s.id === id);
    if (!slider) {
      return;
    }
    const isMoved = this._doMove(slider);
    if (isMoved && !passedCheckSolved) {
      this.isSolved = this._checkSolved();
    }
  }

  shuffle(times?: number) {
    const vectors = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    const getVec = () => vectors[getRandomInt(0, 3)];
    const isValid = ({ x, y }: Position) =>
      x >= 0 && x < this.options.w && y >= 0 && y < this.options.h;
    times = times ?? this.options.w * this.options.h * 10;
    while (times > 0) {
      const [dx, dy] = getVec();
      const pos = { x: this.blanked.x + dx, y: this.blanked.y + dy };
      if (isValid(pos)) {
        this._doSwap(pos);
        times--;
      }
    }
  }

  _checkSolved() {
    return this.sliders.every(
      ({ target, x, y }) => target.x === x && target.y === y,
    );
  }

  _doMove(slider: SliderProps) {
    let offsetX = Math.abs(slider.x - this.blanked.x);
    let offsetY = Math.abs(slider.y - this.blanked.y);
    if (offsetX !== 0 && offsetY !== 0) {
      return false;
    }
    if (offsetX === 0) {
      const delta = slider.y > this.blanked.y ? 1 : -1;
      while (offsetY > 0) {
        this._doSwap({ x: this.blanked.x, y: this.blanked.y + delta });
        this.steps++;
        offsetY--;
      }
    } else {
      const delta = slider.x > this.blanked.x ? 1 : -1;
      while (offsetX > 0) {
        this._doSwap({ x: this.blanked.x + delta, y: this.blanked.y });
        this.steps++;
        offsetX--;
      }
    }
    return true;
  }

  _doSwap(pos: Position) {
    const slider = this.sliders.find(s => s.x === pos.x && s.y === pos.y);
    if (slider) {
      const { x, y } = this.blanked;
      this.blanked = { x: slider.x, y: slider.y };
      slider.x = x;
      slider.y = y;
    }
  }
}
