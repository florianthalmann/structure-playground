export var PORT = '4199';
export var SERVER_PATH = 'http://localhost:' + PORT + '/';

export interface FeatureConfig {
	name: string,
	plugin: string,
	subset?: string,
	selected: boolean
}

export let options = {
	iterative: true,
	similarityThreshold: 0.99,
	minSegmentLength: 5,
	maxThreshold: 10,
	endThreshold: 0,
	onlyDiagonals: false,
	patternIndices: ""
};

export let availableFeatures: FeatureConfig[] = [
	{name:'sections', plugin:'vamp:qm-vamp-plugins:qm-segmenter:segmentation', selected:false},
	{name:'bars', plugin:'vamp:qm-vamp-plugins:qm-barbeattracker:beats', subset:'1', selected:true},
	{name:'beats', plugin:'vamp:qm-vamp-plugins:qm-barbeattracker:beats', selected:false},
	{name:'onsets', plugin:'vamp:qm-vamp-plugins:qm-onsetdetector:onsets', selected:false},
	{name:'onsets2', plugin:'vamp:vamp-aubio:aubioonset:onsets', selected:false},
	{name:'logcentroid', plugin:'vamp:vamp-example-plugins:spectralcentroid:logcentroid', selected:false},
	{name:'melody', plugin:'vamp:mtg-melodia:melodia:melody', selected:false},
	{name:'pitch', plugin:'vamp:vamp-aubio:aubiopitch:frequency', selected:false},
	{name:'amplitude', plugin:'vamp:vamp-example-plugins:amplitudefollower:amplitude', selected:false},
	{name:'energy', plugin:'vamp:bbc-vamp-plugins:bbc-energy:rmsenergy', selected:false},
	{name:'intensity', plugin:'vamp:bbc-vamp-plugins:bbc-intensity:intensity', selected:false},
	{name:'flux', plugin:'vamp:bbc-vamp-plugins:bbc-spectral-flux:spectral-flux', selected:false},
	{name:'skewness', plugin:'vamp:bbc-vamp-plugins:bbc-speechmusic-segmenter:skewness', selected:false},
	{name:'zero', plugin:'vamp:vamp-example-plugins:zerocrossing:counts', selected:false},
	{name:'tonal', plugin:'vamp:qm-vamp-plugins:qm-tonalchange:tcfunction', selected:false},
	{name:'onsetfreq', plugin:'vamp:bbc-vamp-plugins:bbc-rhythm:avg-onset-freq', selected:false},
	{name:'keystrength', plugin:'vamp:qm-vamp-plugins:qm-keydetector:keystrength', selected:false},
	{name:'tuning', plugin:'vamp:nnls-chroma:tuning:tuning', selected:false},
	{name:'tempo', plugin:'vamp:vamp-example-plugins:fixedtempo:tempo', selected:false},
	{name:'mfcc', plugin:'vamp:qm-vamp-plugins:qm-mfcc:coefficients', selected:false},
	{name:'chroma', plugin:'vamp:qm-vamp-plugins:qm-chromagram:chromagram', selected:true},
	{name:'chords', plugin:'vamp:nnls-chroma:chordino:simplechord', selected:false}
];