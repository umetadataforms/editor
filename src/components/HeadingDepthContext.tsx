/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

export type HeadingDepthConfig = {
  depthOffset?: number;
  forceNonTopLevel?: boolean;
};

type HeadingDepthContextValue = {
  depthOffset: number;
  forceNonTopLevel: boolean;
};

const HeadingDepthContext = createContext<HeadingDepthContextValue>({
  depthOffset: 0,
  forceNonTopLevel: false,
});

/** Access heading depth context for nested templates. */
export function useHeadingDepth(): HeadingDepthContextValue {
  return useContext(HeadingDepthContext);
}

/** Provides merged heading depth configuration for descendants. */
export function HeadingDepthProvider({
  value,
  children,
}: {
  value?: HeadingDepthConfig;
  children: ReactNode;
}) {
  const parent = useHeadingDepth();
  const depthOffset = parent.depthOffset + (value?.depthOffset ?? 0);
  const forceNonTopLevel = parent.forceNonTopLevel || !!value?.forceNonTopLevel;

  const merged = useMemo(
    () => ({ depthOffset, forceNonTopLevel }),
    [depthOffset, forceNonTopLevel]
  );

  return (
    <HeadingDepthContext.Provider value={merged}>
      {children}
    </HeadingDepthContext.Provider>
  );
}
