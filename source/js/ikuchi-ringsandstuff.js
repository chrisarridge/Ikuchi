/**
***	@file Provides all the rendering functions for Ikuchi.
***	@author Chris Arridge, Lancaster University <c.arridge@lancaster.ac.uk>
***	@version 0.5a
***	@copyright Lancaster University (2019)
***	@licence TBD.
**/


class Plane {
	constructor(name,size) {
		this.name = name
		this.size = size
		this.geom = null
		this.mat = null
		this.object = null
	}

	makeWireframe(majorColour, minorColour, resolution) {
		this.dispose()
		this.object = new THREE.GridHelper(this.size, resolution, majorColour, minorColour);
		this.object.name = this.name;
		this.object.rotateX(Math.PI/2.0);
		this.object.translateZ(Math.random()*0.02-0.01)
		this.object.updateMatrix();
		this.object.matrixAutoUpdate = false;
	}

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

	get() {return(this.object);}

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

class TextSprite {
	constructor(text, size) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = size;
		this.canvas.height = size;
		let ctx = this.canvas.getContext('2d');

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

		// Make texture and material.
		this.texture = new THREE.Texture(this.canvas);
		this.texture.needsUpdate = true;
		this.mat = new THREE.SpriteMaterial({map: this.texture});

		// Make sprite object.
		this.sprite = new THREE.Sprite(this.mat);
	}

	get() {return(this.sprite);}

	dispose() {
		this.sprite.dispose();
		this.mat.dispose();
		this.texture.dispose();
		this.canvas.remove();
	}
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
class LatLongGrid {
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

	get() {return(this.object);}

	dispose() {
		for (i=this.objects.length; i>0; i--) this.object.remove(this.objects[i])
		for (i=this.geom.length; i>0; i--) this.geom[i].dispose();
		this.matParallel.dispose()
		this.matEquator.dispose()
		this.matMeridian.dispose()
		this.matPrimeMeridian.dispose()
	}
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

class Dipole {
	constructor(colour) {
		this.mat = new THREE.LineBasicMaterial({color: colour});
		this.group = new THREE.Group();
		this.group.name = 'Dipole';
		this.group.matrixAutoUpdate = false;
		this.numPoints = 64
		this.geoms = new Array();
	}

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

	get() {return(this.group);}
}




class DiscreteRing {
	constructor(name, radius, colour, opacity, transparent) {
		this.name =name
		let numSegments = Math.floor(2*Math.PI*(radius/0.1));
		this.geom = new THREE.CircleGeometry(radius, numSegments);
		this.geom.vertices.shift();		// remove the central vertex
		this.mat = new THREE.LineBasicMaterial({color: colour, opacity: opacity, transparent:transparent});
		this.object = new THREE.LineLoop(this.geom, this.mat);
		this.object.name = name;
		this.object.matrixAutoUpdate = false;
	}

	get() {return(this.object);}

	dispose() {
		this.geom.dispose()
		this.mat.dispose()
	}
}

class WideRing {
	constructor(name, innerRadius, outerRadius, colour, opacity, transparent) {
		let numSegments = Math.floor(2*Math.PI*(outerRadius/0.1));
		this.name =name
		this.geom = new THREE.RingGeometry(innerRadius, outerRadius, numSegments);
		this.mat = new THREE.MeshLambertMaterial({color: colour, side: THREE.DoubleSide, opacity: opacity, transparent:transparent});
		this.object = new THREE.Mesh(this.geom, this.mat);
		this.object.name = name;
		this.object.matrixAutoUpdate = false;
	}

	get() {return(this.object);}

	dispose() {
		this.geom.dispose()
		this.mat.dispose()
	}
}


class Moon {
	constructor(name, radius, orbitalRadius, orbitalPeriod, orbitalInclination) {
		this.radius = radius;
		this.a = orbitalRadius;
		this.P = orbitalPeriod;
		this.i = orbitalInclination*Math.PI/180.0;
		this.n = 2.0*Math.PI/orbitalPeriod;
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

	step(dt) {
		this.orbitPhase += this.n*dt;
	}

	update() {
		var translateMatrix = new THREE.Matrix4().makeTranslation(this.a,0.0,0.0);
		var orbitMatrix = new THREE.Matrix4().makeRotationZ(this.orbitPhase);
		var inclinationMatrix = new THREE.Matrix4().makeRotationX(this.i);
		this.moonObj.matrix = inclinationMatrix.multiply(orbitMatrix.multiply(translateMatrix));
	}

	stepAndUpdate(dt) {
		this.step(dt)
		this.update()
	}

	getMoonObject() {return(this.moonObj);}
	getOrbitObject() {return(this.orbitObj);}

	dispose() {
		this.orbitMat.dispose()
		this.orbitGeom.dispose()
		this.moonMat.dispose()
		this.moonGeom.dispose()
	}
}
