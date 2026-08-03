/**	Place tokens for members of a group on a scene.
 */
 

/**	Place the tokens for actors listed in ids at the location specified.
 */

async function createTokens(x, y, ids) {
	let tokens = [];
	let deltax = 0;
	let deltay = 0;
	let n = 1;

	for (let uuid of ids) {
		let actor = game.actors.get(uuid);
		
		tokens.push(await actor.getTokenDocument({
			x: x + deltax, y: y + deltay, 
			level: canvas.level._id, 
			elevation: canvas.level.elevation.bottom
		}));
		deltax += canvas.scene.grid.sizeX;
		if (n % Math.trunc(ids.length / 2) == 0) {
			deltax = 0;
			deltay += canvas.scene.grid.sizeY;
		}
		n++;
	}
	canvas.scene.createEmbeddedDocuments('Token', tokens);
}


/**	Replace the group token with the members.
 */

async function placeTokens(groupToken) {
	let tokens = [];
	let deltax = 0;
	let deltay = 0;
	let n = 1;
	
	let ids = [];
	if (game.system.id == 'dnd5e') {
		for (let uuid of groupToken.actor.system.members.ids)
			ids.push(uuid);
	} else {
		for (const [key, value] of groupToken.actor.system.members) {
			let [str, uuid] = key.split('.');
			ids.push(uuid);
		}
	}
	createTokens(groupToken.x, groupToken.y, ids);		
	canvas.scene.deleteEmbeddedDocuments('Token', [groupToken.id]);
}

function renderTokenHUD(hud, html) {
  if (hud.object.document.actor.type != "group")
    return;

  html.querySelector('.control-icon[data-action="config"]').insertAdjacentHTML(
    "beforebegin",
    `
        <div class="control-icon" data-action="place-token">
          <i class="fas fa-users"></i>
        </div>
      `
  );

  const placeTokenButton = html.querySelector('.control-icon[data-action="place-token"]');

  placeTokenButton.addEventListener("click", async (event) => {
    event.preventDefault();
	placeTokens(hud.object.document);
  });
}

Hooks.once("ready", () => {
  if (game.user.isGM) {
    Hooks.on("renderTokenHUD", renderTokenHUD);
  }
});


function placeGroup() {
	// Get characters from the Player characters folder.
	const pcfolder = game.settings.get('place-tokens', 'pcfolder');
	const pcsonly = game.settings.get('place-tokens', 'pcsonly');

	let folder = game.folders.find((f) => f.name == pcfolder && f.type == 'Actor');
	if (!folder) {
		ui.notifications.warning(`No folder named ${pcfolder} found in the Actors tab. Cannot place group.`);
		return;
	}

	let uuids = [];
	for (let actor of game.actors) {
		if (actor?.folder?._id == folder._id) {
			if (actor.type == 'vehicle')
				continue;
			if (actor.type == 'character' || !pcsonly && actor.type == 'npc')
				uuids.push(actor._id);
		}
	}

	if (uuids.length <= 0)
		return;
	
	// Align tokens to grid.

	let x = Math.floor(canvas.mousePosition.x / canvas.grid.size) * canvas.grid.size;
	let y = Math.floor(canvas.mousePosition.y / canvas.grid.size) * canvas.grid.size;
	createTokens(x, y, uuids);
}


/**	Gather player tokens or all tokens with friendly disposition if flag set.
 */

function gatherTokens(allFriendly) {
	let playerTokens;
	if 	(allFriendly)
		playerTokens = canvas.tokens.documentCollection.filter(t => t.disposition == 1);
	else
		playerTokens = canvas.tokens.documentCollection.filter(t => t?.actor?.type == 'character');
	if (playerTokens.length == 0) {
		ui.notifications.notify("No player tokens found on scene.");
		return;
	}

	let startx = Math.floor(canvas.mousePosition.x / canvas.grid.size) * canvas.grid.size;
	let y = Math.floor(canvas.mousePosition.y / canvas.grid.size) * canvas.grid.size;

	let i = 0;
	let x = startx;
	let elevation = canvas.level.elevation.bottom;

	for (let token of playerTokens) {
		token.move([{x: x, y: y, level: canvas.level._id, elevation: elevation}], 
			{animate: false, constrainOptions: {ignoreWalls: true}});
		x += canvas.grid.size;
		if (++i % 3 == 0) {
			x = startx;
			y += canvas.grid.size;
		}
	}
}

function moveSelected() {
	if (canvas.tokens.controlled.length < 1)
		return ui.notifications.notify('No tokens selected.');
	const deltaX = canvas.mousePosition.x - canvas.tokens.controlled[0].x;
	const deltaY = canvas.mousePosition.y - canvas.tokens.controlled[0].y;
	const elevation = canvas.level.elevation.bottom;

	for (let token of canvas.tokens.controlled) {
		let gridx = Math.floor((token.x + deltaX) / canvas.grid.size);
		let gridy = Math.floor((token.y + deltaY) / canvas.grid.size);
		const x = gridx * canvas.grid.size;
		const y = gridy * canvas.grid.size;
		//token.document.update({x: gridx * canvas.grid.size, y: gridy * canvas.grid.size}, {animate: false});
		const waypoints = [{x: x, y: y}];
		token.document.move([{x: x, y: y, elevation: elevation, level: canvas.level._id}],
			{animate: false, constrainOptions: {ignoreWalls: true}});
	}
}

