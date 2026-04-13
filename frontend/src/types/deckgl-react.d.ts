declare module '@deck.gl/react' {
  import type { ComponentType } from 'react';

  const DeckGL: ComponentType<Record<string, unknown>>;
  export default DeckGL;
}

declare module '@deck.gl/geo-layers' {
  export class H3HexagonLayer {
    constructor(props: Record<string, unknown>);
  }
}

declare module '@deck.gl/core' {
  export type PickingInfo<T = unknown> = {
    object?: T;
  } & Record<string, unknown>;
}
