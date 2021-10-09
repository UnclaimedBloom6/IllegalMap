# IllegalMap
Current Version: v1.3.2 (October 10)
<h3 style="color:red">WARNING: THIS MOD IS BANNABLE ON HYPIXEL. USE AT OWN RISK</h3>

<div class="row" align="center">
  <img src="https://i.imgur.com/kT8BeQN.png" height="250" />
  <img src="https://i.imgur.com/zHpmwzf.png" height="250"/>
  <img src="https://i.imgur.com/hqq6Drn.png" height="250"/>
</div>

IllegalMap is a [ChatTriggers](https://chattriggers.com) module that scans the blocks in a dungeon to generate a map that gets rendered on the player's screen. The module also uses data from the dungeon map in the player's 9th hotbar slot to get information about which rooms are unexplored, checkmarked rooms and player positions.

The module is highly configurable via the /dmap command. For the map to render in-game, the player must bind the "Refresh Map" keybind in their Controls -> Map menu. Pressing the key will begin scanning the blocks in the dungeon and generate the map. Alternatively, you can enable the Auto-Scan feature to do this automatically.

<img src="https://i.imgur.com/A6n9TEI.png" height=400/>

### Features:
- Dungeon Map
- Show rooms not normally visible to the player
- Show puzzle names
- Peek keybind to show more detail about each room
- Show player heads on map
  - Option to show names too
  - Show names under heads while holding spirit leaps
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
- Legit mode

## Legit Mode
Legit mode turns IllegalMap into a regular map. This option is enabled by default for versions 1.3.0 and higher.<br>
Enabling this option means that the player can no longer see unopened rooms, puzzles, total secrets and crypts and disables the some other features like the star mob and door ESPs. The score calculator remains the same, accuracy is not changed.<br>
NOTE: Despite this option being called "Legit Mode", it still requires the dungeon to be scanned since that's just how the map was coded and I'm too lazy to go and make a whole new system specifically for this. If the whole dungeon has not been scanned, then rooms may appear to be incorrect or simply not render at all.<br>
Enabling this feature does not make IllegalMap legal. Be careful.

## Installation
##### Prerequisites:
- Minecraft Java Edition
- Forge
- ChatTriggers

1. Download the .zip from github (Code -> Download ZIP)
2. Extract the folder
3. Open the folder until you get to the one named exactly "IllegalMap" (It should contain the index, settings, rooms and metadata files)
4. Move the "IllegalMap" folder into .minecraft/config/ChatTriggers/modules
5. Run '/ct load' in-game
6. Done!
