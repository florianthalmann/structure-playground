var fs = require('fs');
var express = require('express');
var join = require('path').join;
var formidable = require('formidable');
var bodyParser = require('body-parser');
import { FileManager } from './file-manager';
import { FeatureExtractor } from './feature-extractor';
import { PORT, SERVER_PATH } from './config';

var app = express();
var fileManager = new FileManager('input/', 'output/', __dirname+'/', SERVER_PATH);
var featureExtractor = new FeatureExtractor();

//app.use(cors());
app.use(express["static"](__dirname));
app.use(bodyParser.json({limit: '50mb'}));

app.get('/getaudiofilepath', (req, res) => {
	res.end(fileManager.getAudioFilePath(req.query.audiofile));
});

app.get('/getfeaturefiles', (req, res) => {
	fileManager.getFeatureFiles(req.query.audiofile)
		.then(r => res.end(r));
});

var currentFeatures;

app.post('/setFeatureSelection', function(req, res) {
	currentFeatures = req.body;
	res.end("feature selection updated");
});

app.post('/extractFeatures', function(req, res) {
	var paths = req.body.map(p => __dirname + '/' + p);
	this.featureExtractor.extractFeatures(paths, currentFeatures)
		.then(r => res.end("features extracted for " + req.body));
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
		var currentPath = join(currentDir, file.name);
		fs.rename(file.path, currentPath);
		this.featureExtractor.extractFeatures([currentPath], currentFeatures)
		 	.then(r => res.end("features extracted for " + currentPath));
	});
	form.on('error', function(err) {
		console.log('An error has occured: \n' + err);
	});
	form.on('end', function() {
		//res.end('file uploaded and analyzed');
	});
	form.parse(req);
});

app.post('/saveOutfile', function(req, res) {
	this.fileManager.saveOutFile(req.body.path, req.body.content)
		.then(r => res.end('file saved at ' + req.body.path));
});

app.listen(PORT);

console.log('Server started at '+SERVER_PATH);