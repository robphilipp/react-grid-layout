import React from "react";

interface Props {
    onError: (error: Error, errorInfo: React.ErrorInfo) => void
    children: JSX.Element | Array<JSX.Element>
}

interface GridErrorState {
    hasError: boolean
    error?: Error
}

/**
 * React error boundary for <Grid/>.
 */
export class GridErrorBoundary extends React.Component<Props, GridErrorState> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false}
    }

    static getDerivedStateFromError(error: Error): GridErrorState {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.props.onError(error, errorInfo)
    }

    render(): JSX.Element | Array<JSX.Element> {
        if (this.state.hasError) {
            return <div>
                Unable to render react-resizable-grid-layout; error: {this.state.error?.name};
                message: {this.state.error?.message};
                <p>{this.state.error?.stack}</p>
            </div>
        }
        return this.props.children
    }
}