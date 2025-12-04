from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse

from ..pipeline import ListingPipeline
from ..schemas import GenerationInputs
from ..storage import create_workspace


app = FastAPI(title="AI Product Listing Generator", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(
    images: List[UploadFile] = File(..., description="One or more product images"),
    hints: Optional[str] = Form(None),
    language: str = Form("en"),
):
    # Place uploaded files into a transient workspace images dir
    ws = create_workspace()
    saved_paths: List[str] = []
    for up in images:
        # normalize extension
        name = Path(up.filename or "image.jpg").name
        dest = ws.images_dir / name
        content = await up.read()
        dest.write_bytes(content)
        saved_paths.append(str(dest))

    pipeline = ListingPipeline()
    inputs = GenerationInputs(image_paths=saved_paths, hints=hints, language=language)
    result = pipeline.run(inputs)
    return JSONResponse(result.model_dump())

