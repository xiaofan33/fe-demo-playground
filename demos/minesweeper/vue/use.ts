import { computed, reactive, toRefs } from 'vue';
import { MinesweeperModel, type CellProps, type Position } from '../model';

export function useMinesweeperModel() {
  const model = reactive(new MinesweeperModel());
  const { board, state, timer } = toRefs(model);
  const flagNum = computed(() => model.board.m - model.marksIndexSet.size);

  const getCell = (pos: Position) => model.cells[model.posToIndex(pos)];
  const getHighlightedCells = (cell: CellProps) => {
    if (cell.mark) return [];
    if (!cell.open) return [cell];
    return model
      .getSiblings(cell.index)
      .map(index => model.cells[index])
      .filter(item => !item.open && !item.mark);
  };

  return {
    board,
    state,
    timer,
    flagNum,
    getCell,
    getHighlightedCells,
    init: model.init.bind(model),
    load: model.load.bind(model),
    dump: model.dump.bind(model),
    restart: model.restart.bind(model),
    operate: model.operate.bind(model),
  };
}
