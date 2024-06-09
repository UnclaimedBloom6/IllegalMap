# IllegalMap

If you find a bug or want to make a suggestion, then join my Discord server: https://discord.gg/pykzREcAuZ
**I will not consider adding features that are too cheaty, pointless or are just unrelated to this module.**


IllegalMap is a [ChatTriggers](https://www.chattriggers.com) module that scans each Dungeon to give extra information to the user, like which rooms and puzzles are in the dungeon and exactly how many secrets there are before the dungeon even starts.
The map also shows the user other useful information like the total secrets, death penalties, crypts, mimic and the current score right underneath the map so that the user never needs to look at the tab list.
IllegalMap can be used on its own as your primary dungeon map, with significantly more features than any other map currently.
IllegalMap is highly customizable through the **/dmap** command.

Note: Due to Hypixel's render distance limitation, not all of the dungeon will be visible from the starting room.

<img src="https://i.imgur.com/yMl9bRa.png">

# Installation
##### Prerequisites:
    - Minecraft Java Edition
    - Forge
    - ChatTriggers [Download](https://www.chattriggers.com)

1. Go to the [Releases](https://github.com/UnclaimedBloom6/IllegalMap/releases) page on Github and download the "IllegalMap.zip" file from the latest release.

2. In your Downloads folder, find the IllegalMap.zip file, right click it and click "Extract All" to extract its contents into a separate folder which will just be named "IllegalMap". This folder should contain an index.js file, a metadata.json file as well as the rest of the module's files. Click on the IllegalMap folder and hit Ctrl + C to copy it.

3. Go to your ChatTriggers modules folder. This will usually be located under .minecraft/config/ChatTriggers/modules, but you can find it easily by running the "/ct files" command in-game.

4. While in your modules folder, hit Ctrl + V to paste the IllegalMap folder. If you have an older version of IllegalMap installed, you might be prompted to replace old files with new ones, click replace.

5. If you already have Minecraft open, just run the "/ct load" command and it will reload all of your modules. If you don't have your game open currently, the module will be loaded once you launch it.

6. Run the "/dmap" command to open the config gui. If the gui does not open, double check that you've installed the module correctly. IllegalMap should appear in the "/ct modules" modules list. If it doesn't, then you haven't installed it correctly.
If IllegalMap is there, then run "/ct console js" to open the js console. If there is a big wall of red text, copy it and send it to me via Discord.


# Features

## Dungeon Preview
IllegalMap automatically scans the dungeon as soon as you enter it. After the dungeon has been fully scanned (And the chunks all loaded), it will stop scanning.
By default, all of the rooms before the dungeon begins will be shown clearly, but once the dungeon starts all of the unexplored rooms will be darkened so that they can be distinguished from already explored rooms.
There is an option to show room names and secrets all the time in the Config gui (/dmap), however if you want a cleaner looking map it is recommended to use the **"Peek Rooms"** keybind which will only show room names while the key is being held.

<div class="row" align="center">
    <img src="https://i.imgur.com/iujvHR2.png" width=30%/>
    <img src="https://i.imgur.com/azlvob4.png" width=30%/>
    <img src="https://i.imgur.com/lVIlFmj.png" width=30%/>
</div>

## Dungeon Info
IllegalMap shows useful info about the dungeon underneath the map (By default) including found-remaining-total secrets, crypts, minimum secrets (For S+), score pentalty for deaths, the current score and the mimic status (See screenshots from Dungeon Preview).
The dungeon info can also be configured to display seperately from the map, or remain under the map during clear and seperate upon entering boss.

<img src="https://i.imgur.com/UCrQTUA.png" width=50%/>

## Star Mob ESP and Radar
Scans for star mobs in the world. Can be configured to have boxes drawn around them in the world, or show their locations on the map as small icons.

<img src="https://i.imgur.com/1LtnSpG.png" width=30%/>

The mob heads can be configured to have their border colors changed or just appear as small colored dots.

## Dungeon Logs
IllegalMap logs all of the dungeons that you scan. This lets the user view interesting statistics about the dungeon like the average number of secrets per floor, which puzzles or rooms appear the most (or least) or the average number of wither doors in each dungeon.
The command for Dungeon Logs is **"/dlogsnew \[floor]"**. If no floor is given, then it will show the statistics for every dungeon that you have logged.
The room percentages shown for rooms and puzzles show how the percentage of runs which that room appears in.

<img src="https://i.imgur.com/yecwGr4.png"/>
<img src="https://i.imgur.com/QLjAaHm.png"/>

## Feature List
##### General
- Show unexplored dungeon rooms
- Show number of secrets in dungeon before the dungeon starts
- Automatically scans the dungeon
- Change background color and transparency of map
- Change map, head and checkmark scale
- Customizable map border
  - Smooth RGB option
  - Solid color
- Accurate player icons (Always links icons to correct player)
- Show player usernames on map
  - Option to show player names whilst holding spirit leaps
  - Show player ranks on the map
- Automatically notifies of new IllegalMap updates

#### Score Calculator
- Customizable 270/300 score messages
- Client-side 270/300 score messages
- Auto detect mimic being found
- Announce mimic being killed
- Option to show seperately from the main map

##### Rooms
- Show which room contains the mimic (Floor 6-7)
- Show room names
- Show room secrets
- Darken unexplored rooms
- Change wither door color on the map for visibility or aesthetics

#### Misc
- Star mob radar
  - Shows all of the loaded star mobs on your map
  - Togglable via /star
- Wither door ESP
- Star mob ESP
  - Also togglable via /staresp
