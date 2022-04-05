# IllegalMap
Current Version: v3.2.2 (April 5)

#### NOTE: IllegalMap versions 3.0 or higher will only work with ChatTriggers 2.X. If you are still using ChatTriggers 1.3.2 or lower, use IllegalMap 2.X versions.

### WARNING: THIS MOD IS BANNABLE ON HYPIXEL. USE AT OWN RISK

<div class="row" align="center">
  <img src="https://i.imgur.com/X6BeD16.png" height="250" />
  <img src="https://i.imgur.com/D8iSbGU.png" height="250"/>
  <img src="https://i.imgur.com/s2yV3GH.png" height="250"/>
</div>

IllegalMap is a [ChatTriggers](https://chattriggers.com) module that scans the blocks in a dungeon to generate a map that gets rendered on the player's screen. The module also uses data from the dungeon map in the player's 9th hotbar slot to get information about which rooms are unexplored, checkmarked rooms and player positions which means that it can be used as your primary dungeon map.

The module is highly configurable via the /dmap command. For the map to render in-game, the player must bind the "Refresh Map" keybind in their Controls -> Map menu. Pressing the key will begin scanning the blocks in the dungeon and generate the map. Alternatively, you can enable the Auto-Scan feature to do this automatically.

<img src="https://i.imgur.com/OBCf8l3.png" height=400/>

## Installation
##### Prerequisites:
- Minecraft Java Edition
- Forge
- ChatTriggers

1. Download the .zip from github (Code -> Download ZIP)
2. Extract the folder
3. Open the folder until you get to the one named exactly "IllegalMap" (It should contain the index, settings, rooms and metadata files)
4. Move the "IllegalMap" folder into .minecraft/config/ChatTriggers/modules
5. If your folder is not named EXACTLY "IllegalMap" then it WILL NOT WORK. PLEASE STOP DMING ME ABOUT THIS. READ.
6. Run '/ct load' in-game
7. Done!

### Features:
- Shows the user every room in the Dungeon
- Can be used as a stand alone map
- Tons of customization options
- Reliable player icons
    - Option to mark where a player died.
- Major performance improvements over 1.X
- Show the username of each player under their map icon
- Legit Mode
    - Hides unexplored rooms.
    - Functions like a regular dungeon map, with an accurate score calc.
    - Total secrets available after at least one has been found (Calculates using new % of secrets found from tab).
    - Room names of explored rooms can be seen.
    - Player icons still 100% reliable.
- Auto Scan automatically scans the dungeon upon warping
- Chat Info shows the user useful information about the dungeon after the dungeon has been fully scanned
- Update Checker
- Show the names of all rooms on the map
    - Change the color of the room names on the map.
    - Show only important room names on the map (Puzzles, Trap).
    - Peek keybind to show room names only when the keybind + LSHIFT is being held down.
    - Replace checkmarks with the number of secrets in the room, can change color depending on the checkmark eg green check = green text.
- Darken unexplored rooms to make them easier to differentiate between already explored rooms
- Esp features
    - Change the color of wither doors so that they can be seen more easily.
    - Star mob esp draws a box around starred mobs and minibosses to find mobs more easily.
    - Wither door esp draws a box around wither doors and the blood door.
- Accurate score calculator
    - Option to say a customizable message in party chat when 300 score has been reached.
    - Option to say a customizable message in party chat when a mimic has been revealed.
    - Show which room the mimic is in.
    - Paul option to add 10 bonus score onto each run.
        - Option to toggle always on, always off or Auto Detect.
    - Spirit pet auto detection for the first player to die. (Use /spirits to see which players have a spirit pet).
    - Score calculator can be set to 'seperate' and the main map can be disabled so only the score calculator is shown. Still works as normal.
- Discord rich presence
    - Shows which room you are currently in as well as how many secrets have been found in it .
    - Shows which floor you are currently playing.
- Dungeon Logs
    - Logs all of the dungeons you've joined so that you can go and view the average number of secrets, wither doors, most and least common rooms and more.
- Radar
    - Shows all of the starred mobs within render distance.

## Discord Rich Presence
<img src="https://i.imgur.com/grwsWh0.png" height="100"/>
<img src="https://i.imgur.com/ltywZua.png" height="100"/>


## Legit Mode
Legit mode turns IllegalMap into a regular map. This option is enabled by default for versions 1.3.0 and higher.<br>
Enabling this option means that the player can no longer see unopened rooms and puzzles as well as disables some other features like the star mob and door ESPs. The score calculator remains the same, accuracy is not changed as it obtains all necessary information from the scoreboard and tab list.<br>
NOTE: Despite this option being called "Legit Mode", it still requires the dungeon to be scanned.<br>
Enabling this feature does not make IllegalMap legal. Be careful.
<div class="row" align="center">
  <img src="https://i.imgur.com/WD5DX0D.png" height="400"/>
  <img src="https://i.imgur.com/2pefIJD.png" height="400"/>
  </div>

