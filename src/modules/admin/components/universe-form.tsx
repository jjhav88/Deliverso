"use client";

import { useState } from "react";
import { MediaPicker, type MediaPickerItem } from "@/modules/admin/components/media-picker";
import { TaxonomyForm } from "@/modules/admin/components/taxonomy-form";
import { saveUniverseAction } from "@/modules/catalog/taxonomy-actions";
import type { AdminUniverseFormState } from "@/modules/catalog/queries";

type UniverseFormProps = {
  initial: AdminUniverseFormState;
  media: MediaPickerItem[];
  flash?: string | null;
};

export function UniverseForm({ initial, media, flash }: UniverseFormProps) {
  const [mediaId, setMediaId] = useState(initial.featuredMediaAssetId);
  const [mediaUrl, setMediaUrl] = useState(initial.featuredMediaUrl);

  return (
    <TaxonomyForm
      title={initial.id ? "Editar universo" : "Nuevo universo"}
      action={saveUniverseAction}
      flash={flash}
      initial={{
        id: initial.id,
        isActive: initial.isActive,
        sortOrder: initial.sortOrder,
        es: initial.es,
        en: initial.en,
      }}
      extra={
        <div className="mt-6 max-w-xs">
          <input type="hidden" name="featuredMediaAssetId" value={mediaId ?? ""} />
          <MediaPicker
            label="Imagen (opcional)"
            items={media}
            selectedId={mediaId}
            selectedUrl={mediaUrl}
            onSelect={(id, url) => {
              setMediaId(id);
              setMediaUrl(url);
            }}
          />
        </div>
      }
    />
  );
}
