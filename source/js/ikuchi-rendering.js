/**
***	@file Provides all the rendering functions for Ikuchi.
***	@author Chris Arridge, Lancaster University <c.arridge@lancaster.ac.uk>
***	@version 0.3
***	@copyright Lancaster University (2019)
***	@licence TBD.
**/

// Global variables.
var gCamera;
var gControls;
var gScene;
var gRenderer;
var gLastFrameTime = new Date().getTime();
var gPlanetTexture;
var gPlanetImageElement;
var gPlanetMaterial;
var gNorthLabel;
var gSouthLabel;


/**
*** Initialise the rendering engine, creating the rendering context, camera,
***	scene and so on.
**/
function initRendering() {
	// Setup the planet image DOM element and add functions waiting for changes
	// in the element content.
	gPlanetImageElement = document.createElement('img');
	gPlanetImageElement.onload = function(e) {
		gPlanetTexture = new THREE.Texture(this);
		gPlanetTexture.needsUpdate = true;
		gPlanetMaterial.map = gPlanetTexture;
		gPlanetMaterial.needsUpdate = true;}
	gPlanetImageElement.onchange = function(e) {
		gPlanetTexture = new THREE.Texture(this);
		gPlanetTexture.needsUpdate = true;
		gPlanetMaterial.map = gPlanetTexture;
		gPlanetMaterial.needsUpdate = true;}
	gPlanetMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff} );

	// Setup the scene.
	gScene = new THREE.Scene()
	gScene.background = new THREE.Color(0xdddddd);
	THREE.Object3D.defaultUp = new THREE.Vector3(0.0,0.0,1.0);

	// Setup the renderer.
	gRenderer = new THREE.WebGLRenderer({antialias: true});
	gRenderer.setPixelRatio(window.devicePixelRatio);
	gRenderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(gRenderer.domElement);

	// Setup the camera.
	gCamera = new THREE.PerspectiveCamera(75.0, window.innerWidth / window.innerHeight, 0.1, 1000 );
	gCamera.position.set(0.0, 10.0, 0.0);
	gCamera.up.set(0.0,0.0,1.0);
	gCamera.lookAt(0.0,0.0,0.0);

	// Setup lighting.
	var objAmbientLight = new THREE.AmbientLight(0x050505);
	gScene.add(objAmbientLight);
	var objSunLight = new THREE.DirectionalLight(0xffffff, 1.0);
	objSunLight.position.set(100.0,0.0,0.0);
	gScene.add(objSunLight);

	// Controls for orbiting the planet using the mouse.
	gControls = new THREE.OrbitControls(gCamera, gRenderer.domElement);
	gControls.enableDamping = true;
	gControls.dampingFactor = 0.25;
	gControls.screenSpacePanning = false;
	gControls.minDistance = 2;
	gControls.maxDistance = 500;
	gControls.maxPolarAngle = Math.PI*2;

	// Create objects for the planetary system (planet/rotation axis/dipole etc.).
	gScene.add(makePlanetarySystem());
	setPlanetSystemRotationMatrix();

	// Add coordinate axes.
	var orig = new THREE.Vector3(0.0,0.0,0.0);
	var objPlanetSunVector = new THREE.ArrowHelper(new THREE.Vector3(1.0,0.0,0.0),
											orig, 5.0, 0xff0000);
	var objPlanetOrbitVector = new THREE.ArrowHelper(new THREE.Vector3(0.0,-1.0,0.0),
											orig, 5.0, 0x00ff00);
	gScene.add(objPlanetSunVector);
	gScene.add(objPlanetOrbitVector);

	// Add orbital plane.
	var objOrbitalPlane = new THREE.GridHelper(500, 500, 0x555555, 0xbbbbbb);
	objOrbitalPlane.rotateX(Math.PI/2.0);
//	var geomOrbitalPlane = new THREE.PlaneGeometry(1000.0, 1000.0, 1,1);
//	var objOrbitalPlane = new THREE.Mesh(geomOrbitalPlane, new THREE.MeshBasicMaterial( {color: 0x111122, side: THREE.DoubleSide, opacity: 0.25, transparent:true, wireframe: true}));
	gScene.add(objOrbitalPlane);

	// Listen for resize events.
	window.addEventListener('resize', onWindowResize, false);
}



