var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var fetch = require('isomorphic-fetch');
var url = require('url');
import { IterativeSmithWatermanResult, QUANT_FUNCS } from 'siafun';
var DymoGenerator = require('dymo-generator').DymoGenerator;
var DymoTemplates = require('dymo-generator').DymoTemplates;
import { SERVER_PATH, PORT, DIRS, availableFeatures, options, FeatureConfig } from './config';
import { DymoStructureInducer } from './dymo-structure';
import { FileManager } from './file-manager';
import { FeatureExtractor } from './feature-extractor';
import { execute } from './util';
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var ROOT = __dirname.slice(0, __dirname.length-3)+'lib/'

var app = express();
app.use(express["static"](ROOT));
app.use(bodyParser.json({limit: '50mb'}));
var server = app.listen(PORT);
console.log('server started at '+SERVER_PATH);

var fileManager = new FileManager(DIRS.in, DIRS.out, ROOT, SERVER_PATH);
var featureExtractor = new FeatureExtractor();

featureExtractor.extractFeatures([toFolderName(DIRS.file)+DIRS.file],
		availableFeatures.filter(f => f.selected))
	.then(() => extractSW(DIRS.file))
	.then(() => server.close())
	.then(plot);

function plot(): Promise<any> {
	return new Promise(resolve => {
		execute('python '+ROOT+'../plot.py '+ROOT+DIRS.out, success => resolve());
	})
}

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
			var QF = QUANT_FUNCS;
			options["quantizerFunctions"] = [QF.SORTED_SUMMARIZE(3), QF.ORDER()]//[QF.SORTED_SUMMARIZE(4), QF.CONSTANT(0), QF.ORDER()];
			//options.optimizationDimension: 5,
			return createStructuredDymoFromFeatures(generator, options)
				.then(r => {
					console.log(r)
					/*r.matrices.forEach((m,i) => postJson('smatrix'+i+'.json', m.scoreMatrix));
					//r.matrices.forEach((m,i) => postJson('tmatrix'+i+'.json', m.traceMatrix));
					postJson('segmentMatrix.json', r.segmentMatrix);*/
				});
		})
		.then(() => console.log("done!"))
		.catch(e => console.log(e));
}

function createStructuredDymoFromFeatures(generator, options): Promise<IterativeSmithWatermanResult> {
		DymoStructureInducer.flattenStructure(generator.getCurrentTopDymo(), generator.getManager().getStore());
		return generator.getManager().reloadFromStore()
			.then(r => {
				//let result = DymoStructureInducer.testSmithWaterman(generator.getCurrentTopDymo(), generator.getManager().getStore(), options);
				let result = DymoStructureInducer.addStructureToDymo2(generator.getCurrentTopDymo(), generator.getManager().getStore(), options);
				generator.addRendering();
				return generator.getManager().reloadFromStore()
				 .then(r => result);
			});
	}

function postJson(path, json) {
	fileManager.saveOutFile(path, JSON.stringify(json, null, 2));
}

function filterSelectedFeatures(featureUris) {
	var orderedFiles = [];
	var subsetConditions = [];
	availableFeatures.filter(f => f.selected).forEach(f => {
		var currentFeatureFile = featureUris.filter(u => u.indexOf(f.name) >= 0)[0];
		if (currentFeatureFile) {
			orderedFiles.push(currentFeatureFile);
			subsetConditions.push(f.subset);
		}
	});
	//orderedFiles = orderedFiles.map(function(f){return f});
	return {orderedFiles:orderedFiles, subsetConditions:subsetConditions};
}

function toFolderName(audioFilename) {
	return ROOT + DIRS.in + audioFilename.replace('.', '_') + '/';
}