Hooks.on("init", function() {
	game.keybindings.register("place-tokens", "moveTokens", {
	  name: "Move Selected Tokens",
	  hint: "When this key is pressed the selected tokens will be moved to the current mouse location.",
	  editable: [
		{
		  key: 'KeyM'
		}
	  ],
	  onDown: keybind => { moveSelected(); },
	  restricted: true,             // Restrict this Keybinding to gamemaster only?
	  precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});

	game.keybindings.register("place-tokens", "gatherPlayerTokens", {
	  name: "Gather Player Tokens",
	  hint: "When this key is pressed all player tokens in the scene will be moved to the current mouse location.",
	  editable: [
		{
		  key: 'KeyG'
		}
	  ],
	  onDown: keybind => { gatherTokens(false); },
	  restricted: true,             // Restrict this Keybinding to gamemaster only
	  precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});
	game.keybindings.register("place-tokens", "gatherFriendlyTokens", {
	  name: "Gather Friendly Tokens",
	  hint: "When this key is pressed all friendly tokens in the scene will be moved to the current mouse location.",
	  editable: [
		{
		  key: 'KeyG',
		  modifiers: ["Alt"]
		}
	  ],
	  onDown: keybind => { gatherTokens(true); },
	  restricted: true,             // Restrict this Keybinding to gamemaster only
	  precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});

	game.keybindings.register("place-tokens", "placeGroup", {
	  name: "Place Player Tokens",
	  hint: "When this key is pressed tokens for the player characters in the Player Characters folder will be placed at the cursor location.",
	  editable: [
		{
		  key: 'KeyG',
		  modifiers: ["Shift"]
		}
	  ],
	  onDown: keybind => { placeGroup(); },
	  restricted: true,             // Restrict this Keybinding to gamemaster only?
	  precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});

	game.settings.register('place-tokens', 'pcfolder', {
	  name: 'Player Character Folder',
	  hint: 'Name of the folder in the Actors tab containing the characters to be placed with the Place Group function.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: String,       // Number, Boolean, String, Object
	  default: "Player Characters"
	});
	game.settings.register('place-tokens', 'pcsonly', {
	  name: 'PCs Only',
	  hint: 'Only place player characters -- ignore NPCs in the Player Characters folder.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Boolean,       // Number, Boolean, String, Object
	  default: false
	});
	game.settings.register('place-tokens', 'blink', {
	  name: 'Default Movement: Blink',
	  hint: 'Default movement mode: blink/teleport when tokens are created on the canvas.',
	  scope: 'world',     // "world" = sync to db, "client" = local storage
	  restricted: true,   // GM sets only
	  config: true,       // false if you dont want it to show in module config
	  type: Boolean,       // Number, Boolean, String, Object
	  default: true
	});
	game.placeTokens = {
		pushToken: pushToken
	};
});

// Make default movement action teleport instead of walk.

async function createToken(tokdoc, action, id) {
	if (id == game.user.id)
		await tokdoc.update({movementAction: 'blink'});
}

Hooks.once('init', async function () {
	if (game.settings.get('place-tokens', 'blink'))
		Hooks.on('createToken', createToken);
});


async function pushToken(event, token, destination) {
	/*	Push a token to one of the shapes defined in the destination
	 *	region. Avoid other tokens.
	 */
	 
	function findToken(scene, x, y) {
		for (const t of scene.tokens) {
			const tw = t.width * scene.grid.sizeX;
			const th = t.height * scene.grid.sizeY;
			if (t.x <= x && t.x + tw >= x && t.y <= y && t.y + th >= y)
				return t;
		}
		return null;
	}

	const parts = destination.split(".")
	const sceneId = parts[1];
	const scene = await fromUuid('Scene.' + sceneId)
	if (!token || !token.actor)
		return;
	const actor = token.actor;
	const region = await fromUuid(destination);
	if (!region)
		return ui.notifications.warn(`The region ${destination} does not exist.`);
	
	let userId;
	for (const owner in actor.ownership)
	  if (owner != 'default')
		userId = owner;
	
	if (region.shapes.length == 0)
		return ui.notifications.warn(`The region ${destination} has no defined shapes.`);

	let x, y;
	// Default to first shape in the region.
	const first = region.shapes[0];
	switch (first.type) {
	case 'rectangle':
	case 'ellipse':
		x = first.x;
		y = first.y;
		break;
	case 'polygon':
		x = first.points[0];
		y = first.points[1];
		break;
	}

	let found = false;
	for (const shape of region.shapes) {
		switch (shape.type) {
		case 'rectangle':
		case 'ellipse':
			if (!findToken(scene, shape.x + token.w/2, shape.y + token.h/2)) {
				x = shape.x;
				y = shape.y;
				found = true;
				break;
			}
			break;
		case 'polygon':
			if (!findToken(scene, shape.points[0] + token.w/2, shape.points[1] + token.h/2)) {
				x = shape.points[0];
				y = shape.points[1];
				found = true;
				break;
			}
			break;
		}
		if (found)
			break;
	}

	const user = game.users.get(userId);
	const newToken = await actor.getTokenDocument({ x: x, y: y});
	await scene.createEmbeddedDocuments('Token', [newToken]);
	
	if (user) {
		game.socket.emit("pullToScene", sceneId, user.id);
	}
	await canvas.scene.deleteEmbeddedDocuments("Token", [token.id]);
}
