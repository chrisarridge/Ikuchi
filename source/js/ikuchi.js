/**
***	@file Provides all the GUI functions for Ikuchi.
***	@author Chris Arridge, Lancaster University <c.arridge@lancaster.ac.uk>
***	@version 7
***	@copyright Lancaster University (2019)
***	@licence GNU GPL v3.
**/

/**
*** Copright (C) 2019 Chris Arridge, Lancaster University
***
*** This program is free software: you can redistribute it and/or modify
*** it under the terms of the GNU General Public License as published by
*** the Free Software Foundation, either version 3 of the License, or
*** (at your option) any later version.
***
*** This program is distributed in the hope that it will be useful,
*** but WITHOUT ANY WARRANTY; without even the implied warranty of
*** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*** GNU General Public License for more details.
***
*** You should have received a copy of the GNU General Public License
*** along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/


/*** @class Ikuchi app contained in class. ***/
class Ikuchi {

	/** Create instance of the Ikuchi app.
	***
	*** @constructor
	**/
	constructor() {
		this.autoRotate = true;			// should the planet and sytem autorotate?
		this.speedUp = 3600;			// speedup factor from reality (3600 means that in one second of real time, an hour has passed in the simulated view)

		// Colatitude and longitude of the dipole pole, and the origin of the dipole.
		this.dipolePoleColatitude = 10.0;
		this.dipolePoleLongitude = 0.0;
		this.dipoleOriginX = 0.0;
		this.dipoleOriginY = 0.0;
		this.dipoleOriginZ = 0.0;

		// what is the rotational state of the planet, what is the rotation
		// period of the planet, and does the planet rotate in the opposite sense.
		this.planetRotationPhase = 0.0;
		this.rotationPeriod = 24.0;
		this.rotationReversed = false;

		// Rotational state of the plaentary system (controlled by obliquity and
		// planetary phase).
		this.rotationY = 0.0;
		this.rotationZ = 0.0;

		// For the planet selection.
		this.planet = 'Default';
		this.time = '- -';
		this.events = '- -';

		// Viewing options.
		this.drawFieldLines = true;
		this.drawNorthSouthLabels = true;
		this.cameraType = 'Perspective';

		// Colours. (spare: red #C1292E, peach #D6704D)
		this.bgColour = '#FDFFFC';						// white FDFFFC
		this.ambientColour = '#050505';
		this.sunColour = '#FFFFFF';
		this.sunVectorColour = '#EA8634';				// orange EA8634
		this.orbitVectorColour = '#4BA92A';				// green 4BA92A
		this.spinVectorColour = '#84112D';				// crimson 84112D
		this.dipoleVectorColour = '#235789';			// blue 235789
		this.fieldLineColour = '#F1D302';				// yellow F1D302
		this.equatorialPlaneColour = '#00FFFF';
		this.orbitalPlaneColour = '#161925';			// dark 161925
		this.dipoleEquatorialPlaneColour = '#FF55EE';
		this.moonOrbitColour = '#69C6A0';				// cyan 69C6A0
		this.discreteRingColour = '#6E2347'				// purple 6E2347
		this.wideRingColour = '#6E2347'

		// Plane transparency
		this.orbitalPlaneOpacity = 0.1;
		this.orbitalPlaneTransparency = true;
		this.orbitalPlane = 'Wireframe';
		this.equatorialPlaneOpacity = 0.1;
		this.equatorialPlaneTransparency = true;
		this.equatorialPlane = 'None';
		this.dipoleEquatorialPlaneOpacity = 0.1;
		this.dipoleEquatorialPlaneTransparency = true;
		this.dipoleEquatorialPlane = 'None';

		// Field line L-shells to draw
		this.minLshell = 2.0;
		this.maxLshell = 16.0;
		this.stepLshell = 2.0;
		this.numLongitudes = 6;

		this.orthoWidth = 20;
		this.moons = new Array();
		this.rings = new Array();
		this.moonVisible = {};
		this.ringVisible = {};
		this.planetObjects = new Map();
	}

	/** Add planet (defined in an object literal - see planets.js) to the app.
	***
	*** @param {object} pl The object literal defining the planet.
	**/
	addPlanet(pl) {
		this.planetObjects.set(pl.name, pl);
		for (let i=0; i<pl.moonNames.length; i++) {
			this.moonVisible[this.nameToLabel(pl.moonNames[i],'moon')] = pl.moonVisible[i]
		}
		for (let i=0; i<pl.discreteRingNames.length; i++) {
			this.ringVisible[this.nameToLabel(pl.discreteRingNames[i],'ring')] = pl.discreteRingVisible[i]
		}
		for (let i=0; i<pl.wideRingNames.length; i++) {
			this.ringVisible[this.nameToLabel(pl.wideRingNames[i],'ring')] = pl.wideRingVisible[i]
		}
	}

	/** Initalise the window, GUI, scene and controls so that the app can function. **/
	init() {
		this.initScene();
		this.initRenderer();
		this.initControls();
		this.initGui();
		window.addEventListener('resize', this.onWindowResize.bind(this), false);
	}

