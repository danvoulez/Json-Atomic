/**
 * Browser build script
 * Generates ESM bundles for browser environment using esbuild
 *
 * Output:
 * - dist/browser/minicore.browser.js - Main SDK bundle
 * - dist/browser/minicore.worker.js - Web Worker bundle
 *
 * Features:
 * - Tree-shaking to remove server-only code
 * - ESM format for modern browsers
 * - Chrome 110+ target
 * - @noble/hashes and @noble/curves included (web-compatible)
 */

import * as esbuild from 'npm:esbuild@0.24.0'

const commonConfig: esbuild.BuildOptions = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome110', 'firefox115', 'safari16'],
  treeShaking: true,
  minify: false, // Set to true for production
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    global: 'globalThis'
  },
  logLevel: 'info'
}

console.log('🔨 Building browser bundles...\n')

try {
  // Build main SDK bundle
  await esbuild.build({
    ...commonConfig,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/browser/minicore.browser.js',
    banner: {
      js: '// @logline/minicore - Browser bundle\n// Generated: ' + new Date().toISOString()
    }
  })

  console.log('✓ Main bundle: dist/browser/minicore.browser.js')

  // Build Web Worker bundle separately
  await esbuild.build({
    ...commonConfig,
    entryPoints: ['src/workers/sandbox.worker.ts'],
    outfile: 'dist/browser/minicore.worker.js',
    banner: {
      js: '// @logline/minicore - Web Worker bundle\n// Generated: ' + new Date().toISOString()
    }
  })

  console.log('✓ Worker bundle: dist/browser/minicore.worker.js')

  console.log('\n✅ Browser bundles built successfully!')
  console.log('\nUsage:')
  console.log('  <script type="module">')
  console.log('    import { Minicore } from "./dist/browser/minicore.browser.js"')
  console.log('    const mc = new Minicore()')
  console.log('  </script>')
} catch (error) {
  console.error('❌ Build failed:', error)
  Deno.exit(1)
} finally {
  esbuild.stop()
}
