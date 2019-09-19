/**
***	@file Provides all the rendering functions for Ikuchi.
***	@author Chris Arridge, Lancaster University <c.arridge@lancaster.ac.uk>
***	@version 4
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


/** @class Class to contain a rectangular plane that might be solid or wireframe.
***
*** This is used to represent orbital and equatorial planes.
***/
class Plane {
	/** Create instance of the a plane.
	***
	*** @constructor
	*** @param {number} size The dimensions of the plane.
	**/
	constructor(name,size) {
		this.name = name
		this.size = size
		this.geom = null
		this.mat = null
		this.object = null
	}

	/** Make a new wireframe plane.
	***
	*** @param {colour} majorColour The colour of the major lines on the plane.
	*** @param {colour} minorColour The colour of the minor lines on the plane.
	*** @param {number} resolution Number of minor blocks that the plane divided into.
	**/
	makeWireframe(majorColour, minorColour, resolution) {
		this.dispose()
		this.object = new THREE.GridHelper(this.size, resolution, majorColour, minorColour);
		this.object.name = this.name;
		this.object.rotateX(Math.PI/2.0);
		this.object.translateZ(Math.random()*0.02-0.01)
		this.object.updateMatrix();
		this.object.matrixAutoUpdate = false;
	}

	/** Make a new solid plane.
	***
	*** @param {colour} colour The colour of the plane.
	*** @param {number} opacity The opaque is the plane.
	**/
	makeSolid(colour, opacity) {
		this.dispose()
		this.geom = new THREE.PlaneGeometry(this.size, this.size, 1, 1);
		this.mat = new THREE.MeshBasicMaterial({color: colour, side: THREE.DoubleSide, opacity: opacity, transparent:true})
		this.object = new THREE.Mesh(this.geom, this.mat)
		this.object.name = this.name;
		this.object.translateZ(Math.random()*0.02-0.01)
		this.object.updateMatrix();
		this.object.matrixAutoUpdate = false;
	}

	/** Get the THREE.js object representing the plane.
	***
	*** @returns {THREE.js Object} Object.
	**/
	get() {return(this.object);}

	/** Disposes of the material and geometry. **/
	dispose() {
		if (this.mat) {
			this.mat.dispose()
			this.mat = null
		}
		if (this.geom) {
			this.geom.dispose()
			this.geom = null
		}
	}
}



/** @class Class to contain a piece of text rendered to a texture and used as a sprite.
***
*** This is used to add text that always faces the camera, but is located within
*** 3D world space.
***/
class TextSprite {

	/** Create instance of the a text sprite.
	***
	*** @todo At the moment this is very hard-coded. It will be nice to
	*** make this more general, perhaps using CSS to specify the font
	*** and canvas properties.
	***
	*** @constructor
	*** @param {number} size The size of the canvas [pixels].
	**/
	constructor(text, size) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = size;
		this.canvas.height = size;
		let ctx = this.canvas.getContext('2d');

		// Set background.
		ctx.fillStyle = '#404040';
		ctx.strokeStyle = '';
		ctx.lineWidth = '0px'
		ctx.fillRect(0,0,255,255);

		// Draw text.
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.fillStyle = '#ffffff';
		ctx.strokeStyle = '';
		ctx.lineWidth = '0px';
		ctx.font = 'Bold 192px sans-serif';
		ctx.fillText(text,128,128);

		// Make texture and material.
		this.texture = new THREE.Texture(this.canvas);
		this.texture.needsUpdate = true;
		this.mat = new THREE.SpriteMaterial({map: this.texture});

		// Make sprite object.
		this.sprite = new THREE.Sprite(this.mat);
	}

	/** Get the THREE.js object representing the text sprite.
	***
	*** @returns {THREE.js Object} Object.
	**/
	get() {return(this.sprite);}

	/** Disposes of the material and geometry. **/
	dispose() {
		this.sprite.dispose();
		this.mat.dispose();
		this.texture.dispose();
		this.canvas.remove();
	}
}



