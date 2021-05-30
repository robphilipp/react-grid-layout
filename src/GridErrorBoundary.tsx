import React from "react";

interface Props {
    onError: (error: Error, errorInfo: React.ErrorInfo) => void
    children: JSX.Element | Array<JSX.Element>
}

interface GridErrorState {
    hasError: boolean
}

export class GridErrorBoundary extends React.Component<Props, GridErrorState> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false}
    }

    static getDerivedStateFromError(error: Error): GridErrorState {
        return {
            hasError: true
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.props.onError(error, errorInfo)
    }

    render(): JSX.Element | Array<JSX.Element> {
        if (this.state.hasError) {
            return <div>Something went wrong</div>
        }
        return this.props.children
    }
}