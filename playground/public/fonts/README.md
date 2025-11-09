# JetBrains Mono Fonts

This directory should contain self-hosted JetBrains Mono font files.

## Required Files

Download from Google Fonts or the official JetBrains Mono repository:

- `jetbrains-mono-v13-latin-regular.woff2`
- `jetbrains-mono-v13-latin-500.woff2`
- `jetbrains-mono-v13-latin-600.woff2`
- `jetbrains-mono-v13-latin-700.woff2`

## Download Instructions

1. Visit https://fonts.google.com/specimen/JetBrains+Mono
2. Select weights: 400, 500, 600, 700
3. Download the font files
4. Convert to WOFF2 format if needed
5. Place in this directory

## Alternative

Use the official JetBrains Mono repository:
```bash
git clone https://github.com/JetBrains/JetBrainsMono.git temp
cp temp/fonts/webfonts/*.woff2 playground/public/fonts/
rm -rf temp
```

## License

JetBrains Mono is licensed under the OFL (SIL Open Font License).
See: https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt
