/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />
import { getVersion } from "../utils/Utils";
import {
    @Vigilant,
    @TextProperty,
    @ColorProperty,
    @ButtonProperty,
    @SwitchProperty,
    @ParagraphProperty,
    @SliderProperty,
    @PercentSliderProperty,
    @SelectorProperty,
    Color
} from "../../Vigilance/index";

const colorsOption = [
    "§aGreen",
    "§bAqua",
    "§cRed",
    "§dPink",
    "§eYellow",
    "§fWhite",
    "§0Black",
    "§1Dark Blue",
    "§2Dark Green",
    "§3Cyan",
    "§4Dark Red",
    "§5Purple",
    "§6Gold",
    "§7Gray",
    "§8Dark Gray",
    "§9Blue"
]

@Vigilant("IllegalMap", "IllegalMap", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["Map", "Rooms", "Score Calculator", "Discord", "World", "Radar"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})
class Config {
    constructor() {
        this.initialize(this);
        this.setCategoryDescription(
            "Map",
            `
            &b&lIllegalMap ${getVersion()}

            &6&lCredits

            &etenios - Helping a ton with the score calc, mimic detection and idea to hash rooms.

            &6Jerome - Suggesting to scan the cores of rooms - sped up scanning by over 30x compared to the original IllegalMap.

            &aSoopy - Code to help with performance when updating the player icons, rooms and checkmarks.

            &eiTqxic - Suggesting improvements for the map move gui (scrolling) and supplying code.

            &bHuge thanks to the nerds over at the ChatTriggers discord for assistance with everything ChatTriggers related and being an all-around great community.

            &c&lWARNING: This mod is bannable on Hypixel. Use at own risk.
            `
        )
        this.setCategoryDescription(
            "Rooms",
            "Rooms!"
        )
        this.setCategoryDescription(
            "Score Calculator",
            "Score Calc Stuff"
        )
        this.setCategoryDescription(
            "Radar",
            "Renders locations of star mobs on the map."
        )
    }
    
    moveMapGui = new Gui()
    scoreCalcMoveGui = new Gui()

    // --------------------------------------------------------------------------------
    // Map

    // Toggle Map
    @SwitchProperty({
        name: "&aMap Enabled",
        description: "Toggle whether or not the map is displayed on the screen.\n&aIf the score calculator is not also disabled, the dungeon will still be scanned so the score calc works properly.",
        category: "Map",
        subcategory: "Toggle"
    })
    mapEnabled = true;

    @SwitchProperty({
        name: "Hide In Boss",
        description: "Hides the map in boss (If score calc is set to \"Under Map\" then it won't be shown, however it will still show if set to \"Seperate\" or \"Seperate in Boss\".",
        category: "Map",
        subcategory: "Toggle"
    })
    hideInBoss = false

    // Legit Mode
    @SwitchProperty({
        name: "&aLegit Mode",
        description: "Hides most of the information that would normally be inaccessible to a normal player. The Score Calculator will be unchanged, however you will not be able to see unexplored rooms or the total secrets.",
        category: "Map",
        subcategory: "Legit Mode"
    })
    legitMode = true;

    // Auto Scan
    @SwitchProperty({
        name: "Auto Scan",
        description: "Automatically scan the dungeon.\n&cIf this is disabled, scanning can only be done via the '&b//s&c' command. Recommended to leave this enabled.",
        category: "Map",
        subcategory: "Scanning"
    })
    autoScan = true;

    // Chat Info
    @SwitchProperty({
        name: "Chat Info",
        description: "Sends info about the current dungeon into chat after it has been fully scanned.",
        category: "Map",
        subcategory: "Scanning"
    })
    chatInfo = true;

    // Map Scale
    @SliderProperty({
        name: "Map Scale",
        description: "How big the map is.",
        category: "Map",
        subcategory: "Aesthetics",
        min: 0,
        max: 10
    })
    mapScale = 5;

    @PercentSliderProperty({
        name: "Player Head Scale",
        description: "How large the player heads are when they are rendered on the map.",
        category: "Map",
        subcategory: "Aesthetics"
    })
    headScale = 0.5;

    @ButtonProperty({
        name: "Move Map",
        description: "Open a new gui where you can drag the map to be displayed anywhere you want.",
        category: "Map",
        subcategory: "Aesthetics",
        placeholder: "Move"
    })
    MoveMap() {
        this.moveMapGui.open()
    };

