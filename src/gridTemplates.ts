export enum TrackSizeType {
    Pixel= 'px',
    Percentage = '%',
    Fraction = 'fr',
    // Auto = 'auto'
}

// const PixelRegex = /[0-9]+px/i
// const PercentageRegex = /[0-9]+%/
// const FractionRegex = /[0-9]+fr/
// const AutoRegex = /auto/i

export interface GridTrackSize {
    amount?: number
    sizeType: TrackSizeType
    asString: () => string
}

/**
 * Names for the grid line (i.e. represented in css as [name1 name2 ... nameN]
 */
export interface GridLineNames {
    names: Array<string>
    asString: () => string
}

/**
 * The css grid-track which holds the names of the grid-lines to the left of the
 * track and the size of the track
 */
export interface GridTrack {
    lineNames?: GridLineNames
    track: GridTrackSize
}

/**
 * The css grid-template-row or grid-template-column holding the track-list (which
 * hold the names of the grid-line to the left of the track), the names of the
 * last grid-line (optional), a function for calculating the track sizes given
 * the container (width or height) dimension and (row or column) gap size, and a
 * function for converting the grid-template to a string that can be handed
 * directly to a css grid-template-row or grid-template-column.
 */
export interface GridTrackTemplate {
    trackList: Array<GridTrack>
    lastLineNames?: GridLineNames
    trackSizes: (containerDimension: number, gap?: number) => Array<number>
    asString: () => string
}

export const emptyGridTrackTemplate = (): GridTrackTemplate => ({
    trackList: [],
    trackSizes: () => [],
    asString: () => ""
})

/**
 * Interface defining the grid-template-row or grid-template-column builder. You can create the
 * builder with the [gridTrackTemplateBuilder](#gridTrackTemplateBuilder) function.
 */
export interface GridTrackTemplateBuilder {
    readonly template: GridTrackTemplate
    addTrack: (track: GridTrackSize, lineNames?: GridLineNames) => GridTrackTemplateBuilder
    repeatFor: (times: number, ...track: Array<GridTrack>) => GridTrackTemplateBuilder
    build: (lastLineNames?: GridLineNames) => GridTrackTemplate
}

/**
 * Creates a new grid
 */
export function gridTrackTemplateBuilder(): GridTrackTemplateBuilder {
    const template = emptyGridTrackTemplate()

    /**
     * Adds a track to the grid-template and the line-names located to the left of the track
     * @param template The grid-template-row or grid-template-column
     * @param track The array of grid-tracks
     * @param lineNames The (optional) line names located to the left of the track
     * @return A grid-track-template-builder object with the updated tracks based on the repeat function
     */
    function addTrackTo(template: GridTrackTemplate, track: GridTrackSize, lineNames?: GridLineNames): GridTrackTemplateBuilder {
        template.trackList.push({lineNames, track})
        return updateBuilder(template)
    }

    // todo doesn't yet support 'auto-fill' or 'auto-fit' from the 'times' parameter
    /**
     * Repeats the array of grid tracks by the specified number of times.
     * @param template The grid-template-row or grid-template-column
     * @param times The number of times to repeat the track
     * @param track The array of grid-tracks
     * @return A grid-track-template-builder object with the updated tracks based on the repeat function
     */
    function repeatFor(template: GridTrackTemplate, times: number, ...track: Array<GridTrack>): GridTrackTemplateBuilder {
        for (let i = 0; i < times; ++i) {
            template.trackList.push(...track)
        }
        return updateBuilder(template)
    }

    // todo doesn't yet account for 'auto'
    /**
     * Calculates the track size (does not account for the gaps, spans, etc. Those are applied in
     * the grid cell size calculation
     * @param template The grid track template defining the grid layout
     * @param containerSize The container size for either the row of the column, depending on whether the
     * grid track template represents a grid-template-rows or grid-template-columns, respectively
     * @param gap The gap between the rows or columns
     * @return An array of track sizes that have been adjusted for the gap
     */
    function trackSizesFor(template: GridTrackTemplate, containerSize: number, gap: number): Array<number> {
        // first set all the fixed and percentage sizes
        const dimensions = template.trackList.map(track => {
            switch(track.track.sizeType) {
                case TrackSizeType.Pixel:
                    return track.track.amount || 0
                case TrackSizeType.Percentage:
                    return Math.floor(containerSize * (track.track.amount || 0) / 100)
                case TrackSizeType.Fraction:
                    return -(track.track.amount || 0)
                // case TrackSizeType.Auto:
                default:
                    return NaN
            }
        })

        const totalGaps = (template.trackList.length - 1) * gap

        // apportion the fractional sizes
        const usedSpace = totalGaps + dimensions
            .filter(size => size > 0 && !isNaN(size))
            .reduce((a, b) => a + b, 0)

        if (usedSpace >= containerSize) {
            // when all the space is used up, then set the fractional sizes to 0
            dimensions.forEach((size, index, dims) => {
                if (size < 0 || isNaN(size)) {
                    dims[index] = 0
                }
            })
        } else {
            // there is space available to apportion to the remaining tracks
            // 1. calculate the total fraction number (recall that the fractional numbers are negative)
            const totalFraction = dimensions
                .filter(size => size < 0)
                .map(size => -size)
                .reduce((a, b) => a + b, 0)
            // 2. apportion the fractions to the remaining space
            dimensions.forEach((size, index, dims) => {
                if (size < 0) {
                    dims[index] = (-size / totalFraction) * (containerSize - usedSpace)
                }
            })
        }

        return dimensions
    }

    /**
     * Builds the grid-template-rows or grid-template-columns
     * @param template The grid-template-rows or grid-template-columns template
     * @param lastLineNames The line-names for the last grid line (i.e. the one located to the right
     * of the last grid-track).
     * @return the grid-template-rows or grid-template-columns with the functions to get the track
     * sizes, and convert the template to a CSS string
     */
    function build(template: GridTrackTemplate, lastLineNames?: GridLineNames): GridTrackTemplate {
        return {
            trackList: template.trackList,
            lastLineNames,
            trackSizes: (containerSize: number, gap?: number) => trackSizesFor(template, containerSize, gap || 0),
            asString: () => gridTrackTemplateAsString(template.trackList, lastLineNames)
        }
    }

    /**
     * Private function that update the grid track template builder with the new grid track template,
     * and updates the public functions for the builder
     * @param template The update grid track template
     * @return An updated grid-track-template builder
     */
    function updateBuilder(template: GridTrackTemplate): GridTrackTemplateBuilder {
        return {
            template,
            addTrack: (track: GridTrackSize, lineNames?: GridLineNames) => addTrackTo(template, track, lineNames),
            repeatFor: (times: number, ...track: Array<GridTrack>) => repeatFor(template, times, ...track),
            build: (lastLineNames?: GridLineNames) => build(template, lastLineNames),
        }
    }

    return updateBuilder(template)
}

