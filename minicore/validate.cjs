#!/usr/bin/env node
/**
 * Simple validation script to check minicore structure
 * This validates the files are created correctly without running Deno
 */

const fs = require('fs');
const path = require('path');

const MINICORE_ROOT = __dirname;

const REQUIRED_FILES = [
  'core/minicore.ts',
  'core/validator.ts',
  'core/signer.ts',
  'core/sandbox.ts',
  'core/kernels/run_code.ts',
  'core/kernels/apply_policy.ts',
  'core/kernels/evaluate_prompt.ts',
  'schemas/atomic.schema.json',
  'examples/demo_span.json',
  'examples/code_execution.json',
  'examples/prompt_span.json',
  'tests/core.test.ts',
  'deno.json',
  'README.md',
  'cli.ts',
  'public/index.html'
];

console.log('🔍 Validating Minicore Structure\n');
console.log('═'.repeat(60));

let allValid = true;

REQUIRED_FILES.forEach(file => {
  const filePath = path.join(MINICORE_ROOT, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allValid = false;
  }
});

console.log('═'.repeat(60));

// Validate JSON files
console.log('\n📋 Validating JSON Files\n');

const jsonFiles = [
  'examples/demo_span.json',
  'examples/code_execution.json',
  'examples/prompt_span.json',
  'schemas/atomic.schema.json',
  'deno.json'
];

jsonFiles.forEach(file => {
  const filePath = path.join(MINICORE_ROOT, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`✅ ${file} - Valid JSON`);
  } catch (error) {
    console.log(`❌ ${file} - Invalid JSON: ${error.message}`);
    allValid = false;
  }
});

console.log('═'.repeat(60));

// Check TypeScript files have proper imports
console.log('\n📦 Checking TypeScript Files\n');

const tsFiles = [
  'core/minicore.ts',
  'core/validator.ts',
  'core/signer.ts',
  'core/sandbox.ts'
];

tsFiles.forEach(file => {
  const filePath = path.join(MINICORE_ROOT, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for export statements
  const hasExports = /export\s+(class|function|interface|type|const)/g.test(content);
  
  if (hasExports) {
    console.log(`✅ ${file} - Has exports`);
  } else {
    console.log(`⚠️  ${file} - No exports found`);
  }
});

console.log('═'.repeat(60));

if (allValid) {
  console.log('\n✅ All validation checks passed!\n');
  console.log('Minicore structure is complete and valid.');
  console.log('\nTo run with Deno:');
  console.log('  deno test --allow-all tests/core.test.ts');
  console.log('\nTo run CLI:');
  console.log('  deno run --allow-read cli.ts examples/demo_span.json');
  process.exit(0);
} else {
  console.log('\n❌ Some validation checks failed.\n');
  process.exit(1);
}