	/** Setup the THREE.js scene (lighting, cameras, main objects). **/
	initScene() {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(this.bgColour);
		THREE.Object3D.defaultUp = new THREE.Vector3(0.0,0.0,1.0);

		// Setup the cameras - note that both orthographic and perspective
		// cameras are setup now, but only one is used at any given time.
		let aspect = window.innerWidth/window.innerHeight;
		let orthoHeight = this.orthoWidth/aspect;
		this.perspectiveCamera = new THREE.PerspectiveCamera(75.0, aspect, 0.1, 1000 );
		this.perspectiveCamera.position.set(0.0, 10.0, 0.0);
		this.perspectiveCamera.up.set(0.0,0.0,1.0);
		this.perspectiveCamera.lookAt(0.0,0.0,0.0);
		this.orthographicCamera = new THREE.OrthographicCamera(-this.orthoWidth/2.0,this.orthoWidth/2.0, orthoHeight/2.0, -orthoHeight/2.0, 0.1, 1000);
		this.orthographicCamera.position.set(0.0, 10.0, 0.0);
		this.orthographicCamera.up.set(0.0,0.0,1.0);
		this.orthographicCamera.lookAt(0.0,0.0,0.0);
		this.camera = this.perspectiveCamera;

		// Setup lighting.
		this.ambientLight = new THREE.AmbientLight(this.ambientColour);
		this.ambientLight.name = 'Ambient Light';
		this.scene.add(this.ambientLight);

		this.sunLight = new THREE.DirectionalLight(this.sunColour, 1.0);
		this.sunLight.name = 'Sun Light';
		this.sunLight.position.set(100.0,0.0,0.0);
		this.scene.add(this.sunLight);

		// Add coordinate axes.
		origin = new THREE.Vector3(0.0,0.0,0.0);
		this.oPlanetSunVector = new THREE.ArrowHelper(new THREE.Vector3(1.0,0.0,0.0), origin, 5.0, this.sunVectorColour);
		this.oPlanetSunVector.name = 'Planet-Sun Vector';
		this.oOrbitVector = new THREE.ArrowHelper(new THREE.Vector3(0.0,-1.0,0.0), origin, 5.0, this.orbitVectorColour);
		this.oOrbitVector.name = 'Orbit Vector';
		this.scene.add(this.oPlanetSunVector);
		this.scene.add(this.oOrbitVector);

		// initialise planetary system and planet.
		this.initPlanet()
		this.initPlanetarySystem()
		this.oPlanetarySystemGroup.add(this.oPlanetGroup);
		this.scene.add(this.oPlanetarySystemGroup);

		// Add orbital and equatorial planes.
		this.oOrbitalPlane = new Plane('Orbital Plane', 500);
		this.onChangeOrbitalPlane();
		this.oEquatorialPlane = new Plane('Equatorial Plane', 20)
		this.onChangeEquatorialPlane();
		this.oDipoleEquatorialPlane = new Plane('Dipole Equatorial Plane', 10)
		this.onChangeDipoleEquatorialPlane();
	}

	/** Initialise a planet object and add to the scene.
	***
	*** This method builds objects for the planet itself (a textured/plain colour
	*** sphere), north and south pole labels, rotation axis vector, latitude/
	*** longitude grid, and the magnetic field. These objects are encapsulated in
	*** a THREE.js group: "Planet".
	**/
	initPlanet() {
		this.oPlanetGroup = new THREE.Group();
		this.oPlanetGroup.name = 'Planet';
		this.oPlanetGroup.matrixAutoUpdate = false;

		// Setup texture elements, planet materials and geometries.
		this.planetImageElement = document.createElement('img');
		this.planetImageElement.onload = this.onPlanetTextureLoadOrChange.bind(this);
		this.planetImageElement.onchange = this.onPlanetTextureLoadOrChange.bind(this);
		this.planetTexture = null;
		this.planetMaterial = new THREE.MeshLambertMaterial({color: '#ffffff'});

		// Make the planet geometry
		this.planetGeom = new THREE.SphereBufferGeometry(1.0, 64, 64);
		this.oPlanetObject = new THREE.Mesh(this.planetGeom, this.planetMaterial);
		this.oPlanetObject.name = 'Planet Surface';
		this.oPlanetObject.rotateX(Math.PI/2.0);
		this.oPlanetGroup.add(this.oPlanetObject);

		// make N/S labels
		this.northLabel = new TextSprite('N',256);
		let north = this.northLabel.get();
		north.position.set(0.0,0.0,1.25);
		north.scale.set(0.25,0.25,0.25);
		north.name = 'North Label';
		this.oPlanetGroup.add(north);

		this.southLabel = new TextSprite('S',256);
		let south = this.southLabel.get();
		south.position.set(0.0,0.0,-1.25);
		south.scale.set(0.25,0.25,0.25);
		south.name = 'South Label';
		this.oPlanetGroup.add(south);

		// Add rotation axis vector.
		this.oSpinAxisVector = new THREE.ArrowHelper(new THREE.Vector3(0.0,0.0,1.0), new THREE.Vector3(0.0,0.0,0.0), 5.0, this.spinVectorColour);
		this.oSpinAxisVector.name='Spin Axis Vector';
		this.oPlanetGroup.add(this.oSpinAxisVector);

		// Add a latitude/longitude grid to the planet.
		this.oLatLong = new LatLongGrid(2,8);
		this.oLatLong.makeGrid();
		this.oPlanetGroup.add(this.oLatLong.get());

		// Setup the magnetic field.
		this.oMagneticField = new THREE.Group();
		this.oMagneticField.name = 'Magnetic Field';
		this.oMagneticField.matrixAutoUpdate = false;
		this.oDipole = new Dipole(this.fieldLineColour)
		this.oDipole.makeFieldLines(this.minLshell, this.maxLshell, this.stepLshell, this.numLongitudes)
		this.oMagneticField.add(this.oDipole.get())
		this.oDipoleVector = new THREE.ArrowHelper(new THREE.Vector3(0.0,0.0,1.0), new THREE.Vector3(0.0,0.0,0.0), 4.0, this.dipoleVectorColour);
		this.oMagneticField.add(this.oDipoleVector)
		this.oPlanetGroup.add(this.oMagneticField)
	}

