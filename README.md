# IllegalMap

##### Current Version: 4.0.0
Last Updated: May 28

If you find a bug or want to make a suggestion, then join my Discord server: https://discord.gg/pykzREcAuZ

## Warning: This module is bannable. Use at own risk.

#### NOTE: IllegalMap versions 3.0 and higher require ChatTriggers 2.0 or higher to work.

If you find any bugs or have suggestions for new features then DM me on Discord: Unclaimed#6151.
**I will not consider adding features that are too cheaty, pointless or are just unrelated to this module.**

<details>
    <summary>Installation</summary>

## Installation
##### Prerequisites:
    - Minecraft Java Edition
    - Forge
    - ChatTriggers

1. Download the .zip from github (Code -> Download ZIP). Should be called something like "IllegalMap-main.zip".
    
<img src="https://i.imgur.com/ZTY3vtI.png">
<img src="https://i.imgur.com/EXe4kIQ.png">

2. Extract the folder. (Right click -> Extract All)
    
<img src="https://i.imgur.com/igNciyz.png">

3. Open the folder until you get to the one named exactly "IllegalMap" (It should contain the index.js file, metadata and a couple of folders).
    
<img src="https://i.imgur.com/NiarnzG.png">
    
Inside the folder:
    
<img src="https://i.imgur.com/1fqKOaV.png">

4. Move the "IllegalMap" folder into .minecraft/config/ChatTriggers/modules

5. If your folder is not named EXACTLY "IllegalMap" then it WILL NOT WORK. If your folder is not named exactly "IllegalMap" then go back to step 3.
    
Correct <img src="https://i.imgur.com/laoUDZP.png">
    
Incorrect <img src="https://i.imgur.com/tot1Kvr.png">

6. Run '/ct load' in-game

7. Done!

If you encounter issues regarding installing the mod then I WILL NOT help you. Unless there is an issue with the mod itself, please do not ask me for help. 
</details>
<br>

