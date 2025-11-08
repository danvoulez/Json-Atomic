# Json✯Atomic Playground

An ultra-professional, browser-only interactive playground for Json✯Atomic - the ledger-only constitutional governance platform.

## 🎯 Features

- **100% Browser-Based**: No server required - everything runs in your browser
- **Monaco Editor**: VSCode-like editing experience
- **Cryptographic Operations**: BLAKE3 hashing and Ed25519 signatures
- **Live Validation**: Real-time atomic structure validation
- **Examples**: Pre-built atomic examples to get started
- **Import/Export**: Save and load your atomics
- **Modern UI**: Beautiful dark theme with Tailwind CSS
- **Responsive**: Works on desktop and mobile

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the playground.

### Build for Production

```bash
# Build
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## 🎨 What You Can Do

### 1. Create Atomics
Build atomic transactions with the interactive editor

### 2. Validate
Check if your atomic meets all required field constraints

### 3. Canonicalize
Convert to deterministic JSON format for consistent hashing

### 4. Hash
Generate BLAKE3 cryptographic hashes

### 5. Sign
Digitally sign atomics with Ed25519 keys

### 6. Verify
Verify signatures and hash integrity

## 🛠️ Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Monaco Editor** - Code editor
- **Tailwind CSS** - Styling
- **@noble/hashes** - BLAKE3 hashing
- **@noble/curves** - Ed25519 signatures

## 📦 Deploy

The playground is a static site and can be deployed to:
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static hosting service

Just run `npm run build` and deploy the `dist/` folder.

## 🔒 Security

All cryptographic operations happen in the browser. Your private keys never leave your device.

## 📝 License

MIT
