window.THREE = require('three');

var baseVs = require('../shaders/baseVs.glsl');
var bufferFs = require('../shaders/bufferFs.glsl');
var renderFS = require('../shaders/renderFS.glsl');
var gridVs = require('../shaders/gridVs.glsl');
var gridFs = require('../shaders/gridFS.glsl');


var Main = function( options ) {
	this.element = document.getElementById('three');
	options = options || {};

	this.mouseIsDown = 0;

	this.buffer0 = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { type: THREE.FloatType } );
	this.buffer1 = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { type: THREE.FloatType } );
	this.bufferA = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { type: THREE.FloatType } );
	this.bufferB = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { type: THREE.FloatType } );
	this.bufferC = new THREE.WebGLRenderTarget( this.element.offsetWidth, this.element.offsetHeight, { type: THREE.FloatType } );

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
			iChannel0: { value: this.buffer1.texture },
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

	var geometry = new THREE.BufferGeometry();

	var hParticles = Math.floor( this.element.offsetWidth / 5 );
	var vParticles = Math.floor( this.element.offsetHeight / 5 );
	var numParticles = hParticles * vParticles;

	var position = [];

	for( var i = 0 ; i < hParticles ; i++ ) for( var j = 0 ; j < vParticles ; j++ ) position.push( i * 5 - this.element.offsetWidth / 2, j * 5 - this.element.offsetHeight / 2, 1 );
	geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( position ), 3 ) );

	var material = new THREE.ShaderMaterial( {
		uniforms : {
			iChannel0: { value: this.bufferA.texture },
			res : { value : new THREE.Vector2( this.element.offsetWidth, this.element.offsetWidth ) },
			modSize : { value : 2 }
		},
		transparent : true,
		vertexShader: gridVs,
		fragmentShader: gridFs,
		depthTest:  true,
		depthWrite: false
	} );

	this.pointMesh = new THREE.Points( geometry, material );
	this.scene.add(this.pointMesh);

	this.resize();
	this.step();
}

Main.prototype.onMousedown = function( e ){
	this.mouseIsDown = 1;
	this.updateMouseUniforms();
}

Main.prototype.onMouseup = function( e ){
	this.mouseIsDown = 0;
	this.updateMouseUniforms();
}

Main.prototype.onMousemove = function( e ){
	this.mouseX = e.offsetX;
	this.mouseY = Math.abs( e.offsetY - this.element.offsetHeight );
	this.updateMouseUniforms();
}

Main.prototype.updateMouseUniforms = function( ){
	this.bufferAplane.material.uniforms.iMouse.value = new THREE.Vector3( this.mouseX, this.mouseY, this.mouseIsDown );
	this.bufferBplane.material.uniforms.iMouse.value = new THREE.Vector3( this.mouseX, this.mouseY, this.mouseIsDown );
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
		this.renderer.render( this.bufferAscene, this.bufferAcam, this.buffer0 );
		this.bufferAplane.material.uniforms.iChannel0.value = this.buffer0.texture;
		this.bufferAplane.material.uniforms.iChannel1.value = this.bufferB.texture;

		this.renderer.render( this.bufferBscene, this.bufferBcam, this.bufferB );
		this.bufferBplane.material.uniforms.iChannel0.value = this.bufferB.texture;
		this.bufferBplane.material.uniforms.iChannel1.value = this.bufferA.texture;

		// this.renderPlane.material.uniforms.iChannel0.value = this.bufferA.texture;
	} else {
		this.renderer.render( this.bufferAscene, this.bufferAcam, this.bufferA );
		this.bufferAplane.material.uniforms.iChannel0.value = this.bufferA.texture;
		this.bufferAplane.material.uniforms.iChannel1.value = this.buffer1.texture;

		this.renderer.render( this.bufferBscene, this.bufferBcam, this.buffer1 );
		this.bufferBplane.material.uniforms.iChannel0.value = this.buffer1.texture;
		this.bufferBplane.material.uniforms.iChannel1.value = this.buffer0.texture;

		// this.renderPlane.material.uniforms.iChannel0.value = this.buffer0.texture;
	}

	this.bufferAplane.material.uniforms.frame.value = this.bufferBplane.material.uniforms.frame.value += 1;

	// this.renderer.render( this.scene, this.camera, this.bufferC );
	
	this.renderer.render( this.scene, this.camera );
};

new Main();