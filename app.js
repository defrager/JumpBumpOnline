var url = require('url');
var path = require('path');
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
var game = require("./game");

app.listen(8080);

function handler (request, response) { 
   var uri = url.parse(request.url).pathname;
   if (uri == '/') {
	 uri = "index.html";
   }
    var filename = path.join(process.cwd(), 'client/' + uri);
	console.log('request: ' + filename); 

    path.exists(filename, function(exists) {
    	if(!exists) {
    		response.writeHead(404, {"Content-Type": "text/plain"});
    		response.write("404 Not Found\n");
    		response.end();
			console.log('not found');
    		return;
    	}

    	fs.readFile(filename, "binary", function(err, file) {
    		if(err) {
    			response.writeHead(500, {"Content-Type": "text/plain"});
    			response.write(err + "\n");
    			response.end();
    			return;
    		}

    		response.writeHead(200);
    		response.write(file, "binary");
    		response.end();
    	});
    }); 
}

game.startGame(io);
