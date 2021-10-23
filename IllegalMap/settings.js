import {
    @ButtonProperty,
    Color,
    @ColorProperty,
    @PercentSliderProperty,
    @SelectorProperty,
    @TextProperty,
    @SwitchProperty,
    @SliderProperty,
    @Vigilant,
} from '../Vigilance/index';

@Vigilant("IllegalMap")
class Settings {

    constructor() {
        this.initialize(this)
        this.setCategoryDescription("Map", "&c&lWARNING: THIS MOD IS BANNABLE. USE AT OWN RISK\n\nTo make the map show, go to Controls -> Map and set the 'Refresh Map' bind. Pressing it will make the map show.")
        this.setCategoryDescription("Aesthetics", "Settings related to how the map looks")
        this.setCategoryDescription("Icons", "Icons that are rendered ontop of the map")
        this.setCategoryDescription("Rooms", "Text overlays ontop of the rooms\n\n&aNOTE: The \"Peek Rooms\" keybind enables the Show Secrets option, and shifting whilst holding enables Show Room Names on the map.")
        this.setCategoryDescription("World", "Things related to rendering stuff in the world.")
        this.setCategoryDescription("Score Calculator", "Makes an accurate calculation about the current score of the dungeon and shows it under the map.\n\n&6Big thanks to Tenios for helping with the skill score calculation")
    }

    // Settings

    @SwitchProperty({
        name: "&a&lLegit Mode",
        description: "Make IllegalMap slighyly less illegal. (Not guaranteed to be allowed if this is enabled, still way less cheaty nonetheless)\n&cNOTE: Dungeon still needs to be scanned for anything to work. Recommend enabling Auto Scan.",
        category: "Map",
        subcategory: "Legit Mode"
    })
    legitMode = true;

    @SwitchProperty({
        name: "&6Update Messages",
        description: "Notify you when there is a new IllegalMap version available.",
        category: "Map",
        subcategory: "Updates"
    })
    notifyUpdates = true;

    @SwitchProperty({
        name: "Auto Scan",
        description: "Automatically scans the dungeon until the entire dungeon has been scanned. If Chat Info is enabled, it will say the Chat Info after all of the chunks have been loaded.",
        category: "Map",
        subcategory: "Map"
    })
    autoScan = true;

    @SwitchProperty({
        name: "Darken Unexplored",
        description: "Makes it so that unexplored rooms show up darker on the map.",
        category: "Map",
        subcategory: "Map"
    })
    darkenUnexplored = true;

    @SliderProperty({
        name: "Unexplored Room Opacity",
        description: "How transparent unexplored rooms are.\n&8 - Suggested by Hosted.",
        category: "Aesthetics",
        min: 0,
        max: 255
    })
    unexploredTransparency = 255;

    @SwitchProperty({
        name: "Hide Map In Boss",
        description: "Don't render the map when you enter boss.",
        category: "Map",
        subcategory: "Map"
    })
    hideInBoss = false;

    @SwitchProperty({
        name: "Hide Map Outside Dungeon",
        description: "Don't render the map when you're not in a dungeon.",
        category: "Map",
        subcategory: "Map"
    })
    hideOutsideDungeon = true;

    @SwitchProperty({
        name: "Reset Map After Dungeon",
        description: "Automatically make the map blank after exiting a dungeon.",
        category: "Map",
        subcategory: "Map"
    })
    autoResetMap = true;

    @SwitchProperty({
        name: "Map Enabled",
        description: "Enables the map.",
        category: "Map",
        subcategory: "Map"
    })
    mapEnabled = true;

    @SwitchProperty({
        name: "Chat Info",
        description: "Sends information about the dungeon every time the map has been fully scanned.",
        category: "Map",
        subcategory: "Map"
    })
    mapChatInfo = true;

    // ---------------------------------------------------------------------------------------------

