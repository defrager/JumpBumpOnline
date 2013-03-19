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

var ObjectAnimation = {
	SPRING: {
		frame: [{ image: 0, ticks: 3 }, { image: 1, ticks: 3 }, { image: 2, ticks: 3 }, { image: 4, ticks: 3 }, { image: 5, ticks: 3}]
	},
	SPLASH: {
		frame: [{ image: 6, ticks: 2 },{ image: 7, ticks: 2 },{ image: 8, ticks: 2 },{ image: 9, ticks: 2 },{ image: 10, ticks: 2 },{ image: 11, ticks: 2 },{ image: 12, ticks: 2 },{ image: 13, ticks: 2 },{ image: 14, ticks: 2 }]
	},
	SMOKE: {
		frame: [{ image: 15, ticks: 3 },{ image: 16, ticks: 3 },{ image: 17, ticks: 3 },{ image: 18, ticks: 3 },{ image: 19, ticks: 3 }]
	},
	FLESH_TRACE: {
		frame: [{ image: 76, ticks: 4 },{ image: 77, ticks: 4},{ image: 78, ticks: 4 },{ image: 79, ticks: 4 }]
	},
	FUR: {
		frame: [{ image: 44, ticks: 1 }, { image: 44 + 8, ticks: 1 }, { image: 44 + 16, ticks: 1 }, { image: 44 + 24, ticks: 1 }]
	}
}

var GameObject = {
	Splash: function () {
		this.temporal = true;
	},
	Spring: function () {
		this.resetAnimation = function () {
			this.frame = 0;
			this.ticks = this.anim.frame[0].ticks;
			this.image = this.anim.frame[0].image;
		}
	},
	Flesh: function () {
		this.temporal = true;
	},
	Fur: function () {
		this.temporal = true;
	},
	FleshTrace: function () {
		this.temporal = true;
	},
	Smoke: function () {
		this.temporal = true;
	}
}


var PlayerDirection = {
	LEFT: 1,
	RIGHT: 0
}

function Player(id) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.image = 0;
}

function Sprite() {

}

