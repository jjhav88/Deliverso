"use client";

import { useState } from "react";
import Image from "next/image";
import type { CatalogImage } from "@/modules/catalog/public/types";
import "@/modules/catalog/catalog.css";

type ProductGalleryProps = {
  images: CatalogImage[];
  productName: string;
  emptyLabel: string;
};

export function ProductGallery({
  images,
  productName,
  emptyLabel,
}: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? null;

  if (!current) {
    return (
      <div className="catalog-gallery-main" role="img" aria-label={emptyLabel}>
        <ProductImagePlaceholder />
      </div>
    );
  }

  return (
    <div className="catalog-gallery">
      <div className="catalog-gallery-main">
        <Image
          src={current.src}
          alt={current.alt || productName}
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="catalog-gallery-thumbs" role="group" aria-label={productName}>
          {images.map((image, imageIndex) => (
            <button
              key={image.src}
              type="button"
              className="catalog-gallery-thumb"
              aria-pressed={imageIndex === index}
              aria-label={image.alt || `${productName} ${imageIndex + 1}`}
              onClick={() => setIndex(imageIndex)}
            >
              <Image
                src={image.src}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductImagePlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,color-mix(in_srgb,var(--deliverso-lilac)_22%,var(--deliverso-cream)),var(--deliverso-cream)_62%)]"
    />
  );
}
