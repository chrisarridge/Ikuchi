/**
***	@file Input file containing each planet featuring in Ikuchi
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

planetDefault = {
	name: 'Default',
	equatorialRadius: 1.0,
	polarRadius: 1.0,
	rotationPeriod: 24.0,
	rotationReversed: false,
	planetTexture: '',
	eventLabels: ['Now'],
	eventTimes: [],
	dipolePoleColatitude: 0.0,
	dipolePoleLongitude: 0.0,
	dipoleOrigin: [0.0,0.0,0.0],
	yFunction: rotyDefault,
	zFunction: rotzDefault,
	moonNames: [],
	moonSemimajor: [],
	moonPeriod: [],
	moonInclination: [],
	moonRadius: [],
	moonVisible: [],
	wideRingNames: [],
	discreteRingNames: []
}

/** Definitions for Earth.
***
*** Equinox and solstice dates from https://en.wikipedia.org/wiki/Equinox.
***
*** Moon and ring data from https://en.wikipedia.org/wiki/Moon. Note that the
*** Moon's orbit is simplified (as it is with the other planets).
***
*** Magnetic field angles from http://www.geomag.bgs.ac.uk/education/poles.html.
*** For consistency with other planets in Ikuchi, we orient the magnetic field
*** so that the pole colatitude is the location of the north magnetic pole.
**/
planetEarth = {
	name: 'Earth',
	equatorialRadius: 6378.137,
	polarRadius: 6356.752,
	rotationPeriod: 24.0,
	rotationReversed: false,
	planetTexture: textureEarthDayMap,
	eventLabels: ['Now','NH Summer Solstice','SH Summer Solstice','Vernal Equinox','Autumnal Equinox'],
	eventTimes: ['2019-06-21','2019-12-22','2019-03-20','2019-09-23'],
	dipolePoleColatitude: 170.65/*10.1*/,
	dipolePoleLongitude: 106.83/*288.0*/,
	dipoleOrigin: [0.0,0.0,0.0],
	yFunction: rotyEarth,
	zFunction: rotzEarth,
	moonNames: ['The Moon'],
	moonSemimajor: [384399],
	moonPeriod: [27.321661],
	moonInclination: [0.0],
	moonRadius: [1737],
	moonVisible: [false],
	wideRingNames: [],
	discreteRingNames: []
}

/** Definitions for Jupiter.
***
*** Moon and ring data from PDS: https://pds-rings.seti.org/jupiter/jupiter_tables.html
***
*** Eccentric dipole properties from Connerney, J.E.P. (1993) 'Magnetic fields
*** of the outer planets' J. Geophys. Res. 98(E10) 18659-18679.
**/
planetJupiter = {
	name: 'Jupiter',
	equatorialRadius: 71492,
	polarRadius: 66854,
	rotationPeriod: 9.925,
	rotationReversed: false,
	planetTexture: textureJupiter,
	eventLabels: ['Now'],
	evenTimes: [],
	dipolePoleColatitude: 10.8,
	dipolePoleLongitude: 201.0,
	dipoleOrigin: [-0.01,0.0,-0.01],
	yFunction: rotyJupiter,
	zFunction: rotzJupiter,
	moonNames: ['Io','Europa','Ganymede','Callisto'],
	moonSemimajor: [421600,670900,1070000,1883000],
	moonPeriod: [1.769138,3.551810,7.154553,16.689018],
	moonInclination: [0.04,0.470,0.195,0.281],
	moonRadius: [1821,1565,2634,2403],
	moonVisible: [true,true,true,true],
	wideRingNames: [],
	discreteRingNames: []
}

/** Definitions for Saturn.
***
*** Equinox and solstice times from http://www.planetary.org/blogs/emily-lakdawalla/2016/06031044-oppositions-conjunctions-rpx.html
***
*** Moon and ring data from PDS: https://pds-rings.seti.org/saturn/saturn_tables.html
***
*** Eccentric dipole properties from Connerney, J.E.P. (1993) 'Magnetic fields
*** of the outer planets' J. Geophys. Res. 98(E10) 18659-18679.
**/
planetSaturn = {
	name: 'Saturn',
	equatorialRadius: 60268,
	polarRadius: 54364,
	rotationPeriod: 10.0 + (33.0*60 + 38.0)/3600.0,
	rotationReversed: false,
	planetTexture: textureSaturn,
	eventLabels: ['Now','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice','Cassini SOI'],
	eventTimes: ['2009-08-11','2018-05-23','1995-11-19','2002-10-25','2004-07-01'],
	dipolePoleColatitude: 0.0,
	dipolePoleLongitude: 0.0,
	dipoleOrigin: [0.0,0.0,0.04],
	yFunction: rotySaturn,
	zFunction: rotzSaturn,
	moonNames: ['Mimas','Enceladus','Tethys','Dione','Rhea','Titan'],
	moonSemimajor: [185539,238037,294672,377415,527068,1221865],
	moonPeriod: [0.942,1.37,1.888,2.737,4.518,15.95],
	moonInclination: [1.574,0.009,1.091,0.028,0.333,0.312],
	moonRadius: [397/2.0,504/2.0,1066/2.0,1123/2.0,1529/2.0,5151/2.0],
	moonVisible: [true,true,true,true,true,true],
	wideRingNames: ['D Ring','C Ring','B Ring','A Ring','G Ring','E Ring'],
	wideRingInnerRadii: [66900,74658,92000,122170,166000,175000],
	wideRingOuterRadii: [74510,92000,117580,136775,180000,480000],
	wideRingColours: ['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff'],
	wideRingOpacities: [0.7,0.9,0.9,0.8,0.2,0.2],
	wideRingVisible: [true,true,true,true,false,false],
	discreteRingNames: ['F Ring'],
	discreteRingRadii: [140180],
	discreteRingColours: ['#ffffff'],
	discreteRingOpacities: [0.9],
	discreteRingVisible: [true]
}


