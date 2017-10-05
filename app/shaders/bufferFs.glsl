uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec2 resolution;
uniform vec3 iMouse;
uniform float frame;

varying vec2 vUv;

void main( ){
   vec3 e = vec3( vec2( 1.0 ) / resolution.xy, 0.0 );
   vec2 q = vUv;
   
   vec4 c = texture2D( iChannel0, q );
   
   float p11 = c.x;
   
   float p10 = texture2D( iChannel1, q - e.zy ).x;
   float p01 = texture2D( iChannel1, q - e.xz ).x;
   float p21 = texture2D( iChannel1, q + e.xz ).x;
   float p12 = texture2D( iChannel1, q + e.zy ).x;
   
   float d = 0.;
    
   if (iMouse.z > 0.) d = smoothstep( 4.5, .5, length( iMouse.xy - vUv * resolution.xy ) );

   // The actual propagation:
   d += -( p11 - 0.5 ) * 2.0 + ( p10 + p01 + p21 + p12 - 2.0 );
   d *= 0.99; // dampening
   d *= min( 1.0, float( frame ) ); // clear the buffer at iFrame == 0
   d = d * 0.5 + 0.5;
   
   gl_FragColor = vec4(d, 0, 0, 0);
}