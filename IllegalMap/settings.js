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
        this.setCategoryDescription("Aethetics", "Settings related to how the map looks")
        this.setCategoryDescription("Icons", "Icons that are rendered ontop of the map")
        this.setCategoryDescription("Rooms", "Text overlays ontop of the rooms")
        this.setCategoryDescription("World", "Things related to rendering stuff in the world.")
        this.setCategoryDescription("Score Calculator", "Makes a (fairly) accurate calculation about the current score of the dungeon and shows it under the map.\n\n&cWARNING: Not 100% reliable.")
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
        name: "Auto Scan",
        description: "Automatically scans the dungeon for the first 10 seconds after you warp into a dungeon.\n&cWARNING: Will not scan whole dungeon if chunks are not loaded.",
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
        category: "Aethetics",
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
    hideOutsideDungeon = false;

    @SwitchProperty({
        name: "Reset Map After Dungeon",
        description: "Automatically make the map blank after exiting a dungeon.",
        category: "Map",
        subcategory: "Map"
    })
    autoResetMap = true;

    @SwitchProperty({
        name: "Map Enabled",
        description: "Shows the map on-screen.",
        category: "Map",
        subcategory: "Map"
    })
    mapEnabled = true;

    @SwitchProperty({
        name: "Chat Info",
        description: "Sends information about the dungeon every time you refresh.",
        category: "Map",
        subcategory: "Map"
    })
    mapChatInfo = true;

    // ---------------------------------------------------------------------------------------------

    @SliderProperty({
        name: "Map X",
        description: "How far across your screen the map shows.",
        category: "Aethetics",
        min: 0,
        max: Renderer.screen.getWidth()
    })
    mapX = 1;

    @SliderProperty({
        name: "Map Y",
        description: "How far up/down on your screen the map is.",
        category: "Aethetics",
        min: 0,
        max: Renderer.screen.getHeight()
    })
    mapY = 1;

    @SliderProperty({
        name: "Map Scale",
        description: "How large the map is.",
        category: "Aethetics",
        min: 1,
        max: 10
    })
    mapScale = 5;

    @SliderProperty({
        name: "Map Background Opacity",
        description: "How transparent the background of the map is. 255 = Not transparent, 0 = Fully transparent.",
        category: "Aethetics",
        min: 0,
        max: 255
    })
    backgroundTransparency = 100;

    @ColorProperty({
        name: "Map Background Color",
        description: "yeah",
        category: "Aethetics",
    })
    backgroundColor = Color.BLACK;

    @SwitchProperty({
        name: "&cM&ea&6p &aR&bG&dB",
        description: "Makes a thin RGB border around the map.",
        category: "Aethetics"
    })
    mapRGB = false

    @ColorProperty({
        name: "Wither Door Color",
        description: "Color of the unopened wither doors on the map.",
        category: "Aethetics",
    })
    witherDoorColor = Color.GRAY;

    //----------------------------------------------------------------------------------------------------------

    @SwitchProperty({
        name: "Show Player Heads",
        description: "Shows player heads on the map.\n&cWARNING: Very unoptimized, may cause lag. Not super accurate lol",
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
        name: "Show New Rooms",
        description: "Shows new rooms on the map.",
        category: "Rooms"
    })
    showNewRooms = false;

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
    showCrypts = true;

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
    scoreCalc = 2;

    @SliderProperty({
        name: "Score Calculator X",
        description: "How far across your screen the Score Calculator is (If you have it seperate).",
        category: "Score Calculator",
        min: 0,
        max: Renderer.screen.getWidth()
    })
    scoreCalcX = 1;

    @SliderProperty({
        name: "Map Y",
        description: "How far up/down on your screen the Score Calculator is.",
        category: "Score Calculator",
        min: 0,
        max: Renderer.screen.getHeight()
    })
    scoreCalcY = 1;

    @SwitchProperty({
        name: "Announce 300",
        description: "Says \"300 Score Reached!\" In party chat once you reach 300 score.",
        category: "Score Calculator"
    })
    say300 = true;

    @TextProperty({
        name: "300 Score Reached Messagge",
        description: "The message that will be sent into party chat when 300 score has been reached.",
        category: "Score Calculator",
        placeholder: "300 Score Reached!",
    })
    say300Message = "300 Score Reached!";

    @SwitchProperty({
        name: "Assume Mimic",
        description: "Assumes mimic has been killed while playing on floor 6 or 7.",
        category: "Score Calculator"
    })
    assumeMimic = true;

    @SwitchProperty({
        name: "Assume Spirit Pet",
        description: "Assumes the first player to die is using a spirit pet and only subtract 1 score for the death.",
        category: "Score Calculator"
    })
    assumeSpirit = true;

    @SwitchProperty({
        name: "Paul &d❤",
        description: "Adds +10 to the bonus score.",
        category: "Score Calculator"
    })
    ezpzPaul = false;

    //----------------------------------------------------------------------------------------------------------

}

export default new Settings