IllegalMap is a [ChatTriggers](https://www.chattriggers.com) module that scans each Dungeon to give extra information to the user, like which rooms and puzzles are in the dungeon and exactly how many secrets there are before the dungeon even starts.
The map also shows the user other useful information like the total secrets, death penalties, crypts, mimic and the current score right underneath the map so that the user never needs to look at the tab menu.
IllegalMap can be used on its own as your primary dungeon map, with significantly more features than any other map currently.
IllegalMap is highly customizable through the **/dmap** command.

<div class="row" align="center">
    <img src="https://i.imgur.com/GpwfFpL.png" width=30%/>
    <img src="https://i.imgur.com/Eh5TnqO.png" width=30%/>
    <img src="https://i.imgur.com/PCPSqP2.png" width=30%/>
</div>
<img src="https://i.imgur.com/cCGOPNg.png">

## Legit Mode
**NOTE: Legit Mode has been discontinued will not be worked on in the future. If you are looking for a legit map, then I would recommend installing [LegalMap](https://www.chattriggers.com/modules/v/LegalMap)** (/ct import LegalMap).

**Legit mode is enabled by default.**
Although the risk of getting banned for using this module is virtually zero, some people still prefer not being able to see the rest of the dungeon.
When Legit Mode is enabled, the user won't be able to see unopened rooms or have access to the other cheaty parts of the module (Like Radar, dungeon preview etc). **The score calculator will still work exactly the same since it doesn't require any information that isn't normally available to the player to function.**
Due to how IllegalMap was made, the dungeon still needs to be scanned even for legit mode to work. However, the information the module gains from this scan is only used to imitate the hotbar map and render a vanilla-looking map on the screen.

<div class="row" align="center">
    <img src="https://i.imgur.com/4ezI5fE.png" width=30%>
    <img src="https://i.imgur.com/3voGZzu.png" width=30%>
</div>

NOTE: Although playing with Legit Mode should be streamer safe, it does not make IllegalMap legal. If you don't want to take the risk streaming with the module active, then just use another map.

## Dungeon Preview
IllegalMap automatically scans the dungeon as soon as you enter it. After the dungeon has been fully scanned (And the chunks all loaded), it will stop scanning.
By default, all of the rooms before the dungeon begins will be shown clearly, but once the dungeon starts all of the unexplored rooms will be darkened so that they can be distinguished from already explored rooms.
There is an option to show room names and secrets all the time in the Config gui (/dmap), however if you want a cleaner looking map it is recommended to use the **"Peek Rooms"** keybind which will only show room names while the key is being held.

<div class="row" align="center">
    <img src="https://i.imgur.com/8EXPemE.png" width=30%/>
    <img src="https://i.imgur.com/MkI8r44.png" width=30%/>
    <img src="https://i.imgur.com/BBBWLCi.png" width=30%/>
</div>

## Score Calculator
IllegalMap also comes with an accurate score calculator.
The score calculator works by using numbers from the tab list and scoreboard (Like the percentage of secrets found and rooms cleared) to calculate the score of the dungeon. Originally, the score calculator went off of the number of secrets of all of the scanned rooms, however after Hypixel added the ability to see the exact number of secrets in the dungeon after the first secret has been found, the score calculator is fully legit.
There is also an option to auto-detect players with a spirit pet so that only one score is removed when a player with a spirit pet dies.
The Dungeon Info can be changed to be displayed seperately from the main map as shown below:

<img src="https://i.imgur.com/VieYH5X.png" width=50%/>

## Star Mob Radar
Finding star mobs can be hard, so IllegalMap has an option to show them all on the map similarly to player icons. This will show every star mob and miniboss currently in the player's render distance.

<img src="https://i.imgur.com/1LtnSpG.png" width=30%/>

The mob heads can be configured to have their border colors changed or just appear as small colored dots.

## Discord Rich Presence
Discord RPC is cool so I added it. It shows which floor you are currently playing, the dungeon's time as well as the room you're currently in with the number of secrets.
IllegalMap's Discord RPC is powered by [Vatuu's Discord RPC Library](https://github.com/Vatuu/discord-rpc).

<img src="https://i.imgur.com/grwsWh0.png"/>
<img src="https://i.imgur.com/ltywZua.png"/>

## Dungeon Logs
IllegalMap logs all of the dungeons that you scan. This lets the user view interesting statistics about the dungeon like the average number of secrets per floor, which puzzles or rooms appear the most (or least) or the average number of wither doors in each dungeon.
The command for Dungeon Logs is **"/dlogs \[floor]"**. If no floor is given, then it will show the statistics for every dungeon that you have logged.
NOTE: This data is not sent anywhere. Only you have access to your own logs.

<img src="https://i.imgur.com/bZm5gvB.png"/>
<img src="https://i.imgur.com/u5zHymA.png"/>
<img src="https://i.imgur.com/F7ezfCL.png" width=40%/>

## Feature List
##### General
- Legit Mode
  - Hides information which is not normally available to the player.
  - Disables other cheaty features.
- Show unexplored dungeon rooms
- Show number of secrets in dungeon before the dungeon starts
- Automatically scans the dungeon
- Print info about the dungeon after it has been scanned in chat
- Change background color and transparency of map
- Change map scale
- Customizable map 
  - Smooth RGB option
  - Solid color
- 100% accurate player icons (Always links icons to correct player)
  - Option to enable/disable black border around heads (Like SBA's map)
- Show player usernames on map
  - Option to show player names whilst holding spirit leaps
  - Show player ranks on the map
<img src="https://i.imgur.com/uji0Pyp.png">
- Automatically notifies of new IllegalMap updates
- Discord RPC
  - Shows current room and floor on your discord activity

#### Score Calculator
- Customizable 270/300 score messages
- Client-side 270/300 score messages
- Auto detect mimic being killed
- Announce mimic being killed
- Paul auto-detection (Or manual toggle)
- Auto-detect spirit pet (Or manual toggle)
- Option to show seperately from the main map

##### Rooms
- Show which room contains the mimic (Floor 6-7)
<img src="https://i.imgur.com/dInXjX9.png" width=10%>
- Show room names
- Show room secrets
  - Option to show secrets instead of checkmarks (Color changes depending on room clear)
- Darken unexplored rooms
- Change wither door color on the map for visibility or aesthetics

#### Misc
- Star mob radar
  - Shows all of the loaded star mobs on your map
  - Togglable via /star
- Wither door ESP
- Star mob ESP
  - Also togglable via /staresp
