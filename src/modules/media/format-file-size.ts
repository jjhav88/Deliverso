export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

export type UploadSelection = {
  previewUrl: string | null;
  fileName: string | null;
  fileSizeLabel: string | null;
};

export function emptyUploadSelection(): UploadSelection {
  return {
    previewUrl: null,
    fileName: null,
    fileSizeLabel: null,
  };
}

export function revokeUploadPreview(previewUrl: string | null) {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
}
