import { Color } from "../../BloomCore/Utils/Utils";
import {
    @ButtonProperty,
    @CheckboxProperty,
    Color,
    @ColorProperty,
    @PercentSliderProperty,
    @SelectorProperty,
    @SwitchProperty,
    @TextProperty,
    @Vigilant,
    @SliderProperty
} from '../../Vigilance/index';

const getModuleVersion = () => JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version

@Vigilant("IllegalMap", "IllegalMap", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["General", "Players", "Rooms", "Radar", "Credits"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})
class Config {
    constructor() {
        this.initialize(this)
        this.setCategoryDescription("General", 
            `
            &6&l&nIllegalMap ${getModuleVersion()}


            &bNote: An API key is required for some features. To set it, use &f/dmap setkey <apikey>&b.


            &7By UnclaimedBloom6
            `
        )
    }

    mapEditGui = new Gui()
    editDungeonInfoGui = new Gui()
    borderScaleGui = new Gui()

    // ---------------------------------------------------------------
    // General

    @ButtonProperty({
        name: "&3&lMy Discord Server",
        description: "Join if you want to talk to me directly, report a bug or want to make a suggestion.",
        category: "General",
        placeholder: "Join"
    })
    MyDiscord() {
        java.awt.Desktop.getDesktop().browse(new java.net.URI("https://discord.gg/pykzREcAuZ"))
    }
    // https://discord.gg/pykzREcAuZ

    @SwitchProperty({
        name: "&aMap Enabled",
        description: "Toggle the entire module.",
        category: "General"
    })
    enabled = true;

    @ButtonProperty({
        name: "&aEdit Map",
        description: "Move the map, change the map scale, head scale etc.",
        category: "General"
    })
    MoveMap() {
        this.mapEditGui.open()
    };

    @ColorProperty({
        name: "Background Color",
        description: "Change the background color and transparency of the map.",
        category: "General"
    })
    backgroundColor = new Color(0, 0, 0, 179/255);

    @SwitchProperty({
        name: "&aHide In Boss",
        description: "Hides the map after you enter the boss room.\n&cNOTE: If another mod is hiding boss messages then this might not work.",
        category: "General"
    })
    hideInBoss = false;

    @SwitchProperty({
        name: "Chat Info",
        description: "Show info about the dungeon in chat after it has been scanned.",
        category: "General",
        subcategory: "Scanning"
    })
    chatInfo = false;

    @SwitchProperty({
        name: "&bScore Milestones",
        description: "Tells you when 270/300 score has been reached (Does not send a message in party chat).",
        category: "General",
        subcategory: "Score Milestones"
    })
    scoreMilestones = true;

    @SwitchProperty({
        name: "&aAnnounce 300 Score",
        description: "Announces in party chat when 300 score has been reached.",
        category: "General",
        subcategory: "Score Milestones"
    })
    announce300 = false;

    @TextProperty({
        name: "&a300 Score Message",
        description: "The message to send in party chat when 300 score has been reached (If announce 300 is enabled).",
        category: "General",
        subcategory: "Score Milestones",
        placeholder: "300 Score Reached!"
    })
    announce300Message = "300 Score Reached!"

    @SwitchProperty({
        name: "&eAnnounce 270 Score",
        description: "Announces in party chat when 270 score has been reached.",
        category: "General",
        subcategory: "Score Milestones"
    })
    announce270 = false;
    
    @TextProperty({
        name: "&e270 Score Message",
        description: "The message to send in party chat when 270 score has been reached (If announce 270 is enabled).",
        category: "General",
        subcategory: "Score Milestones",
        placeholder: "270 Score Reached!"
    })
    announce270Message = "270 Score Reached!"

    @SwitchProperty({
        name: "&eAnnounce Mimic Dead",
        description: "Announce in party chat when the mimic has been killed.",
        category: "General",
        subcategory: "Mimic"
    })
    announceMimic = false;

    @TextProperty({
        name: "&cMimic Killed Message",
        description: "If Announce Mimic Dead is enabled, say this message in party chat when the mimic has been killed near you.",
        category: "General",
        subcategory: "Mimic",
        placeholder: "Mimic Dead!"
    })
    announceMimicMessage = "Mimic Dead!";

    @TextProperty({
        name: "&cMimic Detection Messages",
        description: "If one of your party members has a mimic killed message which is not detected by the mod already, add it here separated with a comma.\nEg: mimic dead, mimic killed, breefing killed, and so on...",
        category: "General",
        subcategory: "Mimic",
        placeholder: ""
    })
    extraMimicMessages = "";

    @SelectorProperty({
        name: "&dDungeon Info",
        description: "Change where the dungeon info is rendered.\nThe dungeon into is the text under the map which shows the secrets, crypts etc.\nIf 'Seperate in Boss', then the dungeon info will be under the map during the dungeon then become seperate in boss. Useful if 'Hide in Boss' is enabled.",
        category: "General",
        subcategory: "Dungeon Info",
        options: ["Under Map", "Separate", "Hidden", "Seperate in Boss"]
    })
    dungeonInfo = 0;

