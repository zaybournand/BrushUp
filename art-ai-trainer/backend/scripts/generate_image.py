import torch
from diffusers import StableDiffusionPipeline
import os
from pathlib import Path
from datetime import datetime

model_id = "runwayml/stable-diffusion-v1-5"

if torch.backends.mps.is_available():
    device = "mps"
    torch_dtype_to_use = torch.float16 
    print("MPS (Apple Silicon GPU) is available and will be used.")
else:
    device = "cpu"
    torch_dtype_to_use = torch.float32 
    print("MPS is not available. Falling back to CPU. This will be significantly slower.")
    print("If you are on an M1/M2/M3 Mac, ensure PyTorch is installed with MPS support.")

print(f"Loading model '{model_id}'...")

try:
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch_dtype_to_use,
        variant="fp16" if device == "mps" else None
    )
    pipe = pipe.to(device) 
    if device == "mps":
        pipe.enable_attention_slicing()
        
    print("Model loaded successfully with memory optimizations.")
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

output_dir = Path(__file__).resolve().parents[1] / "generated_images"
os.makedirs(output_dir, exist_ok=True) 

while True:
    prompt = input("\nEnter your image prompt (or type 'quit' to exit): ").strip()
    if prompt.lower() == 'quit':
        print("Exiting image generator.")
        break
    if not prompt:
        print("Prompt cannot be empty. Please try again.")
        continue

    negative_prompt = input("Enter a negative prompt (optional, e.g., 'blurry, low quality, bad anatomy'): ").strip()
    if not negative_prompt:
        negative_prompt = None

    num_images_to_generate = 1 

    print(f"Generating image for prompt: '{prompt}' on {device}...")
    try:
        with torch.no_grad(): 
            results = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=25,  
                guidance_scale=7.5,     
                num_images_per_prompt=num_images_to_generate
            )

        generated_image = results.images[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = os.path.join(output_dir, f"generated_image_{timestamp}.png")
        generated_image.save(image_filename)
        print(f"Image saved as {image_filename}")

    except torch.cuda.OutOfMemoryError: 
        print("\nError: Out of GPU memory. Try reducing num_inference_steps, num_images_per_prompt, or restarting your Mac to free up memory.")
        print("For 8GB RAM, this can happen if other apps are consuming a lot of memory.")
    except Exception as e: 
        print(f"\nAn unexpected error occurred during image generation: {e}")
        print("Please check your prompt, system resources, and PyTorch installation.")
