import {gridArea, gridTemplateAreasBuilder} from "./gridTemplateAreas";

test('should be able to create a grid-template-areas that span columns and have empty areas', () => {
    const template = gridTemplateAreasBuilder()
        .addArea('a', gridArea(1, 2, 3, 1))
        .addArea('b', gridArea(2, 1))
        .build()

    expect(template.gridAreas.size).toBe(2)
    expect(template.gridAreas.get('a')).toEqual(gridArea(1, 2, 3, 1))
    expect(template.gridAreas.get('b')).toEqual(gridArea(2, 1, 1, 1))
    expect(template.asString()).toEqual(`". a"\n"b a"\n". a"`)
})

test('should be able to create a grid-template-areas', () => {
    const template = gridTemplateAreasBuilder()
        .addArea('header', gridArea(1, 1, 1, 3))
        .addArea('sidebar', gridArea(2, 1))
        .addArea('main', gridArea(2, 2))
        .addArea('aside', gridArea(2, 3))
        .addArea('footer', gridArea(3, 1, 1, 3))
        .build()

    expect(template.gridAreas.size).toBe(5)
    // expect(template.gridAreas.get('a')).toEqual(gridArea(1, 2, 3, 1))
    // expect(template.gridAreas.get('b')).toEqual(gridArea(2, 1, 1, 1))
    expect(template.gridAreas.get('header')?.column).toBe(1)
    expect(template.gridAreas.get('header')?.columnsSpanned).toBe(3)
    expect(template.asString()).toEqual(`"header header header"\n"sidebar main aside"\n"footer footer footer"`)
})
