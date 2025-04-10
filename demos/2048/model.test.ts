import { describe, expect, it } from 'vitest';
import { boardToTiles, G2048Model, tilesToBoard } from './model';

describe('moves in all directions should work correctly', () => {
  const board = [
    [2, 0, 2, 0],
    [2, 2, 4, 4],
    [2, 2, 4, 8],
    [2, 2, 2, 0],
  ];
  const steps = [
    {
      move: 'right',
      board: [
        [0, 0, 0, 4],
        [0, 0, 4, 8],
        [0, 4, 4, 8],
        [0, 0, 2, 4],
      ],
    },
    {
      move: 'down',
      board: [
        [0, 0, 0, 0],
        [0, 0, 0, 4],
        [0, 0, 8, 16],
        [0, 4, 2, 4],
      ],
    },
    {
      move: 'left',
      board: [
        [0, 0, 0, 0],
        [4, 0, 0, 0],
        [8, 16, 0, 0],
        [4, 2, 4, 0],
      ],
    },
    {
      move: 'up',
      board: [
        [4, 16, 4, 0],
        [8, 2, 0, 0],
        [4, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    },
  ] as const;

  const m = new G2048Model();
  m.init({ tiles: boardToTiles(board) });

  it.each(steps)('test move $move', ({ move, board }) => {
    m.move(move, false);
    expect(tilesToBoard(m.tiles, 4)).toEqual(board);
  });
});

describe('scores should be calculated correctly after merging tiles', () => {
  const board = [
    [2, 0, 2, 0],
    [2, 2, 4, 4],
    [2, 2, 4, 8],
    [2, 2, 2, 0],
  ];

  const m = new G2048Model();
  m.init({ tiles: boardToTiles(board) });
  m.move('right');

  it('test score increment', () => {
    expect(m.options.score).toBe(4 + 4 + 8 + 4 + 4);
  });
});

describe('the game over condition should be judged correctly', () => {
  const board1 = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ];

  const board2 = [
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 8],
    [4, 2, 4, 8],
  ];

  const m = new G2048Model();

  it("can't move anymore", () => {
    m.init({ tiles: boardToTiles(board1) });
    expect(m.canMove()).toBe(false);
  });

  it('can still merged', () => {
    m.init({ tiles: boardToTiles(board2) });
    expect(m.canMove()).toBe(true);
  });
});
