# IllegalMap

##### Current Version: 5.2.4 for ChatTriggers 2.1.5 or higher
Last Updated: January 10

If you find a bug or want to make a suggestion, then join my Discord server: https://discord.gg/pykzREcAuZ
**I will not consider adding features that are too cheaty, pointless or are just unrelated to this module.**

## Warning: This module is bannable. Use at own risk.

<details>
    <summary>Installation</summary>

## Installation
##### Prerequisites:
    - Minecraft Java Edition
    - Forge
    - ChatTriggers

1. Download the latest .zip folder from the "Releases" tab on the right hand side of the screen.<br>
Click on the latest release, and download the file by clicking on "IllegalMap.X.X.X.zip".
<img src="https://i.imgur.com/iEpBhVF.png" width=30%/>
<img src="https://i.imgur.com/4wYewe0.png" width=30%/>

2. Nagivate to the directory that the folder was installed to (Downloads folder by default) and right click the folder -> Extract All.
<img src="https://i.imgur.com/4NLVpbp.png" width=30%/>
<img src="https://i.imgur.com/rMT5NSG.png" width=30%/>

3. Open the newly extracted folder (Not the .zip) and there will be another folder named "IllegalMap" directly inside of it.<br>
The IllegalMap folder should contain several other folders, as well as an index.js and a metadata.json file.
<img src="https://i.imgur.com/WXxLIuy.png" width=30%/>

4. Copy the "IllegalMap" folder and navigate to your .minecraft/config/ChatTriggers/modules folder.<br>
You can also run the command "/ct files" in-game and then open the "modules" folder and that will take you to the same place.<br>
If you already have other CT modules installed, they should all appear here.

5. Paste the "IllegalMap" folder you copied in step 3 into the modules folder.<br>
If you already have IllegalMap installed, then you don't need to worry about deleting the old version. Just paste it and when you are asked what to do with the duplicate files, just select "Replace" and that will let you keep your old configs as well.

6. Run "/ct load" in-game to refresh the ChatTriggers modules.<br>
If Minecraft is not already running, then the module will be loaded automatically the next time you launch the game so you can just carry on.

If you are having trouble installing the module, then please make sure you have read over the installation guide **THOROUGHLY** before coming to me for help.

</details>
<br>

IllegalMap is a [ChatTriggers](https://www.chattriggers.com) module that scans each Dungeon to give extra information to the user, like which rooms and puzzles are in the dungeon and exactly how many secrets there are before the dungeon even starts.
The map also shows the user other useful information like the total secrets, death penalties, crypts, mimic and the current score right underneath the map so that the user never needs to look at the tab list.
IllegalMap can be used on its own as your primary dungeon map, with significantly more features than any other map currently.
IllegalMap is highly customizable through the **/dmap** command.

<img src="https://i.imgur.com/yMl9bRa.png">

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
IllegalMap shows important info about the dungeon underneath the map (By default) including found-remaining-total secrets, crypts, minimum secrets, score pentalty for deaths, the current score and the mimic status (See screenshots from Dungeon Preview).
The dungeon info can also be configured to display seperately from the map, or remain under the map during clear and seperate upon entering boss.

<img src="https://i.imgur.com/UCrQTUA.png" width=50%/>

## Star Mob Radar
Finding star mobs can be hard, so IllegalMap has an option to show them all on the map similarly to player icons. This will show every star mob and miniboss currently in the player's render distance.

<img src="https://i.imgur.com/1LtnSpG.png" width=30%/>

The mob heads can be configured to have their border colors changed or just appear as small colored dots.

## Dungeon Logs
IllegalMap logs all of the dungeons that you scan. This lets the user view interesting statistics about the dungeon like the average number of secrets per floor, which puzzles or rooms appear the most (or least) or the average number of wither doors in each dungeon.
The command for Dungeon Logs is **"/dlogs \[floor]"**. If no floor is given, then it will show the statistics for every dungeon that you have logged.
The room percentages shown for rooms and puzzles show how the percentage of runs which that room appears in.
NOTE: This data is not sent anywhere. Only you have access to your own logs.

<img src="https://i.imgur.com/bZm5gvB.png"/>
<img src="https://i.imgur.com/u5zHymA.png"/>
<img src="https://i.imgur.com/ycCsaT6.png" width=40%/>

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
<img src="https://i.imgur.com/uji0Pyp.png">
- Automatically notifies of new IllegalMap updates

#### Score Calculator
- Customizable 270/300 score messages
- Client-side 270/300 score messages
- Auto detect mimic being found
- Announce mimic being killed
- Option to show seperately from the main map

##### Rooms
- Show which room contains the mimic (Floor 6-7)
<img src="https://i.imgur.com/dInXjX9.png" width=10%>

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