    @SwitchProperty({
        name: "Collect Dungeon Data",
        description: "After a dungeon has been fully scanned, log details about its secrets, crypts, rooms, wither doors etc to a JSON file and increment the rooms that appear in it.\n&aDoes not store information that can be used to identify players. Data is safe to be shared, not applicable to most people though.\n&cNOTE: DATA IS NOT SENT TO ANYWHERE. ONLY YOU HAVE ACCESS TO THIS.",
        category: "Data Collection",
        subcategory: "Dungeons"
    })
    collectDungeonData = true;

    @ButtonProperty({
        name:"/dlogs",
        description:"Shows information about your logged dungeon runs including average secrets, crypts, wither doors.",
        category:"Data Collection"
    })
    jfhdgkjsdhfgsblvjshdfghkh() {};

    // ---------------------------------------------------------------------------------------------

    @SliderProperty({
        name: "Map X",
        description: "How far across your screen the map shows.",
        category: "Aesthetics",
        min: 0,
        max: Renderer.screen.getWidth()
    })
    mapX = 1;

    @SliderProperty({
        name: "Map Y",
        description: "How far up/down on your screen the map is.",
        category: "Aesthetics",
        min: 0,
        max: Renderer.screen.getHeight()
    })
    mapY = 1;

    @SliderProperty({
        name: "Map Scale",
        description: "How large the map is.",
        category: "Aesthetics",
        min: 1,
        max: 10
    })
    mapScale = 5;

    @SliderProperty({
        name: "Map Background Opacity",
        description: "How transparent the background of the map is. 255 = Not transparent, 0 = Fully transparent.",
        category: "Aesthetics",
        min: 0,
        max: 255
    })
    backgroundTransparency = 100;

    @ColorProperty({
        name: "Map Background Color",
        description: "yeah",
        category: "Aesthetics",
    })
    backgroundColor = Color.BLACK;

    @SwitchProperty({
        name: "&cM&ea&6p &aR&bG&dB",
        description: "Makes a thin RGB border around the map.",
        category: "Aesthetics"
    })
    mapRGB = false

    @ColorProperty({
        name: "Wither Door Color",
        description: "Color of the unopened wither doors on the map.",
        category: "Aesthetics",
    })
    witherDoorColor = Color.GRAY;

    //----------------------------------------------------------------------------------------------------------

    @SwitchProperty({
        name: "Show Player Heads",
        description: "Shows other player's heads on the map.",
        category: "Icons",
        subcategory: "Player Icons"
    })
    showHeads = true;

    @PercentSliderProperty({
        name: "Head Icon Scale",
        description: "How large the players' head icons are.",
        category: "Icons",
        subcategory: "Player Icons"
    })
    headScale = 0.3;

    @SwitchProperty({
        name: "Show Player Head Names",
        description: "Shows player's names underneath their icon on the map.",
        category: "Icons",
        subcategory: "Player Icons"
    })
    showIconNames = false;

    @SwitchProperty({
        name: "Show Own Head",
        description: "Shows your own head on the map (Even before dungeon has started).",
        category: "Icons",
        subcategory: "Player Icons"
    })
    showOwnHead = true;

    @SelectorProperty({
        name: "Checkmarks",
        description: "Checkmarks that get shown for completed rooms.\n&8 - Thanks to Hosted for supplying png's for new checkmarks",
        category: "Icons",
        subcategory: "Checkmarks",
        options: ["None", "Classic", "New", "Vanilla"],
    })
    checkmarks = 2;

    @SwitchProperty({
        name: "Show Names When Holding Leaps",
        description: "Shows each player's username on the map while you are holding Spirit Leaps.",
        category: "Icons",
        subcategory: "Player Icons"
    })
    leapsShowNames = true;

    //----------------------------------------------------------------------------------------------------------

    @SwitchProperty({
        name: "Show Important Names",
        description: "Shows the room names of only trap and puzzle.",
        category: "Rooms"
    })
    showImportantRooms = true;

    @SwitchProperty({
        name: "Show All Room Names",
        description: "Shows the room names of every room.",
        category: "Rooms"
    })
    showAllRooms = false;

