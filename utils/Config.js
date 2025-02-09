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
    title: `&6&l&nIllegalMap ${JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version}`,
    description: "&bNote: An API key is required for some features. To set it, run &a/api &anew.\n&bBy UnclaimedBloom6",
    category: "General",
    configName: "_paragraphone",
    centered: true,
    subcategory: ""
})
.addButton({
    title: "&3&lMy Discord Server",
    description: "Join if you want to talk to me directly, report a bug or want to make a suggestion.",
    category: "General",
    configName: "MyDiscord",
    subcategory: "",
    onClick() {
        java.awt.Desktop.getDesktop().browse(new java.net.URI("https://discord.gg/pykzREcAuZ"))
    }
})
.addSwitch({
    title: "&aMap Enabled",
    description: "Main rendering toggle.",
    category: "General",
    configName: "enabled",
    value: true,
    subcategory: ""
})
.addButton({
    title: "&aEdit Map",
    description: "Move the map, change the map scale, head scale etc.",
    category: "General",
    configName: "MoveMap",
    subcategory: "",
    onClick() {
        mapEditGui.open()
    }
})
.addColorPicker({
    title: "Background Color",
    description: "Change the background color and transparency of the map.",
    category: "General",
    configName: "backgroundColor",
    value: [0, 0, 0, 179],
    subcategory: ""
})
.addSwitch({
    title: "&aHide In Boss",
    description: "Hides the map after you enter the boss room.\n&cNOTE: If another mod is hiding boss messages then this might not work.",
    category: "General",
    configName: "hideInBoss",
    subcategory: ""
})
.addSwitch({
    title: "Chat Info",
    description: "Show info about the dungeon in chat after it has been scanned.",
    category: "General",
    configName: "chatInfo",
    subcategory: "Scanning"
})
.addSwitch({
    title: "&bScore Milestones",
    description: "Tells you when 270/300 score has been reached (Does not send a message in party chat).",
    category: "General",
    configName: "scoreMilestones",
    value: true,
    subcategory: "Score Milestones"
})
.addSwitch({
    title: "&aAnnounce 300 Score",
    description: "Announces in party chat when 300 score has been reached.",
    category: "General",
    configName: "announce300",
    subcategory: "Score Milestones"
})
.addTextInput({
    title: "&a300 Score Message",
    description: "The message to send in party chat when 300 score has been reached (If announce 300 is enabled).",
    category: "General",
    configName: "announce300Message",
    value: "300 Score Reached!",
    placeHolder: "300 Score Reached!",
    subcategory: "Score Milestones"
})
.addSwitch({
    title: "&eAnnounce 270 Score",
    description: "Announces in party chat when 270 score has been reached.",
    category: "General",
    configName: "announce270",
    subcategory: "Score Milestones"
})
.addTextInput({
    title: "&e270 Score Message",
    description: "The message to send in party chat when 270 score has been reached (If announce 270 is enabled).",
    category: "General",
    configName: "announce270Message",
    value: "270 Score Reached!",
    placeHolder: "270 Score Reached!",
    subcategory: "Score Milestones"
})
.addSwitch({
    title: "&eAnnounce Mimic Dead",
    description: "Announce in party chat when the mimic has been killed.",
    category: "General",
    configName: "announceMimic",
    subcategory: "Mimic"
})
.addTextInput({
    title: "&cMimic Killed Message",
    description: "If Announce Mimic Dead is enabled, say this message in party chat when the mimic has been killed near you.",
    category: "General",
    configName: "announceMimicMessage",
    value: "Mimic Dead!",
    placeHolder: "Mimic Dead!",
    subcategory: "Mimic"
})
.addTextInput({
    title: "&cMimic Detection Messages",
    description: "If one of your party members has a mimic killed message which is not detected by the mod already, add it here separated with a comma.\nEg: mimic dead, mimic killed, breefing killed, and so on...",
    category: "General",
    configName: "extraMimicMessages",
    value: "",
    placeHolder: "",
    subcategory: "Mimic"
})
.addDropDown({
    title: "&dDungeon Info",
    description: "Change where the dungeon info is rendered.\nThe dungeon into is the text under the map which shows the secrets, crypts etc.\nIf 'Seperate in Boss', then the dungeon info will be under the map during the dungeon then become seperate in boss. Useful if 'Hide in Boss' is enabled.",
    category: "General",
    configName: "dungeonInfo",
    options: ["Under Map","Separate","Hidden","Seperate in Boss"],
    value: 0,
    subcategory: "Dungeon Info"
})
.addButton({
    title: "&dEdit Dungeon Info",
    description: "If Dungeon Info is set to 'Separate' then this will let you move it and change the scale.",
    category: "General",
    configName: "EditDungeonInfo",
    subcategory: "Dungeon Info",
    placeHolder: "Edit",
    onClick() {
        Client.currentGui.close()
        editDungeonInfoGui.open()
    }
})
.addColorPicker({
    title: "&dBackground Color",
    description: "Change the background color of the dungeon info (If separate). Set to fully transparent to disable.",
    category: "General",
    configName: "dungeonInfoBackgroundColor",
    value: [0, 0, 0, 179],
    subcategory: "Dungeon Info"
})
.addSwitch({
    title: "&8Show Crypts",
    description: "Shows the total number of crypts in the dungeon in the Dungeon Info.",
    category: "General",
    configName: "showTotalCrypts",
    subcategory: "Dungeon Info"
})
.addDropDown({
    title: "&7Map Border",
    description: "Displays a border around the map.\n&8- Thanks IcarusPhantom for the RGB code.",
    category: "General",
    configName: "mapBorder",
    options: ["Disabled","§cR§aG§bB","Solid Color"],
    value: 0,
    subcategory: "Map Border"
})
.addColorPicker({
    title: "&7Border Color",
    description: "Change the color of the map border. Will only show if border is set to 'Solid Color' or 'Hollow'",
    category: "General",
    configName: "borderColor",
    value: [0, 0, 0, 255],
    subcategory: "Map Border"
})
.addButton({
    title: "&7Edit Border",
    description: "Change the scale of the border and the RGB cycle speed.",
    category: "General",
    configName: "EditBorderScale",
    subcategory: "Map Border",
    onClick() {
        borderScaleGui.open()
    }
})
.addSwitch({
    title: "Log Dungeons",
    description: "Automatically saves information about your current dungeon to a file so that you can go back and view information like average secrets, puzzles, rooms etc across past runs.",
    category: "General",
    configName: "logDungeons",
    value: true,
    subcategory: "Dungeon Logging"
})
.addSwitch({
    title: "Chat Info",
    description: "Shows the dungeon score after the dungeon has been fully scanned with a clickable message to view the current dungeon map along with room scores for each room.",
    category: "General",
    configName: "logDungeonChatInfo",
    subcategory: "Dungeon Logging"
})
.addSwitch({
    title: "&6Notify Updates",
    description: "Automatically check for updates and notify you when there is a new version of IllegalMap available (Doesn't auto download).",
    category: "General",
    configName: "notifyUpdates",
    value: true,
    subcategory: "Updates"
})
.addSwitch({
    title: "&6Auto Fetch Rooms.json",
    description: "Automatically fetches the rooms.json file from github. This setting only exists so that I don't overwrite my own copy or in case people are having errors making API requests to github.",
    category: "General",
    configName: "autoFetchRoomsFromGithub",
    value: true,
    subcategory: "Updates"
})
.addSwitch({
    title: "&ePlayer Heads",
    description: "Show player heads on the map.",
    category: "Players",
    configName: "playerHeads",
    value: true,
    subcategory: "Player Heads"
})
.addSwitch({
    title: "&eDefault Own Head",
    description: "If player heads is enabled, this will turn your own head into a green arrow (The vanilla map icon) but keep everyone else as their player heads.",
    category: "Players",
    configName: "useVanillaOwnHead",
    value: false,
    subcategory: "Player Heads"
})
.addSwitch({
    title: "&bSpirit Leap Names",
    description: "Show player's usernames on the map when holding spirit leaps or infinileap.",
    category: "Players",
    configName: "spiritLeapNames",
    value: true,
    subcategory: "Player Names"
})
.addSwitch({
    title: "&bAlways Show Names",
    description: "Always show player names on the map, even when not holding spirit leaps.",
    category: "Players",
    configName: "showPlayerNames",
    subcategory: "Player Names"
})
.addSwitch({
    title: "&bShow Player Ranks",
    description: "Show players ranks on the map.\nEg &fUnclaimedBloom6 &7-> &6[MVP&0++&6] UnclaimedBloom6&7.\n&aRequires API key. &b/bcore setkey <api key>&a.",
    category: "Players",
    configName: "showPlayerRanks",
    value: true,
    subcategory: "Player Names"
})
.addSwitch({
    title: "&bShow Own Name",
    description: "If show spirit leap names is enabled, render your own name as well.",
    category: "Players",
    configName: "showOwnName",
    value: true,
    subcategory: "Player Names"
})
.addSwitch({
    title: "&bPerformance Summary",
    description: "After the run ends, prints in chat how many (and what) rooms each player has cleared, how many secrets they found and how many times they died, similar to BetterMap.",
    category: "Players",
    configName: "showPlayerPerformances",
    subcategory: "Run Overview"
})
.addSwitch({
    title: "Darken Unexplored",
    description: "Darken unopened rooms on the map during the run. The rooms will not be darkened before the run begins.",
    category: "Rooms",
    configName: "darkenUnexplored",
    value: true,
    subcategory: ""
})
.addColorPicker({
    title: "Trap Room Color",
    description: "Changes the trap room's color",
    configName: "trapRoomColor",
    value: [216, 127, 51, 255]
})
.addSwitch({
    title: "Scan Setup Tree",
    description: " ",
    category: "Rooms",
    configName: "scanSetupTree",
    value: false,
    subcategory: ""
})
.addColorPicker({
    title: "&8Wither Door Color",
    description: "Changes the wither door color.",
    category: "Rooms",
    configName: "witherDoorColor",
    value: [0, 0, 0, 255],
    subcategory: "Wither Doors"
})
.addSwitch({
    title: "&8Wither Door Esp",
    description: "Draws a box around the next two wither/blood doors.\n&8- Suggested by epha & RestOps",
    category: "Rooms",
    configName: "witherDoorEsp",
    subcategory: "Wither Doors"
})
.addColorPicker({
    title: "&8Wither Door Esp Color",
    description: "The color of the box drawn around wither doors.",
    category: "Rooms",
    configName: "witherDoorEspColor",
    value: [255, 0, 0, 255],
    subcategory: "Wither Doors"
})
.addSwitch({
    title: "&dAlways Show Room Names",
    description: "Always show room names on the map.\n&aNote: If you want to see room names but don't want them visible all the time, use the 'Peek Rooms' keybind in Controls.",
    category: "Rooms",
    configName: "showRoomNames",
    subcategory: "Room Names"
})
.addSwitch({
    title: "&dAlways Show Puzzle Names",
    description: "Show puzzle names and trap room on the map.",
    category: "Rooms",
    configName: "showPuzzleNames",
    value: true,
    subcategory: "Room Names"
})
.addSwitch({
    title: "&dName Color Checkmark State",
    description: "Changes the color of the room's name to match the checkmark state of that room. White for white checkmark, green for green checkmark etc.",
    category: "Rooms",
    configName: "roomNameCheckmarkColor",
    value: true,
    subcategory: "Room Names"
})
.addSwitch({
    title: "&dShow Secrets",
    description: "Show the secrets in each room on the map.",
    category: "Rooms",
    configName: "showSecrets",
    subcategory: "Secrets"
})
.addSwitch({
    title: "&dChange Puzzle Color",
    description: "Changes the color of the puzzle text depending on the checkmark in that room.\nNo longer displays original checkmark for the room.",
    category: "Rooms",
    configName: "changePuzzleColor",
    subcategory: "Puzzles"
})
.addDropDown({
    title: "&2Checkmark Style",
    description: "Show the names of puzzles on the map after they are opened.",
    category: "Rooms",
    configName: "checkmarkStyle",
    options: ["Regular", "Vanilla", "None"],
    value: 0,
    subcategory: "Checkmarks"
})
.addSwitch({
    title: "Center Checkmarks",
    description: "Center checkmarks in larger rooms.",
    category: "Rooms",
    configName: "centerCheckmarks",
    subcategory: "Checkmarks"
})
.addSwitch({
    title: "Numbers Instead",
    description: "Replaces the normal checkmarks with the number of secrets of the room. Text changes color based on the checkmark color.",
    category: "Rooms",
    configName: "numberCheckmarks",
    subcategory: "Checkmarks"
})
.addSwitch({
    title: "&cWhite Checkmark Blood",
    description: "Puts a white checkmark on blood room once the watcher has finished spawning mobs, but they have not all been killed.",
    category: "Rooms",
    configName: "whiteCheckBlood",
    value: true,
    subcategory: "Blood"
})
.addSwitch({
    title: "&cScan Mimic",
    description: "Scans the dungeon for trapped chests to find where the mimic is and detects when it has been revealed.",
    category: "Rooms",
    configName: "scanMimic",
    subcategory: "Mimic"
})
.addSwitch({
    title: "&cShow Mimic Room",
    description: "Shows which room the mimic is in on the map.",
    category: "Rooms",
    configName: "showMimic",
    value: true,
    subcategory: "Mimic"
})
.addSwitch({
    title: "&6Star Mob Esp",
    description: "Draws a box around starred mobs and minibosses.",
    category: "Radar",
    configName: "starMobEsp",
    subcategory: "Star Mob ESP"
})
.addColorPicker({
    title: "&6Star Mob Esp Color",
    description: "The color of the box drawn around starred mobs.",
    category: "Radar",
    configName: "starMobEspColor",
    value: [0, 255, 0, 255],
    subcategory: "Star Mob ESP"
})
.addSwitch({
    title: "&bRadar",
    description: "Shows the location of star mobs on the map.\n&aCan be toggled using the /radar command if you only need it to find a lost mob.",
    category: "Radar",
    configName: "radar",
    subcategory: ""
})
.addSwitch({
    title: "&bStar Mob Border",
    description: "Renders a small black border around starred mobs on the map.",
    category: "Radar",
    configName: "starMobBorder",
    value: true,
    subcategory: "Star Mobs"
})
.addSwitch({
    title: "&bMiniboss Colors",
    description: "Changes the color of minibosses on the map.",
    category: "Radar",
    configName: "minibossColors",
    value: true,
    subcategory: "Star Mobs"
})
.addSwitch({
    title: "&eRadar Heads",
    description: "Shows the mob's skin (like player icons) instead of a colored dot.",
    category: "Radar",
    configName: "radarHeads",
    value: true,
    subcategory: "Heads"
})
.addSlider({
    title: "&eRadar Head Scale",
    description: "Size of the heads of starred mobs on the map.",
    category: "Radar",
    configName: "radarHeadScale",
    options: [0.001, 1],
    value: 0.5,
    subcategory: "Heads"
})
.addSwitch({
    title: "&cRadar Heads Border",
    description: "Display a border around star mobs on the map (Same as player heads).",
    category: "Radar",
    configName: "radarHeadsBorder",
    value: true,
    subcategory: "Border"
})
.addColorPicker({
    title: "&cRadar Heads Border Color",
    description: "If border is enabled, change the color to make the star mobs look better or stick out more on the map.",
    category: "Radar",
    configName: "radarHeadsBorderColor",
    value: [0, 0, 0, 255],
    subcategory: "Border"
})
.addButton({
    title: "&a&lTenios",
    description: "First person to figure out how the actual score calculation worked and helped a bunch with room hashing idea and some other optimization.",
    category: "Credits",
    configName: "tenios",
    subcategory: ""
})
.addButton({
    title: "&2&lSoopyBoo32",
    description: "Provided a tool which allowed me to measure the lag caused by the module.",
    category: "Credits",
    configName: "soopy",
    subcategory: ""
})
.addButton({
    title: "&5&lSquagward &8(CT Developer)",
    description: "Fixed a memory leak caused by the game not disposing of the old map images properly.",
    category: "Credits",
    configName: "squagward",
    subcategory: ""
})
.addButton({
    title: "&f&lIcarusPhantom",
    description: "Code for smooth RGB for the map border.",
    category: "Credits",
    configName: "icarus",
    subcategory: ""
})
.addButton({
    title: "&d&lChatTriggers Discord",
    description: "General code help. Filled with a bunch of really cool people who have helped me tremendously with a lot of CT related stuff.",
    category: "Credits",
    configName: "ctdiscord",
    subcategory: ""
})
.addButton({
    title: "Apply Changes",
    description: "Applies the changes made to this GUI's theme",
    category: "GUI",
    configName: "applybtn",
    placeHolder: "Apply",
    onClick(config) {
        applyChanges(config)
    }
})
.addColorPicker({
    title: "Change Background Color",
    description: "Changes the color and alpha of the background",
    category: "GUI",
    configName: "bgColor",
    value: [0, 0, 0, 80]
})
.addSlider({
    title: "Change X",
    description: "Changes the starting X coordinate of the GUI (in percent. 20 by default)",
    category: "GUI",
    configName: "x",
    options: [0, 100],
    value: 20
})
.addSlider({
    title: "Change Y",
    description: "Changes the starting Y coordinate of the GUI (in percent. 20 by default)",
    category: "GUI",
    configName: "y",
    options: [0, 100],
    value: 20
})
.addSlider({
    title: "Change Width",
    description: "Changes the width of the GUI (in percent. 60 by default)",
    category: "GUI",
    configName: "width",
    options: [25, 100],
    value: 60
})
.addSlider({
    title: "Change Height",
    description: "Changes the height of the GUI (in percent. 50 by default)",
    category: "GUI",
    configName: "height",
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