/**
*** When the window is resized this function updates the camera projection
*** matrix and rendering window size.
**/
function onWindowResize() {
	gCamera.aspect = window.innerWidth/window.innerHeight;
	gCamera.updateProjectionMatrix();
	gRenderer.setSize(window.innerWidth, window.innerHeight);
}


/**
*** Called each frame to update the animation and render the frame. The time
*** stamp is passed in so that we can update the animation at a consistent
*** rate.
***
***	@param {float} t - The current time stamp [milliseconds].
**/
function animate(t) {
	requestAnimationFrame(animate);
	gControls.update();

	// Update rotation state of planet, based on speed up and 1/fps: the
	// time (t) is ms per frame, so we need to convert to seconds, multiply by
	// the speedup factor (simulation seconds per real time) and then multiply
	// by the angular rotation rate for the planet.
	dt = t - gLastFrameTime;
	if (params.rotatePlanet) {
		if (params.rotationReversed) {
			params.rotationPhase -= dt*1e-3*params.speedUp*(2.0*Math.PI/(params.rotationPeriod*3600.0));
		} else {
			params.rotationPhase += dt*1e-3*params.speedUp*(2.0*Math.PI/(params.rotationPeriod*3600.0));
		}
	}
	setPlanetSystemRotationMatrix();

	gRenderer.render(gScene, gCamera);
	gLastFrameTime = t;
}

/**
***	Using the rotational phase of the planet, and the obliquity and orbital
*** phase, we build the rotation matrix for the planetary system group.
**/
function setPlanetSystemRotationMatrix() {
	// Update the rotation of the planet.
	gScene.getObjectByName('Planet').matrixAutoUpdate = false;
	gScene.getObjectByName('Planet').matrix = new THREE.Matrix4().makeRotationZ(params.rotationPhase);

	// Update the orientation of the planetary system.
	var yMatrix = new THREE.Matrix4().makeRotationY(params.rotationY*Math.PI/180.0);
	var zMatrix = new THREE.Matrix4().makeRotationZ(params.rotationZ*Math.PI/180.0);
	gScene.getObjectByName('PlanetarySystem').matrix = zMatrix.multiply(yMatrix);
}

/**
*** Return points along a dipole field line as a THREE.Path object. The field
*** line is computed from -pi/2 to +pi/2 so that if the field line ends up
*** being displaced from the origin of the planet, then the field line will
*** disappear into the planet, and not 'float' above the surface.
***
***	@param L {float} L-shell of the field line [>=1].
***	@param n {int} Optional number of points to return along the field line (default 64).
***	@returns {THREE.Path} Path object containing points along the field line.
**/
function getDipolePath(L, n=64) {
	var thMax = Math.PI/2.0;
	var th = thMax;
	var deltaTh = 2.0*thMax/n;					// delta shift between points
	var path = new THREE.Path();
	var r = 0.0;

	path.moveTo(Math.cos(thMax),Math.sin(thMax))
	for (var i=0; i<64; i++) {
		th -= deltaTh;
		r = L*Math.cos(th)*Math.cos(th)
		path.lineTo(r*Math.cos(th),r*Math.sin(th));
	}

	return(path)
}

/**
*** Make a THREE.Object group from a set of dipolar field lines.
***
***	@param selectedLshells {array of floats} Array containing the L-shells to include.
*** @param nLongs {int} Number of field lines in longitude (optional, default=6).
*** @param nPoints {int} Number of points to compute along each field line.
***	@param material {THREE.LineBasicMaterial} Material used to render the field lines.
***	@returns {THREE.Group} Group object containiing all the field lines.
**/
function makeDipoleObject(selectedLshells, nLongs=6, nPoints=64, material=new THREE.LineBasicMaterial({color : 0xffff00, linewidth: 4})) {
	var group = new THREE.Group();

	var long = 0.0;
	for (j=0; j<nLongs; j++) {
		for (i=0; i<selectedLshells.length; i++) {
			var geometry = new THREE.BufferGeometry().setFromPoints(getDipolePath(selectedLshells[i], nPoints).getPoints());
			var object = new THREE.Line(geometry, material);
			object.rotateX(Math.PI/2.0);
			object.rotateY(long);
			group.add(object);
		}
		long += 2*Math.PI/nLongs;
	}

	group.name = 'Dipole';
	group.matrixAutoUpdate = false;
	return(group);
}


