# Place Tokens

This module has two major functions: placing groups of player character tokens on the map, and moving selected tokens to another spot.

## Character Groups

There are two ways to place character groups. 

### Using Group Actors

For DnD 5e and SWADE you can create a Group actor in the Actors tab that lists all the members of the group. Drag and drop the Group actor on the map. Right click the token to bring up the token HUD. Click the Users icon on the left side of the token (multiple people). The Group actor will be replaced with all members of the group.

### Using the Player Characters Folder

This method is for game systems that don't have a Group actor to list members of a group. It's also useful for any system if you just want to plop the player characters down with DnD and SWADE without having to drag the Group actor to the scene.

First create a folder in the Actors tab. The default name is Player Characters, but you can name it anything you want. If you choose a different name you must set that name in the Player Character Folder setting in the Place Tokens section of the Settings.

To place the group move the cursor to the location on the scene where you want the tokens to appear. Then press the "Shift+G" key. Tokens for the actor will be placed at that location.

You can change this to another key in the Place Tokens section of Configure Controls.

By default all player character and NPC actors in the Player Characters folder are placed with the group. To omit NPCs, check the PCs Only checkbox in the Place Tokens section of the Settings. Actors in subfolders of the Player Characters folder are not placed.

## Move Tokens

This allows you to move characters to another location in the scene without having to drag them. This is helpful in very large scenes when you're dragging to a spot on the map that's not currently visible.

First select all the tokens you want to move (Shift+click them or use a selection rectangle). Move the cursor to the location to which you wish to move the tokens. Press the "M" key. The tokens will be moved to that location, maintaining their relative positions. 

This key can be changed in the Place Tokens section of Configure Controls.

## Gather Player Tokens

This gathers all the player character tokens from across the map to a single location. Press the "G" key and all tokens of type "character" will be moved to the current mouse location.

## Gather Friendly Tokens

This gathers all tokens with the "friendly" disposition from across the map to a single location. Press the "Alt+G" keys and all friendly tokens will be moved to the current mouse location.

## Default Movement: Blink

This setting will set the movement for tokens created on the scene to "blink" (teleport) instead of the default value, which is walk. This removes the extremely slow dragging movement of the other movement modes. However, if you wish to use the different movement penalties defined in regions you'll need to select the desired movement mode on the token. Be sure to refresh the browser after changing this value.