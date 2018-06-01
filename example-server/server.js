var args = process.argv;

if(args.length <3){
	console.log("Usage: <npm start /absolute/path/to/csv>");
}
else{
	var csv_abs_path = args.slice(2).toString();

	console.log('arguments: ' + csv_abs_path);

	var Spacecraft = require('./spacecraft');
	var RealtimeServer = require('./realtime-server');
	var HistoryServer = require('./history-server');
	var StaticServer = require('./static-server');

	var expressWs = require('express-ws');
	var app = require('express')();
	expressWs(app);

	var spacecraft = new Spacecraft(csv_abs_path);
	var realtimeServer = new RealtimeServer(spacecraft);
	var historyServer = new HistoryServer(spacecraft);
	var staticServer = new StaticServer();

	app.use('/realtime', realtimeServer);
	app.use('/history', historyServer);
	app.use('/', staticServer);

	var port = process.env.PORT || 8080

	app.listen(port, function () {
	    console.log('Open MCT hosted at http://localhost:' + port);

	});
}