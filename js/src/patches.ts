import { Temporal } from "@js-temporal/polyfill";

type KeyToTupleObj<T> = { [K in keyof T]: [K, T[K]] };
type Tuple<T> = KeyToTupleObj<T>[keyof T];

// @ts-expect-error slight mismatches in types are ok.
// Temporal is in TC4, and been shipped to major browsers like Chrome and Safari
// so the API is extremely unlikely to change much anymore.
globalThis.Temporal ??= Temporal;

declare global {
  // generic overrides, from `codebloom`
  interface ObjectConstructor {
    entries<const T extends Record<PropertyKey, unknown>>(
      obj: T,
    ): Array<Tuple<T>>;

    keys<const T extends Record<PropertyKey, unknown>>(obj: T): Array<keyof T>;

    fromEntries<const T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
      entries: T,
    ): { [K in T[number] as K[0]]: K[1] };
  }
}