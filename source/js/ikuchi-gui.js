/**
***	@file Provides all the GUI functions for Ikuchi.
***	@author Chris Arridge, Lancaster University <c.arridge@lancaster.ac.uk>
***	@version 0.31
***	@copyright Lancaster University (2019)
***	@licence TBD.
**/

// GUI global variables
var gui;
var guiFolderPlanets;
var guiFolderSetup;
var guiPlanetEvents;
var guiPlanetSatellites;

// Parameters that control the simulation, some of which are editable in the GUI.
var params = {
	// what L-shells do we show, how many field lines are there around
	// the planet, and do we show the field lines?
	fieldLshells: new Array(2.0,4.0,6.0,8.0),
	fieldNumLongitudes: 6,
	displayFieldLines: true,

	// should the planet auto-rotate and what is the speedup factor from
	// reality (3600 means in one second of real time, an hour has passed
	// in the simulated view).
	rotatePlanet: true,
	speedUp: 3600,

	// Colatitude and longitude of the dipole, and the origin of the dipole.
	// The string representation is for the GUI.
	fieldPoleColatitude: 10.0,
	fieldPoleLongitude: 0.0,
	fieldOriginX: 0.0,
	fieldOriginY: 0.0,
	fieldOriginZ: 0.0,
	fieldOrigin: '(0.0,0.0,0.0)',

	// Rotational state of the plaentary system (controlled by obliquity and
	// planetary phase) and the rotational phase and rotation period
	// of the planet.
	rotationY: 0.0,
	rotationZ: 0.0,
	rotationPhase: 0.0,
	rotationPeriod: 24.0,
	rotationReversed: false,

	// For the planet selection.
	planet: '- -',
	time: '- -',
	events: '- -',
	satellites: '- -',

	// Functions to place the view at a given position.
	setViewSun: function() {gCamera.position.set(10.0,0.0,0.0);},
	setViewDusk: function() {gCamera.position.set(0.0,10.0,0.0);},
	setViewDawn: function() {gCamera.position.set(0.0,-10.0,0.0);},
	setViewTop: function() {gCamera.position.set(0.0,0.0,10.0);},
	setViewOblque: function() {gCamera.position.set(5.77,5.77,5.77);},

	// Button to render to SVG. Inspired by https://www.marciot.com/blog-demos/three-to-svg/.
	goCaptureSVG: function () {
		var w = window.innerWidth;
		var h = window.innerHeight;
		var newWindow = window.open('', '', 'width='+w.toString()+', height='+h.toString());
		var svgCodeContainer = newWindow.document.createElement('textarea');
		svgCodeContainer.id = 'source';
		svgCodeContainer.cols = 120;
		svgCodeContainer.rows = 40;
		newWindow.document.body.appendChild(svgCodeContainer)

		svgRenderer = new THREE.SVGRenderer();
		svgRenderer.setClearColor(0xffffff);
		svgRenderer.setSize(w, h);
		svgRenderer.setQuality('low');
		svgCodeContainer.appendChild(svgRenderer.domElement);
		svgRenderer.render(gScene,gCamera);

		newWindow.document.getElementById('source').value = svgCodeContainer.innerHTML.replace(/<path/g,"\n<path");
	},

	// Move the simulation to a given planet at a given time.
	goPlanet: function() {
		// Convert the time into a unix timestamp (in milliseconds) so that
		// the fits can be used to figure out the obliquity and orbital phase
		// angles.
		t = new Date(params.time);

		// Giant planet dipole position and orientation taken from
		// Connerney (1993) JGR 98(E10), 18659-18679.
		switch(params.planet) {
			case 'Earth':
				params.rotationPeriod = 24.0;
				updateRotationReversed(false);
				params.rotationY = rotyEarth(t.getTime());
				params.rotationZ = rotzEarth(t.getTime()) % 360.0;
				updateFieldColat(10.1);
				updateFieldLong(288.0);
				updateFieldOrigin('(0.0,0.0,0.0)');
				gPlanetImageElement.src = textureEarthDayMap;
				break;
			case 'Jupiter':
				params.rotationPeriod = 9.925;
				updateRotationReversed(false);
				params.rotationY = rotyJupiter(t.getTime());
				params.rotationZ = rotzJupiter(t.getTime()) % 360.0;
				updateFieldOrigin('(-0.01,0.0,-0.01)');
				updateFieldColat(10.8);
				updateFieldLong(201.0);
				gPlanetImageElement.src = textureJupiter;
				break;
			case 'Saturn':
				params.rotationPeriod = 10.0 + (33.0*60 + 38.0)/3600.0;
				updateRotationReversed(false);
				params.rotationY = rotySaturn(t.getTime());
				params.rotationZ = rotzSaturn(t.getTime()) % 360.0;
				updateFieldOrigin('(0.0,0.0,0.04)');
				updateFieldColat(0.0);
				updateFieldLong(0.0);
				gPlanetImageElement.src = textureSaturn;
				break;
			case 'Uranus':
				params.rotationPeriod = 17.0 + (14.0*60 + 24.0)/3600.0;
				updateRotationReversed(true);
				params.rotationY = rotyUranus(t.getTime());
				params.rotationZ = rotzUranus(t.getTime()) % 360.0;
				updateFieldOrigin('(-0.02,0.02,-0.31)');
				updateFieldColat(60.0);
				updateFieldLong(48.0);		// fixme
				gPlanetImageElement.src = textureUranus;
				break;
			case 'Neptune':
				params.rotationPeriod = 16.0 + (6.0*60 + 36.0)/3600.0;
				updateRotationReversed(false);
				params.rotationY = rotyNeptune(t.getTime());
				params.rotationZ = rotzNeptune(t.getTime()) % 360.0;
				updateFieldOrigin('(0.17,0.46,-0.24)');
				updateFieldColat(46.8);
				updateFieldLong(79.5);
				gPlanetImageElement.src = textureNeptune;
				break;
		}
	}
};


