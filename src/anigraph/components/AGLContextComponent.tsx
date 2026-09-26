import React, {useEffect, useRef} from "react";
import {AGLRenderWindow} from "../rendering";

/**
 * Props for {@link AGLContextComponent}.
 * @internal
 */
export type AGLContextComponentProps = {
    renderWindow:AGLRenderWindow
    children?: React.ReactNode
}

/**
 * React component that hosts a Three.js render window: it renders a container `div`, and after each render it
 * points `renderWindow` at that container and starts rendering. Any children are drawn inside the container.
 */
export function AGLContextComponent(props:AGLContextComponentProps) {
    const container = useRef(null as unknown as HTMLDivElement);
    useEffect(() => {
        props.renderWindow.setContainer(container.current);
        props.renderWindow.startRendering();
    });
    return (
        <div className="canvas anigraph-parent">
            <div
                className="anigraphcontainer"
                ref={container}
                key={props.renderWindow.uid}
                >
                {props.children}
            </div>
        </div>
    );
}
