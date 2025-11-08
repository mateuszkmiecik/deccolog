export class AppError extends Error {
  public code: string
  public userMessage?: string

  constructor(message: string, code: string, userMessage?: string) {
    super(message)
    this.code = code
    this.userMessage = userMessage
    this.name = 'AppError'
  }
}

export class CameraError extends AppError {
  constructor(message: string, userMessage = 'Unable to access camera. Please check permissions.') {
    super(message, 'CAMERA_ERROR', userMessage)
  }
}

export class ImageProcessingError extends AppError {
  constructor(message: string, userMessage = 'Failed to process image') {
    super(message, 'IMAGE_PROCESSING_ERROR', userMessage)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, userMessage = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', userMessage)
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 'An unexpected error occurred')
  }
  
  return new AppError('Unknown error', 'UNKNOWN_ERROR', 'An unexpected error occurred')
}