// src/lib/short-code.ts — 6-char codes with an unambiguous alphabet.

import { customAlphabet } from 'nanoid'

// No 0/O/1/I/L to avoid misreads.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const nano = customAlphabet(ALPHABET, 6)

export function generateShortCode(): string {
  return nano()
}
