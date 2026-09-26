precision highp float;
precision highp int;

//uniform float exposure;

uniform sampler2D inputMap;
uniform bool inputMapProvided;
varying vec4 vPosition;
varying vec2 vUv;
uniform float sliderValue;
uniform float nearDepth;
uniform float fogFalloffDist;
uniform bool visDepth;
uniform bool visFog;
uniform vec4 fogColor;
uniform float fogExp;

uniform sampler2D inputDepthMap;
uniform bool inputDepthMapProvided;


void main()	{
//    float xTextureCoordinateOffset = sin((sliderValue*10.0)*2.0*3.14159*vUv.y)*sliderValue*0.1;

//    vec4 inputColor = texture(inputMap, vec2(vUv.x+xTextureCoordinateOffset, vUv.y));
//    if(!visDepth && !visFog){
//        vec4 inputColor = texture(inputDepthMap, vec2(vUv.xy));
//    }

    float depthMapVal = texture(inputDepthMap, vec2(vUv.xy)).x;
    float adjustedDepth = (depthMapVal-(nearDepth))/((1.0-nearDepth)*fogFalloffDist);


    vec4 inputColor = texture(inputMap, vec2(vUv.xy));

    float blurAmount = clamp((sliderValue*0.01)*adjustedDepth, -0.01,0.01);
    for(int x=0;x<7;x++){
        for(int y=0;y<7;y++){
            inputColor = inputColor+texture(inputMap, vec2(vUv.xy)+vec2(float(x-3),float(y-3))*blurAmount);
        }
    }
    inputColor = inputColor/inputColor.w;

    adjustedDepth = clamp(adjustedDepth, 0.0, 1.0);
    adjustedDepth = pow(adjustedDepth, fogExp);

    if(visDepth){
//        float depthMapVal = 1.0/texture(inputDepthMap, vec2(vUv.xy)).x;
//        float adjustedDepth = clamp((depthMapVal-nearDepth)/(fogFalloffDist), 0.0, 1.0);
//        adjustedDepth = 1.0/adjustedDepth;
//        float adjustedDepth = nearDepth*10.0;
//        float adjustedDepth = depthMapVal;
        inputColor = vec4(adjustedDepth,adjustedDepth,adjustedDepth,1.0);
    }
    if(visFog){
//        float depth = texture(inputDepthMap, vec2(vUv.xy)).x;
        inputColor = adjustedDepth*fogColor+(1.0-adjustedDepth)*inputColor;

    }

    gl_FragColor = vec4(inputColor.xyz, 1.0);

//    gl_FragColor = vec4(inputColor.xyz/(sliderValue*5.0), 1.0);

//    gl_FragColor = vec4(vUv.xy, 0.0, 1.0); // comment out this line to display a visualization of texture coordinates
//    gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}
