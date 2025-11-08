#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std/flags/mod.ts"
import { Ledger } from '../../core/ledger/ledger.ts'
import { LedgerVerifier } from '../../core/ledger/verifyLedger.ts'
import { canonicalize } from '../../core/canonical.ts'
import { signAtomic } from '../../core/crypto.ts'

const VERSION = '1.0.0'
...
// -- código completo conforme fornecido --