/** @class Class to contain latitude/longitude grid for a planet in THREE.js.
***
***	@todo Needs modifying so that the planet can be represented by a biaxial
***	ellipsoid with separate polar and equatorial radii.
*** @todo At the moment the colours are hard-coded. It will be nice to
*** make this more general, perhaps using CSS to specify the line properties.
*** @todo The number of points for each great circle is fixed at 64. Should
*** make this a setting.
***/
class LatLongGrid {
	/** Create instance of the latitude/longitude grid.
	***
	*** The total number of parallels (lines of constant latitude) is given
	*** by numHalfLat*2 + 1. So if numHalfLat=2, then there will be five equally-
	*** spaced parallels at +60, +30, 0, -30, -60 degrees.
	***
	*** @constructor
	*** @param {number} numHalfLat Number of parallels in the each hemisphere.
	*** @param {number} numLong Number of meridians.
	**/
	constructor(numHalfLat, numLong) {
		this.numHalfLat = numHalfLat;
		this.numLong = numLong;
		this.matParallel=new THREE.LineBasicMaterial({color: 0xaaaaaa, linewidth: 1});
		this.matEquator=new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1});
		this.matMeridian=new THREE.LineBasicMaterial({color: 0xaaaaaa, linewidth: 1});
		this.matPrimeMeridian=new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1});
		this.object = new THREE.Group();
		this.object.name = 'Latitude and Longitude Grid';
		this.object.matrixAutoUpdate = false;
		this.geom = new Array();
		this.objects = new Array();
	}

	/** Make the grid object. **/
	makeGrid() {
		let i=0;
		let tmp;
		let numLat = 1 + this.numHalfLat*2;
		let dlat = 0.5*Math.PI/(this.numHalfLat+1);
		let dlong = 2.0*Math.PI/this.numLong;

		// Create parallels.
		let lat = 0.0 - dlat*this.numHalfLat;
		for (i=0; i<numLat; i++) {
			let ax = Math.cos(lat)*1.0;
			let ay = Math.cos(lat)*1.0;
			let curve = new THREE.EllipseCurve(0.0, 0.0, ax, ay, 0.0, 2.0*Math.PI, false, 0.0);
			let geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
			if (i==this.numHalfLat) {
				tmp = new THREE.Line(geom, this.matEquator);
			} else {
				tmp = new THREE.Line(geom, this.matParallel);
			}
			tmp.translateZ(Math.sin(lat)*1.0);
			this.objects.push(tmp);
			this.geom.push(geom);
			this.object.add(tmp);
			lat += dlat;
		}

		// Create meridians.
		let curve = new THREE.EllipseCurve(0.0,0.0, 1.0,1.0, -Math.PI/2.0, Math.PI/2.0,	false, 0.0);
		let geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
		this.geom.push(geom);
		let long = 0.0;
		for (i=0; i<this.numLong; i++) {
			if (i==0) {
				tmp = new THREE.Line(geom, this.matPrimeMeridian);
			} else {
				tmp = new THREE.Line(geom, this.matMeridian);
			}
			tmp.rotateX(Math.PI/2.0);
			tmp.rotateY(long);
			long += dlong;
			this.objects.push(tmp);
			this.object.add(tmp);
		}
	}

	/** Get the THREE.js object representing the text sprite.
	***
	*** @returns {THREE.js Object} Object.
	**/
	get() {return(this.object);}

	/** Disposes of the material and geometry. **/
	dispose() {
		for (i=this.objects.length; i>0; i--) this.object.remove(this.objects[i])
		for (i=this.geom.length; i>0; i--) this.geom[i].dispose();
		this.matParallel.dispose()
		this.matEquator.dispose()
		this.matMeridian.dispose()
		this.matPrimeMeridian.dispose()
	}
}



/** Calculate dipole field line.
***
*** Return points along a dipole field line as a THREE.Path object. The field
*** line is computed from -pi/2 to +pi/2 so that if the field line ends up
*** being displaced from the origin of the planet, then the field line will
*** disappear into the planet, and not 'float' above the surface.
***
***	@param L {number} L-shell of the field line [>=1].
***	@param n {number} Optional number of points to return along the field line (default 64).
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



/** @class Class to contain a dipole magnetic field representation.
***
*** Contains a set of dipole field line objects (geometries and materials)
*** that are contained in a THREE.js group.
***
*** @todo The number of points for each field line is fixed at 64. Should
*** make this a setting. Alternatively, would be nice to use splines rather
*** than just line segments.
***/
class Dipole {

