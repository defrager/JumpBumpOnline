var path = require('path');
var fs = require('fs') 

exports.startGame = startGame;

var PlayerAnimation = {
	NONE: {
		restart_frame: 0,
		frame: [{ image: 0, ticks: 1 }]
	},
	RUN: {
		restart_frame: 0,
		frame: [{ image: 0, ticks: 4 }, { image: 1, ticks: 4 }, { image: 2, ticks: 4 }, { image: 3, ticks: 4 }]
	},
	JUMPUP: {
		restart_frame: 0,
		frame: [{ image: 4, tick: 1 }]
	},
	JUMPDOWN: {
		restart_frame: 2,
		frame: [{ image: 5, ticks: 8 }, { image: 6, ticks: 10 }, { image: 7, ticks: 3 }, { image: 6, ticks: 3 }]
	},
	SWIMDOWN: {
		restart_frame: 0,
		frame: [{ image: 6, ticks: 1 }]
	},
	SWIMUP: {
		restart_frame: 1,
		frame: [{ image: 5, ticks: 8 }, { image: 4, ticks: 1 }]
	},
	DEATH: {
		restart_frame: 0,
		frame: [{ image: 8, ticks: 5 }]
	}
}

var GameObject = {
	SMOKE: 'SMOKE',
	DEADTH: 'DEADTH',
	SPLASH: 'SPLASH',
	SPRING: 'SPRING'
}

var PlayerDirection = {
	LEFT: 1,
	RIGHT: 0
}

var Sound = {
	JUMP: 'JUMP',
	WATER_SPLASH: 'WATER_SPLASH',
	DEADTH: 'DEADTH',
	SPRING: 'SPRING'
};

function rnd(limit) {
    return Math.floor(Math.random() * limit);
}

function Player(id) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.x_add = 0;
	this.y_add = 0;
	this.direction = rnd(2) ? PlayerDirection.LEFT : PlayerDirection.RIGHT;
	this.jump_ready = true;
	this.frame = 0;
	this.frame_tick = 0;
	this.image = 0;
	this.anim = PlayerAnimation.NONE;
	this.bumps = 0;
	this.actions = {};

	this.setAnimation = function (anim) {
		this.anim = anim;
		this.frame = 0;
		this.frame_tick = 0;
	}

	this.updateAnimation = function () {
		this.frame_tick++;
		var anim = this.anim;
		var restart_frame = false;

		if (this.frame_tick >= anim.frame[this.frame].ticks) {
			this.frame++;
			if (this.frame >= anim.frame.length) {
				this.frame = anim.restart_frame;
				restart_frame = true;
			}
			this.frame_tick = 0;
		}
		this.image = anim.frame[this.frame].image + this.direction * 9;
		return restart_frame;
	}

	this.sendMessage = function(message, data) {
		this.socket.emit('message', {'type' : message, 'data' : data});
	}

	this.getPlayerData = function() {
		return {
			x: this.x,
			y: this.y,
			x_add: this.x_add,
			y_add: this.y_add,
			image: this.image,
			id: this.id,
			socket: this.socket.id
		}
	}
}

var Tile = {
	NONE: '0',
	GROUND: '1',
	WATER: '2',
	ICE: '3',
	SPRING: '4', 

	isOneOf: function (tile, tiles) {
		return tiles.indexOf(tile) !== -1;
	}
}

function loadJSON(url, element, callback) {
	var filename = path.join(process.cwd(), 'client/' + url);
	fs.readFile(filename, "binary", function(err, file) { 
		if (err) {
			console.log("can't read ", filename, err);
			err();
		} else {
			callback(element, JSON.parse(file));
		}
	});
}

