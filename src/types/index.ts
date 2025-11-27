export interface CollectionItem {
  readonly id: string
  name: string
  description: string
  image256: string // Should be validated base64
  /** Optional remote URL returned by the upload API */
  remoteUrl?: string
  fingerprint: ReadonlyArray<number> // Should be fixed length
  readonly createdAt: number
  indexNumber?: number
}

export interface CreateItemInput {
  name: string
  description: string
  image256: string
  remoteUrl?: string
  fingerprint: ReadonlyArray<number>
}

export interface SimilarityResult {
  readonly euclidean: number
  readonly cosine: number
  readonly manhattan: number
  readonly isSimilar: boolean
}

export interface FingerprintResult {
  readonly fingerprint: number[];
  readonly canvas: string
}

export type CameraFacingMode = 'user' | 'environment'

export interface CameraOptions {
  facingMode: CameraFacingMode
}