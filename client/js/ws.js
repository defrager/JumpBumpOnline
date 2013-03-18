function Ws(address, port) {
	this.init(address, port);
};

Ws.prototype.init = function (address, port) {
	this.socket = io.connect('http://localhost');

	
	this.socket.on('open', function (e) {
	});
	
	this.socket.on('message', function (data) {
		//console.log(data);
		Event.call(data.type, data.data);
	});
	
	//this.socket.onerror = function (e) {
	//};
	
};

Ws.prototype.send = function (name, values) {
	this.socket.emit(name, values);
};