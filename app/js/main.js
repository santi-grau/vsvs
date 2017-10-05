window.THREE = require('three');

var baseVs = require('../shaders/baseVs.glsl');
var bufferFs = require('../shaders/bufferFs.glsl');
var renderFS = require('../shaders/renderFS.glsl');

var Main = function( options ) {
	this.element = document.getElementById('three');
	options = options || {};

	this.mouseIsDown = 0;

	this.buffer0 = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );
	this.buffer1 = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );
	this.bufferA = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );
	this.bufferB = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter} );

	// buffer A
	this.bufferAscene = new THREE.Scene();
	this.bufferAcam = new THREE.OrthographicCamera();
	var geometry = new THREE.PlaneBufferGeometry( this.element.offsetWidth, this.element.offsetHeight );
	var material = new THREE.ShaderMaterial( {
		uniforms: {
			iChannel0: { value: this.bufferA.texture },
			iChannel1: { value: this.bufferB.texture },
			frame: { value: 0.0 },
			resolution: { value: new THREE.Vector2( this.element.offsetWidth, this.element.offsetHeight ) },
			iMouse : { value : new THREE.Vector3( 0, 0, 0 ) }
		},
		vertexShader: baseVs,
		fragmentShader: bufferFs
	} );

	this.bufferAplane = new THREE.Mesh( geometry, material );
	this.bufferAscene.add( this.bufferAplane );
	
	// buffer B
	this.bufferBscene = new THREE.Scene();
	this.bufferBcam = new THREE.OrthographicCamera();
	var geometry = new THREE.PlaneBufferGeometry( this.element.offsetWidth, this.element.offsetHeight );
	var material = new THREE.ShaderMaterial( {
		uniforms: {
			iChannel0: { value: this.bufferB.texture },
			iChannel1: { value: this.bufferA.texture },
			frame: { value: 0.0 },
			resolution: { value: new THREE.Vector2( this.element.offsetWidth, this.element.offsetHeight ) },
			iMouse : { value : new THREE.Vector3( 0, 0, 0 ) }
		},
		vertexShader: baseVs,
		fragmentShader: bufferFs
	} );
	this.bufferBplane = new THREE.Mesh( geometry, material );
	this.bufferBscene.add( this.bufferBplane );

	// Render scene
	this.scene = new THREE.Scene();
	this.camera = new THREE.OrthographicCamera();
	var geometry = new THREE.PlaneBufferGeometry( this.element.offsetWidth, this.element.offsetHeight );
	var material = new THREE.ShaderMaterial( {
		uniforms: {
			iChannel0: { value: this.bufferA.texture },
			frame: { value: 0.0 },
			resolution: { value: new THREE.Vector2( this.element.offsetWidth, this.element.offsetHeight ) }
		},
		vertexShader: baseVs,
		fragmentShader: renderFS
	} );
	this.renderPlane = new THREE.Mesh( geometry, material );
	this.scene.add( this.renderPlane );
	
	this.renderer = new THREE.WebGLRenderer( { alpha : true, antialias : false } );
	this.element.appendChild( this.renderer.domElement );

	this.element.addEventListener('mousemove', this.onMousemove.bind( this ) );
	this.element.addEventListener('mousedown', this.onMousedown.bind( this ) );
	this.element.addEventListener('mouseup', this.onMouseup.bind( this ) );

	this.resize();
	this.step();
}

Main.prototype.onMousedown = function( e ){
	this.mouseIsDown = 1;
}

Main.prototype.onMouseup = function( e ){
	this.mouseIsDown = 0;
}

Main.prototype.onMousemove = function( e ){
	// console.log(e.offsetX, e.offsetY)
	var x = e.offsetX;
	var y = Math.abs( e.offsetY - this.element.offsetHeight );
	this.bufferAplane.material.uniforms.iMouse.value = new THREE.Vector3( x, y, this.mouseIsDown );
	this.bufferBplane.material.uniforms.iMouse.value = new THREE.Vector3( x, y, this.mouseIsDown );
}

Main.prototype.resize = function( e ) {
	var width = this.element.offsetWidth, height = this.element.offsetHeight;
	this.renderer.setSize( width * 2, height * 2 );
	this.renderer.domElement.setAttribute( 'style', 'width:' + width + 'px; height:' + height + 'px;' );
	var camView = { left :  width / -2, right : width / 2, top : height / 2, bottom : height / -2 };
	for ( var prop in camView) this.camera[ prop ] = camView[ prop ];
	this.camera.position.z = 100;
	this.camera.updateProjectionMatrix( );

	this.bufferAcam = this.camera;
	this.bufferAcam.updateProjectionMatrix( );

	this.bufferBcam = this.camera;
	this.bufferBcam.updateProjectionMatrix( );
}

Main.prototype.step = function( time ) {
	window.requestAnimationFrame( this.step.bind( this ) );
	
	var n = this.bufferAplane.material.uniforms.frame.value;

	if( n === 0 || !!( n && !(n%2))) {
		this.renderer.render( this.bufferBscene, this.bufferBcam, this.buffer0 );
		this.bufferBplane.material.uniforms.iChannel0.value = this.buffer0.texture;
	} else {
		this.renderer.render( this.bufferBscene, this.bufferBcam, this.buffer1 );
		this.bufferBplane.material.uniforms.iChannel0.value = this.buffer1.texture;
	}
	this.renderer.render( this.bufferBscene, this.bufferBcam, this.bufferB );
	this.bufferBplane.material.uniforms.frame.value += 1;
	
	if( n === 0 || !!( n && !(n%2))) {
		this.renderer.render( this.bufferAscene, this.bufferAcam, this.buffer0 );
		this.bufferAplane.material.uniforms.iChannel0.value = this.buffer0.texture;
	} else {
		this.renderer.render( this.bufferAscene, this.bufferAcam, this.buffer1 );
		this.bufferAplane.material.uniforms.iChannel0.value = this.buffer1.texture;
	}
	this.renderer.render( this.bufferAscene, this.bufferAcam, this.bufferA );
	this.bufferAplane.material.uniforms.frame.value += 1;

	
	
	this.renderer.render( this.scene, this.camera );
};

new Main();