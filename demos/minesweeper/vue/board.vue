<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import Cell from './cell.vue';
import type { CellProps, OperationType, Position } from '../model';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  w: number;
  h: number;
  side: number;
  edge: number;
  colorCssVars: Record<string, string>;
  getCell: (pos: Position) => CellProps;
  getHighlightedCells: (cell: CellProps) => CellProps[];
}>();

const emits = defineEmits<{
  (event: 'onOperate', cell: CellProps, operation: OperationType): void;
}>();

const boardStyles = computed(() => ({
  '--side': `${props.side}px`,
  '--edge': `${props.edge}px`,
  ...props.colorCssVars,
}));

const blockData = computed(() => {
  return Array.from({ length: props.h }, (_, y) =>
    Array.from({ length: props.w }, (__, x) => props.getCell({ x, y })),
  );
});

const boardRef = useTemplateRef<HTMLElement>('boardRef');
const pointerPos = ref<Position>({ x: 0, y: 0 });
const enableHighlight = ref(false);

const focusedCell = computed(() => {
  const { x: px, y: py } = pointerPos.value;
  const size = props.side + props.edge;
  const x = Math.floor(px / size);
  const y = Math.floor(py / size);
  if (px - x * size <= props.side && py - y * size <= props.side) {
    return props.getCell({ x, y });
  }
});

const highlightedCells = computed(() => {
  if (enableHighlight.value && focusedCell.value) {
    return props.getHighlightedCells(focusedCell.value);
  }
});

function onPointerdown(event: PointerEvent) {
  if (boardRef.value) {
    const rect = boardRef.value.getBoundingClientRect();
    pointerPos.value = {
      x: event.clientX - rect.x,
      y: event.clientY - rect.y,
    };
    enableHighlight.value = event.buttons !== 2;
    document.body.addEventListener('pointermove', onPointermove);
    document.body.addEventListener('pointerup', onPointerup);
    document.body.addEventListener('pointercancel', onPointerup);
  }
}

function onPointermove(event: PointerEvent) {
  const rect = boardRef.value!.getBoundingClientRect();
  const x = event.clientX - rect.x;
  const y = event.clientY - rect.y;
  if (x >= 0 && x < rect.width && y >= 0 && y < rect.height) {
    pointerPos.value = { x, y };
    enableHighlight.value = true;
  } else {
    enableHighlight.value = false;
  }
}

function onPointerup(event: PointerEvent) {
  enableHighlight.value = false;
  document.body.removeEventListener('pointermove', onPointermove);
  document.body.removeEventListener('pointerup', onPointerup);
  document.body.removeEventListener('pointercancel', onPointerup);
}

function onHandlerOperate(event: Event, operation: OperationType) {
  event.preventDefault();
  focusedCell.value && emits('onOperate', focusedCell.value, operation);
}
</script>

<template>
  <div
    ref="boardRef"
    :style="boardStyles"
    class="flex flex-col gap-y-[var(--edge)] font-mono text-[calc(var(--side)*0.65)] font-bold"
    @pointerdown="onPointerdown"
    @click="onHandlerOperate($event, 'open')"
    @contextmenu="onHandlerOperate($event, 'mark')"
    @dblclick="onHandlerOperate($event, 'openAround')"
  >
    <div
      v-for="(row, y) in blockData"
      :key="y"
      class="flex gap-x-[var(--edge)]"
    >
      <div
        v-for="(meta, x) in row"
        :key="x"
        class="h-[var(--side)] w-[var(--side)] shrink-0"
      >
        <Cell
          :meta="meta"
          :isHighlighted="enableHighlight && highlightedCells?.includes(meta)"
        />
      </div>
    </div>
  </div>
</template>