/**
*** Initialise the GUI.
***
*** @todo: add capability to select rings/satellites in the planet selector.
*** @todo: add capability to change the colours.
**/
function initGui()
{
	gui = new dat.GUI({height : 5 * 32 - 1});

	// main control parmeters
	gui.add(params, 'rotatePlanet').name('Auto rotate planet')
	gui.add(params, 'speedUp').name('Speed').min(100.0).max(10000).step(1.0).listen();
	gui.add(params, 'rotationY').name('Obliquity').min(-90.0).max(90.0).step(5.0).onChange(updateObliquity).listen();
	gui.add(params, 'rotationZ').name('Orbital Phase').min(0.0).max(360.0).step(10.0).onChange(updateOrbitPhase).listen();
	gui.add(params, 'fieldPoleColatitude').name('Dipole Colatitude').min(0.0).max(180.0).step(5.0).onChange(updateFieldColat).listen();
	gui.add(params, 'fieldPoleLongitude').name('Dipole Longitude').min(0.0).max(360.0).step(5.0).onChange(updateFieldLong).listen();
	gui.add(params, 'fieldOrigin').name('Dipole Centre').onFinishChange(updateFieldOrigin).listen();
	gui.add(params, 'rotationPeriod').name('Rotation Period').min(9.0).max(29.0).step(0.05).listen();
	gui.add(params, 'rotationReversed').name('Reverse Rotation').onChange(updateRotationReversed).listen();
	gui.add(params, 'goCaptureSVG').name('Capture SVG Code');

	// quick button to change views
	var guiViewFolders = gui.addFolder('Views');
	guiViewFolders.add(params, 'setViewSun').name('Subsolar point');
	guiViewFolders.add(params, 'setViewDusk').name('Dusk meridian');
	guiViewFolders.add(params, 'setViewDawn').name('Dawn meridian');
	guiViewFolders.add(params, 'setViewTop').name('Overhead');
	guiViewFolders.add(params, 'setViewOblque').name('Oblique');

	// setup presets
	guiFolderSetup = gui.addFolder('Setup');
	guiFolderSetup.add(params, 'fieldNumLongitudes').name('Num. longitudes')

	// select specific planets
	guiFolderPlanets = gui.addFolder('Planets');
	guiFolderPlanets.add(params, 'planet', ['- -','Earth','Jupiter','Saturn','Uranus','Neptune']).name('Planet').onFinishChange(updatePlanet);
	guiFolderPlanets.add(params, 'time').name('Time').listen();
	guiFolderPlanets.add(params, 'goPlanet').name('Go');
	guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['- -']).name('Events').onFinishChange(updatePlanetEvent);
//	guiPlanetSatellites = guiFolderPlanets.add(params, 'satellites', ['- -']).name('Satellites').onFinishChange(updatePlanetSatellites)
}


/**
*** Respond to a planet having been selected in the planet combobox. This sets
*** the current time in the time box, adds specific events to the event
*** combobox.
***
*** @todo: add capability to select rings/satellites in the planet selector.
**/
function updatePlanet(val) {
	var now = new Date();
	var nowStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0')

	switch(val) {
		case '- -':
			params.time = '';
//			guiPlanetEvents.remove()
//			guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['- -']).name('Events');
			break;
		case 'Earth':
			params.time = nowStr;
			guiPlanetEvents.remove()
			guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['Now','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice']).name('Events').onFinishChange(updatePlanetEvent);
//			guiPlanetSatellites.remove()
//			guiPlanetSatellites = guiFolderPlanets.add(params, 'satellites', ['None','Moon']).name('Satellites')
			break;
		case 'Jupiter':
			params.time = nowStr;
			guiPlanetEvents.remove()
			guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['Now']).name('Events').onFinishChange(updatePlanetEvent);
