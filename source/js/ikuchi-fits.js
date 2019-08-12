// Fits for Earth
function rotzEarth(t) {
	return(28969.76593826826 + -1.140795533078171e-08*t + 1.91455041474075*Math.sin(t*1.991063797294792e-10 + 166.45721759460946) + 0.020095207100803526*Math.sin(2*t*1.991063797294792e-10 + 3.0486487224410945));
}

function rotyEarth(t) {
	return(23.443179439452567 + -4.121869290538975e-15*t + -1.2272599199877887e-06*Math.sin(t*1.991063797294792e-10 + 0.9999820053054922));
}


// Fits for Neptune
function rotzNeptune(t) {
	return(255.91317766790257 + -6.893801246322523e-11*t + 0.9454730107723246*Math.sin(t*1.2083688173611776e-12 + -62.578127104062375) + -0.014744554948462245*Math.sin(2*t*1.2083688173611776e-12 + 1.266248446716515));
}

function rotyNeptune(t) {
	return(28.23499732092514 + 5.2904723464592514e-14*t + 0.034394668638443704*Math.sin(t*1.2083688173611776e-12 + 0.331170136656262));
}


// Fits for Jupiter
function rotzJupiter(t) {
	return(2363.210322546628 + -9.616143895679547e-10*t + -5.542986488709191*Math.sin(t*1.678489129283648e-11 + -411.3879611880666) + -0.16775457350349135*Math.sin(2*t*1.678489129283648e-11 + 12.882211363180492));
}

function rotyJupiter(t) {
	return(3.1190272601328144 + -4.084193371447696e-17*t + 5.860895728903148e-05*Math.sin(t*1.678489129283648e-11 + 0.6386993627562367));
}


// Fits for Uranus
function rotzUranus(t) {
	return(252.84767231373795 + -1.3577519209180985e-10*t + 5.413011491991998*Math.sin(t*2.369684154208593e-12 + 374.0894421221592) + -0.1524982565595177*Math.sin(2*t*2.369684154208593e-12 + 0.5073946730854844));
}

function rotyUranus(t) {
	return(82.22984393612073 + 7.291957245865771e-17*t + 0.000170581027977027*Math.sin(t*2.369684154208593e-12 + 0.537899776703132));
}


// Fits for Saturn
function rotzSaturn(t) {
	return(940.4269059601968 + -3.8743167223069975e-10*t + -6.207983106486679*Math.sin(t*6.759045002001111e-12 + 596.0437653880368) + 0.21686127313758174*Math.sin(2*t*6.759045002001111e-12 + 13.964708082127727));
}

function rotySaturn(t) {
	return(26.726932292193407 + 3.0378524217934277e-15*t + -0.0007065705139857624*Math.sin(t*6.759045002001111e-12 + 1.3102091218124712));
}
