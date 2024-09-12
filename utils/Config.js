import Settings from "../../Amaterasu/core/Settings"
import DefaultConfig from "../../Amaterasu/core/DefaultConfig"

// Funny Guis here
export const mapEditGui = new Gui()
export const editDungeonInfoGui = new Gui()
export const borderScaleGui = new Gui()

const applyChanges = (/** @type {Settings} */setting) => {
    const scheme = setting.getHandler().getColorScheme()
    const gui = setting.AmaterasuGui

    // Setup scheme
    scheme.Amaterasu.background.color = setting.settings.bgColor
    setting.handler._setColorScheme(scheme)

    // Setup Gui
    gui.background.x = setting.settings.x
    gui.background.y = setting.settings.y
    gui.background.width = setting.settings.width
    gui.background.height = setting.settings.height

    // Apply changes
    setting.apply()
}

const config = new DefaultConfig("IllegalMap", "data/settings.json")
.addTextParagraph({
    category: "General",
    configName: "_paragraphone",
    title: `&6&l&nIllegalMap ${JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version}`,
    description: "&bNote: An API key is required for some features. To set it, run &a/api &anew.\n&bBy UnclaimedBloom6",
    centered: true,
    subcategory: ""
})
.addButton({
    category: "General",
    configName: "MyDiscord",
    title: "&3&lMy Discord Server",
    description: "Join if you want to talk to me directly, report a bug or want to make a suggestion.",
    subcategory: "",
    onClick() {
        java.awt.Desktop.getDesktop().browse(new java.net.URI("https://discord.gg/pykzREcAuZ"))
    }
})
.addSwitch({
    category: "General",
    configName: "enabled",
    title: "&aMap Enabled",
    description: "Toggle the entire module.",
    value: true,
    subcategory: ""
})
.addButton({
    category: "General",
    configName: "MoveMap",
    title: "&aEdit Map",
    description: "Move the map, change the map scale, head scale etc.",
    subcategory: "",
    onClick() {
        mapEditGui.open()
    }
})
.addColorPicker({
    category: "General",
    configName: "backgroundColor",
    title: "Background Color",
    description: "Change the background color and transparency of the map.",
    value: [0, 0, 0, 179],
    subcategory: ""
})
.addSwitch({
    category: "General",
    configName: "hideInBoss",
    title: "&aHide In Boss",
    description: "Hides the map after you enter the boss room.\n&cNOTE: If another mod is hiding boss messages then this might not work.",
    subcategory: ""
})
.addSwitch({
    category: "General",
    configName: "chatInfo",
    title: "Chat Info",
    description: "Show info about the dungeon in chat after it has been scanned.",
    subcategory: "Scanning"
})
.addSwitch({
    category: "General",
    configName: "scoreMilestones",
    title: "&bScore Milestones",
    description: "Tells you when 270/300 score has been reached (Does not send a message in party chat).",
    value: true,
    subcategory: "Score Milestones"
})
.addSwitch({
    category: "General",
    configName: "announce300",
    title: "&aAnnounce 300 Score",
    description: "Announces in party chat when 300 score has been reached.",
    subcategory: "Score Milestones"
})
.addTextInput({
    category: "General",
    configName: "announce300Message",
    title: "&a300 Score Message",
    description: "The message to send in party chat when 300 score has been reached (If announce 300 is enabled).",
    value: "300 Score Reached!",
    placeHolder: "300 Score Reached!",
    subcategory: "Score Milestones"
})
.addSwitch({
    category: "General",
    configName: "announce270",
    title: "&eAnnounce 270 Score",
    description: "Announces in party chat when 270 score has been reached.",
    subcategory: "Score Milestones"
})
.addTextInput({
    category: "General",
    configName: "announce270Message",
    title: "&e270 Score Message",
    description: "The message to send in party chat when 270 score has been reached (If announce 270 is enabled).",
    value: "270 Score Reached!",
    placeHolder: "270 Score Reached!",
    subcategory: "Score Milestones"
})
.addSwitch({
    category: "General",
    configName: "announceMimic",
    title: "&eAnnounce Mimic Dead",
    description: "Announce in party chat when the mimic has been killed.",
    subcategory: "Mimic"
})
.addTextInput({
    category: "General",
    configName: "announceMimicMessage",
    title: "&cMimic Killed Message",
    description: "If Announce Mimic Dead is enabled, say this message in party chat when the mimic has been killed near you.",
    value: "Mimic Dead!",
    placeHolder: "Mimic Dead!",
    subcategory: "Mimic"
})
.addTextInput({
    category: "General",
    configName: "extraMimicMessages",
    title: "&cMimic Detection Messages",
    description: "If one of your party members has a mimic killed message which is not detected by the mod already, add it here separated with a comma.\nEg: mimic dead, mimic killed, breefing killed, and so on...",
    value: "",
    placeHolder: "",
    subcategory: "Mimic"
})
.addDropDown({
    category: "General",
    configName: "dungeonInfo",
    title: "&dDungeon Info",
    description: "Change where the dungeon info is rendered.\nThe dungeon into is the text under the map which shows the secrets, crypts etc.\nIf 'Seperate in Boss', then the dungeon info will be under the map during the dungeon then become seperate in boss. Useful if 'Hide in Boss' is enabled.",
    options: ["Under Map","Separate","Hidden","Seperate in Boss"],
    value: 0,
    subcategory: "Dungeon Info"
})
.addButton({
    category: "General",
    configName: "EditDungeonInfo",
    title: "&dEdit Dungeon Info",
    description: "If Dungeon Info is set to 'Separate' then this will let you move it and change the scale.",
    subcategory: "Dungeon Info",
    placeHolder: "Edit",
    onClick() {
        editDungeonInfoGui.open()
    }
})
.addColorPicker({
    category: "General",
    configName: "dungeonInfoBackgroundColor",
    title: "&dBackground Color",
    description: "Change the background color of the dungeon info (If separate). Set to fully transparent to disable.",
    value: [0, 0, 0, 179],
    subcategory: "Dungeon Info"
})
.addSwitch({
    category: "General",
    configName: "showTotalCrypts",
    title: "&8Show Crypts",
    description: "Shows the total number of crypts in the dungeon in he Dungeon Info.",
    subcategory: "Dungeon Info"
})
.addDropDown({
    category: "General",
    configName: "mapBorder",
    title: "&7Map Border",
    description: "Displays a border around the map.\n&8- Thanks IcarusPhantom for the RGB code.",
    options: ["Disabled","§cR§aG§bB","Solid Color","Hollow"],
    value: 0,
    subcategory: "Map Border"
})
.addColorPicker({
    category: "General",
    configName: "borderColor",
    title: "&7Border Color",
    description: "Change the color of the map border. Will only show if border is set to 'Solid Color' or 'Hollow'",
    value: [0, 0, 0, 255],
    subcategory: "Map Border"
})
.addButton({
    category: "General",
    configName: "EditBorderScale",
    title: "&7Edit Border",
    description: "Change the scale of the border and the RGB speed.",
    subcategory: "Map Border",
    onClick() {
        borderScaleGui.open()
    }
})
.addSwitch({
    category: "General",
    configName: "logDungeons",
    title: "Log Dungeons",
    description: "Automatically saves information about your current dungeon to a file so that you can go back and view information like average secrets, puzzles, rooms etc across past runs.",
    value: true,
    subcategory: "Dungeon Logging"
})
.addSwitch({
    category: "General",
    configName: "logDungeonChatInfo",
    title: "Chat Info",
    description: "Shows the dungeon score after the dungeon has been fully scanned with a clickable message to view the current dungeon map along with room scores for each room.",
    subcategory: "Dungeon Logging"
})
.addSwitch({
    category: "General",
    configName: "notifyUpdates",
    title: "&6Notify Updates",
    description: "Automatically check for updates and notify you when there is a new version of IllegalMap available (Doesn't auto download).",
    value: true,
    subcategory: "Updates"
})
.addSwitch({
    category: "General",
    configName: "autoFetchRoomsFromGithub",
    title: "&6Auto Fetch Rooms.json",
    description: "Automatically fetches the rooms.json file from github. This setting only exists so that I don't overwrite my own copy or in case people are having errors making API requests to github.",
    value: true,
    subcategory: "Updates"
})
.addSwitch({
    category: "Players",
    configName: "playerHeads",
    title: "&ePlayer Heads",
    description: "Show player heads on the map.",
    value: true,
    subcategory: "Player Heads"
})
.addSwitch({
    category: "Players",
    configName: "spiritLeapNames",
    title: "&bSpirit Leap Names",
    description: "Show player's usernames on the map when holding spirit leaps or infinileap.",
    value: true,
    subcategory: "Player Names"
})
.addSwitch({
    category: "Players",
    configName: "showPlayerNames",
    title: "&bAlways Show Names",
    description: "Always show player names on the map, even when not holding spirit leaps.",
    subcategory: "Player Names"
})
.addSwitch({
    category: "Players",
    configName: "showPlayerRanks",
    title: "&bShow Player Ranks",
    description: "Show players ranks on the map.\nEg &fUnclaimedBloom6 &7-> &6[MVP&0++&6] UnclaimedBloom6&7.\n&aRequires API key. &b/dmap setkey <api key>&a.",
    value: true,
    subcategory: "Player Names"
})
.addSwitch({
    category: "Players",
    configName: "showOwnName",
    title: "&bShow Own Name",
    description: "If show spirit leap names is enabled, render your own name as well.",
    value: true,
    subcategory: "Player Names"
})
.addSwitch({
    category: "Players",
    configName: "showPlayerPerformances",
    title: "&bPerformance Summary",
    description: "After the run ends, prints in chat how many (and what) rooms each player has cleared, how many secrets they found and how many times they died, similar to BetterMap.",
    subcategory: "Run Overview"
})
.addSwitch({
    category: "Rooms",
    configName: "darkenUnexplored",
    title: "Darken Unexplored",
    description: "Darken unopened rooms on the map during the run. The rooms will not be darkened before the run begins.",
    value: true,
    subcategory: ""
})
.addSwitch({
    category: "Rooms",
    configName: "scanSetupTree",
    title: "Scan Setup Tree",
    description: "&c&lur mom.",
    value: false,
    subcategory: ""
})
.addColorPicker({
    category: "Rooms",
    configName: "witherDoorColor",
    title: "&8Wither Door Color",
    description: "Changes the wither door color.",
    value: [0, 0, 0, 255],
    subcategory: "Wither Doors"
})
.addSwitch({
    category: "Rooms",
    configName: "witherDoorEsp",
    title: "&8Wither Door Esp",
    description: "Draws a box around the next two wither/blood doors.\n&8- Suggested by epha & RestOps",
    subcategory: "Wither Doors"
})
.addColorPicker({
    category: "Rooms",
    configName: "witherDoorEspColor",
    title: "&8Wither Door Esp Color",
    description: "The color of the box drawn around wither doors.",
    value: [255, 0, 0, 255],
    subcategory: "Wither Doors"
})
.addSwitch({
    category: "Rooms",
    configName: "showRoomNames",
    title: "&dShow Rooms",
    description: "Always show room names on the map.\n&aNote: If you want to see room names but don't want them visible all the time, use the 'Peek Rooms' keybind in Controls.",
    subcategory: "Room Names"
})
.addSwitch({
    category: "Rooms",
    configName: "showPuzzleNames",
    title: "&dShow Puzzles",
    description: "Show puzzle names and trap room on the map.",
    value: true,
    subcategory: "Room Names"
})
.addSwitch({
    category: "Rooms",
    configName: "showSecrets",
    title: "&dShow Secrets",
    description: "Show the secrets in each room on the map.",
    subcategory: "Secrets"
})
.addSwitch({
    category: "Rooms",
    configName: "changePuzzleColor",
    title: "&dChange Puzzle Color",
    description: "Changes the color of the puzzle text depending on the checkmark in that room.\nNo longer displays original checkmark for the room.",
    subcategory: "Puzzles"
})
.addDropDown({
    category: "Rooms",
    configName: "checkmarkStyle",
    title: "&2Checkmark Style",
    description: "Show the names of puzzles on the map after they are opened.",
    options: ["Regular","Vanilla"],
    value: 0,
    subcategory: "Checkmarks"
})
.addSwitch({
    category: "Rooms",
    configName: "centerCheckmarks",
    title: "Center Checkmarks",
    description: "Center checkmarks in larger rooms.",
    subcategory: "Checkmarks"
})
.addSwitch({
    category: "Rooms",
    configName: "numberCheckmarks",
    title: "Numbers Instead",
    description: "Replaces the normal checkmarks with the number of secrets of the room. Text changes color based on the checkmark color.",
    subcategory: "Checkmarks"
})
.addSwitch({
    category: "Rooms",
    configName: "whiteCheckBlood",
    title: "&cWhite Checkmark Blood",
    description: "Puts a white checkmark on blood room once the watcher has finished spawning mobs, but they have not all been killed.",
    value: true,
    subcategory: "Blood"
})
.addSwitch({
    category: "Rooms",
    configName: "scanMimic",
    title: "&cScan Mimic",
    description: "Scans the dungeon for trapped chests to find where the mimic is and detects when it has been revealed.",
    subcategory: "Mimic"
})
.addSwitch({
    category: "Rooms",
    configName: "showMimic",
    title: "&cShow Mimic Room",
    description: "Shows which room the mimic is in on the map.",
    value: true,
    subcategory: "Mimic"
})
.addSwitch({
    category: "Radar",
    configName: "starMobEsp",
    title: "&6Star Mob Esp",
    description: "Draws a box around starred mobs and minibosses.",
    subcategory: "Star Mob ESP"
})
.addColorPicker({
    category: "Radar",
    configName: "starMobEspColor",
    title: "&6Star Mob Esp Color",
    description: "The color of the box drawn around starred mobs.",
    value: [0, 255, 0, 255],
    subcategory: "Star Mob ESP"
})
.addSwitch({
    category: "Radar",
    configName: "radar",
    title: "&bRadar",
    description: "Shows the location of star mobs on the map.\n&aCan be toggled using the /star command if you only need it to find a lost mob.",
    subcategory: ""
})
.addSwitch({
    category: "Radar",
    configName: "starMobBorder",
    title: "&bStar Mob Border",
    description: "Renders a small black border around starred mobs on the map.",
    value: true,
    subcategory: "Star Mobs"
})
.addSwitch({
    category: "Radar",
    configName: "minibossColors",
    title: "&bMiniboss Colors",
    description: "Changes the color of minibosses on the map.",
    value: true,
    subcategory: "Star Mobs"
})
.addSwitch({
    category: "Radar",
    configName: "radarHeads",
    title: "&eRadar Heads",
    description: "Shows the mob's skin (like player icons) instead of a colored dot.",
    value: true,
    subcategory: "Heads"
})
.addSlider({
    category: "Radar",
    configName: "radarHeadScale",
    title: "&eRadar Head Scale",
    description: "Size of the heads of starred mobs on the map.",
    options: [0.001, 1],
    value: 0.5,
    subcategory: "Heads"
})
.addSwitch({
    category: "Radar",
    configName: "radarHeadsBorder",
    title: "&cRadar Heads Border",
    description: "Display a border around star mobs on the map (Same as player heads).",
    value: true,
    subcategory: "Border"
})
.addColorPicker({
    category: "Radar",
    configName: "radarHeadsBorderColor",
    title: "&cRadar Heads Border Color",
    description: "If border is enabled, change the color to make the star mobs look better or stick out more on the map.",
    value: [0, 0, 0, 255],
    subcategory: "Border"
})
.addButton({
    category: "Credits",
    configName: "tenios",
    title: "&a&lTenios",
    description: "First person to figure out how the actual score calculation worked and helped a bunch with room hashing idea and some other optimization.",
    subcategory: ""
})
.addButton({
    category: "Credits",
    configName: "soopy",
    title: "&2&lSoopyBoo32",
    description: "Provided a tool which allowed me to measure the lag caused by the module.",
    subcategory: ""
})
.addButton({
    category: "Credits",
    configName: "squagward",
    title: "&5&lSquagward &8(CT Developer)",
    description: "Fixed a memory leak caused by the game not disposing of the old map images properly.",
    subcategory: ""
})
.addButton({
    category: "Credits",
    configName: "icarus",
    title: "&f&lIcarusPhantom",
    description: "Code for smooth RGB for the map border.",
    subcategory: ""
})
.addButton({
    category: "Credits",
    configName: "ctdiscord",
    title: "&d&lChatTriggers Discord",
    description: "General code help. Filled with a bunch of really cool people who have helped me tremendously with a lot of CT related stuff.",
    subcategory: ""
})
.addButton({
    category: "GUI",
    configName: "applybtn",
    title: "Apply Changes",
    description: "Applies the changes made to this GUI's theme",
    placeHolder: "Apply",
    onClick(config) {
        applyChanges(config)
    }
})
.addColorPicker({
    category: "GUI",
    configName: "bgColor",
    title: "Change Background Color",
    description: "Changes the color and alpha of the background",
    value: [0, 0, 0, 80]
})
.addSlider({
    category: "GUI",
    configName: "x",
    title: "Change X",
    description: "Changes the starting X coordinate of the GUI (in percent. 20 by default)",
    options: [0, 100],
    value: 20
})
.addSlider({
    category: "GUI",
    configName: "y",
    title: "Change Y",
    description: "Changes the starting Y coordinate of the GUI (in percent. 20 by default)",
    options: [0, 100],
    value: 20
})
.addSlider({
    category: "GUI",
    configName: "width",
    title: "Change Width",
    description: "Changes the width of the GUI (in percent. 60 by default)",
    options: [25, 100],
    value: 60
})
.addSlider({
    category: "GUI",
    configName: "height",
    title: "Change Height",
    description: "Changes the height of the GUI (in percent. 50 by default)",
    options: [25, 100],
    value: 50
})

const setting = new Settings("IllegalMap", config, "data/ColorScheme.json")
const handler = setting.getHandler()

applyChanges(setting)

handler.registers.onKeyType((keyChar, keyCode) => {
    if (keyCode === Keyboard.KEY_BACK || keyCode === 1) return

    const search = setting.searchBar
    if (search.selected) return

    search._focusSearch()
    Client.scheduleTask(() => handler.getWindow().keyType(keyChar, keyCode))
})

export default () => setting.settings

register("gameUnload", () => {
    FileLib.write("IllegalMap", "data/ColorScheme.json", JSON.stringify(handler.getColorScheme(), null, 4))
})