function Level() {
	this.ready = false;
	this.tiles = [];
	this.ROW_COUNT = 16;
	this.COLUMN_COUNT = 22;
	this.TILE_WIDTH = 16;
	this.TILE_HEIGHT = 16;

	this.load = function (atlasDataUrl) {
		loadJSON(atlasDataUrl, this, function (level, parsed) {
			console.log("Level: ", parsed);
			for (var s in parsed.rows) {
				var row = parsed.rows[s];
				level.tiles.push(row);
			}
			level.ready = true;
		});
	}

	this.fs = function (players) {
		for (var i in players) {
			this.positionPlayer(players[i], players);
		}
	}

	this.positionPlayer = function (player, players) {
		var positionFound = false;
		var column, row;
		while (!positionFound) {
			positionFound = true;
			column = rnd(this.COLUMN_COUNT);
			row = rnd(this.ROW_COUNT);
			if (this.tiles[row][column] != Tile.NONE) {
				positionFound = false;
			} 
			for (var p = 0; p < players.length; p++) {
				if (players[p] == player) continue;
				if (Math.abs(column * this.TILE_WIDTH - players[p].x) < 2 * this.TILE_WIDTH && Math.abs(row * this.TILE_HEIGHT - players[p].y) < 2 * this.TILE_HEIGHT) {
					positionFound = false;
				}
			}
		}
			
		player.dead_flag = false;
		player.x = column * this.TILE_WIDTH;
		player.y = row * this.TILE_HEIGHT;
		player.x_add = player.y_add = 0;
		player.direction = PlayerDirection.RIGHT;
		player.jump_ready = true;
		player.in_water = false;
		player.setAnimation(PlayerAnimation.NONE);
	}
}

