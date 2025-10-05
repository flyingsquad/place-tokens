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
		
		tokens.push(await actor.getTokenDocument({ x: x + deltax, y: y + deltay}));
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


Hooks.on("init", function() {
	game.keybindings.register("place-tokens", "moveTokens", {
	  name: "Move Selected Tokens",
	  hint: "When this key is pressed the selected tokens will be moved to the current mouse location.",
	  editable: [
		{
		  key: 'KeyM'
		}
	  ],
	  onDown: keybind => {
		if (canvas.tokens.controlled.length < 1)
			return;
		const deltaX = canvas.mousePosition.x - canvas.tokens.controlled[0].x;
		const deltaY = canvas.mousePosition.y - canvas.tokens.controlled[0].y;
		for (let token of canvas.tokens.controlled) {
			let gridx = Math.floor((token.x + deltaX) / canvas.grid.size);
			let gridy = Math.floor((token.y + deltaY) / canvas.grid.size);
			token.document.update({"x": gridx * canvas.grid.size, "y": gridy * canvas.grid.size}, {animate: false});
		}
	  },
	  restricted: true,             // Restrict this Keybinding to gamemaster only?
	  precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
	});

	game.keybindings.register("place-tokens", "placeGroup", {
	  name: "Place Player Characters",
	  hint: "When this key is pressed tokens for the player characters in the Player Characters folder will be placed at the cursor location.",
	  editable: [
		{
		  key: 'KeyG'
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

});