    @ButtonProperty({
        name: "&dEdit Dungeon Info",
        description: "If Dungeon Info is set to 'Separate' then this will let you move it and change the scale.",
        category: "General",
        subcategory: "Dungeon Info",
        placeholder: "Edit"
    })
    EditDungeonInfo() {
        this.editDungeonInfoGui.open()
    };

    @ColorProperty({
        name: "&dBackground Color",
        description: "Change the background color of the dungeon info (If separate). Set to fully transparent to disable.",
        category: "General",
        subcategory: "Dungeon Info"
    })
    dungeonInfoBackgroundColor = new Color(0, 0, 0, 179/255);

    @SelectorProperty({
        name: "&7Map Border",
        description: "Displays a border around the map.\n&8- Thanks LcarusPhantom for the RGB code.",
        category: "General",
        subcategory: "Map Border",
        options: ["Disabled", "§cR§aG§bB", "Solid Color", "Hollow"]
    })
    mapBorder = 0;

    @ColorProperty({
        name: "&7Border Color",
        description: "Change the color of the map border. Will only show if border is set to 'Solid Color' or 'Hollow'",
        category: "General",
        subcategory: "Map Border"
    })
    borderColor = new Color(0, 0, 0, 1);
    
    @ButtonProperty({
        name: "&7Edit Border",
        description: "Change the scale of the border and the RGB speed.",
        category: "General",
        subcategory: "Map Border"
    })
    EditBorderScale() {
        this.borderScaleGui.open()
    };

    @SwitchProperty({
        name: "Log Dungeons",
        description: "Automatically saves information about your current dungeon to a file so that you can go back and view information like average secrets, puzzles, rooms etc across past runs.",
        category: "General",
        subcategory: "Dungeon Logging"
    })
    logDungeons = true;

    @SwitchProperty({
        name: "&6Notify Updates",
        description: "Automatically check for updates and notify you when there is a new version of IllegalMap available (Doesn't auto download).",
        category: "General",
        subcategory: "Updates"
    })
    notifyUpdates = true;



    // ---------------------------------------------------------------
    // Players

    @SwitchProperty({
        name: "&ePlayer Heads",
        description: "Show player heads on the map.",
        category: "Players",
        subcategory: "Player Heads"
    })
    playerHeads = true;

    @SwitchProperty({
        name: "&bSpirit Leap Names",
        description: "Show player's usernames on the map when holding spirit leaps or infinileap.",
        category: "Players",
        subcategory: "Player Names"
    })
    spiritLeapNames = true;

    @SwitchProperty({
        name: "&bAlways Show Names",
        description: "Always show player names on the map, even when not holding spirit leaps.",
        category: "Players",
        subcategory: "Player Names"
    })
    showPlayerNames = false;

    @SwitchProperty({
        name: "&bShow Player Ranks",
        description: "Show players ranks when their name is being rendered on the map.\nEg &fUnclaimedBloom6 &7-> &6[MVP&0++&6] UnclaimedBloom6&7.\n&aRequires API key. &b/lm setkey <api key>&a.",
        category: "Players",
        subcategory: "Player Names"
    })
    showPlayerRanks = true;

    @SwitchProperty({
        name: "&bShow Own Name",
        description: "If show spirit leap names is enabled, render your own name as well.",
        category: "Players",
        subcategory: "Player Names"
    })
    showOwnName = true;

    // ---------------------------------------------------------------
    // Rooms

    @SwitchProperty({
        name: "Darken Unexplored",
        description: "Darken unopened rooms on the map during the run. The rooms will not be darkened before the run begins.",
        category: "Rooms"
    })
    darkenUnexplored = true;

    @ColorProperty({
        name: "&8Wither Door Color",
        description: "Changes the wither door color.",
        category: "Rooms",
        subcategory: "Wither Doors"
    })
    witherDoorColor = new Color(0, 0, 0, 1);

    // Wither Door Esp
    @SwitchProperty({
        name: "&8Wither Door Esp",
        description: "Draws a box wither doors and blood door.\n&8- Suggested by epha & RestOps",
        category: "Rooms",
        subcategory: "Wither Doors"
    })
    witherDoorEsp = false;

    // Wither door esp color
    @ColorProperty({
        name: "&8Wither Door Esp Color",
        description: "The color of the box drawn around wither doors.",
        category: "Rooms",
        subcategory: "Wither Doors"
    })
    witherDoorEspColor = new java.awt.Color(1, 0, 0, 1);

    @SwitchProperty({
        name: "&dShow Rooms",
        description: "Always show room names on the map.\n&aNote: If you want to see room names but don't want them visible all the time, use the 'Peek Rooms' keybind in Controls.",
        category: "Rooms",
        subcategory: "Room Names"
    })
    showRoomNames = false;

    @SwitchProperty({
        name: "&dShow Puzzles",
        description: "Show puzzle names and trap room on the map.",
        category: "Rooms",
        subcategory: "Room Names"
    })
    showPuzzleNames = true;

