export interface UseDimensionValues {
    width: number
    height: number
}

export type Dimensions = UseDimensionValues

/**
 * Reports whether the dimensions changed by more than their threshold by calculating
 * distance between the previous dimensions and the current dimension using the coordinates
 * of the bottom left-hand corner
 * @param d1 The previous dimensions
 * @param d2 The current dimensions
 * @param threshold The distance threshold in pixels
 * @return `true` if the resize threshold was exceeded; `false` otherwise
 */
export function resizeThresholdExceeded(d1: Dimensions, d2: Dimensions, threshold: number): boolean {
    return (Math.sqrt(
        (d1.width - d2.width) * (d1.width - d2.width) +
        (d1.height - d2.height) * (d1.height - d2.height)
    )) > threshold
}
