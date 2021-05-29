import * as React from "react";
import {cloneElement, createContext, CSSProperties, useCallback, useContext, useState} from "react";
import {Dimensions} from "./dimensions";

export enum Align {
    Center = 'center',
    Stretch = 'stretch',
    FlexStart = 'flex-start',
    FlexEnd = 'flex-end',
}

export enum JustifyContent {
    SpaceAround = 'space-around',
    SpaceEvenly = 'space-evenly',
    SpaceBetween = 'space-between',
    NoSpace = 'space-none'
}

export enum FlexDirection {
    Row = 'row',
    Column = 'column',
}

export enum FlexWrap {
    Wrap = 'wrap',
    NoWrap = 'nowrap',
    WrapReverse = 'wrap-reverse',
}

interface UseFlexValues extends Dimensions {
    // width: number
    // height: number
    flexDirection: FlexDirection
}

const initialFlexValues: UseFlexValues = {
    width: 0,
    height: 0,
    flexDirection: FlexDirection.Row
}

const FlexContext = createContext<UseFlexValues>(initialFlexValues)

interface FlexProps {
    // supplies the dimensions of the (parent) container whose dimensions
    // this grid uses.
    dimensionsSupplier?: () => Dimensions
    // the layout direction, or the direction of the main axis
    flexDirection?: FlexDirection
    // distribution of space around the main axis (i.e. if flex direction is row, this
    // would distribute the horizontal space,or if the flex direction is column, this would
    // distribute the vertical space)
    justifyContent?: JustifyContent
    // distribution of space around the cross-axis (i.e. if flex direction is row, this
    // would distribute the vertical space,or if the flex direction is column, this would
    // distribute the horizontal space)
    alignContent?: JustifyContent
    // alignment for the cross-axis (i.e. if flex direction is row, this would align vertically,
    // or if the flex direction is column, this would align horizontally) which sets the `align-self`
    // property on all the children
    alignItems?: Align
    // sets whether items are forced on one line (no-wrap) or are allowed to wrap on multiple lines
    flexWrap?: FlexWrap
    // the vertical gap between columns
    columnGap?: number
    // the horizontal gap between rows
    rowGap?: number
    // additional styles passed from the parent component
    styles?: CSSProperties
    // the children of the flex container, which must be <FlexItem> types
    children: JSX.Element | Array<JSX.Element>
}

export function FlexContainer(props: FlexProps): JSX.Element {
    const {
        dimensionsSupplier,
        flexDirection = FlexDirection.Row,
        justifyContent,
        alignContent,
        alignItems = Align.Center,
        flexWrap = FlexWrap.NoWrap,
        columnGap,
        rowGap,
        styles = {},
        children
    } = props

    const {width, height} = dimensionsSupplier ? dimensionsSupplier() : {width: 0, height: 0}

    function enrich(children: JSX.Element | Array<JSX.Element>): JSX.Element | Array<JSX.Element> {
        const childElements = Array.isArray(children) ? children : [children];
        return childElements.map(child => cloneElement(child, {
            width, height,
            flexDirection,
        }))
    }

    return (
        <FlexContext.Provider value={{width, height, flexDirection}}>
            <div
                style={{
                    ...styles,
                    width, height,
                    display: 'flex',
                    flexDirection,
                    justifyContent,
                    alignContent,
                    alignItems,
                    flexWrap,
                    columnGap,
                    rowGap,
                }}
            >
                {enrich(children)}
            </div>
        </FlexContext.Provider>
    )
}

interface UseFlexItemValues extends Dimensions {
    // width: number
    // height: number
    flexDirection: FlexDirection
}

const initialFlexItemValues: UseFlexItemValues = {
    width: 0,
    height: 0,
    flexDirection: FlexDirection.Row
}

const FlexItemContext = createContext<UseFlexItemValues>(initialFlexItemValues)

interface FlexItemProps {
    // property sets the initial main size of a flex item. it sets the size of the
    // content box unless otherwise set with box-sizing.
    flexBasis?: number
    // sets the grow property for the main-axis size
    flexGrow?: number
    // sets the shrink property for the main-axis size
    flexShrink?: number
    justifyContent?: JustifyContent
    justifySelf?: JustifyContent
    alignSelf?: Align
    order?: number
    children: JSX.Element | Array<JSX.Element>
}

export function FlexItem(props: FlexItemProps): JSX.Element {
    const {
        flexGrow,
        flexBasis,
        flexShrink,
        justifyContent = JustifyContent.SpaceAround,
        justifySelf,
        alignSelf,
        order,
        children,
    } = props

    const {width, height, flexDirection} = useContext<UseFlexValues>(FlexContext)

    const [cellDimensions, setCellDimensions] = useState<Dimensions>({width: 0, height: 0})
    const divRef = useCallback(
        (node: HTMLDivElement) => {
            if (node !== null) {
                // const {width: cellWidth, height: cellHeight} = node.getBoundingClientRect()
                const dims = node.getBoundingClientRect()
                if (flexDirection === FlexDirection.Row) {
                    dims.height = height || dims.height
                } else {
                    dims.width = width || dims.width
                }
                setCellDimensions({width: Math.floor(dims.width), height: Math.floor(dims.height)})
            }
        },
        [flexDirection, height, width]
    )

    function enrich(children: JSX.Element | Array<JSX.Element>): JSX.Element | Array<JSX.Element> {
        const childElements = Array.isArray(children) ? children : [children];
        return childElements.map(child => cloneElement(child, {
            width: cellDimensions.width,
            height: cellDimensions.height
        }))
    }

    return (
        <FlexItemContext.Provider value={{
            width: cellDimensions.width,
            height: cellDimensions.height,
            flexDirection
        }}>
            <div ref={divRef} style={{
                // display: 'flex',
                flexGrow,
                flexBasis,
                flexShrink,
                justifyContent: justifyContent === JustifyContent.NoSpace ? undefined : justifyContent,
                justifySelf,
                alignSelf,
                order,
            }}>
                {enrich(children)}
            </div>
        </FlexItemContext.Provider>
    )
}

export function useFlexItem(): UseFlexItemValues {
    const context = useContext<UseFlexItemValues>(FlexItemContext)
    return context
}

