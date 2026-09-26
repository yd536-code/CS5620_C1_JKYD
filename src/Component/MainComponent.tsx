import React from "react";
import {ARenderWindow} from "../anigraph/rendering/context/ARenderWindow";
import {AContextComponent} from "./AContextComponent";

type VisualizationComponentProps = {
    renderWindow: ARenderWindow;
    name: string;
    children?: React.ReactNode;
}

export function MainComponent(props: VisualizationComponentProps) {
    return (
            <div className={"card"}>
                <h3 className={"card-header"}>
                    {props.children}
                </h3>
                <div className={"card-body"}>
                    <AContextComponent renderWindow={props.renderWindow}/>
                </div>
                <div className={"card-body scene-description"}>
                </div>
            </div>
    )
}
