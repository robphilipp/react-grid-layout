export interface GridArea {
    row: number
    column: number
    rowsSpanned?: number
    columnsSpanned?: number
}

export interface GridTemplateAreas {
    gridAreas: Map<string, GridArea>
    asString: () => string
}

export const emptyGridTemplateAreas = (): GridTemplateAreas => ({
    gridAreas: new Map(),
    asString: () => ""
})

export function isGridTemplateAreasEmpty(template: GridTemplateAreas): boolean {
    return template.gridAreas.size === 0 && template.asString() === ""
}

export function isGridTemplateAreasNonEmpty(template: GridTemplateAreas): boolean {
    return !isGridTemplateAreasEmpty(template)
}

export interface GridTemplateAreasBuilder {
    readonly template: GridTemplateAreas
    addArea: (name: string, area: GridArea) => GridTemplateAreasBuilder
    build: () => GridTemplateAreas
}

export function gridTemplateAreasBuilder(): GridTemplateAreasBuilder {
    const template = emptyGridTemplateAreas()

    function addAreaTo(template: GridTemplateAreas, name: string, area: GridArea): GridTemplateAreasBuilder {
        template.gridAreas.set(name, area)
        return updateBuilder(template)
    }

    function build(template: GridTemplateAreas, numRows?: number, numColumns?: number): GridTemplateAreas {
        return {
            gridAreas: template.gridAreas,
            asString: () => gridTemplateAreasAsString(template, numRows, numColumns)
        }
    }

    function updateBuilder(template: GridTemplateAreas): GridTemplateAreasBuilder {
        return {
            template,
            addArea: (name: string, area: GridArea) => addAreaTo(template, name, area),
            build: (numRows?: number, numColumns?: number) => build(template, numRows, numColumns)
        }
    }

    return updateBuilder(template)
}

function gridTemplateAreasAsString(template: GridTemplateAreas, numRows?: number, numColumns?: number): string {
    // row and column bound (i.e. min and max values)
    const [, rowUpper] = boundsFor(template.gridAreas, convertAreaToRowBoundsFor)
    const [, columnUpper] = boundsFor(template.gridAreas, convertAreaToColumnBoundsFor)

    // calculate the maximum indexes for the row and column
    const rowMax = (numRows === undefined || numRows < 1) ? rowUpper : Math.max(rowUpper, numRows)
    const columnMax = (numColumns === undefined || numColumns < 1) ? columnUpper : Math.max(columnUpper, numColumns)

    // create the empty matrix
    const matrix: string[][] = []
    for (let r = 0; r < rowMax; ++r) {
        matrix.push([])
        for (let c = 0; c < columnMax; ++c) {
            matrix[r].push(".")
        }
    }

    // overwrite the cells with names
    Array
        .from(template.gridAreas.entries())
        .forEach(([name, area]) => {
            for (let r = area.row - 1; r < area.row + (area.rowsSpanned || 1) - 1; ++r) {
                for (let c = area.column - 1; c < area.column + (area.columnsSpanned || 1) - 1; ++c) {
                    matrix[r][c] = name
                }
            }
        })

    // return the matrix representation
    return matrix.map(row => `"${row.join(" ")}"`).join("\n")
}

function boundsFor(
    gridAreas: Map<string, GridArea>,
    convertAreaToBounds: (area: GridArea) => [min: number, max: number]
): [min: number, max: number] {
    return Array.from(gridAreas.values())
        .map(convertAreaToBounds)
        .reduce((accum, bounds) => {
            const lower = Math.min(accum[0], bounds[0])
            const upper = Math.max(accum[1], bounds[1])
            return [lower, upper]
        }, [Number.MAX_VALUE, Number.MIN_VALUE]) as [number, number]
}

function convertAreaToRowBoundsFor(area: GridArea): [min: number, max: number] {
    return [area.row, area.row + (area.rowsSpanned || 1) - 1]
}

function convertAreaToColumnBoundsFor(area: GridArea): [min: number, max: number] {
    return [area.column, area.column + (area.columnsSpanned || 1) - 1]
}

export function gridArea(row: number, column: number, spannedRows?: number, spannedColumns?: number): GridArea {
    return {
        row, column,
        rowsSpanned: spannedRows || 1,
        columnsSpanned: spannedColumns || 1
    }
}