# Change history

## Version 0.5b - 2019-09-
* Fixed field lines visibility switch
* Fixed moon orbit traces and field lines colour selectors
* Minor bug fixes

## Version 0.5a - 2019-08-23
* Refactored code.
* Added moon rendering.
* Fixed memory leaks.
* Fixed orthographic camera bug.
* Modified how orbital and equatorial planes are rendered.
* Fixed ring rendering double-sided bug.
* Added dipole equatorial plane rendering.
* Removed optical depth->opacity ring rendering - just solid with a settable opacity.
* Changed discrete ring rendering to use lines rather than meshes.

## Version 0.4 - 2019-08-20
* Fixed scroll bar error.
* Added options to modify colours of different items.
* Added planetary ring rendering.
* Added orthographic camera and option to switch between orthographic and perspective views.
* Added build step which constructs a function for translating between ring optical depth and rendering opacity.

## Version 0.31 - 2019-08-16
* Fixed labelling error in Uranus solstices.
* Fixed GUI update error.

## Version 0.3 - 2019-08-16
* Added code to capture SVG version of onscreen image. Opens a new browser
	window with a textarea containing the SVG code that can be cut and pasted
	into a text file and then loaded into Illustrator or Inkscape.
* Clarified distinction between the north and south pole (according to the
	IAU definition; NB the north pole is the pole that lies in the same
	hemisphere off the ecliptic as Earth's north pole) and the rotational pole
	of the planet. Added functionality to reverse the rotation rate (e.g.,
	Uranus counter-rotates relative to the pole).
* Added sprites to highlight the north and south planetographic poles.

## Version 0.2 - 2019-08-12
* Added code to visualise specific planets and specific times, with texture
	mapping and accurate orientations and rotation rates.
* Changed planetary rotation to a real-time model with a speedup factor.
* Added oblique viewing geometry option.
* Added event timings.
* Changed orbital plane rendering to a wireframe, rather than a shaded surface.
* Fixed equatorial plane flickering bug for zero obliquities.
* Added dipole offset as well as dipole orientation.

## Version 0.1 - 2019-03-23