	/** Create instance of the dipole model.
	***
	*** @constructor
	*** @param {colour} colour Colour of the field lines.
	**/
	constructor(colour) {
		this.mat = new THREE.LineBasicMaterial({color: colour});
		this.group = new THREE.Group();
		this.group.name = 'Dipole';
		this.group.matrixAutoUpdate = false;
		this.numPoints = 64
		this.geoms = new Array();
	}

	/** Make all the field lines and add them to the THREE.js group.
	***
	*** @param {number} minLshell Minimum L-shell to compute a field line of [planet radii].
	*** @param {number} maxLshell Maximum L-shell to compute a field line of [planet radii].
	*** @param {number} stepLshell The step between each L-shell [planet radii].
	*** @param {number} numLongs Number of meridians to generate field lines on.
	**/
	makeFieldLines(minLshell, maxLshell, stepLshell, numLongs) {
		let long;
		let i=0;
		let geom;
		let L = minLshell;
		let obj;

		while (L<maxLshell) {
			geom = new THREE.BufferGeometry().setFromPoints(getDipolePath(L, this.numPoints).getPoints());
			this.geoms.push(geom)

			long = 0.0;
			for (i=0; i<numLongs; i++) {
				obj = new THREE.Line(geom, this.mat);
				obj.rotateX(Math.PI/2.0);
				obj.rotateY(long);
				this.group.add(obj);
				long += 2*Math.PI/numLongs;
			}

			L += stepLshell;
		}
	}

	/** Get the THREE.js object representing the dipole model.
	***
	*** @returns {THREE.js Object} Object.
	**/
	get() {return(this.group);}
}



/** @class Class to contain a discrete planetary ring.
***
*** Note that this is designed to be a simplified representation of a discrete
*** ring, and is not supposed to have correct rendering/optical depth and so on.
***
*** This does not support (yet) elliptical/inclined rings.
**/
class DiscreteRing {
	/** Create instance of the discrete ring.
	***
	*** The radius is in units of planetary radius.
	***
	*** @constructor
	*** @param {number} radius Radius of the discrete ring (this is modelled as a single line).
	*** @param {colour} colour Colour of the ring.
	*** @param {number} opacity Opacity of the ring.
	*** @param {boolean} transparent Whether or not the ring is transparent (if not, opacity will have no effect).
	**/
	constructor(name, radius, colour, opacity, transparent) {
		this.name = name
		let numSegments = Math.floor(2*Math.PI*(radius/0.1));
		this.geom = new THREE.CircleGeometry(radius, numSegments);
		this.geom.vertices.shift();		// remove the central vertex
		this.mat = new THREE.LineBasicMaterial({color: colour, opacity: opacity, transparent:transparent});
		this.object = new THREE.LineLoop(this.geom, this.mat);
		this.object.name = name;
		this.object.matrixAutoUpdate = false;
	}

	/** Get the THREE.js object representing the ring.
	***
	*** @returns {THREE.js Object} Object.
	**/
	get() {return(this.object);}

	/** Disposes of the material and geometry. **/
	dispose() {
		this.geom.dispose()
		this.mat.dispose()
	}
}



/** @class Class to contain a broad planetary ring.
***
*** Note that this is designed to be a simplified representation of a broad
*** ring, and is not supposed to have correct rendering/optical depth and so on.
***
*** This does not support (yet) elliptical/inclined rings.
***/
class WideRing {
	/** Create instance of the broad ring.
	***
	*** The radii are in units of planetary radius.
	***
	*** @constructor
	*** @param {number} innerRadius Inner radius of the ring.
	*** @param {number} outerRadius Inner radius of the ring.
	*** @param {colour} colour Colour of the ring.
	*** @param {number} opacity Opacity of the ring.
	*** @param {boolean} transparent Whether or not the ring is transparent (if not, opacity will have no effect).
	**/
	constructor(name, innerRadius, outerRadius, colour, opacity, transparent) {
		let numSegments = Math.floor(2*Math.PI*(outerRadius/0.1));
		this.name =name
		this.geom = new THREE.RingGeometry(innerRadius, outerRadius, numSegments);
		this.mat = new THREE.MeshLambertMaterial({color: colour, side: THREE.DoubleSide, opacity: opacity, transparent:transparent});
		this.object = new THREE.Mesh(this.geom, this.mat);
		this.object.name = name;
		this.object.matrixAutoUpdate = false;
	}