    @ColorProperty({
        name: "Background Color",
        description: "Background color of the map.",
        category: "Map",
        subcategory: "Aesthetics"
    })
    backgroundColor = new java.awt.Color(0, 0, 0, 0.4);

    @SwitchProperty({
        name: "&6Notify Updates",
        description: "Automatically check for updates and notify you when there is a new version of IllegalMap available (Doesn't auto download).",
        category: "Map",
        subcategory: "Updates"
    })
    notifyUpdates = true;

    @SwitchProperty({
        name: "Show Dead Players",
        description: "Draws a small cross where a player died",
        category: "Map",
        subcategory: "Players"
    })
    showDeadPlayers = true;

    @SelectorProperty({
        name: "Show Player Names",
        description: "Draws the player's username underneath their player icon on the map.",
        category: "Map",
        subcategory: "Players",
        options: [
            "Off",
            "Holding Leaps",
            "Always"
        ]
    })
    playerNames = 1;

    // Player Names on map

    @SwitchProperty({
        name: "Show Own Nametag",
        description: "Show your own nametag on the map when holding &9Spirit Leaps&7. ('Show Player Names' must be set to 'Holding Leaps')",
        category: "Map",
        subcategory: "Players"
    })
    showOwnNametag = false

    @SwitchProperty({
        name: "Show Rank",
        description: "If 'Show Player Names' is set to 'Holding Leaps', display the player's rank as well as their username.\n&cNOTE: API Key must be set. Use /dmap key <apiKey> to set your API key.",
        category: "Map",
        subcategory: "Players"
    })
    showPlayerRank = true

    @SwitchProperty({
        name: "Black Border",
        description: "Player icons have black borders around them like on SBA's Dungeon map.",
        category: "Map",
        subcategory: "Players"
    })
    playerIconBorder = true

    @SwitchProperty({
        name: "Player Name Background",
        description: "Render a dark background behind the player's name on the map so it stands out.",
        category: "Map",
        subcategory: "Players"
    })
    nametagBorder = true


    @SwitchProperty({
        name: "Log Dungeons",
        description: "Stores information about past dungeons that have been scanned (Secrets, rooms etc).\n&aStats visible via the /dlogs [floor] command.",
        category: "Map",
        subcategory: "Logs"
    })
    logDungeons = true
    
    @SelectorProperty({
        name: "Map Border",
        description: "Renders a border around the map.",
        category: "Map",
        subcategory: "Map Border",
        options: [
            "Off",
            "§cR§aG§bB",
            "Custom"
        ]
    })
    mapBorder = 0;

    @SliderProperty({
        name: "Border RGB Speed",
        description: "How fast the RGB on the map border cycles.\n&8- Thanks to LcarusPhantom for supplying code for smooth RGB.",
        category: "Map",
        subcategory: "Map Border",
        min: 1,
        max: 10
    })
    rgbSpeed = 10;

    @ColorProperty({
        name: "Border Color",
        description: "Color of the map border.",
        category: "Map",
        subcategory: "Map Border"
    })
    borderColor = Color.BLACK;

    // --------------------------------------------------------------------------------
    // Radar

    @SwitchProperty({
        name: "Radar",
        description: "Shows the location of star mobs on the map.\n&aCan be toggled using the /star command if you only need it to find a lost mob.\n&8Suggested by Hosted",
        category: "Radar",
        subcategory: "Star Mobs"
    })
    radar = false;

    @SwitchProperty({
        name: "Star Mob Border",
        description: "Renders a small black border around starred mobs on the map.",
        category: "Radar",
        subcategory: "Star Mobs"
    })
    starMobBorder = true;

    @SwitchProperty({
        name: "Miniboss Colors",
        description: "Changes the color of minibosses on the map.",
        category: "Radar",
        subcategory: "Star Mobs"
    })
    minibossColors = true;

    @SwitchProperty({
        name: "Radar Heads",
        description: "Shows the mob's skin (like player icons) instead of a colored dot.",
        category: "Radar",
        subcategory: "Heads"
    })
    radarHeads = true;

    
    @PercentSliderProperty({
        name: "Radar Head Scale",
        description: "Size of the heads of starred mobs on the map.",
        category: "Radar",
        subcategory: "Heads"
    })
    radarHeadScale = 0.5;
    
    @SwitchProperty({
        name: "Radar Heads Border",
        description: "Display a border around star mobs on the map (Same as player heads).",
        category: "Radar",
        subcategory: "Border"
    })
    radarHeadsBorder = true;

