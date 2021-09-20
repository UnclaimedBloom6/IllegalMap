# IllegalMap

<h3 style="color:red">WARNING: THIS MOD IS BANNABLE ON HYPIXEL. USE AT OWN RISK</h3>

<div class="row" align="center">
  <img src="https://i.imgur.com/kT8BeQN.png" height="250" />
  <img src="https://i.imgur.com/zHpmwzf.png" height="250"/>
  <img src="https://i.imgur.com/hqq6Drn.png" height="250"/>
</div>

IllegalMap is a [ChatTriggers](https://chattriggers.com) module that scans the blocks in a dungeon to generate a map that gets rendered on the player's screen. The module also uses data from the dungeon map in the player's 9th hotbar slot to get information about which rooms are unexplored, checkmarked rooms and player positions.

The module is highly configurable via the /dmap command. For the map to render in-game, the player must bind the "Refresh Map" keybind in their Controls -> Map menu. Pressing the key will begin scanning the blocks in the dungeon and generate the map.

<img src="https://i.imgur.com/A6n9TEI.png" height=400/>

### Features:
- Dungeon Map
- Show rooms not normally visible to the player
- Show puzzle names
- Peek keybind to show more detail about each room
- Show player heads on map
  - Option to show names too
- Show checkmarks on map
  - Toggle between Off, Vanilla, Classic and New checkmarks
- Score Calculator
  - Show current dungeon score under map
  - Say in party chat when 300 score has been reached
  - Crypts display
  - Death penalty display
  - Puzzle counter
  - Total secrets
  - Found secrets
  - Remaining secrets
- Wither door ESP
- Darken unexplored rooms
- Hide map in boss or outside of dungeon
- RGB Border
- Add +10 score for Paul (Toggle)

## Installation
##### Prerequisites:
- Minecraft Java Edition
- Forge
- ChatTriggers

1. Extract the IllegalMap folder from the .zip file
2. Navigate to .minecraft/config/ChatTriggers/modules (Or do /ct files in-game) 
3. Drag and drop the extracted IllegalMap folder into the modules folder. The folder should be named 'IllegalMap' and contain the index.js, metadata.json, settings.js and rooms.json files.
4. Run the command '/ct load' in-game to reload ChatTriggers modules. If this is your first time using the mod, a message should appear in chat with some information about the module.
5. To configure the map, run the command '/dmap'
6. To make the map show in-game, go to Controls -> Map and bind the 'Refresh Map' keybind. Pressing the keybind should scan the dungeon and make the map show on the screen.
