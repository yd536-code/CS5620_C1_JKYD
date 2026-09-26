import React from "react";
import {ARenderWindow} from "../anigraph/rendering/context/ARenderWindow";
import {AGLRenderWindow} from "../anigraph/rendering/context/AGLRenderWindow";
import {ATwoJSRenderWindow} from "../anigraph/rendering/context/ATwoJSRenderWindow";
import {ContextType} from "../anigraph/scene/ASceneController";
import {AGLContextComponent} from "../anigraph/components/AGLContextComponent";
import {ATwoJSContextComponent} from "../anigraph/components/ATwoJSContextComponent";

type AContextComponentProps = {
    renderWindow: ARenderWindow;
    children?: React.ReactNode;
};

export function AContextComponent({ renderWindow, children }: AContextComponentProps) {
    switch (renderWindow.sceneController.contextType) {
        case ContextType.THREEJS:
            return <AGLContextComponent renderWindow={renderWindow as AGLRenderWindow}>{children}</AGLContextComponent>;
        case ContextType.TWOJS:
            return <ATwoJSContextComponent renderWindow={renderWindow as ATwoJSRenderWindow}>{children}</ATwoJSContextComponent>;
        default:
            throw new Error(`Unknown contextType: ${(renderWindow.sceneController as any).contextType}`);
    }
}