function JumpBump(io) {
	var UNIT = 1.0 / 16;

	var players = [];
	var level;
	var score = [0, 0, 0, 0];

	function initialize() {
		createPlayers();
		loadLevel();
		update();
		createSockets();
	}

	function createPlayers() {

	}

	function loadLevel() {
		level = new Level();
		level.load('images/level.json.txt');
	}

	function update() {

		for (var i in players) {
			updatePlayer(players[i]);
		}
		if (level.ready) {
			checkDeath();
		}
		sendUpdatePlayers();

		if (players.length > 0) {
			setTimeout(update, 1000/63); 
		}
	}


	function checkDeath() {
		for (var i = 0; i < players.length; ++i) {
			for (var j = 0; j < i; ++j) {
				var p1 = players[i];
				var p2 = players[j];

				if (Math.abs(p1.x - p2.x) >= 12 || Math.abs(p1.y - p2.y) >= 12)
					continue;
				

				if (Math.abs(p1.y - p2.y) > 5) {
					if (p1.y > p2.y) {
						var p = p1; p1 = p2; p2 = p;
					}
					if (p1.y < p2.y) {
						if (p1.y_add >= 0) {
							p1.y_add = -p1.y_add;
							if (p1.y_add > -4) {
								p1.y_add = -4;
							}
							p1.jump_abort = true;
							p2.dead_flag = true;

							if (p2.anim != PlayerAnimation.DEATH) {
								p2.setAnimation(PlayerAnimation.DEATH);
								playSound(Sound.DEADTH);

								addObject(GameObject.DEADTH, p2.x, p2.y, 0, 0, p2.id);
							}

							score[p1.id]++;
							sendUpdateScore();
							
						} else {
							if (p2.y_add < 0) p2.y_add = 0;
						}


					}
				} else {
					if (p1.x > p2.x) {
						var p = p1; p1 = p2; p2 = p;
					}
					if (p1.x < p2.x) {
						if (p1.x_add > 0)
							p1.x = p2.x - 12;
						else if (p2.x_add < 0)
							p2.x = p1.x + 12;
						else {
							p1.x -= p1.x_add;
							p2.x -= p2.x_add;
						}
						var t = p2.x_add;
						p2.x_add = p1.x_add;
						p1.x_add = t;
						if (p1.x_add > 0) p1.x_add = -p1.x_add;
						if (p2.x_add < 0) p2.x_add = -p2.x_add;
					}
				}
			}
		}
	}

	function updatePlayer(player) {
		var cx = level.TILE_WIDTH, cy = level.TILE_HEIGHT;

		if (player.dead_flag) {
			if (player.updateAnimation()) {
				level.positionPlayer(player, players);
			}
			return;
		}

		if (player.actions['move-left'] && (player.direction == PlayerDirection.LEFT || !player.actions['move-right'])) {
			if (getTile(player.y + cy, player.x + cx / 2) == Tile.ICE
				|| getTile(player.y + cy, player.x) != Tile.GROUND && getTile(player.y + cy, player.x + cx - 1) == Tile.ICE
				|| getTile(player.y + cy, player.x) == Tile.ICE && getTile(player.y + cy, player.x + cx - 1) != Tile.GROUND) {
				if (player.x_add > 0) {
					player.x_add -= 0.25 * UNIT;
				} else {
					player.x_add -= 0.1875 * UNIT;
				}
			} else {
				if (player.x_add > 0) {
					player.x_add -= 4 * UNIT;
					if (!player.in_water && getTile(player.y + cy, player.x + cx / 8) == Tile.GROUND) {
						addObject(GameObject.SMOKE, player.x + 2 + rnd(9), player.y + 13 + rnd(5), 0, -4 * UNIT - Math.random() * 2 * UNIT);
					}
				} else {
					player.x_add -= 3 * UNIT;
				}
			}
			if (player.x_add < -24 * UNIT) {
				player.x_add = -24 * UNIT;
			}

			player.direction = PlayerDirection.LEFT;
			if (player.anim == PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.RUN);
			}
		} else if (player.actions['move-right']) {
			if (getTile(player.y + cy, player.x + cx / 2) == Tile.ICE
				|| getTile(player.y + cy, player.x) != Tile.GROUND && getTile(player.y + cy, player.x + cx - 1) == Tile.ICE
				|| getTile(player.y + cy, player.x) == Tile.ICE && getTile(player.y + cy, player.x + cx - 1) != Tile.GROUND) {
				if (player.x_add > 0) {
					player.x_add += 0.25 * UNIT;
				} else {
					player.x_add += 0.1875 * UNIT;
				}
			} else {
				if (player.x_add < 0) {
					player.x_add += 4 * UNIT;
					if (!player.in_water && getTile(player.y + cy, player.x + cx / 8) == Tile.GROUND) {
						addObject(GameObject.SMOKE, player.x + 2 + rnd(9), player.y + 13 + rnd(5), 0, -4 * UNIT - Math.random() * 2 * UNIT);
					}
				} else {
					player.x_add += 3 * UNIT;
				}
			}
			if (player.x_add > 24 * UNIT) {
				player.x_add = 24 * UNIT;
			}
			player.direction = PlayerDirection.RIGHT;
			if (player.anim == PlayerAnimation.NONE) {
				player.setAnimation(PlayerAnimation.RUN);
			}
		} else {
			if (Tile.isOneOf(getTile(player.y + cy, player.x + cx / 2), [Tile.GROUND, Tile.SPRING])
				|| Tile.isOneOf(getTile(player.y + cy, player.x), [Tile.GROUND, Tile.SPRING]) && getTile(player.y + cy, player.x + cx - 1) != Tile.ICE
				|| Tile.isOneOf(getTile(player.y + cy, player.x + cx - 1), [Tile.GROUND, Tile.SPRING]) && getTile(player.y + cy, player.x) != Tile.ICE) {
				if (player.x_add < 0) {
					player.x_add += 4 * UNIT;
					if (player.x_add > 0)
						player.x_add = 0;
				} else if (player.x_add > 0) {
					player.x_add -= 4 * UNIT;
					if (player.x_add < 0)
						player.x_add = 0;
				}
				if (player.x_add != 0 && getTile(player.y + cy, player.x + cx / 2) == Tile.GROUND) {
					addObject(GameObject.SMOKE, player.x + 2 + rnd(9), player.y + 13 + rnd(5), 0, -4 * UNIT - Math.random() * 2 * UNIT);
				}
			}
			if (player.anim == PlayerAnimation.RUN) {
				player.setAnimation(PlayerAnimation.NONE);
			}
		}

		if (player.jump_ready && player.actions['move-up']) {
			if (Tile.isOneOf(getTile(player.y + cy, player.x), [Tile.GROUND, Tile.ICE]) || Tile.isOneOf(getTile(player.y + cy, player.x + cx - 1), [Tile.GROUND, Tile.ICE])) {
				player.y_add = -70 * UNIT;
				player.setAnimation(PlayerAnimation.JUMPUP);
				player.jump_ready = false;
				player.jump_abort = true;
				playSound(Sound.JUMP);
			}
			if ((getTile(player.y + cy / 2 - 1, player.x) == Tile.NONE || getTile(player.y + cy / 2 - 1, player.x + cx - 1) == Tile.NONE)
				&& (getTile(player.y + cy / 2 + 1, player.x) == Tile.WATER || getTile(player.y + cy / 2 + 1, player.x + cx - 1) == Tile.WATER)) {
				player.y_add = -48 * UNIT;
				player.in_water = false;
				player.setAnimation(PlayerAnimation.JUMPUP);
				player.jump_ready = false;
				player.jump_abort = true;
				playSound(Sound.JUMP);
			}
		} else if (!player.actions['move-up']) {
			player.jump_ready = true;
			if (!player.in_water && player.y_add < 0 && player.jump_abort) {
				player.y_add += 8 * UNIT;
				if (player.y_add > 0) player.y_add = 0;
			}
		}

		player.x += player.x_add;
		if (player.x < 0) {
			player.x = 0;
			player.x_add = 0;
		}
		if (player.x + cx > level.TILE_WIDTH * level.COLUMN_COUNT) {
			player.x = level.TILE_WIDTH * level.COLUMN_COUNT - cx;
			player.x_add = 0;
		}
		
		y = Math.floor(player.y); x = Math.floor(player.x);
		if (y < 0) y = 0;
		if (Tile.isOneOf(getTile(y, x), [Tile.GROUND, Tile.ICE, Tile.SPRING])
			|| Tile.isOneOf(getTile(y + cy - 1, player.x), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.x = Math.floor((player.x + cx / 2) / cx) * cx;
			player.x_add = 0;
		}
		if (Tile.isOneOf(getTile(y, x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])
			|| Tile.isOneOf(getTile(y + cy - 1, x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.x = Math.floor((player.x + cx / 2) / cx) * cx;
			player.x_add = 0;
		}

		player.y += player.y_add;

		if (getTile(player.y + cy - 1, player.x + cx / 2) == Tile.SPRING
			|| getTile(player.y + cy - 1, player.x) == Tile.SPRING && getTile(player.y + cy - 1, player.x + cx - 1) != Tile.GROUND
			|| getTile(player.y + cy - 1, player.x) != Tile.GROUND && getTile(player.y + cy - 1, player.x + cx - 1) == Tile.SPRING) {
			player.y -= 1;
			player.y_add = -100 * UNIT;
			player.setAnimation(PlayerAnimation.JUMPUP);
			player.jump_ready = false;
			player.jump_abort = false;
			playSound(Sound.SPRING);
			
			// TODO: Add multiple spring support.
			addObject(GameObject.SPRING);
		}

		if (Tile.isOneOf(getTile(player.y, player.x), [Tile.GROUND, Tile.ICE, Tile.SPRING]) || Tile.isOneOf(getTile(player.y, player.x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.y = Math.floor((player.y + cy / 2) / cy) * cy;
			player.y_add = 0;
			player.setAnimation(PlayerAnimation.NONE);
		}

		if (getTile(player.y + cy / 2, player.x + cx / 2) == Tile.WATER) {
			if (!player.in_water) {
				player.in_water = true;
				player.setAnimation(PlayerAnimation.SWIMDOWN);
				if (player.y_add >= 8 * UNIT) {
					// TODO: Add Splash sound.
					addObject(GameObject.SPLASH, player.x + 8, Math.floor((player.y) / cy) * cy + cy - 1, 0, 0);
					playSound(Sound.WATER_SPLASH);
				}
			}
			player.y_add -= 0.375 * UNIT;
			if (player.y_add < 0 && player.anim != PlayerAnimation.SWIMUP) {
				player.setAnimation(PlayerAnimation.SWIMUP);
			}
			if (player.y_add < -16 * UNIT) {
				player.y_add = -16 * UNIT;
			}
			if (player.y_add > 16 * UNIT) {
				player.y_add = 16 * UNIT;
			}
			if (Tile.isOneOf(getTile(player.y + cy - 1, player.x), [Tile.GROUND, Tile.ICE]) || Tile.isOneOf(getTile(player.y + cy - 1, player.x + cx - 1), [Tile.GROUND, Tile.ICE])) {
				player.y = Math.floor((player.y + cy / 2) / cy) * cy;
				player.y_add = 0;
			}

		} else if (Tile.isOneOf(getTile(player.y + cy - 1, player.x), [Tile.GROUND, Tile.ICE, Tile.SPRING])
			|| Tile.isOneOf(getTile(player.y + cy - 1, player.x + cx - 1), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
			player.in_water = false;
			player.y = Math.floor((player.y + cy / 2) / cy) * cy;
			player.y_add = 0;
			if (player.anim != PlayerAnimation.NONE && player.anim != PlayerAnimation.RUN) {
				player.setAnimation(PlayerAnimation.NONE);
			}
		} else {
			if (!player.in_water) {
				player.y_add += 3 * UNIT;
				player.y_add = Math.min(player.y_add, 80 * UNIT);
			} else {
				player.y = Math.floor(player.y) + 1;
				player.y_add = 0;
			}
			player.in_water = false;
		}

		if (player.y_add > 9 * UNIT && player.anim != PlayerAnimation.JUMPDOWN && !player.in_water) {
			player.setAnimation(PlayerAnimation.JUMPDOWN);
		}

		player.updateAnimation();
	}

	function getTile(y, x) {
		if (y < 0) {
			return Tile.NONE;
		}
		row = Math.floor(y / level.TILE_HEIGHT);
		if (row >= level.tiles.length) {
			return Tile.GROUND;
		}
		return level.tiles[row][Math.floor(x / level.TILE_WIDTH)]
	}

	function playSound(sound) {
		io.sockets.emit('message', {'type' : 'playSound', 'data' : sound}); 
	}

	function addObject(object, x, y, x_add, y_add, frame) {
		var data = {
			object: object,
			x: x,
			y: y,
			x_add: x_add,
			y_add: y_add
		}
		if (frame) {
			data.frame = frame;
		}
		sendMessage('addObject', data); 
	}


	function sendUpdatePlayers() {
		var data = [];
		for (var i = 0; i < players.length; ++i) {
			data.push(players[i].getPlayerData());
		}
		sendMessage('updatePlayers', data); 
	}

	function createNewPlayer(socket) {
		var player = new Player(players.length % 4);
		level.positionPlayer(player, players);

		players.push(player);
		player.socket = socket;

		player.sendMessage('createNewPlayer', player.getPlayerData());
		sendUpdateScore();
	}

	function sendUpdateScore() {
		scoreFound = [false, false, false, false];
		for (var i = 0; i < players.length; i++) {
			scoreFound[players[i].id] = true;
		}
		for (var i = 0; i < scoreFound.length; i++) {
			if (!scoreFound[i]) {
				score[i] = 0;
			}
		}
		sendMessage('updateScore', score);
	}

	function sendMessage(message, data) {
		io.sockets.emit('message', {'type' : message, 'data' : data}); 
	}

	function removePlayer(socket) {
		console.log("Disconnected:");

		for (var i = 0; i < players.length; ++i) {
			console.log(players[i].socket.id);
			if (players[i].socket.id === socket.id) {
				console.log("Removed " + i);
				players.splice(i, 1);						
			}
		}
		sendUpdateScore();
	}

	function findPlayer(socketId) {
		for (var i = 0; i < players.length; ++i) {
			if (players[i].socket.id === socketId) {
				return	players[i];				
			}
		}
		return null;
	}

	function inputActionChanged(data) {
		var player = findPlayer(data.socket);
		if (player == null) {
			return;
		}
		player.actions = data.actions;
	}

	function createSockets() {
		game = this;
		io.sockets.on('connection', function (socket) {
			console.log("connected: " + socket);
			
			createNewPlayer(socket);
			sendUpdatePlayers();

			if (players.length == 1) {
				update();
			}

			socket.on('inputActionChanged', function (data) {
				inputActionChanged(data);
			});

			socket.on('disconnect', function (data) {
				removePlayer(socket);
			});
		});
		//io.log.enabled = false;
		io.set('log level', 1); // reduce logging
	}

	initialize();
}

function startGame (io) { 
	JumpBump(io);
};