	/** Get the THREE.js object representing the ring.
	***
	*** @returns {THREE.js Object} Object.
	**/
	get() {return(this.object);}

	/** Disposes of the material and geometry. **/
	dispose() {
		this.geom.dispose()
		this.mat.dispose()
	}
}



/** @class Class to contain an orbiting moon and it's orbit.
***
*** Note that this is designed to be a simplified representation of a broad
*** ring, and is not supposed to have correct rendering/texturing and so on.
***
*** The orbit itself is also simplified to a circular inclined orbit.
***/
class Moon {
	/** Create instance of the broad ring.
	***
	*** The radii are in units of planetary radius.
	***
	*** @constructor
	*** @param {number} radius Radius of the moon.
	*** @param {number} orbitalRadius Orbital radius of the moon.
	*** @param {number} orbitalPeriod Period of the orbit [seconds].
	*** @param {number} orbitalInclination Inclination of the orbit [deg].
	**/
	constructor(name, radius, orbitalRadius, orbitalPeriod, orbitalInclination) {
		this.radius = radius;
		this.a = orbitalRadius;
		this.P = orbitalPeriod;
		this.i = orbitalInclination*Math.PI/180.0;
		this.n = 2.0*Math.PI/orbitalPeriod;			// mean motion (radians/s)
		this.name = name;
		this.numOrbitSegments = Math.floor(2*Math.PI*orbitalRadius/0.1);
		this.orbitPhase = 0.0;

		this.moonMat = new THREE.MeshLambertMaterial({color: 0xffffff});
		this.moonGeom = new THREE.SphereBufferGeometry(this.radius, 16, 16);
		this.moonObj = new THREE.Mesh(this.moonGeom, this.moonMat);
		this.moonObj.name = this.name + '_moon';
		this.moonObj.matrixAutoUpdate = false;

		this.orbitMat = new THREE.LineBasicMaterial({color: 0x00fffff});
		this.orbitGeom = new THREE.CircleGeometry(this.a, this.numOrbitSegments);
		this.orbitGeom.vertices.shift();		// remove the central vertex
		this.orbitObj = new THREE.LineLoop(this.orbitGeom, this.orbitMat)
		this.orbitObj.name = name + '_orbit';
		this.orbitObj.matrixAutoUpdate = false;
		this.orbitObj.matrix = new THREE.Matrix4().makeRotationX(this.i);
	}

	/** Step the moon position along in time by a given timestep.
	***
	*** @param {number} dt Timestep [seconds].
	**/
	step(dt) {
		this.orbitPhase += this.n*dt;
	}

	/** Update the world matrix for the moon and its orbit **/
	update() {
		var translateMatrix = new THREE.Matrix4().makeTranslation(this.a,0.0,0.0);
		var orbitMatrix = new THREE.Matrix4().makeRotationZ(this.orbitPhase);
		var inclinationMatrix = new THREE.Matrix4().makeRotationX(this.i);
		this.moonObj.matrix = inclinationMatrix.multiply(orbitMatrix.multiply(translateMatrix));
	}

	/** Step the moon position along in time by a given timestep and then update the world matrices.
	***
	*** @param {number} dt Timestep [seconds].
	**/
	stepAndUpdate(dt) {
		this.step(dt)
		this.update()
	}

	/** Get the THREE.js object representing the moon.
	***
	*** @returns {THREE.js Object} Object.
	**/
	getMoonObject() {return(this.moonObj);}

	/** Get the THREE.js object representing the moon orbit.
	***
	*** @returns {THREE.js Object} Object.
	**/
	getOrbitObject() {return(this.orbitObj);}

	/** Disposes of the material and geometry. **/
	dispose() {
		this.orbitMat.dispose()
		this.orbitGeom.dispose()
		this.moonMat.dispose()
		this.moonGeom.dispose()
	}
}
