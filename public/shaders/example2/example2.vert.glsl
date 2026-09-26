precision highp float;
precision highp int;
varying vec2 vUv;
varying vec4 vExtraAttribute; // we will declare an extra attribe to interpolate across triangle

void main() {
    vUv = uv;

    // We can interpolate any extra attribute we want. Here we are interpolating the eye coordinates of each vertex as an example.
    vExtraAttribute = modelViewMatrix * vec4(position.xyz , 1.0);

    gl_Position = projectionMatrix * vExtraAttribute;
}