/** Definitions for Uranus.
***
*** Equinox and solstice times are from Meeus, J (1997) 'Equinoxes and solstices on
*** Uranus and Neptune' J. Brit. Astronomical Assoc. 107(6), p332,
*** http://adsabs.harvard.edu/full/1997JBAA..107..332M
***
*** Moon and ring data from PDS: https://pds-rings.seti.org/uranus/uranus_tables.html
***
*** Eccentric dipole properties from Connerney, J.E.P. (1993) 'Magnetic fields
*** of the outer planets' J. Geophys. Res. 98(E10) 18659-18679. Note that
*** since the dipole properties were derived in a frame where the north pole
*** was coincident with the rotational pole (i.e., opposite to the IAU
*** definition we use here) the dipole z offset and latitude are swapped from
*** those quoted in Connerney (1993).
**/
planetUranus = {
	name: 'Uranus',
	equatorialRadius: 25559,
	polarRadius: 24973,
	rotationPeriod: 17.0 + (14.0*60 + 24.0)/3600.0,
	rotationReversed: true,
	planetTexture: textureUranus,
	eventLabels: ['Now','Voyager 2','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice'],
	eventTimes: ['1986-01-24','1966-02-03','1985-10-06','2007-12-16','2030-04-19'],
	dipolePoleColatitude: -60.0,
	dipolePoleLongitude: 48.0,
	dipoleOrigin: [-0.02,0.02,0.31],
	yFunction: rotyUranus,
	zFunction: rotzUranus,
	moonNames: ['Mab','Miranda','Ariel','Umbriel','Titania','Oberon'],
	moonSemimajor: [97736,129800,191200,266000,435800,583600],
	moonPeriod: [-0.9229583,-1.413,-2.520,-4.144,-8.706,-13.463],
	moonInclination: [0.14,4.22,0.31,0.36,0.10,0.10],
	moonRadius: [12,235,579,585,789,761],
	moonVisible: [false,true,true,true,true,true],
	wideRingNames: ['Nu','Mu','Xi'],
	wideRingInnerRadii: [66100,86000,26840],
	wideRingOuterRadii: [69900,103000,41350],
	wideRingColours: ['#ffffff','#ffffff','#ffffff'],
	wideRingOpacities: [0.7,0.7,0.8],
	wideRingVisible: [true,true,false],
	discreteRingNames: ['6','5','4','Alpha','Beta','Eta','Gamma','Delta','Lambda','Epsilon'],
	discreteRingRadii: [41837,42234,42570,44718,45661,47175,47627,48300,50023,51149],
	discreteRingColours: ['#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff','#ffffff'],
	discreteRingOpacities: [0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8,0.8],
	discreteRingVisible: [true,true,true,true,true,true,true,true,true,true]
}

/** Definitions for Neptune.
***
*** Equinox and solstice times are from Meeus, J (1997) 'Equinoxes and solstices on
*** Uranus and Neptune' J. Brit. Astronomical Assoc. 107(6), p332,
*** http://adsabs.harvard.edu/full/1997JBAA..107..332M
***
*** Moon and ring data from PDS: https://pds-rings.seti.org/neptune/neptune_tables.html
***
*** Eccentric dipole properties from Connerney, J.E.P. (1993) 'Magnetic fields
*** of the outer planets' J. Geophys. Res. 98(E10) 18659-18679.
**/
planetNeptune = {
	name: 'Neptune',
	equatorialRadius: 24764,
	polarRadius: 24341,
	rotationPeriod: 16.0 + (6.0*60 + 36.0)/3600.0,
	rotationReversed: false,
	planetTexture: textureNeptune,
	eventLabels: ['Now','Vernal Equinox','NH Summer Solstice','Autumnal Equinox','SH Summer Solstice','Voyager 2'],
	eventTimes: ['2038-02-28','2078-11-14','1955-04-11','1997-02-26','1989-08-25'],
	dipolePoleColatitude: 46.8,
	dipolePoleLongitude: 79.5,
	dipoleOrigin: [0.17,0.46,-0.24],
	yFunction: rotyNeptune,
	zFunction: rotzNeptune,
	moonNames: ['Proteus','Triton','Nereid'],
	moonSemimajor: [117647,354760,5513400],
	moonPeriod: [1.122315,5.876854,360.13619],
	moonInclination: [0.55,156.834,7.23],
	moonRadius: [209,1353,170],
	moonVisible: [true,true,false],
	wideRingNames: ['Galle','Lassell'],
	wideRingInnerRadii: [41000,54200],
	wideRingOuterRadii: [43000,56200],
	wideRingColours: ['#ffffff','#ffffff'],
	wideRingOpacities: [0.7,0.7],
	wideRingVisible: [true,true],
	discreteRingNames: ['Le Verrier','Arago','Adams'],
	discreteRingRadii: [53200,57200,62933],
	discreteRingColours: ['#ffffff','#ffffff','#ffffff'],
	discreteRingOpacities: [0.9,0.9,0.9],
	discreteRingVisible: [true,true,true]
}
