/**
 * FADS design-system public entry.
 *
 * Exposes the token layer, design providers, and the reusable primitives,
 * composite, and shell components. Pattern layers are added incrementally and
 * re-exported here. Product code must import from this package only — never
 * reach into internal files (DC-20/DC-21).
 *
 * ⚠ Component visual fidelity is **Pending final DGA token values (Q3/Q20)**.
 */
export { token } from './tokens/tokens';
export type { Token } from './tokens/tokens';
export * from './providers';
export * from './primitives';
export * from './layout';
export * from './composite';
export * from './shell';
