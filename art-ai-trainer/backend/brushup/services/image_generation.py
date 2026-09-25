"""Load optional ML dependencies only when a reference is requested."""
from threading import Lock

class GenerationUnavailable(RuntimeError):
    pass

class GenerationOutOfMemory(RuntimeError):
    pass

class ImageGenerationService:
    def __init__(self, model_id):
        self.model_id = model_id
        self.pipeline = None
        self.lock = Lock()

    def generate(self, prompt, negative_prompt=None):
        # A pipeline is shared per app; serialize loading and inference.
        with self.lock:
            try:
                import torch
                from diffusers import StableDiffusionPipeline
                if self.pipeline is None:
                    device = "cuda" if torch.cuda.is_available() else (
                        "mps" if torch.backends.mps.is_available() else "cpu")
                    dtype = torch.float32 if device == "cpu" else torch.float16
                    pipeline = StableDiffusionPipeline.from_pretrained(self.model_id, torch_dtype=dtype)
                    self.pipeline = pipeline.to(device)
            except Exception as exc:
                raise GenerationUnavailable("Image generation service is unavailable.") from exc

            try:
                with torch.no_grad():
                    images = self.pipeline(prompt=prompt, negative_prompt=negative_prompt or None,
                                           num_inference_steps=30, guidance_scale=7.5).images
            except torch.cuda.OutOfMemoryError as exc:
                raise GenerationOutOfMemory() from exc
            if not images:
                raise RuntimeError("No image output from model")
            return images[0]
