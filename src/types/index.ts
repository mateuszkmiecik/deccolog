export interface TagInfo {
  id: number
  name: string
}

export interface CollectionItem {
  readonly id: number
  name: string
  photoUrl: string
  fingerprint: string
  tags?: TagInfo[]
  readonly createdAt: number
}

export type CollectionItemInput = Omit<CollectionItem, 'id' | 'createdAt'>

export interface SimilarityResult {
  readonly euclidean: number
  readonly cosine: number
  readonly manhattan: number
  readonly isSimilar: boolean
}

export interface FingerprintResult {
  readonly fingerprint: string;
  readonly canvas: string
}

export type CameraFacingMode = 'user' | 'environment'

export interface CameraOptions {
  facingMode: CameraFacingMode
}