//			guiPlanetSatellites.remove()
//			guiPlanetSatellites = guiFolderPlanets.add(params, 'satellites', ['None','Io/Eur/Gan/Cal']).name('Satellites')
			break;
		case 'Saturn':
			params.time = nowStr;
			guiPlanetEvents.remove()
			guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['Now','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice','Cassini SOI']).name('Events').onFinishChange(updatePlanetEvent);
//			guiPlanetSatellites.remove()
//			guiPlanetSatellites = guiFolderPlanets.add(params, 'satellites', ['None','Enc/Tit','Mim/Enc/Tet/Dio/Rhe/Tit/Iap']).name('Satellites')
			break;
		case 'Uranus':
			params.time = nowStr;
			guiPlanetEvents.remove()
			guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['Now','Voyager 2','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice',]).name('Events').onFinishChange(updatePlanetEvent);
//			guiPlanetSatellites.remove()
//			guiPlanetSatellites = guiFolderPlanets.add(params, 'satellites', ['None','Mir/Ari/Umb/Tit/Obe']).name('Satellites')
			break;
		case 'Neptune':
			params.time = nowStr;
			guiPlanetEvents.remove()
			guiPlanetEvents = guiFolderPlanets.add(params, 'events', ['Now','Voyager 2','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice',]).name('Events').onFinishChange(updatePlanetEvent);
//			guiPlanetSatellites.remove()
//			guiPlanetSatellites = guiFolderPlanets.add(params, 'satellites', ['None','Triton','Pro/Tri/Ner']).name('Satellites')
			break;
		default:
			throw new Error("Unknown planet name");
	}
}



/**
*** Called when the rotation orientation of the planet is changed. Sets the
*** parameter and changes the rotation axis vector object.
**/
function updateRotationReversed(val) {
	params.rotationReversed = val;
	if (params.rotationReversed) {
		gScene.getObjectByName('Rotation Axis Vector').rotation.set(-Math.PI/2.0,0.0,0.0);
	} else {
		gScene.getObjectByName('Rotation Axis Vector').rotation.set(Math.PI/2.0,0.0,0.0);
	}
	gScene.getObjectByName('Rotation Axis Vector').updateMatrix();
}


/**
*** Called when the obliquity of the planet is directly changed in the
*** GUI. Sets the parameter and adjusted the rotation matrices.
**/
function updateObliquity(val) {
	params.rotationY = val;
	setPlanetSystemRotationMatrix();
}


/**
*** Called when the orbital phase of the planet is directly changed in the
*** GUI. Sets the parameter and adjusted the rotation matrices.
**/
function updateOrbitPhase(val) {
	params.rotationZ=val;
	setPlanetSystemRotationMatrix();
}


/**
*** Called when the pole colatitude of the dipole is directly changed in the
*** GUI. Sets the parameter and adjusted the rotation matrices.
**/
function updateFieldColat(val) {
	params.fieldPoleColatitude = val;
	var yMatrix = new THREE.Matrix4().makeRotationY(params.fieldPoleColatitude*Math.PI/180.0);
	var zMatrix = new THREE.Matrix4().makeRotationZ(params.fieldPoleLongitude*Math.PI/180.0);
	var transMatrix = new THREE.Matrix4().makeTranslation(params.fieldOriginX,params.fieldOriginY,params.fieldOriginZ);
	gScene.getObjectByName('Dipole plus Vector').matrix = transMatrix.multiply(zMatrix.multiply(yMatrix));
	setPlanetSystemRotationMatrix();
}


/**
*** Called when the pole longitude of the dipole is directly changed in the
*** GUI. Sets the parameter and adjusted the rotation matrices.
**/
function updateFieldLong(val) {
	params.fieldPoleLongitude = val;
	var yMatrix = new THREE.Matrix4().makeRotationY(params.fieldPoleColatitude*Math.PI/180.0);
	var zMatrix = new THREE.Matrix4().makeRotationZ(params.fieldPoleLongitude*Math.PI/180.0);
	var transMatrix = new THREE.Matrix4().makeTranslation(params.fieldOriginX,params.fieldOriginY,params.fieldOriginZ);
	gScene.getObjectByName('Dipole plus Vector').matrix = transMatrix.multiply(zMatrix.multiply(yMatrix));
	setPlanetSystemRotationMatrix();
}