/**
*** Make a THREE.Object group containing a planet, lat/long grid, field lines,
*** rotation axis and magnetic axis..
***
***	@returns {THREE.Group} Group object containiing the planet.
**/
function makePlanet() {
	var group = new THREE.Group();

	// First thing to do is to make the planet.
	var geometry = new THREE.SphereBufferGeometry(1.0, 32, 32);
	var obj = new THREE.Mesh(geometry, gPlanetMaterial);
	obj.name = 'Planet Surface';
	obj.rotateX(Math.PI/2.0);
	group.add(obj);

	// Add latitude/longitude grid.
	group.add(makeLatLongGrid(nHalfLat=2, nLong=8));

	// Add rotation axis vector.
	var objPlanetRotationAxisVector = new THREE.ArrowHelper(new THREE.Vector3(0.0,0.0,1.0),
											new THREE.Vector3(0.0,0.0,0.0),
											5.0, 0x0000ff);
	objPlanetRotationAxisVector.name='Rotation Axis Vector';
	group.add(objPlanetRotationAxisVector);

	function textTexture(text) {
		canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
		ctx = canvas.getContext('2d');

		// Set background.
		ctx.fillStyle = 'rgb(64,64,64)';
		ctx.strokeStyle = '';
		ctx.lineWidth = '0px'
		ctx.fillRect(0,0,255,255);

		// Draw text.
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.strokeStyle = '';
		ctx.lineWidth = '0px';
		ctx.font = 'Bold 192px sans-serif';
		ctx.fillText(text,128,128);
		tmp = new THREE.Texture(canvas);
		tmp.needsUpdate = true;
		return(tmp);
	}

	textureNorth = textTexture('N');
	var spriteMaterialNorth = new THREE.SpriteMaterial({map: textureNorth});
	var spriteNorth = new THREE.Sprite(spriteMaterialNorth);
	spriteNorth.position.set(0.0,0.0,1.25);
	spriteNorth.scale.set(0.25,0.25,0.25);
	group.add(spriteNorth);

	textureSouth = textTexture('S');
	var spriteMaterialSouth = new THREE.SpriteMaterial({map: textureSouth});
	var spriteSouth = new THREE.Sprite(spriteMaterialSouth);
	spriteSouth.position.set(0.0,0.0,-1.25);
	spriteSouth.scale.set(0.25,0.25,0.25);
	group.add(spriteSouth);

	// Add dipole field lines and dipole axis.
	var objDipolePlusVector = new THREE.Group();
	objDipolePlusVector.name = 'Dipole plus Vector';

	var objDipole = makeDipoleObject(params.fieldLshells, nLongs=params.fieldNumLongitudes);
	objDipolePlusVector.add(objDipole);

	var objPlanetDipoleAxisVector = new THREE.ArrowHelper(new THREE.Vector3(0.0,0.0,1.0),
											new THREE.Vector3(0.0,0.0,0.0),
											4.0, 0xffffff);
	objDipolePlusVector.add(objPlanetDipoleAxisVector);

	// Setup rotation and origin of the dipole.
	var yMatrix = new THREE.Matrix4().makeRotationY(params.fieldPoleColatitude*Math.PI/180.0);
	var zMatrix = new THREE.Matrix4().makeRotationZ(params.fieldPoleLongitude*Math.PI/180.0);
	var transMatrix = new THREE.Matrix4().makeTranslation(params.fieldOriginX,params.fieldOriginY,params.fieldOriginZ);
	objDipolePlusVector.matrixAutoUpdate=false;
	objDipolePlusVector.matrix = transMatrix.multiply(yMatrix.multiply(zMatrix));
	group.add(objDipolePlusVector);

	group.name = 'Planet';
	group.matrixAutoUpdate = false;
	return(group);
}


