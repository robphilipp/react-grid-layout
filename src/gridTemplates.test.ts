import {
    // withAuto,
    gridTrackTemplateBuilder,
    withLineNames,
    withPixels,
    TrackSizeType,
    withGridTrack, withPercentage, withFraction, cellDimensionFor, trackIndexFor
} from "./gridTemplates";

test('should be able to build a simple grid template with one auto track and no line names', () => {
    const template = gridTrackTemplateBuilder().addTrack(withFraction(1)).build()
    expect(template.lastLineNames).toBeUndefined()
    expect(template.trackList.length).toBe(1)
    expect(template.trackList[0].lineNames).toBeUndefined()
    expect(template.trackList[0].track.amount).toBe(1)
    expect(template.trackList[0].track.sizeType).toEqual(TrackSizeType.Fraction)
    expect(template.trackList[0].track.asString()).toEqual('1fr')
    expect(template.asString()).toEqual('1fr')
})

test('should be able to build a simple grid template with named lines', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(1), withLineNames('one', 'two'))
        .build()
    expect(template.lastLineNames?.names).toBeUndefined()
    expect(template.trackList.length).toBe(1)
    expect(template.trackList[0].lineNames?.names).toEqual(['one', 'two'])
    expect(template.asString()).toEqual('[one two] 1fr')
})

test('should be able to build a simple grid template with named lines and end line', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(2), withLineNames('one', 'two'))
        .build(withLineNames('end'))
    expect(template.lastLineNames?.names).toEqual(['end'])
    expect(template.trackList.length).toBe(1)
    expect(template.trackList[0].lineNames?.names).toEqual(['one', 'two'])
    expect(template.asString()).toEqual('[one two] 2fr [end]')
})

test('should be able to build a grid template with named lines and end line', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(1), withLineNames('one', 'two'))
        .addTrack(withPixels(10), withLineNames('size', '10size'))
        .build(withLineNames('end'))
    expect(template.lastLineNames?.names).toEqual(['end'])
    expect(template.trackList.length).toBe(2)
    expect(template.trackList[0].lineNames?.names).toEqual(['one', 'two'])
    expect(template.trackList[0].track.amount).toBe(1)
    expect(template.trackList[0].track.sizeType).toEqual(TrackSizeType.Fraction)
    expect(template.trackList[1].lineNames?.names).toEqual(['size', '10size'])
    expect(template.trackList[1].track.amount).toEqual(10)
    expect(template.trackList[1].track.sizeType).toEqual(TrackSizeType.Pixel)
    expect(template.asString()).toEqual('[one two] 1fr [size 10size] 10px [end]')
})

test('should be able to build a grid template with named lines, repeat, and end line', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(2), withLineNames('one', 'two'))
        .repeatFor(3, withGridTrack(withPercentage(10), 'size', '10size'))
        .build(withLineNames('end'))
    expect(template.lastLineNames?.names).toEqual(['end'])
    expect(template.trackList.length).toBe(4)
    expect(template.trackList[0].lineNames?.names).toEqual(['one', 'two'])
    expect(template.trackList[0].track.amount).toBe(2)
    expect(template.trackList[0].track.sizeType).toEqual(TrackSizeType.Fraction)
    for (let i = 1; i < 4; ++i) {
        expect(template.trackList[i].lineNames?.names).toEqual(['size', '10size'])
        expect(template.trackList[i].track.amount).toEqual(10)
        expect(template.trackList[i].track.sizeType).toEqual(TrackSizeType.Percentage)
    }
    expect(template.asString()).toEqual('[one two] 2fr [size 10size] 10% [size 10size] 10% [size 10size] 10% [end]')
})

test('should be able to calculate the track sizes', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(1), withLineNames('one', 'two'))
        .addTrack(withPixels(10), withLineNames('size', '10size'))
        .build(withLineNames('end'))

    const dimensions = template.trackSizes(100)
    expect(dimensions.length).toEqual(template.trackList.length)
    expect(dimensions[0]).toBe(90)
    expect(dimensions[1]).toBe(10)
})

test('should be able to calculate the track sizes for multiple fractions', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(1), withLineNames('one', 'two'))
        .addTrack(withPixels(10), withLineNames('size', '10size'))
        .addTrack(withFraction(2), withLineNames('three', 'four'))
        .build(withLineNames('end'))

    const dimensions = template.trackSizes(100)
    expect(dimensions.length).toEqual(template.trackList.length)
    expect(dimensions[0]).toBe(30)
    expect(dimensions[1]).toBe(10)
    expect(dimensions[2]).toBe(60)
})

test('should be able to calculate the track sizes for multiple fractions and percentages', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(1), withLineNames('one', 'two'))
        .addTrack(withPixels(10), withLineNames('size', '10size'))
        .addTrack(withFraction(2), withLineNames('three', 'four'))
        .addTrack(withPercentage(30), withLineNames('percent30'))
        .build(withLineNames('end'))

    const dimensions = template.trackSizes(100)
    expect(dimensions.length).toEqual(template.trackList.length)
    expect(dimensions[0]).toBe(20)
    expect(dimensions[1]).toBe(10)
    expect(dimensions[2]).toBe(40)
    expect(dimensions[3]).toBe(30)
})

test('should be able to calculate the track sizes for single fraction', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withFraction(1), withLineNames('one', 'two'))
        .build(withLineNames('end'))

    const dimensions = template.trackSizes(100)
    expect(dimensions.length).toEqual(template.trackList.length)
    expect(dimensions[0]).toBe(100)
})

test('should be able to calculate the track sizes for a fixed and 2 fractions', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withPixels(200), withLineNames('nav'))
        .repeatFor(2, withGridTrack(withFraction(1), 'one', 'two'))
        .build(withLineNames('end'))

    const dimensions = template.trackSizes(1000)
    expect(dimensions.length).toEqual(template.trackList.length)
    expect(dimensions[0]).toBe(200)
    expect(dimensions[1]).toBe(400)
    expect(dimensions[2]).toBe(400)
})

test('should calculate the cell size based on the grid template, gap, and container size', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withPixels(200), withLineNames('nav'))
        .repeatFor(2, withGridTrack(withFraction(1), 'one', 'two'))
        .build(withLineNames('end'))

    const containerSize = 1000
    const gap = 30
    // fixed sizes must be the specified size, which means that the gap must be
    // removed from the fractional or percent tracks
    let size = cellDimensionFor(containerSize, 1, gap, 1, template)
    expect(size).toBe(200)
    // there are two gaps, and because the first track is fixed, the gap must be removed
    // from the the next two fractional tracks, so each loses the gap (30 px)
    size = cellDimensionFor(containerSize, 2, gap, 1, template)
    expect(size).toBe(400 - gap)
    size = cellDimensionFor(containerSize, 3, gap, 1, template)
    expect(size).toBe(400 - gap)
})

test('should be able to resolve the index based on the grid line-name', () => {
    const template = gridTrackTemplateBuilder()
        .addTrack(withPixels(200), withLineNames('nav'))
        .repeatFor(2, withGridTrack(withFraction(1), 'one', 'two'))
        .build(withLineNames('end'))
    expect(trackIndexFor('nav', template)).toBe(1)
})