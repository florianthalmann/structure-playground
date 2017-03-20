(function() {

	var fs = require('fs');
	var express = require('express');
	var path = require('path');
	var formidable = require('formidable');
	var bodyParser = require('body-parser');
	var async = require('async');
	var util = require('./util.js');
	//var cors = require('cors');

	var PORT = '4199';
	var INPUT_FOLDER = 'input/';
	var OUTPUT_FOLDER = 'output/';
	var SERVER_PATH = 'http://localhost:' + PORT + '/';

	var app = express();

	//app.use(cors());
	app.use(express["static"](__dirname));
	app.use(bodyParser.json({limit: '50mb'}));

	app.get('/getaudiofilepath', (req, res) => {
		var folder = toFolderName(req.query.audiofile);
		res.end(SERVER_PATH + folder + req.query.audiofile);
	});

	app.get('/getfeaturefiles', (req, res) => {
		var folder = toFolderName(req.query.audiofile);
		getFilesInFolder(folder, ["json", "n3"], files => {
			res.send(files.map(f => SERVER_PATH + folder + f))
		});
	});

	function toFolderName(audioFilename) {
		return INPUT_FOLDER + audioFilename.replace('.', '_') + '/';
	}

	function getFilesInFolder(folder, fileTypes, callback) {
		fs.readdir(__dirname + '/' + folder, function(err, files) {
			if (err) {
				console.log(err);
			} else if (files) {
				var files = files.filter(function(f) {
					//check if right extension
					return fileTypes.indexOf(f.split('.').slice(-1)[0]) >= 0;
				});
			}
			callback(files);
		});
	}

	var currentFeatures;

	function extractFeatures(path, callback) {
		async.mapSeries(currentFeatures, (f,c) => extractFeature(f, path, c), callback);
	}

	//extracts the given feature from the current audio file (currentPath) if it doesn't exist yet
	function extractFeature(feature, path, callback) {
		var audioFolder = path.slice(0, path.lastIndexOf('/')+1);
		var audioFilename = path.slice(path.lastIndexOf('/')+1);
		var featureOutPath = path.replace(path.slice(path.lastIndexOf('.')), '');
		var featureDestPath = audioFolder+(featureOutPath+'_').slice(path.lastIndexOf('/')+1) + feature.name + '.json';
		fs.stat(featureDestPath, function(err, stat) {
			if (err) { // only extract if file doesn't exist yet
				console.log('extracting '+feature.name+' for '+audioFilename);
				util.execute('sonic-annotator -d ' + feature.plugin + ' ' + path + ' -w jams', function(success) {
					if (success) {
						util.execute('mv '+featureOutPath+'.json '+featureDestPath, function(success) {
							callback();
						});
					}
				});
			} else {
				callback();
			}
		})
	}

	app.post('/setFeatureSelection', function(req, res) {
		currentFeatures = req.body;
		res.end("feature selection updated");
	});

	app.post('/extractFeatures', function(req, res) {
		var paths = req.body.map(p => __dirname + '/' + p);
		async.mapSeries(paths, extractFeatures, function() {
			res.end("features extracted for " + req.body);
		});
	});

	app.post('/postAudioFile', function(req, res) {
		var form = new formidable.IncomingForm();
		form.multiples = true;
		form.uploadDir = 'app/input/';
		form.on('file', function(field, file) {
			var currentDir = form.uploadDir+file.name.replace(/\./g,'_')+'/';
			if (!fs.existsSync(currentDir)){
				fs.mkdirSync(currentDir);
			}
			var currentPath = path.join(currentDir, file.name);
			fs.rename(file.path, currentPath);
			extractFeatures(currentPath, function() {
				res.end("features extracted for " + currentPath);
			});
		});
		form.on('error', function(err) {
			console.log('An error has occured: \n' + err);
		});
		form.on('end', function() {
			//res.end('file uploaded and analyzed');
		});
		form.parse(req);
	});

	app.post('/saveOutFile', function(req, res) {
		fs.writeFile(__dirname + '/' + OUTPUT_FOLDER + req.body.path, JSON.stringify(req.body.content, null, 2), function (err) {
			if (err) return res.send(err);
			res.end('file saved at ' + req.body.path);
		});
	});

	app.listen(PORT);

	console.log('Server started at '+SERVER_PATH);

}).call(this);
