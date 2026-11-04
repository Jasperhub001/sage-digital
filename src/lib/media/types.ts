export interface MediaAsset {
  /** Object path inside the bucket, e.g. `library/123-name.jpg` */
  path: string
  /** Display filename (last path segment) */
  name: string
  /** Public HTTPS URL for use in cover_image / gallery_images */
  publicUrl: string
  size: number | null
  updatedAt: string | null
}

export interface MediaUploadResult {
  asset: MediaAsset
  fileName: string
}

export interface MediaValidationError {
  fileName: string
  message: string
}
