from __future__ import annotations

from typing import List, Optional, Dict
from pydantic import BaseModel, Field, HttpUrl


class GenerationInputs(BaseModel):
    image_paths: List[str] = Field(..., description="Local file paths to product images")
    hints: Optional[str] = Field(None, description="Optional seller hints/brand voice notes")
    language: str = Field("en", description="Locale for generated copy")


class ListingAttributes(BaseModel):
    brand: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    custom: Dict[str, str] = Field(default_factory=dict)


class ListingMetadata(BaseModel):
    title: str
    bullets: List[str]
    description: str
    seo_tags: List[str]
    attributes: ListingAttributes


class GeneratedAssets(BaseModel):
    supplementary_images: List[str] = Field(default_factory=list, description="Paths to generated images")
    marketing_gif: Optional[str] = Field(None, description="Path to animated GIF simulating short video")


class GenerationResult(BaseModel):
    metadata: ListingMetadata
    assets: GeneratedAssets
    workspace_dir: str


# Marketplace adapters — simple shapers for now

class EtsyListing(BaseModel):
    title: str
    description: str
    tags: List[str]
    materials: List[str] = Field(default_factory=list)

    @staticmethod
    def from_generic(meta: ListingMetadata) -> "EtsyListing":
        materials = [m for m in [meta.attributes.material] if m]
        return EtsyListing(
            title=meta.title[:139],
            description=meta.description,
            tags=meta.seo_tags[:13],
            materials=materials,
        )


class ShopifyProduct(BaseModel):
    title: str
    body_html: str
    tags: str

    @staticmethod
    def from_generic(meta: ListingMetadata) -> "ShopifyProduct":
        return ShopifyProduct(
            title=meta.title,
            body_html=meta.description,
            tags=", ".join(meta.seo_tags),
        )


class AmazonListing(BaseModel):
    item_name: str
    product_description: str
    bullet_points: List[str]
    generic_keywords: str

    @staticmethod
    def from_generic(meta: ListingMetadata) -> "AmazonListing":
        return AmazonListing(
            item_name=meta.title[:199],
            product_description=meta.description,
            bullet_points=meta.bullets[:5],
            generic_keywords=" ".join(meta.seo_tags)[:249],
        )


__all__ = [
    "GenerationInputs",
    "ListingAttributes",
    "ListingMetadata",
    "GeneratedAssets",
    "GenerationResult",
    "EtsyListing",
    "ShopifyProduct",
    "AmazonListing",
]
