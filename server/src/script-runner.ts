var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var fetch = require('isomorphic-fetch');
var url = require('url');
var siafun = require('siafun');
var DymoGenerator = require('dymo-generator').DymoGenerator;
var DymoTemplates = require('dymo-generator').DymoTemplates;
import { SERVER_PATH, PORT, availableFeatures, options, FeatureConfig } from './config';
import { FileManager } from './file-manager';
import { FeatureExtractor } from './feature-extractor';
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var ROOT = __dirname.slice(0, __dirname.length-3)+'files/'

var app = express();
app.use(express["static"](ROOT));
app.use(bodyParser.json({limit: '50mb'}));
var server = app.listen(PORT);
console.log('server started at '+SERVER_PATH);

var fileManager = new FileManager('input/', 'output/', ROOT, SERVER_PATH);
var featureExtractor = new FeatureExtractor();

var files = ['fugue.m4a', 'jackstraw77-05-07.mp3'];
extractSW(files[1])
	//.then(() => extractSW(files[0]))
	.then(() => server.close());

function extractSW(audioFile): Promise<any> {
	var generator = new DymoGenerator();
	var audioPath = fileManager.getAudioFilePath(audioFile);
	return fileManager.getFeatureFiles(audioFile)
		.then(featureFiles => filterSelectedFeatures(featureFiles))
		.then(r =>
			DymoTemplates.createSingleSourceDymoFromFeatures(generator, audioPath, r.orderedFiles, r.subsetConditions)
		)
		.then(r => {console.log(r); return r})
		.then(() => {
			var QF = siafun.QUANT_FUNCS;
			options["quantizerFunctions"] = [QF.SORTED_SUMMARIZE(4), QF.CONSTANT(0), QF.ORDER()];
			//options.optimizationDimension: 5,
			return DymoTemplates.createStructuredDymoFromFeatures(generator, options)
				.then(r => {
					r.matrices.forEach((m,i) => postJson('mmatrix'+i+'.json', m.scoreMatrix));
					postJson('pathmatrix.json', r.pathMatrix);
				});
		})
		.then(() => console.log("done!"))
		.catch(e => console.log(e));
}

function postJson(path, json) {
	fileManager.saveOutFile(path, JSON.stringify(json, null, 2));
}

function filterSelectedFeatures(featureUris) {
	var orderedFiles = [];
	var subsetConditions = [];
	for (var i = 0; i < availableFeatures.length; i++) {
		if (availableFeatures[i].selected) {
			var currentFeatureFile = featureUris.filter(f => f.indexOf(availableFeatures[i].name) >= 0)[0];
			if (currentFeatureFile) {
				orderedFiles.push(currentFeatureFile);
				subsetConditions.push(availableFeatures[i].subset);
			}
		}
	}
	//orderedFiles = orderedFiles.map(function(f){return f});
	return {orderedFiles:orderedFiles, subsetConditions:subsetConditions};
}
