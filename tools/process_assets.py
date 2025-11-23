# FILE: tools/process_assets.py
import os
import sys
from rembg import remove
from PIL import Image
from colorama import Fore, Style, init

# Initialize colors
init(autoreset=True)

RAW_DIR = "tools/assets/raw"
OUT_DIR = "public/images"

def log(msg, type="info"):
    if type == "info":
        print(f"{Fore.CYAN}[APEX SYSTEM]{Style.RESET_ALL} {msg}")
    elif type == "success":
        print(f"{Fore.GREEN}[SUCCESS]{Style.RESET_ALL} {msg}")
    elif type == "error":
        print(f"{Fore.RED}[ERROR]{Style.RESET_ALL} {msg}")

def process_image(filename):
    input_path = os.path.join(RAW_DIR, filename)

    # Create output filename (force .png for transparency)
    name_without_ext = os.path.splitext(filename)[0]
    output_filename = f"{name_without_ext}.png"
    output_path = os.path.join(OUT_DIR, output_filename)

    log(f"Processing asset: {filename}...", "info")

    try:
        # Open and Remove Background
        with open(input_path, 'rb') as i:
            with open(output_path, 'wb') as o:
                input_data = i.read()
                output_data = remove(input_data, alpha_matting=True)
                o.write(output_data)

        log(f"Background removed. Asset deployed to: {output_path}", "success")

    except Exception as e:
        log(f"Failed to process {filename}: {str(e)}", "error")

def main():
    if not os.path.exists(RAW_DIR):
        os.makedirs(RAW_DIR)
        log(f"Created raw directory at {RAW_DIR}", "info")

    files = [f for f in os.listdir(RAW_DIR) if os.path.isfile(os.path.join(RAW_DIR, f)) and not f.startswith('.')]

    if not files:
        log("No new assets found in tools/assets/raw", "info")
        return

    for file in files:
        process_image(file)

if __name__ == "__main__":
    main()
