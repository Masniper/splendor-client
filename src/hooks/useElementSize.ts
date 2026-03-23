import { type RefObject, useLayoutEffect, useState } from "react";

/** Content-box width/height for sprite backgrounds (ResizeObserver + initial measure). */
export function useElementSize<T extends HTMLElement>(
  ref: RefObject<T | null>,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({
        width: Math.max(1, Math.round(r.width)),
        height: Math.max(1, Math.round(r.height)),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}
