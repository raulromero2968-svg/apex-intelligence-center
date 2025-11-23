# FILE: tools/process_assets.py
import os
import time
from rembg import remove
from PIL import Image, ImageFilter
from colorama import Fore, Style, init

# Initialize terminal colors
init(autoreset=True)

# CONFIGURATION
RAW_DIR = "tools/assets/raw"
PROCESSED_DIR = "public/images"
# Fuzziness for standard transparency (optional, rembg handles most)
# Increase if you see jagged edges on holograms
ALPHA_MATTING = True

def log(msg, type="info"):
    timestamp = time.strftime("%H:%M:%S")
    if type == "info":
        print(f"{Fore.CYAN}[APEX {timestamp}]{Style.RESET_ALL} {msg}")
    elif type == "success":
        print(f"{Fore.GREEN}[SUCCESS]{Style.RESET_ALL} {msg}")
    elif type == "warn":
        print(f"{Fore.YELLOW}[WARNING]{Style.RESET_ALL} {msg}")
    elif type == "error":
        print(f"{Fore.RED}[ERROR]{Style.RESET_ALL} {msg}")

def ensure_dirs():
    if not os.path.exists(RAW_DIR):
        os.makedirs(RAW_DIR)
        log(f"Created input directory: {RAW_DIR}", "warn")

    # We don't create public/images as it should exist in Next.js,
    # but we check for it.
    if not os.path.exists(PROCESSED_DIR):
        os.makedirs(PROCESSED_DIR)
        log(f"Created output directory: {PROCESSED_DIR}", "warn")

def process_image(filename):
    input_path = os.path.join(RAW_DIR, filename)
    name_no_ext = os.path.splitext(filename)[0]
    output_filename = f"{name_no_ext}.png" # Force PNG for transparency
    output_path = os.path.join(PROCESSED_DIR, output_filename)

    log(f"Processing artifact: {filename}...", "info")

    try:
        with open(input_path, 'rb') as i:
            input_data = i.read()

            # APEX CORE: Remove Background
            output_data = remove(
                input_data,
                alpha_matting=ALPHA_MATTING,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )

            with open(output_path, 'wb') as o:
                o.write(output_data)

        # Optimization check (optional: resize if massive)
        with Image.open(output_path) as img:
            w, h = img.size
            log(f"Dimensions: {w}x{h}px", "info")
            if w > 2000 or h > 2000:
                log("Asset is large. Consider resizing for web performance.", "warn")

        log(f"Asset deployed to: {output_path}", "success")

        # Optional: Move raw file to 'archive' so it's not re-processed
        # os.rename(input_path, os.path.join("tools/assets/archive", filename))

    except Exception as e:
        log(f"Processing failure for {filename}: {e}", "error")

def main():
    ensure_dirs()

    files = [f for f in os.listdir(RAW_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

    if not files:
        log("No raw assets detected. Drop files in 'tools/assets/raw' to initiate.", "warn")
        return

    log(f"Detected {len(files)} assets. Initializing batch processing...", "info")
    for file in files:
        process_image(file)

if __name__ == "__main__":
    main()
