export const BATCH_SIZES = [1, 2, 3, 4, 5] as const;
export type BatchSize = (typeof BATCH_SIZES)[number];

export const BATCH_PROCESSING_SIZE_OPTIONS = BATCH_SIZES.map(size => ({
  value: String(size),
  label: size
})); 