/**	Place tokens for members of a group on a scene.
 */
 
export class PlaceTokens {
	async placeTokens(groupToken) {
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

		for (let uuid of ids) {
			let actor = game.actors.get(uuid);
			
			tokens.push(await actor.getTokenDocument({ x: groupToken.x + deltax, y: groupToken.y + deltay}));
			deltax += canvas.scene.grid.sizeX;
			if (n % Math.trunc(ids.length / 2) == 0) {
				deltax = 0;
				deltay += canvas.scene.grid.sizeY;
			}
			n++;
		}
		canvas.scene.createEmbeddedDocuments('Token', tokens);
		canvas.scene.deleteEmbeddedDocuments('Token', [groupToken.id]);
		
	}
}

function renderTokenHUD(hud, html) {
  if (hud.object.document.actor.type != "group")
    return;

  html[0].querySelector('.control-icon[data-action="config"]').insertAdjacentHTML(
    "beforebegin",
    `
        <div class="control-icon" data-action="place-token">
          <i class="fas fa-users"></i>
        </div>
      `
  );

  const placeTokenButton = html.find('.control-icon[data-action="place-token"]');

  placeTokenButton.on("click", async (event) => {
    event.preventDefault();
	let pt = new PlaceTokens();
	pt.placeTokens(hud.object.document);
  });
}

Hooks.once("ready", () => {
  if (game.user.isGM) {
    Hooks.on("renderTokenHUD", renderTokenHUD);
  }
});