export function withLineNames(...names: string[]): GridLineNames {
    return {names, asString: namesFor}
}

export function withGridTrack(gridTrackSize: GridTrackSize, ...names: string[]): GridTrack {
    return {lineNames: withLineNames(...names), track: gridTrackSize}
}

export function withPixels(pixels: number): GridTrackSize {
    return gridTrackSizeFor(TrackSizeType.Pixel, pixels)
}

export function withPercentage(percentage: number): GridTrackSize {
    return gridTrackSizeFor(TrackSizeType.Percentage, percentage)
}

export function withFraction(fraction: number): GridTrackSize {
    return gridTrackSizeFor(TrackSizeType.Fraction, fraction)
}

// export function withAuto(): GridTrackSize {
//     return gridTrackSizeFor(TrackSizeType.Auto)
// }

function gridTrackSizeFor(sizeType: TrackSizeType, amount?: number): GridTrackSize {
    const amountString = amount !== undefined ?
        () => `${Math.floor(amount)}${sizeType}` :
        () => `${sizeType}`

    return {
        amount,
        sizeType,
        asString: amountString
    }
}

function namesFor(names?: Array<string>): string {
    return names && names.length > 0 ?
        `[${names.join(" ")}]` :
        ""
}

/**
 * Converts the grid-template-rows or grid-template-columns into a CSS string
 * @param gridTrackList A list of grid tracks
 * @param lastLineNames A list of grid line-names
 * @return the CSS representation of the grid-template-rows or grid-templage-columns
 */
function gridTrackTemplateAsString(gridTrackList: Array<GridTrack>, lastLineNames?: GridLineNames): string {
    function amountString(sizeType: TrackSizeType, amount?: number): string {
        return amount !== undefined ? `${Math.floor(amount)}${sizeType}` : sizeType.toString()
    }

    const trackList = gridTrackList
        .map(track => {
            const names = namesFor(track.lineNames?.names)
            const space = (names && names.length > 0) ? " " : ""
            return `${names}${space}${amountString(track.track.sizeType, track.track.amount)}`
        })
        .join(" ")
    const lastLines = lastLineNames ? ` ${namesFor(lastLineNames.names)}` : ""
    return trackList + lastLines
}

/**
 * Calculates the cell dimension (width or height) from the track size, correcting for gaps added for
 * spanned dimension (rows or columns). The returned dimension (width or height) is the dimension of
 * contents of the cell, after applying the row or column gaps.
 * @param containerSize The dimension of the parent container
 * @param dimension The row or column index of the cell
 * @param gap The row or column gap
 * @param spanned The number of rows or columns which the cell spans
 * @param gridTrackTemplate The row or column grid-track template defining the tracks
 * @return The width or height of the cell, after accounting for the row or column gap
 */
export function cellDimensionFor(containerSize: number, dimension: number, gap: number, spanned: number, gridTrackTemplate: GridTrackTemplate): number {
    const index = dimension - 1
    const spannedTrackSize = gridTrackTemplate.trackSizes(containerSize, gap)
        .slice(index, index + spanned)
        .reduce((a, b) => a + b, 0)
    return Math.floor(spannedTrackSize + (spanned - 1) * gap)
}

/**
 * Attempts to resolve the row or column index for the specified index or grid line-name. When the
 * identifier is a number, then that is returned as the index (a simple passthrough). When the identifier
 * is a string, then the attempts to find the index that holds the name, and uses that.
 * @param identifier The identifier is either the row or column index, or a grid line-name
 * @param template The css-grid track template represented by the [GridTrackTemplate](#GridTrackTemplate)
 * @return The row or column number in the grid, or 0 if not found
 */
export function trackIndexFor(identifier: number | string, template: GridTrackTemplate): number {
    if (typeof identifier === 'number') {
        return identifier
    }
    return template.trackList.findIndex(track => track.lineNames?.names.includes(identifier)) + 1
}

/**
 * Returns an array that holds the grid line-names for the grid-template-rows or grid-template-columns
 * @param template The grid-template-row or grid-template-column
 * @return an array that holds the grid line-names
 */
export function gridLineNamesFor(template: GridTrackTemplate): Array<string> {
    return Array.from(new Set(template.trackList.flatMap(track => track.lineNames?.names || [])))
}