/**
*** Make a THREE.Object group containing the planet object and other parts
*** of the planetary sytem.
***
***	@param objPlanet {THREE.Object3D} Planet object produced by makePlanet().
***	@returns {THREE.Object3D} Planetary sytem object.
**/
function makePlanetarySystem() {

	var group = new THREE.Object3D();

	// add equatorial plane
	var geomEquatorialPlane = new THREE.RingGeometry(1.0, 5.0, 64, 8, 0.0, Math.PI*2);
	var objEquatorialPlane = new THREE.Mesh(geomEquatorialPlane, new THREE.MeshBasicMaterial({color: 0x00bb00, side:THREE.DoubleSide, opacity: 0.1, transparent:true}));
	objEquatorialPlane.translateZ(0.01);
	group.add(objEquatorialPlane);

	group.add(makePlanet());

	group.name = 'PlanetarySystem';
	group.matrixAutoUpdate = false;

	return(group);

}


/**
***	Make a THREE.Object3D group for a latitude/longitude grid.
***
***	@param nHalfLat {int} Number of parallels in the each hemisphere (default=1).
***	@param nLong {int} Number of meridians (default=8).
***	@param matParallel {THREE.LineBasicMaterial} Material for the parallels.
***	@param matEquator {THREE.LineBasicMaterial} Material for the equatorial parallels.
***	@param matMeridian {THREE.LineBasicMaterial} Material for the meridians.
***	@param matPrimeMeridian {THREE.LineBasicMaterial} Material for the prime meridian.
***	@returns {THREE.Object3D} Group object.
***
***	@todo Needs modifying so that the planet can be represented by a biaxial
***	ellipsoid with separate polar and equatorial radii.
**/
function makeLatLongGrid(nHalfLat=1, nLong=8,
		matParallel=new THREE.LineBasicMaterial({color: 0xaaaaaa, linewidth: 1}),
		matEquator=new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1}),
		matMeridian=new THREE.LineBasicMaterial({color: 0xaaaaaa, linewidth: 1}),
		matPrimeMeridian=new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1})) {

	var nLat = 1 + nHalfLat*2;
	var dlat = 0.5*Math.PI/(nHalfLat+1);
	var dlong = 2.0*Math.PI/nLong;

	var group = new THREE.Group();

	var lat = 0.0 - dlat*nHalfLat;
	for (i=0; i<nLat; i++) {
		var ax = Math.cos(lat)*1.0;
		var ay = Math.cos(lat)*1.0;
		var curve = new THREE.EllipseCurve(
							0.0, 0.0,		// x0, y0
							ax, ay,		// ax, ay
							0.0, 2.0*Math.PI,	// start/stop angles
							false,			// clockwise
							0.0);
		var geomParallel = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
		if (i==nHalfLat) {
			var objParallel = new THREE.Line(geomParallel, matEquator);
		} else {
			var objParallel = new THREE.Line(geomParallel, matParallel);
		}
		objParallel.translateZ(Math.sin(lat)*1.0);
		group.add(objParallel);
		lat += dlat;
	}

	var curve = new THREE.EllipseCurve(
						0.0, 0.0,		// x0, y0
						1.0, 1.0,		// ax, ay
						-Math.PI/2.0, Math.PI/2.0,	// start/stop angles
						false,			// clockwise
						0.0);			// rotation
	var long = 0.0;
	for (i=0; i<nLong; i++) {
		var geomMeridian = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
		if (i==0) {
			var objMeridian = new THREE.Line(geomMeridian, matPrimeMeridian);
		} else {
			var objMeridian = new THREE.Line(geomMeridian, matMeridian);
		}
		objMeridian.rotateX(Math.PI/2.0);
		objMeridian.rotateY(long);
		long += dlong;
		group.add(objMeridian);
	}

	group.name = 'Latitude and Longitude Grid';
	group.matrixAutoUpdate = false;
	return(group);
}
