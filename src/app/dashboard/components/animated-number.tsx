"use client";

import * as React from "react";
import { Text } from "@chakra-ui/react";

import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const DURATION_MS = 900;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
}

/**
 * Counts up to `value` once, on first load. Screen readers and reduced-motion
 * users only ever get the final value.
 */
export function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [display, setDisplay] = React.useState(value);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (reduceMotion || hasAnimated.current) {
      setDisplay(value);
      return;
    }

    hasAnimated.current = true;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  return (
    <>
      <span aria-hidden="true">{format(display)}</span>
      <Text as="span" srOnly>
        {format(value)}
      </Text>
    </>
  );
}
