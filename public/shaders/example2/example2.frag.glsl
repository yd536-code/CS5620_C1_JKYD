precision highp float;
precision highp int;

uniform sampler2D inputMap;
uniform bool inputMapProvided;

uniform float sliderValue;
uniform bool checkBox;
varying vec4 vExtraAttribute;

varying vec4 vPosition;
varying vec2 vUv;

uniform bool showMirrorTextureCoords;

void main()	{
    // We want to sample from a texture that represents the mirrored world rendered from our current perspective.
    // My recommended strategy for this would be to render the scene from a "mirrored perspective" to a texture,
    // then use this shader in a second pass to render your mirror geometry, with the mirrored perspective texture as inputMap.

    // the texture coordinates interpolated from your vertex shader
    // Hint: You don't actually need to use these to implement a mirror.
    // You are welcome to, but it may even be easier without them
    vec2 textureCoordinates = vUv;

    // The starter code hooks up a check box to this variable to help you with debugging
    if(checkBox){
        // let's assign our texture coordinates to the xy values of our extra interpolated attribute
        textureCoordinates = vExtraAttribute.xy;
    }

    // Let's sample our texture with the texture coordinates we have chosen
    vec4 textureColor = texture(inputMap, textureCoordinates);

    vec4 outputColor = textureColor;
    if(showMirrorTextureCoords){
        outputColor = vec4(textureCoordinates, 0.0, 1.0);
    }

    gl_FragColor = outputColor;
}
