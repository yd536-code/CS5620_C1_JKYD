precision highp float;
precision highp int;

uniform sampler2D diffuseMap;
//uniform sampler2D normalMap;
uniform bool diffuseMapProvided;
//uniform bool normalMapProvided;
uniform float alpha;

varying vec4 vPosition;
varying vec4 vColor;
//varying vec3 vNormal;
varying vec2 vUv;


void main()	{
    vec3 position = vPosition.xyz/vPosition.w;
    vec4 surface_color = texture(diffuseMap, vUv).xyzw;
//    vec4 surface_color = vec4(vUv.xx, 0.0, alpha);
//    surface_color = surface_color*vColor;
    surface_color.w = surface_color.w*alpha;
    gl_FragColor = surface_color;
//    gl_FragColor = vec4(0.0,1.0,0.0, 1.0);
}
