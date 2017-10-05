uniform vec2 resolution;
uniform sampler2D iChannel0;
varying vec2 vUv;

void main( ){
	vec2 q = vUv;
	float h = texture2D( iChannel0, q ).x;
	float sh = 1.35 - h * 2.0;
	gl_FragColor = vec4( vec3( sh ), 1.0 );
}