from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

import typer
from rich import print
from rich.panel import Panel

from .pipeline import ListingPipeline
from .schemas import GenerationInputs


app = typer.Typer(add_completion=False, help="AI Product Listing Generator CLI")


@app.command()
def generate(
    images: List[Path] = typer.Argument(..., exists=True, readable=True, help="One or more product image paths"),
    hints: Optional[str] = typer.Option(None, help="Optional seller hints/brand voice"),
    language: str = typer.Option("en", help="Language locale for copy"),
):
    """Generate listing metadata and assets from images."""
    pipeline = ListingPipeline()
    inputs = GenerationInputs(image_paths=[str(p) for p in images], hints=hints, language=language)
    result = pipeline.run(inputs)

    print(Panel.fit("Generation complete", title="genai-listing"))
    print("Workspace:", result.workspace_dir)
    print()
    print("Title:", result.metadata.title)
    print("Bullets:")
    for b in result.metadata.bullets:
        print(" -", b)
    print("SEO tags:", ", ".join(result.metadata.seo_tags))
    print()
    print("Assets:")
    for p in result.assets.supplementary_images:
        print(" -", p)
    if result.assets.marketing_gif:
        print(" -", result.assets.marketing_gif)

    # also dump a compact json to stdout if user pipes it
    typer.echo(json.dumps(result.model_dump(), ensure_ascii=False))


if __name__ == "__main__":
    app()