/**
*** Called when the origin of the dipole is directly changed in the
*** GUI. Sets the parameter and adjusted the rotation matrices.
**/
function updateFieldOrigin(val) {
	params.fieldOrigin = val;
	v = val.replace(/[()\s]+/g, '').split(',')
	params.fieldOriginX = Number(v[0]);
	params.fieldOriginY = Number(v[1]);
	params.fieldOriginZ = Number(v[2]);
	var yMatrix = new THREE.Matrix4().makeRotationY(params.fieldPoleColatitude*Math.PI/180.0);
	var zMatrix = new THREE.Matrix4().makeRotationZ(params.fieldPoleLongitude*Math.PI/180.0);
	var transMatrix = new THREE.Matrix4().makeTranslation(params.fieldOriginX,params.fieldOriginY,params.fieldOriginZ);
	gScene.getObjectByName('Dipole plus Vector').matrix = transMatrix.multiply(zMatrix.multiply(yMatrix));
	setPlanetSystemRotationMatrix();
}


/**
*** Called when the a planet "event" is selected in the GUI combobox. Sets the
*** appropriate time (e.g., closest approach time of a spacecraft) and then
*** invokes goPlanet to set everything up.
**/
function updatePlanetEvent(val) {
	var now = new Date();
	var nowStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0')
	console.log(val);
	switch(params.planet) {
		// Equinox and solstice times from https://en.wikipedia.org/wiki/Equinox
		case 'Earth':
			switch(val) {
				case 'Now':
					params.time = nowStr;
					params.goPlanet();
					break;
				case 'NH Summer Solstice':
					params.time = '2019-06-21';
					params.goPlanet();
					break;
				case 'SH Summer Solstice':
					params.time = '2019-12-22';
					params.goPlanet();
					break;
				case 'Vernal Equinox':
					params.time = '2019-03-20';
					params.goPlanet();
					break;
				case 'Autumnal Equinox':
					params.time = '2019-09-23';
					params.goPlanet();
					break;
			}
			break;

		case 'Jupiter':
			switch(val) {
				case 'Now':
					params.time = nowStr;
					params.goPlanet();
					break;
			}
			break;

		case 'Saturn':
			switch(val) {
				case 'Now':
					params.time = nowStr;
					params.goPlanet();
					break;
				case 'Vernal Equinox':
					params.time = '2009-08-11';
					params.goPlanet();
					break;
				case 'NH Summer Solstice':
					params.time = '2018-05-23';
					params.goPlanet();
					break;
				case 'Autumnal Equinox':
					params.time = '1995-11-19';
					params.goPlanet();
					break;
				case 'SH Summer Solstice':
					params.time = '2002-10-25';
					params.goPlanet();
					break;
				case 'Cassini SOI':
					params.time = '2004-07-01';
					params.goPlanet();
					break;
			}
			break;

		// Equinox times from: Meeus, J (1997) 'Equinoxes and solstices on
		// Uranus and Neptune' J. Brit. Astronomical Assoc. 107(6), p332,
		// http://adsabs.harvard.edu/full/1997JBAA..107..332M
		case 'Uranus':
			switch(val) {
				case 'Now':
					params.time = nowStr;
					params.goPlanet();
					break;
				case 'Autumnal Equinox':
					params.time = '1966-02-03';
					params.goPlanet();
					break;
				case 'SH Summer Solstice':
					params.time = '1985-10-06';
					params.goPlanet();
					break;
				case 'Vernal Equinox':
					params.time = '2007-12-16';
					params.goPlanet();
					break;
				case 'NH Summer Solstice':
					params.time = '2030-04-19';
					params.goPlanet();
					break;
				case 'Voyager 2':
					params.time = '1986-01-24';
					params.goPlanet();
					break;
			}
			break;

		// Equinox times from: Meeus, J (1997) 'Equinoxes and solstices on
		// Uranus and Neptune' J. Brit. Astronomical Assoc. 107(6), p332,
		// http://adsabs.harvard.edu/full/1997JBAA..107..332M
		case 'Neptune':
			switch(val) {
				case 'Now':
					params.time = nowStr;
					params.goPlanet();
					break;
				case 'Vernal Equinox':
					params.time = '2038-02-28';
					params.goPlanet();
					break;
				case 'NH Summer Solstice':
					params.time = '2078-11-14';
					params.goPlanet();
					break;
				case 'Autumnal Equinox':
					params.time = '1955-04-11';
					params.goPlanet();
					break;
				case 'SH Summer Solstice':
					params.time = '1997-02-26';
					params.goPlanet();
					break;
				case 'Voyager 2':
					params.time = '1989-08-25';
					params.goPlanet();
					break;
			}
			break;
	}
}
