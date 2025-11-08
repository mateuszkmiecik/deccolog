export const CONFIG = {
  IMAGE: {
    CAPTURE_SIZE: 256,
    FINGERPRINT_SIZE: 32,
    JPEG_QUALITY: 0.8
  },
  CAMERA: {
    FACING_MODE: 'environment' as const,
    STREAM_TIMEOUT: 100
  },
  SIMILARITY: {
    DEFAULT_THRESHOLD: 0.5
  },
  DATABASE: {
    NAME: 'CollectionDB',
    VERSION: 1,
    STORE_NAME: 'items'
  }
} as const

export const MESSAGES = {
  ERRORS: {
    CAMERA_PERMISSION: 'Unable to access camera. Please check permissions.',
    IMAGE_PROCESSING: 'Failed to process image',
    ADD_ITEM: 'Failed to add item to collection',
    NO_IMAGE: 'Please capture an image before adding to collection'
  },
  PLACEHOLDERS: {
    ITEM_NAME: 'Enter item name',
    ITEM_DESCRIPTION: 'Enter item description'
  }
} as const