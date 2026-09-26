/* Creative Commons Attribution 4.0 International (CC-BY-4.0) */
/* Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com) */
/* This source code was getting from https://github.com/tastejs/todomvc-app-css/blob/03e753aa21bd555cbdc2aa09185ecb9905d1bf16/index.css */

import styled, { css } from "styled-components";

const WindowMaxWidthPercentage = 100;
const WindowMaxHeightPercentage = 100;

const fullWindowLayoutStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  //height: 100vh;
  height: 100%;

  .anigraph-parent{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .anigraphcontainer {
    width: 100%;
    height: 100%;
    max-height: 100%;
  }
  .h1{
    text-align: center;
  }

  .card{
    height: 100%;
    border: none;
  }
`;

const cardLayoutStyles = css`
  #transformationviewer-main{
    width: 95%;
  }
  .card{
    height: 90%;
    border: none;
  }
  .anigraphcontainer{
    max-height: 95%;
    max-width: 95%;
    aspect-ratio: 1;
    border: black;
    border-radius: 3px;
    border-style: solid;
  }

  .anigraph-parent{
    height: 100%;
  }

  .visualization-row{
    height: 600px;
  }

  .scene-description{
    font-size: 10pt;
    line-height: 12pt;
    //max-height: 150px;
    //min-height: 200px;
    //overflow: scroll;
  }
  h5 {
    font-size: 11pt;
  }
`;

/**
 * A single, stable component (not two separate ones swapped by type) so toggling
 * $fullWindow only changes CSS -- it never unmounts/remounts children like ControlPanel.
 * (Swapping between two differently-typed styled-components at the same JSX position
 * makes React tear down and rebuild the whole subtree on every toggle, which was
 * resetting any live GUI control state back to its initial registration value.)
 */
export const Layout = styled.div<{ $fullWindow?: boolean }>`
  ${props => props.$fullWindow ? fullWindowLayoutStyles : cardLayoutStyles}
`;