function Screen(width, height) {
	this.sprites = [];
	this.width = width;
	this.height = height;

	init = function (screen) {
		screen.canvas = document.createElement('canvas');
		screen.canvas.width = screen.width;
		screen.canvas.height = screen.height;
		screen.context = screen.canvas.getContext('2d');
	} (this);

	this.clear = function () {
		this.sprites = [];
	}

	this.addSprite = function (sprite, x, y) {
		if (sprite == null) {
			return;
		}
		var drawObject = {
			sprite: sprite,
			x: x,
			y: y
		};
		this.sprites.push(drawObject);
	}

	this.drawSprites = function () {
		for (var key = this.sprites.length - 1; key >= 0; key--) {
			var drawObject = this.sprites[key];
			var sprite = drawObject.sprite;
			this.context.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height,
				drawObject.x - sprite.hotspot_x, drawObject.y - sprite.hotspot_y, sprite.width, sprite.height);
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

function Level() {
	this.ready = false;
	this.backgroundImage;
	this.foregroundImage;
	this.tiles = [];
	this.ROW_COUNT = 16;
	this.COLUMN_COUNT = 22;
	this.TILE_WIDTH = 16;
	this.TILE_HEIGHT = 16;

	this.load = function (atlasDataUrl, callback) {
		loadJSON(atlasDataUrl, this, function (level, parsed) {
			level.backgroundImage = new Image();
			level.backgroundImage.src = parsed.backgroundImage;

			level.foregroundImage = new Image();
			level.foregroundImage.src = parsed.foregroundImage;

			for (var s in parsed.rows) {
				var row = parsed.rows[s];
				level.tiles.push(row);
			}
			level.ready = true;
			callback();
		});
	}
}

function Atlas() {
	this.sprites = []
	this.ready = false;

	this.load = function (atlasDataUrl) {
		loadJSON(atlasDataUrl, this, function (atlas, parsed) {
			atlas.image = new Image();
			atlas.image.src = parsed.imageSource;

			for (var s in parsed.sprites) {
				var data = parsed.sprites[s];
				sprite = new Sprite();
				sprite.x = data.x;
				sprite.y = data.y;
				sprite.width = data.width;
				sprite.height = data.height;
				sprite.hotspot_x = data.hotspot_x;
				sprite.hotspot_y = data.hotspot_y;
				sprite.image = atlas.image;
				atlas.sprites.push(sprite);
			}
			atlas.ready = true
		});
	}

	this.getSprite = function (index) {
		if (!this.ready) {
			return null;
		}
		return this.sprites[index];
	}
}

function Input() {
	this.bindings = {};
	this.actions = {};
	this.onInputActionChanged;
	this.canvas;

	this.init = function (canvas, onInputActionChanged) {
		var input = this;
		this.onInputActionChanged = onInputActionChanged;
		this.canvas = canvas;
		this.bindings[87] = 'move-up';
		this.bindings[65] = 'move-left';
		this.bindings[68] = 'move-right';
	
		this.bindings[37] = 'move-left';
		this.bindings[38] = 'move-up';
		this.bindings[39] = 'move-right';

		window.addEventListener('keydown', function (event) { input.onKeyDown(event); });
		window.addEventListener('keyup', function (event) { input.onKeyUp(event); });
		canvas.addEventListener('touchstart', function (event) { input.onCanvasTouchStartHandler(event); }, false);
		canvas.addEventListener('touchmove', function (event) { input.onCanvasTouchMoveHandler(event); }, false);
		canvas.addEventListener('touchend', function (event) { input.onCanvasTouchEndHandler(event); }, false);
	}

	this.onKeyDown = function (event) {
		var action = this.bindings[event.keyCode];
		if (action) {
			this.actions[action] = true;
			this.onInputActionChanged();
		}
	}

	this.onKeyUp = function (event) {
		var action = this.bindings[event.keyCode];
		if (action) {
			this.actions[action] = false;
			this.onInputActionChanged();
		}
	}

	this.processTouch = function(event) {
		var x = event.touches[0].pageX;
		var y = event.touches[0].pageY;
				
		this.actions[x < this.canvas.width / 2 ? 'move-left' : 'move-right'] = true;
		this.actions['move-up'] = y < this.canvas.height / 2;
		this.onInputActionChanged();	
	}	
	
	this.onCanvasTouchStartHandler = function (event) {
		if (event.touches.length == 1) {
			event.preventDefault();			
			this.processTouch(event);
		}
	}
	
	this.onCanvasTouchMoveHandler = function (event) {
		var lastTouch = this.touch;
		if (event.touches.length == 1) {
			event.preventDefault();

			this.processTouch(event);	
			this.onInputActionChanged();
		}
	}
	
	this.onCanvasTouchEndHandler = function (event) {
		this.actions['move-left'] = false;
		this.actions['move-right'] = false;
		this.actions['move-up'] = false;
		if (event.touches.length == 1) {
			event.preventDefault();			
			this.processTouch(event);
		}
		this.onInputActionChanged();	
	}
};

var JumpBump = (function(){
	// Default dimensions of the world
	var DEFAULT_WIDTH = 400,
		DEFAULT_HEIGHT = 256;
	var MENU_FADE_IN_DURATION = 600;
	var SCALE = 2;
	var UNIT = 1.0 / 16;

	// Flags if the game should output debug information
	var options = {
		showGore: URLUtil.queryValue('nogore') != '1',
		debug: URLUtil.queryValue('debug') == '1',
		sound: URLUtil.queryValue('nosound') != '1'
	};

	var TOUCH_INPUT = navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);

	// The world dimensions
	var world = {
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT
	};
	var screenSize = {
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT
	};
	var Sound = {
		JUMP: null,
		WATER_SPLASH: null,
		DEADTH: null,
		SPRING: null
	};
	var audioContext;

	var canvas,
		context;
	var menuBackground;

	var players = [];
	var screen;
	var objects = [];
	var leftovers = {};
	var rabbitAtlas;
	var objectsAtlas;
	var numbersAtlas;
	var input;
	var level;
	var menuMode = false;
	var ws = new Ws('localhost', 8190); 
		
	function initialize() {
		container = $('#game');
		canvas = document.querySelector('#world');
		
		if (canvas && canvas.getContext) {
			context = canvas.getContext('2d');        
		} else {
			alert('Doesn\'t seem like your browser supports the HTML5 canvas element :(');
			return;
		}

		window.addEventListener('resize', onWindowResizeHandler, false);

		input = new Input();
		input.init(canvas, onInputActionChanged);

		// Force an initial layout
		onWindowResizeHandler();

		loadSprites();
		loadLevel();
		loadSound();
		initScreen();
		update();

		Event.subscribe('updatePlayers',  onEventUpdatePlayers);
		Event.subscribe('createNewPlayer', onEventCreateNewPlayer);
		Event.subscribe('addObject', onEventAddObject);
		Event.subscribe('playSound', onEventPlaySound);
		Event.subscribe('updateScore', onEventUpdateScore);

		container.fadeIn(MENU_FADE_IN_DURATION);
	}

	function onEventUpdatePlayers(playersUpdate) {
		//console.log(playersUpdate);
		foundPlayers = {};
		for (var i = 0; i < playersUpdate.length; i++) {
			var playerData = playersUpdate[i];
			foundPlayers[playerData.socket] = true;

			var player = findPlayer(playerData.socket);

			if (player == null) {
				player = new Player(playerData.id);
				player.local = false;
				players.push(player);
			}
			player.x = playerData.x;
			player.y = playerData.y;
			player.socket = playerData.socket;
			player.image = playerData.image;
		}
		for (var i = players.length - 1; i >= 0; i--) {
			if (!foundPlayers[players[i].socket]) {
				players.splice(i, 1);
			}
		}
	}

	function onEventCreateNewPlayer(playerData) {
		var player = new Player(playerData.id);
		player.x = playerData.x;
		player.y = playerData.x;
		player.socket = playerData.socket;
		player.image = playerData.image
		player.local = true;

		players.push(player);
	}

	function onEventUpdateScore(score) {
		for (var id = 0; id < 4; id++) {
			addLeftover('l' + id, numbersAtlas.getSprite(Math.floor(score[id] / 10) % 10), 360, 34 + id * 64);
			addLeftover('r' + id, numbersAtlas.getSprite(score[id] % 10), 376, 34 + id * 64);	
		}
	}

	function onEventAddObject(objectData) {
		//console.log(objectData);
		if (objectData.object == 'SMOKE') {
			addObject(new GameObject.Smoke(), objectData.x, objectData.y, objectData.x_add, objectData.y_add, ObjectAnimation.SMOKE, 0);
		} else if (objectData.object == 'SPLASH') {
			addObject(new GameObject.Splash(), objectData.x, objectData.y, objectData.x_add, objectData.y_add, ObjectAnimation.SPLASH, 0);
		} else if (objectData.object == 'DEADTH') {
			if (options.showGore) {
				for (var a = 0; a < 6; ++a) {
					addObject(new GameObject.Fur(), objectData.x + 6 + rnd(5), objectData.y + 6 + rnd(5), (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, ObjectAnimation.FUR, objectData.frame || 0);
				}
				for (var a = 0; a < 6; ++a) {
					addObject(new GameObject.Flesh(), objectData.x + 6 + rnd(5), objectData.y + 6 + rnd(5), (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, ObjectAnimation.FLESH_TRACE, 0);
				}
				for (var a = 0; a < 6; ++a) {
					addObject(new GameObject.Flesh(), objectData.x + 6 + rnd(5), objectData.y + 6 + rnd(5), (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, ObjectAnimation.FLESH_TRACE, 1);
				}
				for (var a = 0; a < 6; ++a) {
					addObject(new GameObject.Flesh(), objectData.x + 6 + rnd(5), objectData.y + 6 + rnd(5), (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, ObjectAnimation.FLESH_TRACE, 2);
				}
				for (var a = 0; a < 6; ++a) {
					addObject(new GameObject.Flesh(), objectData.x + 6 + rnd(5), objectData.y + 6 + rnd(5), (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, ObjectAnimation.FLESH_TRACE, 3);
				}
			}
		} else if (objectData.object == 'SPRING') {
			for (var i in objects) {
				var object = objects[i];
				if (object.anim == ObjectAnimation.SPRING) { // TODO: Add multiple spring support.
					object.resetAnimation();
				}
			}
		}
	}
	function onEventPlaySound(sound) {
		playSound(Sound[sound]);
	}

	function getLocalPlayer() {
		for (var i = 0; i < players.length; i++) {
			var player = players[i];
			if (player.local) {
				return player;
			}
		}
		return null;
	}
	function findPlayer(socketId) {
		for (var i = 0; i < players.length; i++) {
			var player = players[i];
			if (player.socket == socketId) {
				return player;
			}
		}
		return null;
	}

	function onInputActionChanged() {
		var player = getLocalPlayer();
		if (player == null) {
			return;
		}
		data = {
			socket: player.socket,
			actions: input.actions
		}
		ws.send('inputActionChanged', data);
	}

	function loadSprites() {
		menuBackground = new Image();	
		menuBackground.src = 'images/menu.png';

		rabbitAtlas = new Atlas();
		rabbitAtlas.load('images/rabbit.json.txt');

		objectsAtlas = new Atlas();
		objectsAtlas.load('images/objects.json.txt');

		numbersAtlas = new Atlas();
		numbersAtlas.load('images/numbers.json.txt');
	}

	function loadLevel() {
		level = new Level();
		level.load('images/level.json.txt', onLevelLoad);
	}

	function onLevelLoad() {
		for (var row = 0; row < level.ROW_COUNT; row++) {
			for (var column = 0; column < level.COLUMN_COUNT; column++) {
				if (level.tiles[row][column] == Tile.SPRING) {
					addObject(new GameObject.Spring(), column * level.TILE_WIDTH, row * level.TILE_HEIGHT, 0, 0, ObjectAnimation.SPRING, ObjectAnimation.SPRING.frame.length - 1);
				}
			}
		}
	}

	function playSound(sound) {
		if (sound == null) {
			return;
		}
		var clip = audioContext.createBufferSource();
		clip.connect(audioContext.destination);
		clip.buffer = sound;
		clip.noteOn(0);
	}

	function loadSound() {
		try {
			audioContext = new webkitAudioContext();
			loadSoundFile("sound/jump.wav", function (buffer) { Sound.JUMP = buffer; })
			loadSoundFile("sound/water-splash.wav", function (buffer) { Sound.WATER_SPLASH = buffer; })
			loadSoundFile("sound/deadth.wav", function (buffer) { Sound.DEADTH = buffer; })
			loadSoundFile("sound/spring.mp3", function (buffer) { Sound.SPRING = buffer; })
			loadMusic();
		}
		catch (e) {
			//console.warn('Web Audio API is not supported in this browser');
		}
	}
	function loadSoundFile(urlSound, onSoundLoad) {
		var soundRequest = new XMLHttpRequest();
		soundRequest.open("GET", urlSound, true);
		soundRequest.responseType = "arraybuffer";
		soundRequest.onload = function () {
			audioContext.decodeAudioData(soundRequest.response, function (buffer) {
				onSoundLoad(buffer);
			}, function (data) { });	
		};

		soundRequest.send();
	}


	function loadMusic() {
		if (!options.sound) {
			return;
		}
		loadSoundFile("sound/bump.mp3", function (buffer) {
			var mainNode = audioContext.createGainNode(0);
			mainNode.connect(audioContext.destination);

			var clip = audioContext.createBufferSource();
			clip.buffer = buffer;
			clip.gain.value = 0.5;
			clip.connect(mainNode);
			clip.loop = true;
			clip.noteOn(0);
		});
	}

	function initScreen() {
		screen = new Screen(world.width, world.height);
	}

	function update() {
		screen.clear();

		for (var i in players) {
			var player = players[i];
			screen.addSprite(rabbitAtlas.getSprite(player.image + 18 * player.id), Math.floor(player.x),  Math.floor(player.y));
		}
		for (var i in leftovers) {
			var leftover = leftovers[i];
			screen.addSprite(leftover.sprite, Math.floor(leftover.x), Math.floor(leftover.y));
		}

		updateObjects();
	
		if (menuMode) {
			screen.context.drawImage(menuBackground, 0, 0, world.width, world.height);
		} else if (level.ready) {
			screen.context.drawImage(level.backgroundImage, 0, 0, world.width, world.height);
		}

		screen.drawSprites();

		if (!menuMode && level.ready) {
			screen.context.drawImage(level.foregroundImage, 0, 0, world.width, world.height);
		}

		context.webkitImageSmoothingEnabled = false;
		context.drawImage(screen.canvas, 0, 0, world.width, world.height, 0, 0, screenSize.width, screenSize.height);
	  
		requestAnimFrame(update);
	}

	function updateObjects() {
		var cx = level.TILE_WIDTH, cy = level.TILE_HEIGHT;

		for (var i = objects.length - 1; i >= 0; i--) {
			var object = objects[i];
			// I'm not proud for this method. Refactor.
			if (object instanceof GameObject.Splash || object instanceof GameObject.Spring
				|| object instanceof GameObject.FleshTrace || object instanceof GameObject.Smoke) {
				object.x += object.x_add;
				object.y += object.y_add;
				object.ticks--;
				if (object.ticks <= 0) {
					object.frame++;
					if (object.frame >= object.anim.frame.length) {
						if (object.temporal) {
							objects.splice(i, 1);
							continue;
						}
						object.frame--;
					}
					object.ticks = object.anim.frame[object.frame].ticks;
					object.image = object.anim.frame[object.frame].image;
				}
				screen.addSprite(objectsAtlas.getSprite(object.image), Math.floor(object.x), Math.floor(object.y));
			} else if (object instanceof GameObject.Fur) {
				if (rnd(100) < 30) {
					addObject(new GameObject.FleshTrace(), object.x, object.y, 0, 0, ObjectAnimation.FLESH_TRACE, 0);
				}
				
				if (getTile(object.y, object.x) == Tile.NONE) {
					object.y_add += 0.75 * UNIT;
					if (object.y_add > 48 * UNIT) object.y_add = 48 * UNIT;
				} else if (getTile(object.y, object.x) == Tile.WATER) {
					if (object.x_add < 0) {
						object.x_add = Math.max(object.x_add, -16 * UNIT);
						object.x_add += 0.25 * UNIT;
						object.x_add = Math.min(object.x_add, 0);
					} else {
						object.x_add = Math.min(object.x_add, 16 * UNIT);
						object.x_add -= 0.25 * UNIT;
						object.x_add = Math.max(object.x_add, 0);
					}
					object.y_add += 0.25 * UNIT;
					object.y_add = Math.min(object.y_add, 16 * UNIT);
					object.y_add = Math.max(object.y_add, -16 * UNIT);
				}
				object.x += object.x_add;
				object.y += object.y_add;
				
				if (object.x < -5 || object.x > 405 || object.y > 260) { // TODO: fix constants
					objects.splice(i, 1);
					continue;
				}
				
				if (!Tile.isOneOf(getTile(object.y, object.x), [Tile.NONE, Tile.WATER])) {
					if (object.y_add < 0) {
						object.y = Math.floor((object.y + cy / 2) / cy) * cy;
						object.x_add /= 2;
						object.y_add = -object.y_add / 2;
					} else if (Tile.isOneOf(getTile(object.y, object.x),  [Tile.GROUND, Tile.SPRING])) {
						if (object.y_add > 32 * UNIT) {
							object.y = Math.floor((object.y + cy / 2) / cy) * cy - UNIT;
							object.x_add /= 2;
							object.y_add = -object.y_add / 2;
						} else {
							objects.splice(i, 1);
							continue;
						}
					} else if (getTile(object.y, object.x) == Tile.ICE) {
						object.y = Math.floor((object.y + cy / 2) / cy) * cy - UNIT;
						if (object.y_add > 32 * UNIT) {
							object.y_add = -object.y_add / 2;
						} else {
							object.y_add = 0;
						}
					}
				}
				if (Tile.isOneOf(getTile(object.y, object.x), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
					object.x = Math.floor((object.x + cx / 2) / cx) * cx;
					object.x_add = -object.x_add / 2;
				}
				if (object.x_add < 0 && object.x_add > -4 * UNIT)
					object.x_add = -4 * UNIT;
				if (object.x_add > 0 && object.x_add < 4 * UNIT)
					object.x_add = 4 * UNIT;
				var angle = Math.round((Math.atan2(-object.y_add, -object.x_add) + Math.PI) * 4 / Math.PI);

				if (angle < 0) angle += 8;
				if (angle < 0) angle = 0;
				if (angle > 7) angle = 7;
				screen.addSprite(objectsAtlas.getSprite(object.image + angle), Math.floor(object.x), Math.floor(object.y));
			} else if (object instanceof GameObject.Flesh) {
				if (rnd(100) < 30) {
					addObject(new GameObject.FleshTrace(), object.x, object.y, 0, 0, ObjectAnimation.FLESH_TRACE, object.frame);
				}

				if (getTile(object.y, object.x) == Tile.NONE) {
					object.y_add += 0.75 * UNIT;
					if (object.y_add > 48 * UNIT) object.y_add = 48 * UNIT;
				} else if (getTile(object.y, object.x) == Tile.WATER) {
					if (object.x_add < 0) {
						object.x_add = Math.max(object.x_add, -16 * UNIT);
						object.x_add += 0.25 * UNIT;
						object.x_add = Math.min(object.x_add, 0);
					} else {
						object.x_add = Math.min(object.x_add, 16 * UNIT);
						object.x_add -= 0.25 * UNIT;
						object.x_add = Math.max(object.x_add, 0);
					}
					object.y_add += 0.25 * UNIT;
					object.y_add = Math.min(object.y_add, 16 * UNIT);
					object.y_add = Math.max(object.y_add, -16 * UNIT);
				}
				object.x += object.x_add;
				object.y += object.y_add;

				if (object.x < -5 || object.x > 405 || object.y > 260) { // TODO: fix constants
					objects.splice(i, 1);
					continue;
				}

				if (!Tile.isOneOf(getTile(object.y, object.x), [Tile.NONE, Tile.WATER])) {
					if (object.y_add < 0) {
						object.y = Math.floor((object.y + cy / 2) / cy) * cy;
						object.x_add /= 2;
						object.y_add = -object.y_add / 2;
					} else if (Tile.isOneOf(getTile(object.y, object.x), [Tile.GROUND, Tile.SPRING])) {
						if (object.y_add > 32 * UNIT) {
							object.y = Math.floor((object.y + cy / 2) / cy) * cy - UNIT;
							object.x_add /= 2;
							object.y_add = -object.y_add / 2;
						} else {
							// Add some forever
							objects.splice(i, 1);
							continue;
						}
					} else if (getTile(object.y, object.x) == Tile.ICE) {
						object.y = Math.floor((object.y + cy / 2) / cy) * cy - UNIT;
						if (object.y_add > 32 * UNIT) {
							object.y_add = -object.y_add / 2;
						} else {
							object.y_add = 0;
						}
					}
				}
				if (Tile.isOneOf(getTile(object.y, object.x), [Tile.GROUND, Tile.ICE, Tile.SPRING])) {
					object.x = Math.floor((object.x + cx / 2) / cx) * cx;
					object.x_add = -object.x_add / 2;
				}
				if (object.x_add < 0 && object.x_add > -4 * UNIT)
					object.x_add = -4 * UNIT;
				if (object.x_add > 0 && object.x_add < 4 * UNIT)
					object.x_add = 4 * UNIT;

				screen.addSprite(objectsAtlas.getSprite(object.image), Math.floor(object.x), Math.floor(object.y));
			}
		}
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

	function addObject(object, x, y, x_add, y_add, anim, frame) {
		object.x = x;
		object.y = y;
		object.x_add = x_add;
		object.y_add = y_add;
		object.x_acc = 0;
		object.y_acc = 0;
		object.anim = anim;
		object.frame = frame;
		object.ticks = anim.frame[frame].ticks;
		object.image = anim.frame[frame].image;
		objects.push(object);
	}

	function addLeftover(name, sprite, x, y) {
		var leftover = {
			sprite: sprite,
			x: x,
			y: y
		}
		leftovers[name] = leftover;
	}

	function onWindowResizeHandler() {
		// Update the game size
		world.width = DEFAULT_WIDTH;
		world.height = DEFAULT_HEIGHT;

		screenSize.width = world.width * SCALE;
		screenSize.height = world.height * SCALE;

		// Resize the container
		container.width(screenSize.width);
		container.height(screenSize.height);

		// Resize the canvas
		canvas.width = screenSize.width;
		canvas.height = screenSize.height;

		// Determine the x/y position of the canvas
		var cx = Math.max((window.innerWidth - screenSize.width) * 0.5, 1);
		var cy = Math.max((window.innerHeight - screenSize.height) * 0.5, 1);

		// Update the position of the canvas
		container.css({
			left: cx,
			top: cy
		});

	}
	
	initialize();
	
})();