	/** Initialise an empty planetary system object and add to the scene.
	***
	*** This THREE.js group will eventually be populated with moons and a
	*** ring system when planets are selected.
	**/
	initPlanetarySystem() {
		this.oPlanetarySystemGroup = new THREE.Group();
		this.oPlanetarySystemGroup.name = 'Planetary System';
		this.oPlanetarySystemGroup.matrixAutoUpdate = false;
	}

	/** Initialise the WebGL renderer, setting the size based on the browser window. **/
	initRenderer() {
		// Setup the renderer.
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);
	}

	/** Initialise the orbit controls and attach to the camera and renderer. **/
	initControls() {
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.25;
		this.controls.screenSpacePanning = false;
		this.controls.minDistance = 2;
		this.controls.maxDistance = 500;
		this.controls.maxPolarAngle = 2.0*Math.PI;
	}

	/** Initialise GUI.
	***
	*** This method uses DAT.gui to build an interface to allow the user to
	*** select planets and to adjust the parameters.
	**/
	initGui() {
		// init GUI.
		this.gui = new dat.GUI({height : 5 * 32 - 1});
		this.gui.add(this, 'autoRotate').name('Auto rotate')
		this.gui.add(this, 'speedUp').name('Speed').min(100.0).max(10000.0).step(1.0);
		this.gui.add(this, 'rotationY').name('Obliquity').min(-90.0).max(90.0).step(5.0);
		this.gui.add(this, 'rotationZ').name('Orbital Phase').min(0.0).max(360.0).step(10.0);
		this.gui.add(this, 'dipolePoleColatitude').name('Dipole Colatitude').min(0.0).max(180.0).step(5.0).onChange(this.onChangeDipoleProperties.bind(this));
		this.gui.add(this, 'dipolePoleLongitude').name('Dipole Longitude').min(0.0).max(360.0).step(5.0).onChange(this.onChangeDipoleProperties.bind(this));
		this.gui.add(this, 'dipoleOriginX').name('Dipole x0').min(-1.0).max(1.0).step(0.02).onChange(this.onChangeDipoleProperties.bind(this));
		this.gui.add(this, 'dipoleOriginY').name('Dipole y0').min(-1.0).max(1.0).step(0.02).onChange(this.onChangeDipoleProperties.bind(this));
		this.gui.add(this, 'dipoleOriginZ').name('Dipole z0').min(-1.0).max(1.0).step(0.02).onChange(this.onChangeDipoleProperties.bind(this));
		this.gui.add(this, 'rotationPeriod').name('Rotation Period').min(9.0).max(29.0).step(0.05);
		this.gui.add(this, 'rotationReversed').name('Reverse Rotation').listen().onChange(this.onChangeRotationReversed.bind(this));
		this.gui.add(this, 'planetaryInfo').name('Show Information');
		this.gui.add(this, 'captureSVG').name('Capture SVG Code');

		this.guiFolderPlanets = this.gui.addFolder('Planets');
		let labels = new Array();
		for (let [key, val] of this.planetObjects) labels.push(key);
		this.guiFolderPlanets.add(this, 'planet', labels).name('Planet').onChange(this.onChangePlanet.bind(this));
		this.guiFolderPlanets.add(this, 'time').name('Time').listen().onFinishChange(this.onChangeTime.bind(this));

		this.guiFolderViews = this.gui.addFolder('Views');
		this.guiFolderViews.add(this, 'setViewSun').name('Subsolar point');
		this.guiFolderViews.add(this, 'setViewDusk').name('Dusk meridian');
		this.guiFolderViews.add(this, 'setViewDawn').name('Dawn meridian');
		this.guiFolderViews.add(this, 'setViewTop').name('Overhead');
		this.guiFolderViews.add(this, 'setViewOblique').name('Oblique');

		this.guiFolderOptions = this.gui.addFolder('Options');
		this.guiFolderOptions.add(this, 'drawFieldLines').name('Draw field lines').onChange(this.onChangefieldLineVisibilty.bind(this));
		this.guiFolderOptions.add(this, 'drawNorthSouthLabels').name('Draw north/south labels').onChange(this.onChangeDrawNSLabels.bind(this));
		this.guiFolderOptions.add(this, 'cameraType', ['Perspective','Orthographic']).name('Camera').onChange(this.onChangeCamera.bind(this));

		this.guiFolderColours = this.gui.addFolder('Colours');
		this.guiFolderColours.addColor(this, 'bgColour').name('Background').onChange(this.onChangeBackgroundColour.bind(this));
		this.guiFolderColours.addColor(this, 'moonOrbitColour').name('Moon orbits').onChange(this.onChangemoonOrbitColor.bind(this));
		this.guiFolderColours.addColor(this, 'fieldLineColour').name('Field lines').onChange(this.onChangefieldLineColor.bind(this));
		this.guiFolderColours.addColor(this, 'ambientColour').name('Ambient light').onChange(this.onChangeAmbientLightColour.bind(this));
		this.guiFolderColours.addColor(this, 'sunColour').name('Sunlight').onChange(this.onChangeSunlightColour.bind(this));
		this.guiFolderColours.addColor(this, 'sunVectorColour').name('Sun vector').onChange(this.onChangeSunVectorColour.bind(this));
		this.guiFolderColours.addColor(this, 'orbitVectorColour').name('Orbit vector').onChange(this.onChangeOrbitVectorColour.bind(this));
		this.guiFolderColours.addColor(this, 'spinVectorColour').name('Spin vector').onChange(this.onChangeSpinVectorColour.bind(this));
		this.guiFolderColours.addColor(this, 'dipoleVectorColour').name('Dipole vector').onChange(this.onChangeDipoleVectorColour.bind(this));

		this.guiFolderOrbitalPlane = this.gui.addFolder('Orbital Plane')
		this.guiFolderOrbitalPlane.add(this, 'orbitalPlane', ['Wireframe','Solid','None']).name('Rendering').onChange(this.onChangeOrbitalPlane.bind(this));
		this.guiFolderOrbitalPlane.addColor(this, 'orbitalPlaneColour').name('Colour').onChange(this.onChangeOrbitalPlaneProperties.bind(this));
		this.guiFolderOrbitalPlane.add(this, 'orbitalPlaneOpacity').name('Opacity').min(0.0).max(1.0).step(0.01).onChange(this.onChangeOrbitalPlaneProperties.bind(this));
//		this.guiFolderOrbitalPlane.add(this, 'orbitalPlaneTransparency').name('Transparent').onChange(this.onChangeOrbitalPlaneProperties.bind(this));

		this.guiFolderEquatorialPlane = this.gui.addFolder('Equatorial Plane')
		this.guiFolderEquatorialPlane.add(this, 'equatorialPlane', ['Wireframe','Solid','None']).name('Rendering').onChange(this.onChangeEquatorialPlane.bind(this));
		this.guiFolderEquatorialPlane.addColor(this, 'equatorialPlaneColour').name('Colour').onChange(this.onChangeEquatorialPlaneProperties.bind(this));
		this.guiFolderEquatorialPlane.add(this, 'equatorialPlaneOpacity').name('Opacity').min(0.0).max(1.0).step(0.01).onChange(this.onChangeEquatorialPlaneProperties.bind(this));
//		this.guiFolderEquatorialPlane.add(this, 'equatorialPlaneTransparency').name('Transparent');

		this.guiFolderDipoleEquatorPlane = this.gui.addFolder('Dipole Equatorial Plane')
		this.guiFolderDipoleEquatorPlane.add(this, 'dipoleEquatorialPlane', ['Wireframe','Solid','None']).name('Rendering').onChange(this.onChangeDipoleEquatorialPlane.bind(this));
		this.guiFolderDipoleEquatorPlane.addColor(this, 'dipoleEquatorialPlaneColour').name('Colour').onChange(this.onChangeDipoleEquatorialPlaneProperties.bind(this));
		this.guiFolderDipoleEquatorPlane.add(this, 'dipoleEquatorialPlaneOpacity').name('Opacity').min(0.0).max(1.0).step(0.01).onChange(this.onChangeDipoleEquatorialPlaneProperties.bind(this));
//		this.guiFolderDipoleEquatorPlane.add(this, 'dipoleEquatorialPlaneTransparency').name('Transparent');
	}

	/** Callback which updates the scene and renders a new frame.
	***
	*** The method computes the timestep between this frame and the last (so
	*** we can maintain frame-rate independent animation), steps the animation
	*** features (moon orbits, planet rotation) and then renders the new frame.
	***
	*** @param {number} t Timestamp for this animation frame.
	**/
	animate(t) {
		requestAnimationFrame(this.animate.bind(this));
		this.controls.update();

		let dt = t - this.lastFrameTime;

		this.step(dt)
		this.update()

		this.renderer.render(this.scene, this.camera);
		this.lastFrameTime = t;
	}

	/** Update the animations based on given stepsize.
	***
	*** Updates both the rotation state of the planet and the orbital position
	*** of the moons (if present). The provided timestep (in ms) is converted
	*** to a "simulation" timestep based on a speedup factor set in the GUI.
	***
	*** @param {number} dt Time step.
	**/
	step(dt) {
		if (this.autoRotate) {

			// Rotation phase is adjusted based on the angular rotation rate
			// (2pi/Period) of the planet.
			if (this.rotationReversed) {
				this.planetRotationPhase -= dt*1e-3*this.speedUp*(2.0*Math.PI/(this.rotationPeriod*3600.0));
			} else {
				this.planetRotationPhase += dt*1e-3*this.speedUp*(2.0*Math.PI/(this.rotationPeriod*3600.0));
			}

			// Update each moon.
			let i;
			for (i=0; i<this.moons.length; i++) this.moons[i].stepAndUpdate(dt*1e-3*this.speedUp);
		}
	}

	/** Update the rotation matrices for the planet and planetary sytem. **/
	update() {
		this.oPlanetGroup.matrix = new THREE.Matrix4().makeRotationZ(this.planetRotationPhase);
		let yMatrix = new THREE.Matrix4().makeRotationY(this.rotationY*Math.PI/180.0);
		let zMatrix = new THREE.Matrix4().makeRotationZ(this.rotationZ*Math.PI/180.0);
		this.oPlanetarySystemGroup.matrix = zMatrix.multiply(yMatrix);
	}

	/** Starts the animation and rendering loop. **/
	run() {
		this.lastFrameTime = performance.now();
		requestAnimationFrame(this.animate.bind(this));
	}

	/** Captures the current visualisation and generates SVG code for the user.
	***
	*** Generates a new browser window with a simple text area element to hold
	*** the SVG code. The method then creates an instance of the SVGRenderer,
	*** points the SVG Renderer to the textarea element, and then renders the
	*** scene.
	***
	*** This code is based on blog posts and code by Felix Breuer:
	*** http://blog.felixbreuer.net/2014/08/05/using-threejs-to-create-vector-graphics-from-3d-visualizations.html
	*** https://github.com/fbreuer/threejs-examples
	***
	*** and Marcio L. Teixeira:
	*** (https://mt236.wordpress.com/2016/03/26/using-three-js-to-render-to-svg/).
	*** https://github.com/marciot/blog-demos/tree/master/three-to-svg
	**/
	captureSVG() {
		let w = window.innerWidth;
		let h = window.innerHeight;
		let newWindow = window.open('', '', 'width='+w.toString()+', height='+h.toString());
		let svgCodeContainer = newWindow.document.createElement('textarea');
		svgCodeContainer.id = 'source';
		svgCodeContainer.cols = 120;
		svgCodeContainer.rows = 40;
		newWindow.document.body.appendChild(svgCodeContainer)

		let svgRenderer = new THREE.SVGRenderer();
		svgRenderer.setClearColor(0xffffff);
		svgRenderer.setSize(w, h);
		svgRenderer.setQuality('high');
		svgCodeContainer.appendChild(svgRenderer.domElement);
		svgRenderer.render(this.scene,this.camera);

		newWindow.document.getElementById('source').value = svgCodeContainer.innerHTML.replace(/<path/g,"\n<path");
	}

	/** Fetch planet meta data and display **/
	planetaryInfo() {
		let cPlanet = this.planetObjects.get(this.planet);
		var title = cPlanet.name;
		var name = cPlanet.meta.author;
		var version = cPlanet.meta.version;
		var contact = cPlanet.meta.contact;
		var text = cPlanet.meta.text;

		/** Create information box container **/
		var box = document.createElement('div');
		box.className = 'information-box-container';
		box.id = 'info-box';

		/** Create close button for information box **/
	  var boxClose = document.createElement('div');
		boxClose.className = 'close-container';
		boxClose.innerHTML = '<button id="info-closeButton" class="close" onclick="infoRemove()">&times;</button>';

		/** Populate information box with content **/
		var boxContent = document.createElement('div');
		boxContent.className = 'content';

		/**Add text to content **/
		var contentText = document.createElement('div');
		contentText.className = 'text';
		contentText.innerHTML = '<h2>'+title+'</h2>'+'<p>Author(s): '+name+'</p><p>Contact: '+contact+'</p><p>Version: '+version+'</p><p>'+text+'</p>';

		document.body.appendChild(box);
		box.appendChild(boxContent);
		boxContent.appendChild(boxClose);
		boxContent.appendChild(contentText);
	}

	/** Convert a moon or ring name to a label.
	***
	*** Strips out whitespace and other symbols that are not legal as
	*** javascript variable names, then adds a prefix and underscore to
	*** the start.
	***
	*** @param {string} s The moon or ring name to generate a label from.
	*** @param {string} prefix The prefix to add.
	**/
	nameToLabel(s,prefix) {
		// strip out all whitespace, append an underscore
		let label = (' ' + s).slice(1)
		label = label.replace(/\s/g,'')
		label = label.replace(/[^a-zA-Z0-9]+/,'')
		return('_'+prefix+'_'+label)
	}

	/** Change the current camera to use the perspective camera. **/
	setPerspectiveCamera() {
		// Copy over the position and orientation of the current camera.
		this.perspectiveCamera.position.copy(this.camera.position);
		this.perspectiveCamera.rotation.copy(this.camera.rotation);
		let targetX = this.controls.target.x;
		let targetY = this.controls.target.y;
		let targetZ = this.controls.target.z;
		this.camera = this.perspectiveCamera;

		// dipose of old controls
		this.controls.dispose();

		// make new controls
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.25;
		this.controls.screenSpacePanning = false;
		this.controls.minDistance = 2;
		this.controls.maxDistance = 500;
		this.controls.maxPolarAngle = 2.0*Math.PI;
		this.controls.target.x = targetX;
		this.controls.target.y = targetY;
		this.controls.target.z = targetZ;
	}

	/** Change the current camera to use the orthographic camera. **/
	setOrthographicCamera() {
		// Copy over the position and orientation of the current camera.
		this.orthographicCamera.position.copy(this.camera.position);
		this.orthographicCamera.rotation.copy(this.camera.rotation);
		let targetX = this.controls.target.x;
		let targetY = this.controls.target.y;
		let targetZ = this.controls.target.z;
		this.camera = this.orthographicCamera;

		// dipose of old controls
		this.controls.dispose();

		// make new controls
		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.25;
		this.controls.screenSpacePanning = false;
		this.controls.minDistance = 2;
		this.controls.maxDistance = 500;
		this.controls.maxPolarAngle = 2.0*Math.PI;
		this.controls.target.x = targetX;
		this.controls.target.y = targetY;
		this.controls.target.z = targetZ;
	}

	/** Change camera position to be located at the subsolar point. **/
	setViewSun() {this.camera.position.set(10.0,0.0,0.0);}

	/** Change camera position to be located above the X-Y plane ("above"). **/
	setViewTop() {this.camera.position.set(0.0,0.0,10.0);}

	/** Change camera position to be located at the dawn terminator. **/
	setViewDawn() {this.camera.position.set(0.0,-10.0,0.0);}

	/** Change camera position to be located at the dusk terminator. **/
	setViewDusk() {this.camera.position.set(0.0,10.0,0.0);}

	/** Change camera position to be located at the above the post-noon sector. **/
	setViewOblique() {this.camera.position.set(5.77,5.77,5.77);}

	/** Update dipole world matrix based on a new dipole colatitude/longitude and origin. **/
	onChangeDipoleProperties() {
		// Set the orientation and location of the dipole and add.
		let yMatrix = new THREE.Matrix4().makeRotationY(this.dipolePoleColatitude*Math.PI/180.0);
		let zMatrix = new THREE.Matrix4().makeRotationZ(this.dipolePoleLongitude*Math.PI/180.0);
		let tMatrix = new THREE.Matrix4().makeTranslation(this.dipoleOriginX, this.dipoleOriginY, this.dipoleOriginZ);
		this.oMagneticField.matrix = tMatrix.multiply(zMatrix.multiply(yMatrix));
	}

	/** Update obliquity and orbtial phase angles for a user-selected timestamp. **/
	onChangeTime() {
		let t = new Date(this.time);
		let cPlanet = this.planetObjects.get(this.planet);
		this.rotationY = cPlanet.yFunction(t.getTime());
		this.rotationZ = cPlanet.zFunction(t.getTime()) % 360.0;
		this.update();
	}

	/** Update planet object when planet is a retrograde rotator. **/
	onChangeRotationReversed() {
		if (this.rotationReversed) {
			this.oSpinAxisVector.rotation.set(-Math.PI/2.0,0.0,0.0);
		} else {
			this.oSpinAxisVector.rotation.set(Math.PI/2.0,0.0,0.0);
		}
		this.oSpinAxisVector.updateMatrix();
	}

	/** Update the planet texture map - callback for DOM img element containing texture. **/
	onPlanetTextureLoadOrChange() {
		if (this.planetTexture) this.planetTexture.dispose()
		this.planetTexture = new THREE.Texture(this.planetImageElement)
		this.planetTexture.needsUpdate = true;
		this.planetMaterial.map = this.planetTexture;
		this.planetMaterial.needsUpdate = true;
	}

	/** Update orbital plane rendering based on user selection. **/
	onChangeOrbitalPlane() {
		let tmp = this.scene.getObjectByName('Orbital Plane')
		if (typeof(tmp)!='undefined') {
			this.scene.remove(tmp)
			this.oOrbitalPlane.dispose()
		}
		switch(this.orbitalPlane) {
			case 'Wireframe':
				this.oOrbitalPlane.makeWireframe(this.orbitalPlaneColour,'#bbbbbb', 100);
				this.scene.add(this.oOrbitalPlane.get());
				break;
			case 'Solid':
				this.oOrbitalPlane.makeSolid(this.orbitalPlaneColour, this.orbitalPlaneOpacity);
				this.scene.add(this.oOrbitalPlane.get());
				break;
			case 'None':
				break;
		}
	}

	/** Update orbital plane colours and opacity based on user selection. **/
	onChangeOrbitalPlaneProperties() {
		let tmp = this.oOrbitalPlane.get()
		tmp.material.color.setStyle(this.orbitalPlaneColour);
		tmp.material.opacity = this.orbitalPlaneOpacity;
	}

	/** Update equatorial plane rendering based on user selection. **/
	onChangeEquatorialPlane() {
		let tmp = this.oPlanetarySystemGroup.getObjectByName('Equatorial Plane')
		if (typeof(tmp)!='undefined') {
			this.oPlanetarySystemGroup.remove(tmp)
			this.oEquatorialPlane.dispose()
		}

		switch(this.equatorialPlane) {
			case 'Wireframe':
				this.oEquatorialPlane.makeWireframe(this.equatorialPlaneColour,'#bbbbbb', 500);
				this.oPlanetarySystemGroup.add(this.oEquatorialPlane.get());
				break;
			case 'Solid':
				this.oEquatorialPlane.makeSolid(this.equatorialPlaneColour, this.equatorialPlaneOpacity);
				this.oPlanetarySystemGroup.add(this.oEquatorialPlane.get());
				break;
			case 'None':
				break;
		}
	}

	/** Update equatorial plane colours and opacity based on user selection. **/
	onChangeEquatorialPlaneProperties() {
		let tmp = this.oEquatorialPlane.get()
		tmp.material.color.setStyle(this.equatorialPlaneColour);
		tmp.material.opacity = this.equatorialPlaneOpacity;
	}

	/** Update dipole equatorial plane rendering based on user selection. **/
	onChangeDipoleEquatorialPlane() {
		let tmp = this.oMagneticField.getObjectByName('Dipole Equatorial Plane')
		if (typeof(tmp)!='undefined') {
			this.oMagneticField.remove(tmp)
			this.oDipoleEquatorialPlane.dispose()
		}

		switch(this.dipoleEquatorialPlane) {
			case 'Wireframe':
				this.oDipoleEquatorialPlane.makeWireframe(this.dipoleEquatorialPlaneColour,'#bbbbbb', 500);
				this.oMagneticField.add(this.oDipoleEquatorialPlane.get());
				break;
			case 'Solid':
				this.oDipoleEquatorialPlane.makeSolid(this.dipoleEquatorialPlaneColour, this.dipoleEquatorialPlaneOpacity);
				this.oMagneticField.add(this.oDipoleEquatorialPlane.get());
				break;
			case 'None':
				break;
		}
	}

	/** Update dipole equatorial plane colours and opacity based on user selection. **/
	onChangeDipoleEquatorialPlaneProperties() {
		let tmp = this.oDipoleEquatorialPlane.get()
		tmp.material.color.setStyle(this.dipoleEquatorialPlaneColour);
		tmp.material.opacity = this.dipoleEquatorialPlaneOpacity;
	}

	/** Change planet on response to the user selecting a planet from the planet GUI combobox.
	***
	*** Rermoves the moons and rings from the current planetary system
	*** object, change the planet propertie, update the GUI, and add new
	*** moons/rings.
	**/
	onChangePlanet() {
		let i;

		// remove all the moons
		for (i=this.moons.length-1; i>=0; i--) {
			let tmp = this.moons.pop()
			this.oPlanetarySystemGroup.remove(tmp.getMoonObject())
			this.oPlanetarySystemGroup.remove(tmp.getOrbitObject())
			tmp.dispose()
		}

		// remove all the rings
		for (i=this.rings.length-1; i>=0; i--) {
			let tmp = this.rings.pop()
			this.oPlanetarySystemGroup.remove(tmp.get())
			tmp.dispose()
		}

		// make planet the active one
		let cPlanet = this.planetObjects.get(this.planet)
		this.rotationPeriod = cPlanet.rotationPeriod;
		this.rotationReversed = cPlanet.rotationReversed;
		this.dipolePoleColatitude = cPlanet.dipolePoleColatitude;
		this.dipolePoleLongitude = cPlanet.dipolePoleLongitude;
		this.dipoleOriginX = cPlanet.dipoleOrigin[0];
		this.dipoleOriginY = cPlanet.dipoleOrigin[1];
		this.dipoleOriginZ = cPlanet.dipoleOrigin[2];
		this.onChangeDipoleProperties()
		this.planetImageElement.src = this.planetObjects.get(this.planet).planetTexture
		this.onChangeRotationReversed()

		// set folder entries in the planets folder
		for (i=this.guiFolderPlanets.__controllers.length-1; i>1; i--) this.guiFolderPlanets.__controllers[i].remove();
		this.events = 'Now'
		this.guiFolderPlanets.add(this, 'events', this.planetObjects.get(this.planet).eventLabels).name('Events').onChange(this.onSelectEvent.bind(this))

		// set the time and update the obliquity and orbital phase
		let now = new Date();
		let nowStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
		this.time = nowStr;
		this.onChangeTime()

		// add moons
		let tmp;
		for (i=0; i<cPlanet.moonNames.length; i++) {
			tmp = new Moon(cPlanet.moonNames[i], 2*cPlanet.moonRadius[i]/cPlanet.equatorialRadius, cPlanet.moonSemimajor[i]/cPlanet.equatorialRadius, cPlanet.moonPeriod[i]*86400, cPlanet.moonInclination[i])
			tmp.update()
			this.moons.push(tmp)
			this.oPlanetarySystemGroup.add(tmp.getMoonObject())
			this.oPlanetarySystemGroup.add(tmp.getOrbitObject())
			tmp.getMoonObject().visible = this.moonVisible[this.nameToLabel(cPlanet.moonNames[i],'moon')]
			tmp.getOrbitObject().visible = this.moonVisible[this.nameToLabel(cPlanet.moonNames[i],'moon')]
			tmp.getOrbitObject().material.color.setStyle(this.moonOrbitColour)
			this.guiFolderPlanets.add(this.moonVisible, this.nameToLabel(cPlanet.moonNames[i],'moon')).name(cPlanet.moonNames[i]).onChange(this.onChangeMoonVisibility.bind(this));
		}

		// add wide rings
		for (i=0; i<cPlanet.wideRingNames.length; i++) {
			tmp = new WideRing(cPlanet.wideRingNames[i],
								cPlanet.wideRingInnerRadii[i]/cPlanet.equatorialRadius,
								cPlanet.wideRingOuterRadii[i]/cPlanet.equatorialRadius,
								cPlanet.wideRingColours[i], cPlanet.wideRingOpacities[i], true)
			this.rings.push(tmp)
			this.oPlanetarySystemGroup.add(tmp.get())
			tmp.get().visible = this.ringVisible[this.nameToLabel(cPlanet.wideRingNames[i],'ring')]
			tmp.get().material.color.setStyle(this.wideRingColour)

			this.guiFolderPlanets.add(this.ringVisible, this.nameToLabel(cPlanet.wideRingNames[i],'ring')).name(cPlanet.wideRingNames[i]).onChange(this.onChangeRingVisibility.bind(this));
		}

		// add discrete rings
		for (i=0; i<cPlanet.discreteRingNames.length; i++) {
			tmp = new DiscreteRing(cPlanet.discreteRingNames[i],
								cPlanet.discreteRingRadii[i]/cPlanet.equatorialRadius,
								cPlanet.discreteRingColours[i], cPlanet.discreteRingOpacities[i], true)
			this.rings.push(tmp)
			this.oPlanetarySystemGroup.add(tmp.get())
			tmp.get().visible = this.ringVisible[this.nameToLabel(cPlanet.discreteRingNames[i],'ring')]
			tmp.get().material.color.setStyle(this.discreteRingColour)

			this.guiFolderPlanets.add(this.ringVisible, this.nameToLabel(cPlanet.discreteRingNames[i],'ring')).name(cPlanet.discreteRingNames[i]).onChange(this.onChangeRingVisibility.bind(this));
		}

		// update GUI display
		for (i in this.gui.__controllers) {
			this.gui.__controllers[i].updateDisplay();
		}
	}

	/** Show/hide moons and their orbits. **/
	onChangeMoonVisibility() {
		let cPlanet = this.planetObjects.get(this.planet)
		for (let i=0; i<cPlanet.moonNames.length; i++) {
			this.moons[i].getMoonObject().visible=this.moonVisible[this.nameToLabel(cPlanet.moonNames[i],'moon')]
			this.moons[i].getOrbitObject().visible=this.moonVisible[this.nameToLabel(cPlanet.moonNames[i],'moon')]
		}
	}

	/** Show/hide rings. **/
	onChangeRingVisibility() {
		for (let i=0; i<this.rings.length; i++) {
			this.rings[i].get().visible = this.ringVisible[this.nameToLabel(this.rings[i].name,'ring')]
		}
	}

	/** When a planet event is selected, set the correct time, update the GUI, and update the visualisation. **/
	onSelectEvent() {
		if (this.events=='Now') {
			let now = new Date();
			let nowStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
			this.time = nowStr;
		} else {
			let cPlanet = this.planetObjects.get(this.planet)
			for (let i=1; i<cPlanet.eventLabels.length; i++) {
				if (cPlanet.eventLabels[i]==this.events) {
					this.time = cPlanet.eventTimes[i-1];
					this.onChangeTime()
				}
			}
		}
	}

	/** Change camera type. **/
	onChangeCamera() {
		switch(this.cameraType) {
			case 'Perspective':
				this.setPerspectiveCamera();
				break;
			case 'Orthographic':
				this.setOrthographicCamera();
				break;
		}
	}

	/** Show/hide north/south labels. **/
	onChangeDrawNSLabels() {
		if (this.drawNorthSouthLabels) {
			this.northLabel.get().visible = true;
			this.southLabel.get().visible = true;
		} else {
			this.northLabel.get().visible = false;
			this.southLabel.get().visible = false;
		}

	}

	/** Show/hide field lines. **/
	onChangefieldLineVisibilty(){
		if (this.drawFieldLines){
			this.oDipole.mat.visible = true;
		}
		else{
			this.oDipole.mat.visible = false;
		}
	}

	/** Update the background colour. **/
	onChangeBackgroundColour() {
		this.scene.background = new THREE.Color(this.bgColour);
	}

	/** Update the colour of moon orbits. **/
	onChangemoonOrbitColor(){
		let cPlanet = this.planetObjects.get(this.planet)
		for (let i=0; i<cPlanet.moonNames.length; i++) {
			this.moons[i].getOrbitObject().material.color.setStyle(this.moonOrbitColour);
		}
	}

	/** Update the colour of the field lines. **/
	onChangefieldLineColor(){
		this.oDipole.mat.color.setStyle(this.fieldLineColour);
	}

	/** Update the ambient light colour.	**/
	onChangeAmbientLightColour() {
		this.ambientLight.color.setStyle(this.ambientColour);
	}

	/** Update the Sun light colour. **/
	onChangeSunlightColour() {
		this.sunLight.color.setStyle(this.sunColour);
	}

	/** Update the colour of the planet-Sun vector. **/
	onChangeSunVectorColour() {
		this.oPlanetSunVector.cone.material.color.setStyle(this.sunVectorColour);
		this.oPlanetSunVector.line.material.color.setStyle(this.sunVectorColour);
	}

	/** Update the colour of the orbital velocity vector. **/
	onChangeOrbitVectorColour() {
		this.oOrbitVector.cone.material.color.setStyle(this.orbitVectorColour);
		this.oOrbitVector.line.material.color.setStyle(this.orbitVectorColour);
	}

	/** Update the colour of the planet spin axis vector. **/
	onChangeSpinVectorColour() {
		this.oSpinAxisVector.cone.material.color.setStyle(this.spinVectorColour);
		this.oSpinAxisVector.line.material.color.setStyle(this.spinVectorColour);
	}

	/** Update the colour of the dipole axis vector **/
	onChangeDipoleVectorColour() {
		this.oDipoleVector.cone.material.color.setStyle(this.dipoleVectorColour);
		this.oDipoleVector.line.material.color.setStyle(this.dipoleVectorColour);
	}

	/** Update the renderer and camera when the window is resized. **/
	onWindowResize() {
		this.camera.aspect = window.innerWidth/window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

}