    @SwitchProperty({
        name: "Show Secrets",
        description: "Shows the secrets in each room.",
        category: "Rooms"
    })
    showSecrets = false;
    
    @SwitchProperty({
        name: "Show Crypts",
        description: "Shows how many crypts are in each room",
        category: "Rooms",
        // subcategory: "Map"
    })
    showCrypts = false;

    // -------------------------------------------------------------------------------

    @SwitchProperty({
        name: "Wither Doors Esp",
        description: "Draws a baritone box around wither doors and the blood door. Boxes disappear when you go close to them.\n&8- Suggested by epha & RestOps",
        category: "World",
        subcategory: "Wither Door ESP"
    })
    witherDoorEsp = false;

    @ColorProperty({
        name: 'Wither Door ESP Color',
        description: 'What color the wither door ESP boxes render.\n&cNOTE: Color picker must be on the very edge otherwise the ESP box will be white.',
        category: 'World',
        subcategory: 'Wither Door ESP',
    })
    witherDoorEspColor = Color.RED;

    @SwitchProperty({
        name: "Star Mob ESP",
        description: "Draws a box around starred mobs that can be seen through walls.",
        category: "World",
        subcategory: "Star Mob ESP"
    })
    starMobEsp = false;

    @ColorProperty({
        name: 'Star Mob ESP Color',
        description: 'What color the box around starred mobs is.\n&cNOTE: Color picker must be on the very edge otherwise the ESP box will be white.',
        category: 'World',
        subcategory: 'Star Mob ESP',
    })
    starMobEspColor = Color.WHITE;

    //----------------------------------------------------------------------------------------------------------

    // @SwitchProperty({
    //     name: "Enable Score Calculator",
    //     description: "Shows the score calc under the dungeon map.",
    //     category: "Score Calculator"
    // })
    // scoreCalc = true;

    @SelectorProperty({
        name: "Score Calculator",
        description: "Enable or disable the score calculator",
        category: "Score Calculator",
        subcategory: "Score Calculator",
        options: ["Disabled", "Under Map", "Seperate"],
    })
    scoreCalc = 1;

    @SliderProperty({
        name: "Score Calculator X",
        description: "How far across your screen the Score Calculator is (If you have it seperate).",
        category: "Score Calculator",
        subcategory: "Settings",
        min: 0,
        max: Renderer.screen.getWidth()
    })
    scoreCalcX = 1;

    @SliderProperty({
        name: "Map Y",
        description: "How far up/down on your screen the Score Calculator is.",
        category: "Score Calculator",
        subcategory: "Settings",
        min: 0,
        max: Renderer.screen.getHeight()
    })
    scoreCalcY = 1;

    @SwitchProperty({
        name: "Announce 300",
        description: "Says \"300 Score Reached!\" In party chat once you reach 300 score.",
        category: "Score Calculator",
        subcategory: "300 Reached",
    })
    say300 = false;

    @TextProperty({
        name: "300 Score Reached Messagge",
        description: "The message that will be sent into party chat when 300 score has been reached. (If announce 300 is enabled)",
        category: "Score Calculator",
        subcategory: "300 Reached",
        placeholder: "300 Score Reached!",
    })
    say300Message = "300 Score Reached!";

    @SwitchProperty({
        name: "Seperate In Boss",
        description: "If Hide Map in Boss is set to false, still show the score calculator while you're in boss as if it was set to 'Seperate'.",
        category: "Score Calculator",
        subcategory: "Settings",
    })
    seperateInBoss = true;

    @SwitchProperty({
        name: "Assume Spirit Pet",
        description: "Assumes the first player to die is using a spirit pet and only subtract 1 score for the death.",
        category: "Score Calculator",
        subcategory: "Settings"
    })
    assumeSpirit = true;

    @SwitchProperty({
        name: "Paul &d❤",
        description: "Adds +10 to the bonus score.",
        category: "Score Calculator",
        subcategory: "Settings"
    })
    ezpzPaul = false;

    //----------------------------------------------------------------------------------------------------------

}

export default new Settings