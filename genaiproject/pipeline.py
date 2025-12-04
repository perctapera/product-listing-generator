from __future__ import annotations

from pathlib import Path
from typing import List

from .schemas import (
    GenerationInputs,
    ListingMetadata,
    ListingAttributes,
    GeneratedAssets,
    GenerationResult,
)
from .providers import VisionProvider, ImageGenProvider, VideoGenProvider
from .storage import create_workspace, copy_images_into_workspace


class ListingPipeline:
    def __init__(self):
        self.vision = VisionProvider()
        self.image_gen = ImageGenProvider()
        self.video_gen = VideoGenProvider()

    def run(self, inputs: GenerationInputs) -> GenerationResult:
        ws = create_workspace()
        local_images: List[Path] = copy_images_into_workspace(ws, inputs.image_paths)

        # 1) Describe product from images (stub)
        obs = self.vision.describe(local_images, hints=inputs.hints, language=inputs.language)
        metadata = ListingMetadata(
            title=obs.title,
            bullets=obs.bullets,
            description=self._compose_description(obs, inputs.hints),
            seo_tags=obs.seo_tags,
            attributes=obs.attributes,
        )

        # 2) Generate supplementary visuals (stub)
        suppl = self.image_gen.generate_supplementary(local_images, ws.outputs_dir)

        # 3) Generate short marketing GIF (stub)
        gif_path = self.video_gen.generate_short_gif(local_images, ws.outputs_dir)

        assets = GeneratedAssets(
            supplementary_images=[str(p) for p in suppl],
            marketing_gif=str(gif_path) if gif_path else None,
        )

        result = GenerationResult(
            metadata=metadata,
            assets=assets,
            workspace_dir=str(ws.root),
        )

        # persist JSON outputs for convenience
        ws.save_json("metadata.json", result.metadata.model_dump())
        ws.save_json("assets.json", result.assets.model_dump())
        ws.save_json("result.json", result.model_dump())

        return result

    @staticmethod
    def _compose_description(obs, hints: str | None) -> str:
        parts: List[str] = []
        parts.append(obs.title)
        parts.append("")
        parts.extend([f"• {b}" for b in obs.bullets])
        if hints:
            parts.append("")
            parts.append(f"Notes from seller: {hints}")
        parts.append("")
        parts.append("Carefully crafted and photographed for clarity. Colors may vary slightly across screens.")
        return "\n".join(parts)


__all__ = ["ListingPipeline"]
