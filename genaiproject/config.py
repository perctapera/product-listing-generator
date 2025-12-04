import os
from pathlib import Path


class Settings:
    # Provider keys (optional for offline stubs)
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")

    # Storage
    base_output_dir: Path = Path(os.getenv("GENAI_OUTPUT_DIR", "outputs")).resolve()

    # Toggles
    enable_real_openai: bool = bool(openai_api_key)


settings = Settings()

__all__ = ["settings", "Settings"]
