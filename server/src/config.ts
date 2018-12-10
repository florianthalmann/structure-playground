export var PORT = '4199';
export var SERVER_PATH = 'http://localhost:' + PORT + '/';
import { QUANT_FUNCS, OPTIMIZATION } from 'siafun';
import * as math from 'mathjs';

export interface FeatureConfig {
	name: string,
	plugin: string,
	subset?: string,
	selected: boolean
}

export const DIRS = {
	in: 'input/',
	file: '1100.mp3',//'jackstraw77-05-07.mp3',
	out: 'output/1100-bar-chroma-sia/'
}

export let options2 = {
	iterative: true,
	similarityThreshold: .99,
	minSegmentLength: 5, //stop when segment length below this
	maxThreshold: 10, //stop when max value below this
	endThreshold: 0,
	onlyDiagonals: true,
	patternIndices: ""
};

export let options = {
	quantizerFunctions: [QUANT_FUNCS.SORTED_SUMMARIZE(3), QUANT_FUNCS.CONSTANT(0), QUANT_FUNCS.ORDER()],
	//heuristic: dymoCore.HEURISTICS.COVERAGE,
	selectionHeuristic: (pattern, vectors, occurrences, allPoints) => {
		var dim = 3;//pattern[0].length;
		//var gaps = getPointsInBoundingBox(pattern, allPoints).length - pattern.length;
		//var result = pattern.length / Math.pow(1+gaps, 1/dim);

		//var result = pattern.length * Math.sqrt(math.mean(vectors.map(v => math.norm(v)))) // * Math.sqrt(occurrences.length);

		var norms = vectors.map(v => Math.sqrt(math.sum(v.map(p => Math.pow(p,2)))));//vectors.map(v => math.norm(v));
		var avgNorm = Math.sqrt(math.mean(norms))
		/*var result = 0;
		if (math.mean(norms) > 5) {//pattern.length > 10) {
			result = pattern.length * Math.sqrt(Math.log(occurrences.length) * Math.sqrt(math.mean(norms)));
		}*/

		var patternDuration = math.norm(math.subtract(pattern[pattern.length-1], pattern[0]));
		//var result = pattern.length // / Math.pow(1+gaps, 1/dim) * Math.sqrt(math.mean(norms))
		//TODO BEST var result = pattern.length > 1 ? pattern.length * Math.pow(avgNorm / patternDuration, 1/3) : 0;
		var result = pattern.length > 3 ? pattern.length * avgNorm / Math.sqrt(patternDuration) : 0;

		return result;
	},
	overlapping: true,
	optimizationMethod: OPTIMIZATION.NONE,
	optimizationHeuristic: (pattern, vectors, occurrences, allPoints) => {
		var dim = 4;
		var gaps = getPointsInBoundingBox(pattern, allPoints).length - pattern.length;
		return pattern.length // Math.pow(1+gaps, 1/dim);
	},
	optimizationDimension: 5,
	//patternIndices: patternIndices
}

function getPointsInBoundingBox(pattern, allPoints) {
	var maxes = math.max(pattern, 0);
	var mins = math.min(pattern, 0);
	return allPoints.filter(p => p.every((e,i) => maxes[i] - mins[i] == 0 || (mins[i] <= e && e <= maxes[i])));
}

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