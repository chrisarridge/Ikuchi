#! /usr/bin/python

"""Builds a javascript file that contains: rotation angle fits and base64
encoded textures. Requires NumPy, SpiceyPy, and SciPy. Matplotlib is optionally
required for reproducing the plots that test the fits."""

import numpy as np
import matplotlib.pyplot as pl
import base64
import datetime
import platform
import os
import scipy.optimize as opt
import scipy
import matplotlib
import spiceypy

show_fit_plots = False

# If you are rebuilding Ikuchi, then you will need to specify the texture
# locations and filenames.
texture_path = 'textures/'
texture_earth = os.path.join(texture_path,'1k_earth_daymap.jpg')
texture_jup = os.path.join(texture_path,'1k_jupiter.jpg')
texture_sat = os.path.join(texture_path,'1k_saturn.jpg')
texture_ura = os.path.join(texture_path,'1k_uranus.jpg')
texture_nep = os.path.join(texture_path,'1k_neptune.jpg')

# Load the required SPICE kernels to calculate the orientations of the planets.
print('[ikuchi-build] Loading SPICE kernels')
kernel_path = 'C:/Users/arridge/Documents/Data/SPICE/'
spiceypy.furnsh(kernel_path+'generic_kernels/lsk/naif0012.tls')
spiceypy.furnsh(kernel_path+'generic_kernels/pck/pck00010.tpc')
spiceypy.furnsh(kernel_path+'generic_kernels/spk/planets/de405.bsp')
spiceypy.furnsh(kernel_path+'generic_kernels/spk/satellites/jup341.bsp')
spiceypy.furnsh(kernel_path+'generic_kernels/spk/satellites/sat317.bsp')
spiceypy.furnsh(kernel_path+'generic_kernels/spk/satellites/ura083.bsp')
spiceypy.furnsh(kernel_path+'generic_kernels/spk/satellites/nep090.bsp')
spiceypy.furnsh('space-physics-frames.fk')

# Do the calculation from 1950-2050 in steps of 1 day. If we are to extend
# this to Mercury then we'll require a shorter time step.
t_start = spiceypy.utc2et('1950-01-01T00:00')
t_end = spiceypy.utc2et('2049-12-30T00:00')
t = np.arange(t_start, t_end, 1*86400)

# To simplify everything, we put what planets we want to include in this
# dictionary. The dictionary contains the name of the planet (as it will
# appear in Ikuchi), the body-fixed frame, the Planetary Solar Orbital frame,
# and the rotation period in milliseconds.
#
# The code then calculates the pole orientation and rotation angles and stores
# them back in this dictionary.
make_planet = lambda s, d, n, yr: {'s':s,'d':d,'v':np.zeros((n,3)),'roty':np.zeros(n),'rotz':np.zeros(n),'yr':yr}
data = {'Earth':make_planet('IAU_EARTH','GSE',len(t),365.2422*86400.0*1e3),
		'Neptune':make_planet('IAU_NEPTUNE','NSO',len(t),60182*86400.0*1e3),
		'Jupiter':make_planet('IAU_JUPITER','JSO',len(t),4332.59*86400.0*1e3),
		'Uranus':make_planet('IAU_URANUS','USO',len(t),30688.5*86400.0*1e3),
		'Saturn':make_planet('IAU_SATURN','KSO',len(t),10759.22*86400.0*1e3)}

# Do the calculations.
print('[ikuchi-build] Calculating pole positions')
for i in range(len(t)):
	if i%1000==0:
		print('[ikuchi-build] Calculating pole positions: {:04}/{:04}'.format(i+1,len(t)))
	for p in data:
		m = spiceypy.pxform(data[p]['s'], data[p]['d'], t[i])
		v = spiceypy.mxv(m,[0,0,1])
		data[p]['v'][i,:] = v
		data[p]['roty'][i] = np.arccos(v[2])*180/np.pi
		data[p]['rotz'][i] = np.arctan2(v[1],v[0])*180/np.pi

# Now we have a set of angles that are modulo 2pi, but to fit them we need
# to remove the modulo 2pi and have a monotonic set of angles, e.g., 0- 2*pi*n.
# We find all the points where the angle changes and then add an offset to that
# rotation. We keep increasing that offset by 2pi for each rotation to
# get a monotonic change.
print('[ikuchi-build] Adjusting rotation angles to be monotonic (invert modulo 2pi)')
for p in data:
	rages = []
	st = 0
	for k in range(1,len(t)):
		if (data[p]['rotz'][k]-data[p]['rotz'][k-1])>180:
			rages.append((st,k-1))
			st = k
	ad = 360*len(rages)
	for r in rages:
		data[p]['rotz'][r[0]:r[1]+1] += ad
		ad -= 360