    @SwitchProperty({
        name: "&dShow Secrets",
        description: "Show the secrets in each room on the map.",
        category: "Rooms",
        subcategory: "Secrets"
    })
    showSecrets = false;

    @SwitchProperty({
        name: "&dChange Puzzle Color",
        description: "Changes the color of the puzzle text depending on the checkmark in that room.\nNo longer displays original checkmark for the room.",
        category: "Rooms",
        subcategory: "Puzzles"
    })
    changePuzzleColor = false;
    
    @SelectorProperty({
        name: "&2Checkmark Style",
        description: "Show the names of puzzles on the map after they are opened.",
        category: "Rooms",
        subcategory: "Checkmarks",
        options: ["Regular", "Vanilla"]
    })
    checkmarkStyle = 0;

    @SwitchProperty({
        name: "Center Checkmarks",
        description: "Center checkmarks in larger rooms.",
        category: "Rooms",
        subcategory: "Checkmarks"
    })
    centerCheckmarks = false;
    
    @SwitchProperty({
        name: "&cWhite Checkmark Blood",
        description: "Puts a white checkmark on blood room once the watcher has finished spawning mobs, but they have not all been killed.",
        category: "Rooms",
        subcategory: "Blood"
    })
    whiteCheckBlood = true;

    @SwitchProperty({
        name: "&cScan Mimic",
        description: "Scans the dungeon for trapped chests to find where the mimic is and detects when it has been revealed.",
        category: "Rooms",
        subcategory: "Mimic"
    })
    scanMimic = false;

    @SwitchProperty({
        name: "&cShow Mimic Room",
        description: "Shows which room the mimic is in on the map.",
        category: "Rooms",
        subcategory: "Mimic"
    })
    showMimic = true;

    // ---------------------------------------------------------------
    // Radar

    // Star mob Esp
    @SwitchProperty({
        name: "&6Star Mob Esp",
        description: "Draws a box around starred mobs and minibosses.",
        category: "Radar",
        subcategory: "Star Mob ESP"
    })
    starMobEsp = false;

    // Star mob esp color
    @ColorProperty({
        name: "&6Star Mob Esp Color",
        description: "The color of the box drawn around starred mobs.",
        category: "Radar",
        subcategory: "Star Mob ESP"
    })
    starMobEspColor = new java.awt.Color(0, 1, 0, 1);

    @SwitchProperty({
        name: "&bRadar",
        description: "Shows the location of star mobs on the map.\n&aCan be toggled using the /star command if you only need it to find a lost mob.",
        category: "Radar"
    })
    radar = false;

    @SwitchProperty({
        name: "&bStar Mob Border",
        description: "Renders a small black border around starred mobs on the map.",
        category: "Radar",
        subcategory: "Star Mobs"
    })
    starMobBorder = true;

    @SwitchProperty({
        name: "&bMiniboss Colors",
        description: "Changes the color of minibosses on the map.",
        category: "Radar",
        subcategory: "Star Mobs"
    })
    minibossColors = true;

    @SwitchProperty({
        name: "&eRadar Heads",
        description: "Shows the mob's skin (like player icons) instead of a colored dot.",
        category: "Radar",
        subcategory: "Heads"
    })
    radarHeads = true;

    
    @PercentSliderProperty({
        name: "&eRadar Head Scale",
        description: "Size of the heads of starred mobs on the map.",
        category: "Radar",
        subcategory: "Heads"
    })
    radarHeadScale = 0.5;
    
    @SwitchProperty({
        name: "&cRadar Heads Border",
        description: "Display a border around star mobs on the map (Same as player heads).",
        category: "Radar",
        subcategory: "Border"
    })
    radarHeadsBorder = true;

    @ColorProperty({
        name: "&cRadar Heads Border Color",
        description: "If border is enabled, change the color to make the star mobs look better or stick out more on the map.",
        category: "Radar",
        subcategory: "Border"
    })
    radarHeadsBorderColor = Color.BLACK
    
    // Credits

    @ButtonProperty({
        name: "&a&lTenios",
        description: "First person to figure out how the actual score calculation worked and helped a bunch with room hashing idea and some other optimization.",
        category: "Credits",
        placeholder: " "
    })
    tenios() {};

    @ButtonProperty({
        name: "&2&lSoopyBoo32",
        description: "Provided a tool which allowed me to measure the lag caused by the module.",
        category: "Credits",
        placeholder: " "
    })
    soopy() {};

    @ButtonProperty({
        name: "&5&lSquagward &8(CT Developer)",
        description: "Fixed a memory leak caused by the game not disposing of the old map images properly.",
        category: "Credits",
        placeholder: " "
    })
    squagward() {};

    @ButtonProperty({
        name: "&f&lLcarusPhantom",
        description: "Code for smooth RGB for the map border.",
        category: "Credits",
        placeholder: " "
    })
    lcarus() {};

    @ButtonProperty({
        name: "&d&lChatTriggers Discord",
        description: "General code help. Filled with a bunch of really cool people who have helped me tremendously with a lot of CT related stuff.",
        category: "Credits",
        placeholder: " "
    })
    ctdiscord() {};



}

export default new Config()