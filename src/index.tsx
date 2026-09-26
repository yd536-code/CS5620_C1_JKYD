import React from "react";
import ReactDOM from "react-dom";
import {createRoot} from 'react-dom/client'
import "@fontsource/anonymous-pro";

import MainApp, {MainAppConfigs} from "./MainApp";


// ReactDOM.render(
const container = document.getElementById("root");
const root =createRoot(container as HTMLElement);

/**
 * Whether to render the app inside `<React.StrictMode>`, set by `MainAppConfigs.USE_STRICT_MODE` in MainApp.tsx
 * (false if it isn't set). In development, StrictMode runs every effect twice. That breaks leva's `useToggle`: the
 * control panel keeps the height it had at first render, so controls added afterward are clipped. Leave it off
 * unless you are specifically checking for StrictMode problems.
 */
const useStrictMode = MainAppConfigs?.USE_STRICT_MODE ?? false;

root.render(
    useStrictMode ? (
        <React.StrictMode>
            <MainApp />
        </React.StrictMode>
    ) : (
        <MainApp />
    ),
);
