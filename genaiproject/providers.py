from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from PIL import Image, ImageDraw, ImageFont

from .schemas import ListingAttributes, ListingMetadata


# -------- Vision Provider (stub) --------


@dataclass
class VisionObservation:
    title: str
    bullets: List[str]
    attributes: ListingAttributes
    seo_tags: List[str]


class VisionProvider:
    def describe(self, images: List[Path], hints: Optional[str], language: str = "en") -> VisionObservation:
        # Simple heuristic from image size and filename; replace with API integration later.
        primary = images[0]
        with Image.open(primary) as im:
            w, h = im.size
        base_name = primary.stem.replace("_", " ").replace("-", " ").title()
        if not base_name or base_name.lower().startswith("img"):
            base_name = "Handcrafted Product"

        title = f"{base_name} – Premium Quality"
        bullets = [
            f"High-quality build ({w}x{h} px photo)",
            "Thoughtful design for everyday use",
            "Great gift idea",
            "Ships fast",
        ]
        if hints:
            bullets.append(f"Seller notes: {hints[:60]}…" if len(hints) > 60 else f"Seller notes: {hints}")

        attributes = ListingAttributes(
            brand=None,
            material=None,
            color=None,
            size=None,
        )
        seo_tags = [
            base_name.split(" ")[0].lower(),
            "handmade",
            "gift",
            "unique",
        ]
        return VisionObservation(title=title, bullets=bullets, attributes=attributes, seo_tags=seo_tags)


# -------- Image Generation Provider (stub using Pillow) --------


class ImageGenProvider:
    def generate_supplementary(self, images: List[Path], out_dir: Path) -> List[Path]:
        out_paths: List[Path] = []
        for idx, src in enumerate(images[:3], start=1):
            with Image.open(src).convert("RGBA") as im:
                overlay = Image.new("RGBA", im.size, (255, 255, 255, 0))
                draw = ImageDraw.Draw(overlay)
                text = "Lifestyle Mockup"
                # simple rectangle banner
                draw.rectangle([(10, 10), (int(im.width * 0.6), 60)], fill=(255, 255, 255, 180))
                draw.text((20, 20), text, fill=(0, 0, 0, 255))
                composed = Image.alpha_composite(im, overlay).convert("RGB")
                dest = out_dir / f"supplementary_{idx}.jpg"
                composed.save(dest, quality=90)
                out_paths.append(dest)
        return out_paths


# -------- Video Generation Provider (stub as animated GIF) --------


class VideoGenProvider:
    def generate_short_gif(self, images: List[Path], out_dir: Path) -> Path:
        frames: List[Image.Image] = []
        for src in images[:5]:
            with Image.open(src).convert("RGB") as im:
                frames.append(im.copy())
        if not frames:
            # create a dummy frame
            frames = [Image.new("RGB", (512, 512), (240, 240, 240))]
        dest = out_dir / "marketing.gif"
        frames[0].save(dest, save_all=True, append_images=frames[1:], duration=500, loop=0)
        return dest


__all__ = [
    "VisionProvider",
    "VisionObservation",
    "ImageGenProvider",
    "VideoGenProvider",
]
