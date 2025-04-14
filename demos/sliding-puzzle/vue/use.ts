import { reactive, toRefs } from 'vue';
import { SlidingPuzzleModel } from '../model';

export function useSlidingPuzzleModel() {
  const model = reactive(new SlidingPuzzleModel());
  const { isSolved, steps, sliders, options } = toRefs(model);
  return {
    isSolved,
    steps,
    sliders,
    options,
    init: model.init.bind(model),
    move: model.move.bind(model),
    shuffle: model.shuffle.bind(model),
  };
}