    @ColorProperty({
        name: "Radar Heads Border Color",
        description: "If border is enabled, change the color to make the star mobs look better or stick out more on the map.",
        category: "Radar",
        subcategory: "Border"
    })
    radarHeadsBorderColor = Color.BLACK

    // --------------------------------------------------------------------------------
    // Rooms

    // Show Mimic
    @SwitchProperty({
        name: "Show Mimic",
        description: "Changes the color of the room with the mimic.\n&cRequires 'Mimic Detection' in Score Calculator to be set to 'Auto-Detect (Scan)'",
        category: "Rooms",
        subcategory: "Mimic"
    })
    showMimic = true;

    // Show Important Rooms
    @SwitchProperty({
        name: "Show Important Rooms",
        description: "Always renders the name of puzzles and trap room on the map.",
        category: "Rooms",
        subcategory: "Room Names"
    })
    showImportantRooms = true;

    @SelectorProperty({
        name: "Room Name Color",
        description: "The color of the room names when they are rendered on the map.",
        category: "Rooms",
        subcategory: "Room Names",
        options: colorsOption
    })
    roomNameColor = 5;

    // Darken Unexplored
    @SwitchProperty({
        name: "Darken Unexplored",
        description: "Darken unexplored rooms so that they can be told apart from explored ones.",
        category: "Rooms",
        subcategory: "Unexplored"
    })
    darkenUnexplored = true;

    // Wither Door Color
    @ColorProperty({
        name: "Wither Door Color",
        description: "Changes the color of wither doors on the map so that they can be seen more easily.",
        category: "Rooms",
        subcategory: "Wither Door"
    })
    witherDoorColor = new java.awt.Color(13/255, 13/255, 13/255, 1);

    @SwitchProperty({
        name: "Show Room Names",
        description: "Always show room names above rooms on the map.",
        category: "Rooms",
        subcategory: "Text"
    })
    showRooms = false

    @SelectorProperty({
        name: "Show Secrets",
        description: "Shows the number of secrets a room has on the map. (Can also be shown using the peek keybind)",
        category: "Rooms",
        subcategory: "Text",
        options: [
            "Off",
            "Small",
            "Large",
            "Replace Checkmarks"
        ]
    })
    showSecrets = 0;

    @SelectorProperty({
        name: "&7Unexplored &fSecrets Color",
        description: "The color of secrets if a room is unexplored on the map (Requires 'Show Secrets' to be set to 'Replace Checkmarks'.",
        category: "Rooms",
        subcategory: "Text",
        options: colorsOption
    })
    unexploredSecrets = 13;

    @SelectorProperty({
        name: "White Checkmark Secrets Color",
        description: "The color of secrets if a room has a White checkmark (Requires 'Show Secrets' to be set to 'Replace Checkmarks'.",
        category: "Rooms",
        subcategory: "Text",
        options: colorsOption
    })
    whiteCheckSecrets = 5;

    @SelectorProperty({
        name: "&aGreen &fCheckmark Secrets Color",
        description: "The color of secrets if a room has a Green checkmark (Requires 'Show Secrets' to be set to 'Replace Checkmarks'.",
        category: "Rooms",
        subcategory: "Text",
        options: colorsOption
    })
    greenCheckSecrets = 0;

    // --------------------------------------------------------------------------------

    // Star mob Esp
    @SwitchProperty({
        name: "Star Mob Esp",
        description: "Draws a box around starred mobs and minibosses.\n&aRecommend using the Radar instead.",
        description: "Draws a box around starred mobs and minibosses.\n&aRecommend using the Radar instead.",
        category: "World",
        subcategory: "Star Mobs"
    })
    starMobEsp = false;

    // Star mob esp color
    @ColorProperty({
        name: "Star Mob Esp Color",
        description: "The color of the box drawn around starred mobs.",
        category: "World",
        subcategory: "Star Mobs"
    })
    starMobEspColor = new java.awt.Color(0, 1, 0, 1);

    // Wither Door Esp
    @SwitchProperty({
        name: "Wither Door Esp",
        description: "Draws a box wither doors and blood door.\n&8- Suggested by epha & RestOps",
        category: "World",
        subcategory: "Wither Doors"
    })
    witherDoorEsp = false;

    // Wither door esp color
    @ColorProperty({
        name: "Wither Door Esp Color",
        description: "The color of the box drawn around wither doors.",
        category: "World",
        subcategory: "Wither Doors"
    })
    witherDoorEspColor = new java.awt.Color(1, 0, 0, 1);

    // --------------------------------------------------------------------------------

