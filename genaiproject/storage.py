from __future__ import annotations

import json
import shutil
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

from .config import settings


@dataclass
class Workspace:
    id: str
    root: Path

    @property
    def images_dir(self) -> Path:
        p = self.root / "images"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def outputs_dir(self) -> Path:
        p = self.root / "outputs"
        p.mkdir(parents=True, exist_ok=True)
        return p

    def save_json(self, name: str, data: dict) -> Path:
        path = self.outputs_dir / name
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return path


def create_workspace() -> Workspace:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    wid = f"job-{ts}-{uuid.uuid4().hex[:8]}"
    root = settings.base_output_dir / wid
    root.mkdir(parents=True, exist_ok=True)
    return Workspace(id=wid, root=root)


def copy_images_into_workspace(workspace: Workspace, image_paths: Iterable[str]) -> list[Path]:
    dest_paths: list[Path] = []
    for p in image_paths:
        src = Path(p).resolve()
        if not src.exists():
            raise FileNotFoundError(f"Image not found: {src}")
        dest = workspace.images_dir / src.name
        if src != dest:
            shutil.copyfile(src, dest)
        dest_paths.append(dest)
    return dest_paths


__all__ = ["Workspace", "create_workspace", "copy_images_into_workspace"]
