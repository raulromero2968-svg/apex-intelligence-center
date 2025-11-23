# Apex Asset Pipeline

**CLI-based image processing system for automated background removal and web optimization.**

## Architecture

```
tools/
├── assets/
│   ├── raw/          # Drop zone for unprocessed images
│   └── processed/    # Staging area (future use)
├── process_assets.py # AI background removal script
└── README.md         # This file
```

## Quick Start

### 1. Add Raw Image

Drop your image files into `tools/assets/raw/`:

```bash
cp /path/to/your/image.jpg tools/assets/raw/
```

### 2. Run Processing Pipeline

```bash
npm run assets:process
```

### 3. Retrieve Output

Processed images appear in `public/images/` as transparent PNGs:

```
Input:  tools/assets/raw/wolf_head.jpg
Output: public/images/wolf_head.png
```

## Features

- **AI Background Removal**: Uses `rembg` with U-2-Net deep learning model
- **Automatic PNG Conversion**: Forces transparency-compatible format
- **Batch Processing**: Processes all files in `raw/` directory
- **Color-Coded Logging**: Cyan (info), Green (success), Red (errors)
- **Auto-Installation**: Dependencies install on first run

## Dependencies

The pipeline installs these Python packages automatically:

- `rembg` - AI background removal
- `pillow` - Image processing
- `colorama` - Terminal colors
- `onnxruntime` - ML model runtime

## Production Deployment Notes

### Model Download Requirement

`rembg` requires downloading a **176MB ONNX model** (`u2net.onnx`) from GitHub releases on first run. This downloads to `~/.u2net/` and is cached for future use.

**Environment Restrictions:**

If running in restricted environments (sandboxed containers, firewalled networks), the model download may fail with:

```
403 Client Error: Forbidden for url: https://release-assets.githubusercontent.com/...
```

### Solutions for Production

**Option A: Pre-cache Model** (Recommended for CI/CD)

Download the model manually and include it in your deployment:

```bash
# Download to local cache
mkdir -p ~/.u2net
wget https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx \
  -O ~/.u2net/u2net.onnx
```

**Option B: Run in GitHub Actions/Vercel**

Cloud environments typically have unrestricted GitHub access:

```yaml
# .github/workflows/process-assets.yml
name: Process Assets
on:
  push:
    paths:
      - 'tools/assets/raw/**'
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run assets:process
      - run: git add public/images && git commit -m "chore: Process assets"
```

**Option C: Alternative Tools**

For simpler use cases without AI:

- `sharp` (Node.js image optimization)
- `imagemin` (lossless compression)
- PIL manual transparency detection

## Usage Examples

### Single Image

```bash
# 1. Drop image
cp logo-with-background.png tools/assets/raw/

# 2. Process
npm run assets:process

# 3. Output appears at:
# public/images/logo-with-background.png (transparent background)
```

### Batch Processing

```bash
# 1. Drop multiple images
cp *.jpg tools/assets/raw/

# 2. Process all
npm run assets:process

# 3. All outputs in public/images/
```

## Script Details

`process_assets.py` does the following:

1. Scans `tools/assets/raw/` for image files
2. For each image:
   - Reads file as binary
   - Passes to `rembg.remove()` with alpha matting
   - Writes transparent PNG to `public/images/`
3. Logs results with color-coded status

## Future Enhancements

- [ ] Upload processed images to CDN automatically
- [ ] Support custom output formats (WebP, AVIF)
- [ ] Add image optimization (compression, resize)
- [ ] Integrate with Next.js Image component metadata
- [ ] Support video background removal (FFmpeg + rembg)

## Troubleshooting

**Issue: "No new assets found"**
- Check that files are in `tools/assets/raw/` (not subdirectories)
- Ensure files don't start with `.` (hidden files are skipped)

**Issue: "Failed to process"**
- Verify image file is valid (not corrupted)
- Check Python 3.11+ is installed
- Ensure sufficient disk space for model download (~200MB)

**Issue: Model download fails (403/Network error)**
- See "Production Deployment Notes" above
- Pre-cache model or run in unrestricted environment

## Engineering Philosophy

This pipeline follows Apex's **Developer Experience** principles:

> "Drop an image in a folder, run one command, get production-ready output."

No Photoshop. No manual editing. Just systematic, repeatable processes.

---

**Last Updated:** 2025-11-23
**Maintainer:** Apex Intelligence Engineering
