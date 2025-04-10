import {
  useEventListener,
  tryOnUnmounted,
  tryOnScopeDispose,
  usePointerSwipe,
  type UseSwipeDirection,
  type MaybeRef,
} from '@vueuse/core';

export type MoveCommand = Exclude<UseSwipeDirection, 'none'>;

export function useMoveCommandCallback(
  options: {
    enableKeyboardPress?: boolean;
    enablePointerSwipe?: boolean;
    element?: MaybeRef<HTMLElement | undefined | null>;
    onMoved?: (command: MoveCommand) => void;
  } = {},
) {
  const {
    enableKeyboardPress = true,
    enablePointerSwipe = true,
    element,
    onMoved,
  } = options;

  const stops: Array<() => void> = [];
  const commandMap: Record<string, MoveCommand> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
  };

  if (enableKeyboardPress) {
    const stop = useEventListener('keydown', event => {
      const cmd = commandMap[event.key];
      if (cmd) {
        event.preventDefault();
        onMoved?.(cmd);
      }
    });
    stops.push(stop);
  }
  if (enablePointerSwipe) {
    const { stop: stopSwipe } = usePointerSwipe(element, {
      threshold: 30,
      onSwipeEnd(event, cmd) {
        if (cmd !== 'none') {
          event.preventDefault();
          onMoved?.(cmd);
        }
      },
    });
    stops.push(stopSwipe);
  }

  const clean = () => stops.forEach(stop => stop());
  tryOnScopeDispose(clean);

  return { clean };
}

export function usePagehideCallback(callback: () => void) {
  let called = false;
  const handler = () => {
    if (!called) {
      called = true;
      callback();
    }
  };
  useEventListener('pagehide', handler);
  tryOnUnmounted(handler);
}
