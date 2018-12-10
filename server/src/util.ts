import { exec } from 'child_process';

export function execute(command, callback) {
	let options = {}//{stdio: ['pipe', 'pipe', 'ignore']};
	exec(command, options, function(error, stdout, stderr) {
		if (error) {
			console.log(stderr);
			if (callback) { callback(false); }
		} else {
			if (callback) { callback(true); }
		}
	});
}