    // Score Calc
    @SelectorProperty({
        name: "Score Calculator",
        description: "Enable or Disable the score calculator.",
        category: "Score Calculator",
        subcategory: "Toggle",
        options: [
            "Under Map",
            "Seperate",
            "Disabled",
            "Seperate In Boss"
        ]
    })
    scoreCalc = 0;

    @ButtonProperty({
        name: "Move Score Calculator",
        description: "If 'Score Calculator' is set to seperate, it will appear here.",
        category: "Score Calculator",
        subcategory: "Move",
        placeholder: "Move"
    })
    MoveScoreCalc() {
        this.scoreCalcMoveGui.open()
    }

    @SwitchProperty({
        name: "Announce 300",
        description: "Says a message in party chat once the score has reached 300.",
        category: "Score Calculator",
        subcategory: "Chat"
    })
    announce300 = false

    @TextProperty({
        name: "Announce 300 Message",
        description: "The message that will be sent into party chat after 300 score has been reached.",
        category: "Score Calculator",
        subcategory: "Chat",
        placeholder: "300 Score Reached!"
    })
    announce300Message = "300 Score Reached!"

    @SwitchProperty({
        name: "Announce 270",
        description: "Says a message in party chat once the score has reached 270.",
        category: "Score Calculator",
        subcategory: "Chat"
    })
    announce270 = false

    @TextProperty({
        name: "Announce 270 Message",
        description: "The message that will be sent into party chat after 270 score has been reached.",
        category: "Score Calculator",
        subcategory: "Chat",
        placeholder: "270 Score Reached!"
    })
    announce270Message = "270 Score Reached!"

    @SwitchProperty({
        name: "Score Milestones",
        description: "Tells you in chat when 270 and 300 score has been reached as well as the time they were reached at.",
        category: "Score Calculator",
        subcategory: "Info"
    })
    scoreMilestones = true;

    @SelectorProperty({
        name: "Spirit Pet",
        description: "Takes into account the first player dying having a spirit pet. \n&aAuto Detect requires API key to be set (&b/dmap key <key>&a).",
        category: "Score Calculator",
        subcategory: "Spirit",
        options: [
            "Assumed",
            "Off",
            "Auto Detect"
        ]
    })
    spiritPet = 0;

    // Mimic stuff
    @SelectorProperty({
        name: "Mimic",
        description: "How to detect mimic being killed.\n&aRegular will only detect mimic based off of party chat messages and mimic being killed in Render distance.\n&aScan will scan all of the trapped chests in the dungeon to see if the Mimic chest has been opened. Can have false positives.",
        category: "Score Calculator",
        subcategory: "Mimic",
        options: [
            "Assumed",
            "Off",
            "Auto-Detect (Regular)",
            "Auto-Detect (Scan)"
        ]
    })
    mimicDetection = 3;

    // Announce mimic revealed
    @SwitchProperty({
        name: "Announce Mimic Revealed",
        description: "Says a message in party chat when mimic chest has been revealed.",
        category: "Score Calculator",
        subcategory: "Mimic"
    })
    announceMimic = false;

    // Customize mimic message
    @TextProperty({
        name: "Mimic Revealed Message",
        description: "If 'Announce Mimic Revealed' is enabled, send this message into party chat.\n&aCan contain &7{room} &ato be replaced with the room Mimic was found in.",
        category: "Score Calculator",
        subcategory: "Mimic",
        placeholder: "Mimic Revealed in {room}!"
    })
    announceMimicMessage = "Mimic Revealed in {room}!"

    // Paul!
    @SelectorProperty({
        name: "Paul &d❤",
        description: "Adds +10 score to the bonus score.\n&aIf Paul is active, a blue star &b★ &awill appear after the score on the score calculator.",
        category: "Score Calculator",
        subcategory: "Paul",
        options: [
            "On",
            "Off",
            "Auto Detect"
        ]
    })
    paul = 2;

    // --------------------------------------------------------------------------------

    @SwitchProperty({
        name: "Discord RPC",
        description: "Toggle the Discord RPC (Not compatible with Mac).",
        category: "Discord",
        subcategory: "Toggle"
    })
    discordRPC = true

    @SwitchProperty({
        name: "Current Room",
        description: "Shows the current room you're in as well as how many secrets have been found in it so far.",
        category: "Discord",
        subcategory: "Rich Presence"
    })
    discordRoom = true

    @SwitchProperty({
        name: "Floor",
        description: "Shows which floor you're currently playing.",
        category: "Discord",
        subcategory: "Rich Presence"
    })
    discordFloor = true

}
export default new Config()