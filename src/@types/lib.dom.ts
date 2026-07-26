/* eslint-disable @typescript-eslint/no-empty-object-type */
/* These are intentional brand marker augmentations — no members needed. */

import type { RevealPrivateExempt } from "../private.js";

declare global {
  interface Document extends RevealPrivateExempt {}
  interface HTMLElement extends RevealPrivateExempt {}
  interface Node extends RevealPrivateExempt {}
  interface Element extends RevealPrivateExempt {}
  interface Event extends RevealPrivateExempt {}
  interface Window extends RevealPrivateExempt {}
  interface NodeList extends RevealPrivateExempt {}
  interface StyleSheet extends RevealPrivateExempt {}
}
