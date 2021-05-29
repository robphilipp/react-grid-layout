import * as React from "react";
import {createContext, useCallback, useContext, useEffect, useRef, useState} from "react";
import {Dimensions, resizeThresholdExceeded, UseDimensionValues} from "./dimensions";

const initialDimensions = {
    width: window.innerWidth,
    height: window.innerHeight,
}

const WindowDimensionsContext = createContext<UseDimensionValues>(initialDimensions)

interface Props {
    children: JSX.Element | Array<JSX.Element>
}

export function WindowDimensionsProvider(props: Props): JSX.Element {
    const {children} = props;

    const currentDimensionsRef = useRef<Dimensions>({width: 0, height: 0})
    const [dimensions, setDimensions] = useState<Dimensions>(initialDimensions)
    const updateDimensions = useCallback(
        () => {
            const winDim = {width: window.innerWidth, height: window.innerHeight}
            if (resizeThresholdExceeded(currentDimensionsRef.current, winDim, 2)) {
                setDimensions(winDim)
            }
        },
        [currentDimensionsRef]
    )

    useEffect(
        () => {
            updateDimensions()
            window.addEventListener('resize', updateDimensions)

            return () => {
                window.removeEventListener('resize', updateDimensions)
            }
        },
        [updateDimensions]
    )

    return (
        <WindowDimensionsContext.Provider value={dimensions}>
            {children}
        </WindowDimensionsContext.Provider>
    );
}

/**
 * React hook that must be used within a {@link WindowDimensionsProvider}
 * @return The dimensions values of the element
 */
export function useWindowDimensions(): UseDimensionValues {
    const context = useContext<UseDimensionValues>(WindowDimensionsContext)
    const {width, height} = context
    if (width === undefined || height === undefined) {
        throw new Error("useWindowDimensions can only be used when the parent is a <WindowDimensionsProvider/>")
    }
    return context
}