with open('../js/ikuchi-pregenerated.js','w') as fh:
	fh.write('// All data and functions in this file are auto-generated. Do not modify.\n')
	fh.write('// Build date: {}\n'.format(datetime.datetime.now().__str__()))
	fh.write('// Build platform: {} {}\n'.format(platform.platform(),platform.processor()))
	fh.write('// Build Python version: {}\n'.format(platform.python_version()))
	fh.write('// Build NumPy version: {}\n'.format(np.__version__))
	fh.write('// Build SciPy version: {}\n'.format(scipy.__version__))
	fh.write('// Build Matplotlib version: {}\n'.format(matplotlib.__version__))
	fh.write('// Build SPICE version: {}\n'.format(spiceypy.tkvrsn('toolkit')))
	fh.write('// SPICE Kernels used:\n')
	for i in range(spiceypy.ktotal('ALL')):
		[file,type,source,handle] = spiceypy.kdata(i, 'ALL')
		fh.write('//  {} ({})\n'.format(file,type))
	fh.write('\n\n\n')

	# Output default planet rotation angle functions.
	fh.write('//Fits for Default Planet\n')
	fh.write('function rotzDefault(t){\n\treturn(0.0);\n}\n\n')
	fh.write('function rotyDefault(t){\n\treturn(0.0);\n}\n\n\n')

	# We have full time series of the two rotation angles we need, so now we
	# do fits and write the results of the fits to javascript functions we
	# need in the main web app.
	print('[ikuchi-build] Fitting and generating Javascript functions')

	# We work in unix timestamps measured in milliseconds, but the SPICE
	# data is in ephemeris time in seconds.
	t_unix_ms = (t - spiceypy.utc2et('1970-01-01T00:00:00'))*1000

	# For each planet, fit the y (obliquity) and z (orbital phase) angles
	# separately. The obliquity (roty) is fitted with a model that has a linear
	# variation in time plus a sinusoidal perturbation with a period of the
	# orbit of the planet.
	#
	#  th = a + b*t/P + c*sin(t*2pi/P + d)
	#
	# [a] = degrees
	# [b] = degrees/orbital period
	# [c] = degrees
	# [d] = radians
	#
	# The orbital phase (rotz) angle is fitted with a similar model except the
	# there is an additional sinusoidal perturbation at the second harmonic
	# of the orbital period.
	#
	#  ph = a + b*t/P + c*sin(t*2pi/P + d) + e*sin(2*t*2pi/P + f)
	#
	# [a] = degrees
	# [b] = degrees/orbital period
	# [c] = degrees
	# [d] = radians
	# [e] = degrees
	# [f] = radians
	for p in data:
		# Define the fit functions for this planet.
		fitfun_roty = lambda x, a, b, c, d: a + b*x/data[p]['yr'] + c*np.sin(x*2*np.pi/data[p]['yr'] + d)
		fitfun_rotz = lambda x, a, b, c, d, e, f: a + b*x/data[p]['yr'] + c*np.sin(x*2*np.pi/data[p]['yr'] + d) +  e*np.sin(2*x*2*np.pi/data[p]['yr'] + f)

		# Fit the orbital phase (z rotation angle).
		popt, pcov = opt.curve_fit(fitfun_rotz, t_unix_ms, data[p]['rotz'], p0=[1.0,360.0,0.01,1.0,0.01,1.0])
		residual_rotz = (fitfun_rotz(t_unix_ms, popt[0], popt[1], popt[2], popt[3], popt[4], popt[5]) - data[p]['rotz'])
		rotz_rms = np.sqrt(np.mean(residual_rotz**2))
		rotz_max = np.max(np.abs(residual_rotz))
		if show_fit_plots:
			pl.subplot(2,1,1)
			pl.plot(t_unix_ms, data[p]['rotz'], label='SPICE')
			pl.plot(t_unix_ms,fitfun_rotz(t_unix_ms, popt[0], popt[1], popt[2], popt[3], popt[4], popt[5]), label='Fit')
			pl.ylabel('Orbit phase angle [deg]')
			pl.title(p)
			pl.subplot(2,1,2)
			pl.plot(t_unix_ms, (data[p]['rotz']-fitfun_rotz(t_unix_ms, popt[0], popt[1], popt[2], popt[3], popt[4], popt[5])))
			pl.ylabel('Orbit phase angle [deg]')
			pl.show()

		fh.write('// Fits for '+p+'\n')
		fh.write('// Rotz RMS={:8.6f} deg max(|residual|)={:8.6f} deg\n'.format(rotz_rms, rotz_max))
		fh.write('function rotz'+p+'(t) {\n')
		fh.write('\treturn({} + {}*t + {}*Math.sin(t*{} + {}) + {}*Math.sin(2*t*{} + {}));\n'.format(popt[0],popt[1]/data[p]['yr'],popt[2],2*np.pi/data[p]['yr'],popt[3],popt[4],2*np.pi/data[p]['yr'],popt[5]))
		fh.write('}\n\n')

		# Fit the obliquity (z rotation angle).
		popt, pcov = opt.curve_fit(fitfun_roty, t_unix_ms, data[p]['roty'], p0=[30.0,0.01,0.01,1.0])
		residual_roty = (fitfun_roty(t_unix_ms, popt[0], popt[1], popt[2], popt[3]) - data[p]['roty'])
		roty_rms = np.sqrt(np.mean(residual_roty**2))
		roty_max = np.max(np.abs(residual_roty))
		if show_fit_plots:
			pl.subplot(2,1,1)
			pl.plot(t_unix_ms, data[p]['roty'], label='SPICE')
			pl.plot(t_unix_ms,fitfun_roty(t_unix_ms, popt[0], popt[1], popt[2], popt[3]), label='Fit')
			pl.ylabel('Obliquity [deg]')
			pl.title(p)
			pl.subplot(2,1,2)
			pl.plot(t_unix_ms, (data[p]['roty']-fitfun_roty(t_unix_ms, popt[0], popt[1], popt[2], popt[3])))
			pl.ylabel('Obliquity [deg]')
			pl.show()

		fh.write('// Roty RMS={:8.6f} deg max(|residual|)={:8.6f} deg\n'.format(roty_rms, roty_max))
		fh.write('function roty'+p+'(t) {\n')
		fh.write('\treturn({} + {}*t + {}*Math.sin(t*{} + {}));\n'.format(popt[0],popt[1]/data[p]['yr'],popt[2],2*np.pi/data[p]['yr'],popt[3]))
		fh.write('}\n\n\n')
		print('[ikuchi-build] Errors for {}: rotz_rms={:8.6f} rotz_max={:8.6f} roty_rms={:8.6f} roty_max={:8.6f}'.format(p, rotz_rms, rotz_max, roty_rms, roty_max))


	# Convert textures and turn them into base64 encoded strings.
	print('[ikuchi-build] Encoding textures')

	fh.write('// All textures are sourced from http://planetpixelemporium.com/planets.html.\n')
	fh.write('// and are Copyright (c) James Hastings-Trew. Please see this website for full copyright details.\n')

	with open(texture_jup, "rb") as fh_in:
		map = base64.b64encode(fh_in.read())
		fh.write('// Jupiter texture map.\n')
		fh.write('var textureJupiter = \'data:image/jpeg;base64,{}\';\n\n'.format(map.decode()))

	with open(texture_sat, "rb") as fh_in:
		map = base64.b64encode(fh_in.read())
		fh.write('// Saturn texture map.\n')
		fh.write('var textureSaturn = \'data:image/jpeg;base64,{}\';\n\n'.format(map.decode()))

	with open(texture_ura, "rb") as fh_in:
		map = base64.b64encode(fh_in.read())
		fh.write('// Uranus texture map.\n')
		fh.write('var textureUranus = \'data:image/jpeg;base64,{}\';\n\n'.format(map.decode()))

	with open(texture_nep, "rb") as fh_in:
		map = base64.b64encode(fh_in.read())
		fh.write('// Neptune texture map.\n')
		fh.write('var textureNeptune = \'data:image/jpeg;base64,{}\';\n\n'.format(map.decode()))

	with open(texture_earth, "rb") as fh_in:
		map = base64.b64encode(fh_in.read())
		fh.write('// Earth texture map (daytime).\n')
		fh.write('var textureEarthDayMap = \'data:image/jpeg;base64,{}\';\n\n'.format(map.decode()))

print('[ikuchi-build] Complete')
