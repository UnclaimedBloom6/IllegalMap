//
// By UnclaimedBloom6
//
//
// v1.1.0 - Added secrets/score calc
//
// v1.1.1 - Added darken unexplored rooms
//
// v1.1.2 - Fixed 300 score reached not working at all
//
// v1.1.4 - Numerous bugs fixed/some features added
//
//	- Fixed assumed mimic being on permanently
//	- Fixed boss room from showing as dungeon rooms on smaller dungeonSecrets
// 	- Fixed announce 300 not working
// 	- Option to hide map outside of dungeon
// 	- Option to hide map in boss room
// 	- Add map background transparency option
//
// v1.1.5 - Added peek room names
//
// v1.1.6 - Fixed inBoss thing (Thanks AzuredNoob)
//
// v1.1.7 - Bug fixes, rewriting some parts
// 	- Fixed a room not detecting
// 	- Redid score calc to count incomplete rooms
// 	- Changed order of some of the score calc stuff
// 	- Fixed SBA hide mort messages not resetting 'say300'
//	- Paul Option
//	- Map RGB border is actually a border now
//
// v1.1.8 - Some new rooms, more 300 score bs
//	- Customize 300 score reached message
//
// v1.1.81 - New room & removed debug message left in from 1.1.8
//
// v1.2.0 - Major features added
//	- Wither door ESP
//	- Show player heads
//	- Show player names on map
//	- Checkmarks
// 	- Changed functionality of peek keybind, hold to show secrets and puzzles/trap, 
//	  hold shift ontop of that to show room names
// 	- Fixed hide map in boss not working
//	- Probably some other stuff that I forgot
//
// v1.2.1 - Forgot lol
//
// v1.2.2 - Bunch of stuff
//	- Made the auto scan toggle actually do something
// 	- Added new checkmark style (Thanks Hosted)
//	- Overhauled /dmap settings to be more categories with less settings per
// 	- Background color for map
//	- Improved auto scan
// 	- Made the refresh keybind not spammable
//
// v1.2.3 - Bug fixes and minor features
//	- Fixed checkmarks not working when darken unexplored is disabled
//	- Fixed doors still being dark when darken unexplored is disabled
//	- Vanilla checkmarks option
//	- Show names under player heads while holding spirit leaps
//	- Made text align better with different scales
//
// v1.2.4 - More small stuff
//	- Player heads on map show both layers of the players' skin
//	- Mob ESP Keybind
//	- Convert wither doors to regular doors after they have been opened
//
// v1.2.5 - idk
//	- Total crypts
//	- Unexplored rooms transparency slider
//	- Changed how roomColors is stored
//	- Auto Scan lasts 10 seconds instead of 7
//	- Made player heads more accurate
//
// v1.3.0 - Legit mode and other stuff
//	- Fixed autoscan doing stuff if the dungeon warp fails
//	- Fixed autoscan spamming chat
//	- Make heads appear as markers when blank
//	- Blood door shows with wither door esp
//	- Seperate score calc overlay
//	- Legit Mode
//	- Added total secrets and total crypts into Chat Info
//	- Score calc stuff is centered better under the map
//
// v1.3.1 - Some stuff
//	- Removed NEW rooms (They are regular rooms now)
//	- Improved AutoScan, now scans until the dungeon is fully loaded 
//	  (And sends the ChatInfo message only after the whole map is loaded)
//	- Option to log all dungeons to a JSON file and allow the user to see their average secrets, crypts, wither doors etc via /dlogs
//	- Made first time message show even if the player installs IllegalMap when the game isn't running
//	- Head icons are actually reliable now (THANKS DEBUG YOU ARE KIND OF COOL)
//	- Map renders properly on lower floors now
//
// v1.3.2 - Fixed some bugs
//	- Fixed bug that would cause the map to stop rendering after the first run
//	- Made it so that the score calc set to 'seperate' still shows when the map is disabled
//	- Changed some settings under score calc to make them ordered more conveniently
//
// v1.4.0 - Major updates to Rendering and Score Calculator
//	- Your own head should load all of the time
//	- Option for score calc to get set to Seperate and then stay displayed if hide map in boss is set to false
//	- Improved full map loaded detection with autoscan
//	- Made the explore score more accurate
// 	- Made Score Calculator much more accurate when there are incomplete rooms
// 		- Huge thanks to Tenios for figuring out how the skill score is actually calculated
//	- Fixed typo "Aesthetics" in settings
//	- Completely redid how the map is rendered on the screen. It is MUCH more optimized now
// 	- Changed "green" room to "entrance" in the code because it makes more sense
// 	- Reliable mimic detection
//	- Removed assume mimic
//	- Added trap status to the score calc, removed puzzles ?/?
//	- Adjusted the head position on the map slightly to be more accurate
//	- Added update checker
//
// v1.4.1 - Bug fixes / QOL stuff
//	- Drag to move the map and score calc gui (Finally)
//	- Seperate score calc disappears when not in dungeon
//	- Fixed player icons not being in the right place with higher map scales
//	- Fixed unexplored transparency applying to explored rooms
//	- Fixed map staying disabled if setting enabled then re-enabled
// v1.4.2 - More bug fixes
//	- Fixed hide outside of dungeon not working
//	- Fixed hide in boss not working
//	- Fixed trap completion not detecting when checkmarks are disabled
//	- Fixed unexplored opacity not working with space between main rooms
//	- Fixed mimic falsely triggering when a trapped chest was unloaded (Hopefully)
//
//
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Settings from "./settings"
import settings from "./settings"
import RenderLib from "../RenderLib"
import request from "../requestV2"

const BlockPos = Java.type("net.minecraft.util.BlockPos")
const Blocks = Java.type("net.minecraft.init.Blocks")
const GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager")
const GL11 = Java.type("org.lwjgl.opengl.GL11")
const BufferedImage = Java.type("java.awt.image.BufferedImage")
const TileEntityChest = Java.type("net.minecraft.tileentity.TileEntityChest")

// Keybinds
const refreshBind = new KeyBind("Refresh Map", Keyboard.KEY_NONE, "Map")
const peekRoomNames = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "Map")
const starMobsBind = new KeyBind("Toggle Star Mobs", Keyboard.KEY_NONE, "Map")

// Unknown player head icon
const vanillaMapIcon = new Image("vanillaMapIcon.png", "https://i.imgur.com/GKHfOCt.png")

// Vanilla Checkmarks with Black Borders
const greenCheck = new Image("greenCheck.png", "https://i.imgur.com/eM2SAFe.png")
const whiteCheck = new Image("whiteCheck.png", "https://i.imgur.com/01NCsWX.png")
const failedRoom = new Image("failedRoom.png", "https://i.imgur.com/8kUDvFj.png")
const questionMark = new Image("questionMark.png", "https://i.imgur.com/UxofiYV.png")

// New Checkmarks
const greenCheck2 = new Image("greenCheck2.png", "https://i.imgur.com/GQfTfmp.png")
const whiteCheck2 = new Image("whiteCheck2.png", "https://i.imgur.com/9cZ28bJ.png")
const failedRoom2 = new Image("failedRoom2.png", "https://i.imgur.com/qAb4O9H.png")
const questionMark2 = new Image("questionMark2.png", "https://i.imgur.com/kp92Inw.png")

// Vanilla Checkmarks
const greenCheckVanilla = new Image("greenCheckVanilla.png", "https://i.imgur.com/ywrakP5.png")
const whiteCheckVanilla = new Image("whiteCheckVanilla.png", "https://i.imgur.com/mMbSla0.png")
const failedRoomVanilla = new Image("failedRoomVanilla.png", "https://i.imgur.com/9v8mXZI.png")
const questionMarkVanilla = new Image("questionMarkVanilla.png", "https://i.imgur.com/nlioJkX.png")

const prefix = "&8[&7Map&8]"

register("command", () => Settings.openGUI()).setName("dmap")

// Visualization Stuff
function setDiamond(x, y, z) { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150484_ah.func_176223_P()) }
function setEmerald(x, y, z) { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150475_bE.func_176223_P()) }
function setGold(x, y, z) { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150340_R.func_176223_P()) }
function setCoal(x, y, z) { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150402_ci.func_176223_P()) }

function s(message) { ChatLib.chat(message) }
function checkForBlockBelow(x, z) {
	for (let y = 68; y > 0; y--) {
		if (World.getBlockAt(x, y, z).getRegistryName() !== "minecraft:air") {
			return true
		}
	}
	return false
}
function isBetween(a, b, c) { return (a - b) * (a - c) <= 0 }
function renderCenteredText(text, x, y, scale, splitWords) {
	let split = splitWords ? text.split(" ") : [text]
	for (let i = 0; i < split.length; i++) {
		let word = split[i]
		Renderer.scale(0.1 * scale, 0.1 * scale)
		Renderer.drawStringWithShadow(word, x - Renderer.getStringWidth(ChatLib.removeFormatting(word)) / 2, y + (i * scale * 1.75) - (split.length * scale) / 2)
	}
}
function getDistance(x1, y1, z1, x2, y2, z2) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2)
}

// Gets a player's face - Both layers of their skin as an Image
function getPlayerIcon(playerName) {
	try {
		let player = World.getPlayerByName(playerName)
		if (player == null) {
			return vanillaMapIcon
		}
		// Thanks to Debug in the ChatTriggers discord for saving me the headache and sending me this
		return new Image(javax.imageio.ImageIO.read(new java.net.URL(`https://visage.surgeplay.com/face/${player.getUUID()}`)))
	}
	catch (error) { return vanillaMapIcon }
}

// From DungeonUtilities
const drawBox = (entity, red, entrance, blue, lineWidth, width, height, partialTicks, yOffset) => {
	if (width === null) {
		width = entity.getWidth()
	}
	if (height === null) {
		height = entity.getHeight()
	}
	if (yOffset == null | yOffset == undefined) {
		yOffset = 0
	}

	GL11.glBlendFunc(770, 771);
	GL11.glEnable(GL11.GL_BLEND);
	GL11.glLineWidth(lineWidth);
	GL11.glDisable(GL11.GL_TEXTURE_2D);
	GL11.glDisable(GL11.GL_DEPTH_TEST);
	GL11.glDepthMask(false);
	GlStateManager.func_179094_E();

	let positions = [
		[0.5, 0.0, 0.5],
		[0.5, 1.0, 0.5],
		[-0.5, 0.0, -0.5],
		[-0.5, 1.0, -0.5],
		[0.5, 0.0, -0.5],
		[0.5, 1.0, -0.5],
		[-0.5, 0.0, 0.5],
		[-0.5, 1.0, 0.5],
		[0.5, 1.0, -0.5],
		[0.5, 1.0, 0.5],
		[-0.5, 1.0, 0.5],
		[0.5, 1.0, 0.5],
		[-0.5, 1.0, -0.5],
		[0.5, 1.0, -0.5],
		[-0.5, 1.0, -0.5],
		[-0.5, 1.0, 0.5],
		[0.5, 0.0, -0.5],
		[0.5, 0.0, 0.5],
		[-0.5, 0.0, 0.5],
		[0.5, 0.0, 0.5],
		[-0.5, 0.0, -0.5],
		[0.5, 0.0, -0.5],
		[-0.5, 0.0, -0.5],
		[-0.5, 0.0, 0.5]
	]

	let counter = 0;

	Tessellator.begin(3).colorize(red, entrance, blue);
	positions.forEach(pos => {
		Tessellator.pos(
			entity.getX() + (entity.getX() - entity.getLastX()) * partialTicks + pos[0] * width,
			entity.getY() + yOffset + (entity.getY() - entity.getLastY()) * partialTicks + pos[1] * height,
			entity.getZ() + (entity.getZ() - entity.getLastZ()) * partialTicks + pos[2] * width
		).tex(0, 0);

		counter++;
		if (counter % 2 === 0) {
			Tessellator.draw();
			if (counter !== 24) {
				Tessellator.begin(3).colorize(red, entrance, blue);
			}
		}
	});

	GlStateManager.func_179121_F();
	GL11.glEnable(GL11.GL_TEXTURE_2D);
	GL11.glEnable(GL11.GL_DEPTH_TEST);
	GL11.glDepthMask(false);
	GL11.glDisable(GL11.GL_BLEND);
}

const entryMessages = [
	"[BOSS] Bonzo: Gratz for making it this far, but I’m basically unbeatable.",
	"[BOSS] Scarf: This is where the journey ends for you, Adventurers.",
	"[BOSS] The Professor: I was burdened with terrible news recently...",
	"[BOSS] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!",
	"[BOSS] Livid: Welcome, you arrive right on time. I am Livid, the Master of Shadows.",
	"[BOSS] Sadan: So you made it all the way here...and you wish to defy me? Sadan?!",
	"[BOSS] Necron: Finally, I heard so much about you. The Eye likes you very much."
]

let debugMode = false
register("command", () => { debugMode = !debugMode }).setName("dmapdebug") // Visualization. Sets blocks above the dungeon to diamond, gold etc.

let wholeDungeonLoaded = false
let fullyScanned = false
let corners = { "start": [0, 0], "end": [191, 191] }
let inDungeon = false
let dungeonFloor = null
let dungeonPuzzles = [0, 0]
let dungeonSecrets = 0
let dungeonCrypts = 0
let dungeonDeaths = 0
let completedRooms = 0
let saidIfSPlus = false
let overflowSecrets
const mimicFloors = ["F6", "F7", "M6", "M7"]
let mapOffset = [24, 13]
let playerIcons = {}
let dungeonParty = {} // {"playerName":headIcon}
let autoScanning = false
let scanning = false
let lastSecrets = 0
let lastCrypts = 0
let mimicKilled = false
let trapDone = false
let yellowDone = false
let bloodDone = false
let mimicLocations = []

// Getting info from the scoreboard and tablist about the dungeon
register("tick", () => {
	let dung = false
	Scoreboard.getLines().forEach(x => {
		let unformatted = ChatLib.removeFormatting(x)
		if (/ ⏣ The Catac.+ombs \(.+\)/.test(unformatted)) {
			dungeonFloor = unformatted.match(/ ⏣ The Catac.+ombs \((.+)\)/)[1]
			inDungeon = true
			dung = true
		}
	})
	inDungeon = dung ? true : false
	if (!inDungeon) { return }
	let lines = TabList.getNames()
	try {
		if (inDungeon) {
			dungeonSecrets = parseInt(ChatLib.removeFormatting(lines[31]).split(": ")[1])
			dungeonCrypts = parseInt(ChatLib.removeFormatting(lines[32]).split(": ")[1])
			dungeonDeaths = parseInt(ChatLib.removeFormatting(lines[25]).match(/Deaths: \((\d+)\)/)[1])
			completedRooms = parseInt(ChatLib.removeFormatting(lines[43]).match(/.+Completed Rooms: (\d+)/)[1])
			dungeonPuzzles = [0, 0]
			dungeonPuzzles[0] = parseInt(ChatLib.removeFormatting(lines[46]).match(/Puzzles: \((\d+)\)/)[1])
			overflowSecrets = dungeonSecrets > totalSecrets ? dungeonSecrets - totalSecrets : 0
			for (let i = 0; i < 5; i++) {
				if (lines[47 + i].includes("✔")) {
					dungeonPuzzles[1]++
				}
			}
		}
	}
	catch (error) {
		dungeonSecrets = 0
		dungeonCrypts = 0
		dungeonDeaths = 0
		dungeonPuzzles = [0, 0]
		overflowSecrets = 0
	}

	if (dungeonFloor == "F1" || dungeonFloor == "M1") { corners["end"] = [127, 159] }
	else if (dungeonFloor == "F2" || dungeonFloor == "M2") { corners["end"] = [159, 159] }
	else if (dungeonFloor == "F3" || dungeonFloor == "M3") { corners["end"] = [159, 159] }
	else { corners["end"] = [191, 191] }

})

register("worldLoad", () => {
	wholeDungeonLoaded = false
	fullyScanned = false
	saidIfSPlus = false
	mimicKilled = false
	inBoss = false
	inDungeon = false
	mimicLocations = []

	if (settings.autoResetMap) { dungeonMap = [] }
})

register("tick", () => {
	if (refreshBind.isPressed()) {
		refreshMap()
	}
	if (starMobsBind.isPressed()) {
		settings.starMobEsp = !settings.starMobEsp
		s(`${prefix} &aStar Mobs set to ${settings.starMobEsp}`)
	}
	if (settings.autoScan && inDungeon) {
		// If the dungeon is fully loaded then scan it one last time
		if (wholeDungeonLoaded && !fullyScanned && !scanning) {
			// s("&aScanning, fully loaded")
			autoScanning = false
			refreshMap()
			fullyScanned = true
		}
		// If the dungeon isn't fully loaded then scan it anyway because something to look at
		else if (!wholeDungeonLoaded && !fullyScanned && !scanning) {
			// s("&cScanning, not fully loaded")
			autoScanning = true
			refreshMap()
		}
	}
})

// Get the player's own head
let myHead = vanillaMapIcon
register("step", () => {
	if (myHead !== vanillaMapIcon) { return } 
	new Thread(() => {
		myHead = getPlayerIcon(Player.getName())
	}).start()
}).setFps(1)

// Sets wither doors back to regular doors once they've been opened
register("step", () => {
	if (!inDungeon) { return }
	new Thread(() => {
		if (dungeonMap === []) { return }
		for (let i = 0; i < dungeonMap.length; i++) {
			for (let j = 0; j < dungeonMap[i].length; j++) {
				if (dungeonMap[i][j].roomType == "witherDoor") {
					if (World.getBlockAt(dungeonMap[i][j].x, 69, dungeonMap[i][j].z).getRegistryName() !== "minecraft:coal_block") {
						dungeonMap[i][j].roomType = "door"
					}
				}
			}
		}
	}).start()
}).setFps(5)

// All players in dungeon party - from TabList
register("tick", () => {
	if (!inDungeon) { return }
	let tabList = TabList.getNames()
	let tempArr = []
	if (tabList["1"] !== "") { tempArr.push(ChatLib.removeFormatting(tabList["1"]).split(" ")[0]) }
	if (tabList["5"] !== "") { tempArr.push(ChatLib.removeFormatting(tabList["5"]).split(" ")[0]) }
	if (tabList["9"] !== "") { tempArr.push(ChatLib.removeFormatting(tabList["9"]).split(" ")[0]) }
	if (tabList["13"] !== "") { tempArr.push(ChatLib.removeFormatting(tabList["13"]).split(" ")[0]) }
	if (tabList["17"] !== "") { tempArr.push(ChatLib.removeFormatting(tabList["17"]).split(" ")[0]) }
	tempArr.forEach(player => {
		if (player !== "" && !Object.keys(dungeonParty).includes(player)) {
			dungeonParty[player] = vanillaMapIcon
		}
	})
})

// Get player head for all dungeon party members
register("step", () => {
	if (!inDungeon) { return }
	// s(JSON.stringify(dungeonParty))
	Object.keys(dungeonParty).forEach(player => {
		if (dungeonParty[player] == vanillaMapIcon && player !== Player.getName()) {
			new Thread(() => {
				dungeonParty[player] = getPlayerIcon(player)
			}).start()
		}
	})
}).setFps(1)

// Chat events
register("chat", event => {
	let formatted = ChatLib.getChatMessage(event, true)
	let unformatted = ChatLib.removeFormatting(formatted)
	entryMessages.forEach(message => {
		if (unformatted == message) {
			inBoss = true
		}
	})
})

// Code from AlonAddons (Thanks Alon)
register("entityDeath", (entity) => {
	if (!inDungeon) { return; }
	new Thread(() => {
		if (entity.getClassName() === "EntityZombie") {
			if (entity.getEntity().func_70631_g_()) {
				if (entity.getEntity().func_82169_q(0) === null && entity.getEntity().func_82169_q(1) === null && entity.getEntity().func_82169_q(2) === null && entity.getEntity().func_82169_q(3) === null) {
					mimicKilled = true
				}
			}
		}
	}).start()
})

let roomColors = {
	"wall": [[45, 45, 45], [14, 14, 14]], 						// Wall of Dungeon / Background
	"normal": [[107, 58, 17], [34, 21, 10]],	   				// Brown Rooms
	"entrance": [[20, 133, 0], [20, 31, 19]],     				// Entrance Room
	"blood": [[255, 0, 0], [90, 8, 8]],       					// Blood Room
	"puzzle": [[117, 0, 133], [47, 6, 53]],     				// Puzzle
	"witherDoor": [[13, 13, 13], [150, 150, 150]],    			// Wither Door
	"yellow": [[254, 223, 0], [118, 87, 0]],      				// Yellow Room
	"fairy": [[224, 0, 255], [43, 21, 46]],       				// Fairy Room
	"trap": [[216, 127, 51], [94, 62, 35]],       				// Trap
	"door": [[92, 52, 14], [41, 25, 12]],      					// Regular Door
	"bloodDoor": [[231, 0, 0], [37, 15, 15]],					// Blood Door
	"entryDoor": [[20, 133, 0], [20, 31, 19]],					// Entry door
	"unexplored": [[65, 65, 65], [65, 65, 65]],					// Unexplored rooms (Legit Mode)
}

// yeah
class Room {
	constructor(x = 0, z = 0, roomName = "Unknown", roomType = "normal", isLarge = false, secrets = 0, yLevel, crypts) {
		this.x = x
		this.z = z
		this.roomName = roomName
		this.roomType = roomType
		this.isLarge = isLarge
		this.separatorType = ""
		this.secrets = secrets
		this.yLevel = yLevel
		this.crypts = crypts
		this.explored = true
		this.checkmark = "None"
		this.normallyVisible = false
	}
	getBlockList() {
		let blockList = {}
		for (let a = this.x - 16; a < this.x + 16; a++) {
			for (let b = this.z - 16; b < this.z + 16; b++) {
				let blockName = World.getBlockAt(a, this.yLevel, b).getRegistryName().replace("minecraft:", "")
				if (Object.keys(blockList).includes(blockName)) {
					blockList[blockName] += 1
				}
				else {
					blockList[blockName] = 1
				}
			}
		}
		return blockList
	}
}

let dungeonMap = []
let renderingMap = false
let totalSecrets = 0
let totalRooms = 0
let totalCrypts = 0
let inBoss = false
let witherDoors = 0
let puzzles = []
let currentScore = 0
let lastRooms = []
let doorEsps = []
let trapType = "Unknown"

// Scan the entire dungeon
function refreshMap() {
	new Thread(() => {
		if (scanning) { return }
		let tempMap = []
		witherDoors = 0
		puzzles = []
		trapType = "Unknown"
		let rooms = []
		scanning = true
		totalSecrets = 0
		totalRooms = 0
		totalCrypts = 0
		if (settings.mapChatInfo && !autoScanning) { new Message(`${prefix} &aDoing Stuff...`).setChatLineId(487563475).chat() }
		for (let i = 0; i < 25; i++) {
			tempMap[i] = []
			for (let j = 0; j < 25; j++) {
				tempMap[i][j] = "0"
			}
		}
		let allRooms = JSON.parse(FileLib.read("IllegalMap", "rooms.json"))["dungeonRooms"]
		let levelsToSearch = []
		for (let i = 0; i < allRooms.length; i++) {
			if (!levelsToSearch.includes(allRooms[i]["yLevel"])) {
				levelsToSearch.push(allRooms[i]["yLevel"])
			}
		}
		levelsToSearch.sort()
		let xOff = 0
		for (let x = corners["start"][0]-1; x < corners["end"][0] + 1; x++) {
			let zOff = 0
			for (let z = corners["start"][1]-1; z < corners["end"][1] + 1; z++) {
				// Every 8th block - efficiency
				if (xOff % 8 == 0 && zOff % 8 == 0) {
					// If 1x1 column isnt completely air then it's not a wall of a dungeon
					if (!checkForBlockBelow(x, z)) {
						if (debugMode) { setDiamond(x, 170, z) }
						tempMap[xOff / 8][zOff / 8] = "0"
					}
					// Exact center of a room
					if (xOff % 32 == 16 && zOff % 32 == 16 && checkForBlockBelow(x, z)) {
						if (debugMode) { setEmerald(x, 170, z) }
						let recognizedRoom = false
						// Scan every y level of the rooms in rooms.json
						for (let aa = 0; aa < levelsToSearch.length; aa++) {
							if (recognizedRoom) { break }
							let y = levelsToSearch[aa]
							let room = new Room(x, z, "", "", false, 0, y, 0)
							let allBlocks = room.getBlockList()
							let blockKeys = Object.keys(allBlocks)
							// Scan every room
							for (let k = 0; k < allRooms.length; k++) {
								if (recognizedRoom) { break }
								let roomEntry = allRooms[k]
								let score = 0
								let keys = Object.keys(roomEntry["blocks"])
								// Block list in the current room must meet ALL block criteria from a room in rooms.json to be detected
								for (let l = 0; l < keys.length; l++) {
									if (blockKeys.includes(keys[l]) && !recognizedRoom) {
										if (roomEntry["blocks"][keys[l]][0] == "=" && allBlocks[keys[l]] == parseInt(roomEntry["blocks"][keys[l]].substring(1))) {
											score++
										}
										else if (roomEntry["blocks"][keys[l]][0] == ">" && allBlocks[keys[l]] > parseInt(roomEntry["blocks"][keys[l]].substring(1))) {
											score++
										}
										else {
											break
										}
									}
								}
								// If room is detected then add it to the dungeonMap array
								if (score == Object.keys(roomEntry["blocks"]).length) {
									if (rooms.includes(roomEntry["roomName"])) { continue }
									tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, roomEntry["roomName"], roomEntry["roomType"], true, roomEntry["secrets"], roomEntry["yLevel"], roomEntry["crypts"])
									rooms.push(roomEntry["roomName"])
									recognizedRoom = true
									totalSecrets += roomEntry["secrets"]
									totalCrypts += roomEntry["crypts"] == "Unknown" ? 0 : roomEntry["crypts"]
									if (roomEntry["roomType"] == "puzzle") {
										puzzles.push(roomEntry["roomName"])
									}
									else if (roomEntry["roomType"] == "trap") {
										trapType = roomEntry["roomName"].split(" ")[0]
									}
									totalRooms++
								}
							}
						}
						if (!recognizedRoom) {
							tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "Unknown", "normal", true)
							totalRooms++
						}

					}
					// Positions of where a door can spawn
					if ((xOff % 16 == 0 && zOff % 16 == 0 && checkForBlockBelow(x, z)) && !(xOff % 32 == 16 && zOff % 32 == 16) && (xOff !== 0 && xOff !== 192 && zOff !== 0 && zOff !== 192)) {
						if (tempMap[xOff / 8][zOff / 8] instanceof Room && tempMap[xOff / 8 - 2][zOff / 8].roomType == "entrance") {
							tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "", "entryDoor", false)
							continue
						}
						let blocksClose = 0
						if (debugMode) { setCoal(x + 8, 171, z); setCoal(x - 8, 171, z); setCoal(x, 171, z + 8); setCoal(x, 171, z - 8) }
						if (checkForBlockBelow(x + 8, z)) { blocksClose++ }
						if (checkForBlockBelow(x - 8, z)) { blocksClose++ }
						if (checkForBlockBelow(x, z + 8)) { blocksClose++ }
						if (checkForBlockBelow(x, z - 8)) { blocksClose++ }
						// 2 adjacent air and 2 adjacent non-air means that there is a door here
						if (blocksClose == 2) {
							if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:coal_block") {
								if (debugMode) { setCoal(x, 171, z) }
								doorEsps.push([x, 69, z])
								tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "", "witherDoor", false)
								witherDoors++
							}
							else if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:stained_hardened_clay" && World.getBlockAt(x, 69, z).getMetadata() == 14) {
								doorEsps.push([x, 69, z])
								tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "", "bloodDoor", false)
							}
							else if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:monster_egg" && World.getBlockAt(x, 69, z).getMetadata() == 5) {
								tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "", "entryDoor", false)
							}
							else {
								if (debugMode) { setGold(x, 171, z) }
								tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "", "door", false)
							}
						}
						// All around this position is blocks so it's the middle of a larger room
						else if (blocksClose == 4) {
							if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:monster_egg" && World.getBlockAt(x, 69, z).getMetadata() == 5) {
								tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "", "entryDoor", false)
							}
							else {
								tempMap[xOff / 8][zOff / 8] = new Room(xOff, zOff, "Unknown", "normal", false)
							}

						}
					}
				}
				zOff++
			}
			xOff++
		}
		totalRooms--
		try {
			for (let i = 0; i < tempMap.length; i++) {
				for (let j = 0; j < tempMap[i].length; j++) {
					if (tempMap[i][j] instanceof Room) {
						// Room connections
						if (tempMap[i][j].roomName == "Unknown") {
							if (tempMap[i - 2][j + 2].isLarge && tempMap[i - 2][j - 2].isLarge && tempMap[i + 2][j + 2].isLarge && tempMap[i + 2][j - 2].isLarge) {
								continue
							}
							// Stops the elongated entrance room from showing weirdly on some maps
							else if (tempMap[i - 2][j].roomType == "entrance" || tempMap[i][j - 2].roomType == "entrance" || tempMap[i + 2][j].roomType == "entrance" || tempMap[i][j + 2].roomType == "entrance") {
								tempMap[i][j] = "0"
							}
							// Fill in the gaps between larger rooms
							else if (tempMap[i + 2][j].isLarge && tempMap[i - 2][j].isLarge) {
								tempMap[i][j].separatorType = "tall"
							}
							else {
								tempMap[i][j].separatorType = "long"
							}
						}
						// Clean up entrance room
						try {
							if (tempMap[i - 2][j].roomType == "entrance" || tempMap[i + 2][j].roomType == "entrance" || tempMap[i][j - 2].roomType == "entrance" || tempMap[i][j + 2].roomType == "entrance") {
								if (tempMap[i - 4][j] instanceof Room && roomType == "entryDoor") { tempMap[i][j] = "0" }
								else { tempMap[i][j] = new Room(tempMap[i][j].x, tempMap[i][j].z, "", "entryDoor", false) }
							}
						}
						catch (error) { }
					}
				}
			}
		}
		catch (error) {
			s(error)
		}
		lastSecrets = totalSecrets // So the number under the map doesn't keep changing while the dungeon is being scanned
		lastCrypts = totalCrypts
		lastRooms = rooms
		dungeonMap = tempMap
		scanning = false
		renderingMap = true
		if (settings.mapChatInfo && !autoScanning) { ChatLib.clearChat(487563475) }
		if (settings.mapChatInfo && !autoScanning && !settings.legitMode && inDungeon) {
			s(`${prefix} &aCurrent Dungeon:`)
			s(` &aPuzzles &c${puzzles.length}&a: \n &b- &d${puzzles.join("\n &b- &d")}`)
			s(` &6Trap: &a${trapType}`)
			s(` &8Wither Doors: &7${witherDoors - 1}`)
			s(` &7Total Secrets: &b${lastSecrets}`)
			s(` &7Total Crypts: &c${lastCrypts}`)
		}
		if (fullyScanned && settings.collectDungeonData) {
			logDungeon()
		}
	}).start()
}

let rainbowStep = 0
register("step", () => { rainbowStep++ }).setFps(5)

// Map render code

let mapImage = new BufferedImage(25, 25, BufferedImage.TYPE_4BYTE_ABGR)

let checkmarks = []
let toDrawLater = []

register("step", () => {
	const setPixels = (x1, y1, width, height, color) => {
		for (let x = x1; x < x1 + width; x++) {
			for (let y = y1; y < y1 + height; y++) {
				mapImage.setRGB(x, y, color.getRGB())
			}
		}
	}

	let mapXY = settings.scoreCalc == 1 ? [25, 27] : [25, 25]
	let ms = settings.mapScale

	// Set the background
	mapImage = new BufferedImage(mapXY[0], mapXY[1], BufferedImage.TYPE_4BYTE_ABGR)
	const bgRgba = [settings.backgroundColor.getRed(), settings.backgroundColor.getBlue(), settings.backgroundColor.getGreen(), settings.backgroundTransparency]
	setPixels(0, 0, mapImage.getWidth(), mapImage.getHeight(), new java.awt.Color(bgRgba[0]/255, bgRgba[1]/255, bgRgba[2]/255, bgRgba[3]/255))
	
	if (!renderingMap) { return }

	toDrawLater = []
	checkmarks = []

	// Get the checkmark style the player has selected in settings to be used later
	let greenCheckmark = settings.checkmarks !== 0 ? [greenCheck, greenCheck2, greenCheckVanilla][settings.checkmarks - 1] : greenCheck2
	let whiteCheckmark = settings.checkmarks !== 0 ? [whiteCheck, whiteCheck2, whiteCheckVanilla][settings.checkmarks - 1] : whiteCheck2
	let failedRoomIcon = settings.checkmarks !== 0 ? [failedRoom, failedRoom2, failedRoomVanilla][settings.checkmarks - 1] : failedRoom2
	let questionMarkIcon = settings.checkmarks !== 0 ? [questionMark, questionMark2, questionMarkVanilla][settings.checkmarks - 1] : questionMark2

	for (let i = 0; i < dungeonMap.length; i++) {
		for (let j = 0; j < dungeonMap[i].length; j++) {
			if (dungeonMap[i][j] instanceof Room) {
				let room = dungeonMap[i][j]
				if (settings.legitMode && !room.normallyVisible) { continue }
				let color = settings.darkenUnexplored && !room.explored ? roomColors[room.roomType][1] : roomColors[room.roomType][0]
				if (room.isLarge) {
					if (!room.explored) {
						if (settings.legitMode) {
							color = roomColors["unexplored"]
							setPixels(i-1, j-1, 3, 3, new java.awt.Color(color[0][0]/255, color[0][1]/255, color[0][2]/255, 1))
						}
						else {
							setPixels(i-1, j-1, 3, 3, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, settings.unexploredTransparency/255))
						}
					}
					else {
						setPixels(i-1, j-1, 3, 3, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, 1))
					}
					if ((room.roomType == "puzzle" || room.roomType == "trap") && (settings.showImportantRooms || peekRoomNames.isKeyDown()) && !settings.legitMode) { toDrawLater.push([room.roomName, (settings.mapX + i * ms) * (10 / ms) + ms, (settings.mapY + j * ms) * (10 / ms)]) }
						else if (room.roomType == "normal" && room.roomName !== "Unknown" && !settings.legitMode) {
							let a = ""
							if (settings.showSecrets || peekRoomNames.isKeyDown()) { toDrawLater.push([`&7${room.secrets}`, (settings.mapX + i * ms) * (10 / ms) - ms + 1, (settings.mapY + j * ms) * (10 / ms) - ms + 1]) }
							if (settings.showAllRooms || (peekRoomNames.isKeyDown() && Keyboard.isKeyDown(Keyboard.KEY_LSHIFT))) { a += ` ${room.roomName}` }
							if (settings.showCrypts && room.crypts !== "Unknown") { a += ` ${room.crypts}` }
							toDrawLater.push([a, (settings.mapX + i * ms) * (10 / ms) + ms, (settings.mapY + j * ms) * (10 / ms)])
						}
					if (settings.checkmarks !== 0 || settings.legitMode) {
						if (room.checkmark == "entrance") { checkmarks.push([greenCheckmark, settings.mapX + (i * ms) - ms / 2, settings.mapY + (j * ms) - ms / 2, 2 * ms, 2 * ms]) }
						if (room.checkmark == "white") { checkmarks.push([whiteCheckmark, settings.mapX + (i * ms) - ms / 2, settings.mapY + (j * ms) - ms / 2, 2 * ms, 2 * ms]) }
						if (room.checkmark == "failed") { checkmarks.push([failedRoomIcon, settings.mapX + (i * ms) - ms / 2, settings.mapY + (j * ms) - ms / 2, 2 * ms, 2 * ms]) }
					}
					if (settings.legitMode && !dungeonMap[i][j].explored && dungeonMap[i][j].normallyVisible) {
						checkmarks.push([questionMarkIcon, settings.mapX + (i * ms) - ms / 2, settings.mapY + (j * ms) - ms / 2, 2 * ms, 2 * ms])
					}
				}
				else {
					if (room.separatorType == "tall") {
						room.explored ? setPixels(i, j-1, 1, 3, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, 1)) : setPixels(i, j-1, 1, 3, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, settings.unexploredTransparency/255))
					}
					else if (room.separatorType == "long") {
						room.explored ? setPixels(i-1, j, 3, 1, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, 1)) : setPixels(i-1, j, 3, 1, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, settings.unexploredTransparency/255))
					}
					else {
						room.explored ? setPixels(i, j, 1, 1, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, 1)) : setPixels(i, j, 1, 1, new java.awt.Color(color[0]/255, color[1]/255, color[2]/255, settings.unexploredTransparency/255))
					}
				}
			}
		}
	}
	if (!mimicKilled && settings.scoreCalc !== 0 && mimicFloors.includes(dungeonFloor)) {
		let world = World.getWorld()
		let tempChests = []
		world.field_147482_g.forEach(entity => {
			if(entity instanceof TileEntityChest) {
				if (entity.func_145980_j() == 1) {
					const x = entity.func_174877_v().func_177958_n();
					const y = entity.func_174877_v().func_177956_o();
					const z = entity.func_174877_v().func_177952_p();
					let xyz = [x, y, z]
					tempChests.push(xyz.toString())
				}
			}
		})
		mimicLocations.forEach(location => {
			// let coords = location.split(",")
			// s(JSON.stringify(coords))
			// && world.func_175726_f(new BlockPos(0, 0, 0)).func_177410_o()
			if (!tempChests.includes(location.toString())) {
				let coords = location.split(",")
				if (!world.func_175726_f(new BlockPos(parseInt(coords[0]), parseInt(coords[1]), parseInt(coords[2]))).func_177410_o()) { return }
				mimicKilled = true
				s(`${prefix} &c&lMimic Found!`)
			}
		})
		tempChests.forEach(location => {
			if (!mimicLocations.includes(location.toString())) {
				mimicLocations.push(location.toString())
			}
		})
	}
}).setFps(20)

// // Some code from Debug with help from DawJaw
// register("renderWorld", () => {
// 	World.getWorld().field_147482_g.forEach(entity => {
// 		if(entity instanceof TileEntityChest) {
// 			const x = entity.func_174877_v().func_177958_n();
// 			const y = entity.func_174877_v().func_177956_o();
// 			const z = entity.func_174877_v().func_177952_p();
// 			let xyz = [x, y, z]
// 			if (entity.func_145980_j() == 1) {
// 				RenderLib.drawBaritoneEspBox(x, y, z, 1, 1, 0, 255, 0, 1, true)
// 			}
// 		}
// 	});
// })

register("renderOverlay", () => {
	let ms = settings.mapScale
	let mapXY = settings.scoreCalc == 1 ? [25*ms, 27*ms] : [25*ms, 25*ms]

	if (settings.hideOutsideDungeon && !inDungeon) { renderingMap = false }
	else if (settings.hideInBoss && inBoss) { renderingMap = false }
	else if (!settings.mapEnabled) { renderingMap = false }
	else { renderingMap = true }

	if (settings.mapDragGui.isOpen() || renderingMap) {
		// Draw the map onto the screen
		Renderer.drawImage(new Image(mapImage), settings.mapX, settings.mapY, mapXY[0], mapXY[1])

		if (settings.mapRGB) {
			// Draw RGB Border
			let rainbow = Renderer.getRainbowColors(rainbowStep, 1)
			Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX - 1, settings.mapY - 1, mapXY[0] + 2, 1)
			Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX - 1, settings.mapY + mapXY[1], mapXY[0] + 2, 1)
			Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX - 1, settings.mapY, 1, mapXY[1])
			Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX + mapXY[0], settings.mapY, 1, mapXY[1])
		}
	}

	const bgRgba = [settings.backgroundColor.getRed(), settings.backgroundColor.getBlue(), settings.backgroundColor.getGreen(), settings.backgroundTransparency]
	// Score calc!
	if (settings.scoreCalc !== 0) {

		// The nerd stuff
		let completedR = !bloodDone ? completedRooms + 1 : completedRooms
		completedR = !inBoss ? completedR + 1 : completedR
		// let skillScore = 100 - (settings.assumeSpirit && dungeonDeaths > 0 ? dungeonDeaths * 2 - 1 : dungeonDeaths * 2) - (14 * dungeonPuzzles[0]) + (14 * dungeonPuzzles[1])
		let skillScore = Math.floor(20 + ((completedR > totalRooms ? totalRooms : completedR) / totalRooms) * 80 - (10 * dungeonPuzzles[0]) + (10 * dungeonPuzzles[1]) - (settings.assumeSpirit && dungeonDeaths > 0 ? dungeonDeaths * 2 - 1 : dungeonDeaths * 2))
		// Trap = -5 points
		skillScore = skillScore < 20 ? 20 : skillScore
		let exploreScore = Math.floor(((60 * (completedR > totalRooms ? totalRooms : completedR)) / totalRooms) + ((40 * (dungeonSecrets - overflowSecrets)) / lastSecrets))
		exploreScore = Number.isNaN(exploreScore) ? 0 : exploreScore
		let speedScore = 100
		let bonusScore = (dungeonCrypts >= 5 ? 5 : dungeonCrypts) + (mimicKilled ? 2 : 0) + (settings.ezpzPaul ? 10 : 0)
		
		currentScore = skillScore + exploreScore + speedScore + bonusScore
		currentScore = trapDone ? currentScore : currentScore -= 5
		// Renderer.drawString(
		// 	`Skill: ${skillScore}\n` +
		// 	`Explore: ${exploreScore}\n` +
		// 	`Bonus: ${bonusScore}`,
		// 	550, 150
		// )

		// Components of the main score info shown under the map - Too tedious to put into a single line
		let remaining = lastSecrets - dungeonSecrets < 0 ? `+${(lastSecrets - dungeonSecrets) * -1}` : lastSecrets - dungeonSecrets

		let scSecrets = `&7Secrets: &b${dungeonSecrets}`
		let scSecretsExtra = `&7(&e${remaining}&7, &c${lastSecrets}&7)`
		let scDeaths = settings.assumeSpirit && dungeonDeaths > 0 ? `&7Deaths: &c${(dungeonDeaths * 2 - 1) * -1}` : `&7Deaths: &a${(dungeonDeaths * 2) * -1}`
		let scCrypts = dungeonCrypts >= 5 ? `&7Crypts: &a${dungeonCrypts}` : `&7Crypts: &c${dungeonCrypts}`
		let scCryptsExtra = `&8(${lastCrypts})`
		let scMimic = !mimicFloors.includes(dungeonFloor) ? "" : (mimicKilled ? `&7Mimic: &a✓` : `&7Mimic: &c✘`)
		// let scPuzzles = dungeonPuzzles[1] == dungeonPuzzles[0] ? `&7Puzzles: &a${dungeonPuzzles[1]}&7/&a${dungeonPuzzles[0]}` : `&7Puzzles: &c${dungeonPuzzles[1]}&7/&c${dungeonPuzzles[0]}`
		let scTrap = trapDone ? `&7Trap: &a✓` : `&7Trap: &c✘`
		let scScore = currentScore >= 300 ? `&7Score: &a${currentScore}` : (currentScore >= 270 ? `&7Score: &e${currentScore}` : `&7Score: &c${currentScore}`)

		let displayCrypts = settings.legitMode ? `${scCrypts}` : `${scCrypts} ${scCryptsExtra}`
		let displaySecrets = settings.legitMode ? `${scSecrets}` : `${scSecrets} ${scSecretsExtra}`

		if (settings.scoreCalc == 1 && !settings.scMoveGui.isOpen() && renderingMap) {
			let msg1 = `${displaySecrets}    ${displayCrypts}    ${scMimic}`.trim()
			// let msg2 = `&7Skill: &a${skillScore}    &7Explore: &a${exploreScore}    &7Bonus: &a${bonusScore}`
			let msg2 = `${scTrap}    ${scDeaths}    ${scScore}`

			Renderer.translate(settings.mapX + mapXY[0] / 2, settings.mapY + mapXY[1] - ms * 2)
			renderCenteredText(msg1, 0, 0 - 0.75 * ms, ms, false)
			Renderer.translate(settings.mapX + mapXY[0] / 2, settings.mapY + mapXY[1])
			renderCenteredText(msg2, 0, 0 - 2 * ms, ms, false)
		}
		else if (settings.scoreCalc == 2 || (inBoss && settings.seperateInBoss) || settings.scMoveGui.isOpen() && inDungeon) {
			Renderer.drawRect(Renderer.color(bgRgba[0], bgRgba[1], bgRgba[2], bgRgba[3]), settings.scoreCalcX, settings.scoreCalcY, 20*ms, 11.5*ms)
			Renderer.drawString(
				`${scTrap}\n` +
				`${displayCrypts}\n` +
				`${scMimic}\n` +
				`${displaySecrets}\n` +
				`${scDeaths}\n` +
				`${scScore}`,
				settings.scoreCalcX + ms/2, settings.scoreCalcY + ms/2
			)
		}

		if (currentScore >= 300 && settings.say300 && !saidIfSPlus) {
			ChatLib.command(`pc ${settings.say300Message}`)
			saidIfSPlus = true
		}
	}
	// Icons and text ontop of the map
	if (renderingMap) {

		// Draw checkmarks after the rooms to prevent them being drawn ontop of by rooms
		checkmarks.forEach(check => {
			Renderer.drawImage(check[0], check[1], check[2], check[3], check[4])
		})
		// Draw text ontop of the map
		toDrawLater.forEach(entry => {
			renderCenteredText(entry[0], entry[1], entry[2], ms, true)
		})

		// Player icons
		// Draw player icons on the map
		Object.keys(playerIcons).forEach(p => {
			if (playerIcons[p].name !== Player.getName()) {
				drawMarker(playerIcons[p])
			}
		})
		// Draw your own head on the map (Updates much faster than other players, also shows before and after dungeon)
		if (settings.showOwnHead) {
			if (isBetween(Player.getZ(), -1, 192) && isBetween(Player.getX(), -1, 192)) {
				drawMarker({
					"name": Player.getName(),
					"iconX": settings.mapX + (Player.getX() * (0.1225 * ms) + 2),
					"iconY": settings.mapY + (Player.getZ() * (0.1225 * ms) - 2),
					"rotation": Player.getRawYaw() + 180,
					"icon": myHead
				})
			}
		}
	}
})

// register("renderWorld", () => {
// 	if (!inDungeon) { return }
// 	World.getWorld().field_147482_g.forEach(entity => {
// 		if(entity instanceof TileEntityChest) {
// 			if (entity.func_145980_j() == 1) {
// 				const x = entity.func_174877_v().func_177958_n();
// 				const y = entity.func_174877_v().func_177956_o();
// 				const z = entity.func_174877_v().func_177952_p();
// 				let xyz = [x, y, z]
// 				RenderLib.drawBaritoneEspBox(x, y, z, 1, 1, 0, 255, 0, 1, true)
// 			}
// 		}
// 	})
// })

// Getting player icons from the map in the 9th slot
register("step", () => {
	if (!settings.mapEnabled || !settings.showHeads || !inDungeon) { return }
	if (inBoss) { playerIcons = {}; return }
	new Thread(() => {
		if (inDungeon && !inBoss) {
			let ms = settings.mapScale
			try {
				let map = Player.getInventory().getItems()[8]
				if (map.getName().includes("Your Score Summary")) { return }
				let mapData = map.getItem().func_77873_a(map.getItemStack(), World.getWorld())
				// playerIcons format:
				// let playerIcons = {
				// 	"icon-0": {
				// 		"name":"UnclaimedBloom6",
				// 		"iconX":10,
				// 		"iconY":10,
				// 		"rotation":10,
				// 		"icon":vanillaMapIcon
				// 	}
				// }
				Object.keys(dungeonParty).forEach(player => {
					let playerObj = World.getPlayerByName(player)
					if (playerObj == null) { return }
					let dist = []
					mapData.field_76203_h.forEach((icon, vec4b) => {
						let iconX = settings.mapX + (vec4b.func_176112_b() + 128 - mapOffset[0]) / 2
						let iconY = settings.mapY + (vec4b.func_176113_c() + 128 - mapOffset[1]) / 2

						let rotation = (vec4b.func_176111_d() * 360) / 16

						let myDistance = Math.sqrt((settings.mapX + (playerObj.getX() * (0.1225 * ms)) - iconX) ** 2 + (settings.mapY + (playerObj.getZ() * (0.1225 * ms)) - iconY) ** 2)

						if (dist.length == 0 || dist[1] > myDistance) {
							dist = [icon, myDistance, playerObj.getName(), iconX, iconY, rotation]
						}
					})
					if (dist.length !== 0) {
						let icon = dist[0]
						if (playerIcons[icon] == undefined) { playerIcons[icon] = {} }
						playerIcons[icon]["name"] = dist[2]
						playerIcons[icon]["iconX"] = dist[3]
						playerIcons[icon]["iconY"] = dist[4]
						playerIcons[icon]["rotation"] = dist[5] + 180
						playerIcons[icon]["icon"] = dungeonParty[dist[2]]
					}
				})
				mapData.field_76203_h.forEach((icon, vec4b) => {
					let iconX = Math.round(settings.mapX + (vec4b.func_176112_b() + 128 - mapOffset[0]) / (10/ms))
					let iconY = Math.round(settings.mapY + (vec4b.func_176113_c() + 128 - mapOffset[1]) / (10/ms))

					let rotation = (vec4b.func_176111_d() * 360) / 16 + 180

					if (playerIcons[icon] == undefined) {
						playerIcons[icon] = {
							"name": "Unknown",
							"iconX": iconX,
							"iconY": iconY,
							"rotation": rotation,
							"icon": vanillaMapIcon
						}
					}
					else {
						playerIcons[icon].iconX = iconX
						playerIcons[icon].iconY = iconY
						playerIcons[icon].rotation = rotation
					}

				})
			}
			catch (error) {
				// s(error)
			}
		}
		else {
			playerIcons = {}
		}
	}).start()
}).setFps(5)

// Draw a marker on the dungeon map and rotate it in position
function drawMarker(markerInfo) {
	let ms = settings.mapScale
	let iconDims = markerInfo.icon == vanillaMapIcon ? [ms * (settings.headScale * 4), ms * (settings.headScale * 6)] : [ms * (settings.headScale * 5), ms * (settings.headScale * 5)]
	// Renderer.retainTransforms(true)
	Renderer.translate(markerInfo.iconX, markerInfo.iconY)
	Renderer.translate(iconDims[0] / 2, iconDims[1] / 2)
	Renderer.rotate(markerInfo.rotation)
	Renderer.translate(-iconDims[0] / 2, -iconDims[1] / 2)
	// Renderer.retainTransforms(false)
	if (markerInfo.icon == undefined) { markerInfo.icon = vanillaMapIcon }
	Renderer.drawImage(markerInfo.icon, 0, 0, iconDims[0], iconDims[1])
	if (settings.showIconNames || Player.getHeldItem().getName().endsWith("Spirit Leap") && markerInfo.name !== Player.getName()) {
		renderCenteredText(markerInfo.name, (markerInfo.iconX + iconDims[0] / 2) * 2, (markerInfo.iconY + ms) * 2, 5, false)
	}
}
// Data from the map in the player's 9th slot to figure out which rooms are unexplored or have checkmarks
let scale = 1
register("step", () => {
	if (!renderingMap || inBoss || !inDungeon) { return }
	new Thread(() => {
		let map
		let mapData
		let mapColors
		try {
			map = Player.getInventory().getItems()[8]
			// Don't count score summary as a dungeon map
			if (map.getName().includes("Your Score Summary")) { return }
			mapData = map.getItem().func_77873_a(map.getItemStack(), World.getWorld())
			mapColors = mapData.field_76198_e
		}
		catch (error) { return }
		let map2d = [[]]
		let line = 0
		for (let i = 0; i < mapColors.length; i++) {
			if (i % 128 == 0 && i !== 0) {
				map2d.push([])
				line++
			}
			map2d[line].push(mapColors[i])
		}
		// Offset where the code starts its search for pixels - dungeon is centered on Hypixel's map. More so on smaller dungeons.
		// s(totalRooms)
		if (dungeonFloor == "F1" || dungeonFloor == "M1") { mapOffset = [28, 18]; scale = 1.1 }
		else if (dungeonFloor == "F4" || dungeonFloor == "M4") { mapOffset = [13, 24]; scale = 1 }
		else if (totalRooms == 25 || totalRooms == 24) { mapOffset = [19, 19]; scale = 1.1 }
		else if (totalRooms == 29) { mapOffset = [24, 13]; scale = 1 }
		else if (totalRooms == 15) { mapOffset = [32, 32]; scale = 1 }
		else if (totalRooms > 29) { mapOffset = [13, 13]; scale = 1 }
		else if (totalRooms >= 19) { mapOffset = [28, 18]; scale = 1.1 }
		let unexploredColors = [0, 85, 119]
		for (let i = 0; i < 11; i++) {
			for (let j = 0; j < 11; j++) {
				try {
					let color = map2d[parseInt((i*10+mapOffset[1]) * scale)][parseInt((j*10+mapOffset[0]) * scale)]
					if (color == 0) { dungeonMap[j * 2 + 2][i * 2 + 2].normallyVisible = false }
					else { dungeonMap[j * 2 + 2][i * 2 + 2].normallyVisible = true }
					if (!unexploredColors.includes(color)) { dungeonMap[j * 2 + 2][i * 2 + 2].explored = true }
					else { dungeonMap[j * 2 + 2][i * 2 + 2].explored = false }
					// Pixel color = checkmark color
					if (color == 30) {
						if (dungeonMap[j * 2 + 2][i * 2 + 2].roomType !== "entrance") {
							dungeonMap[j * 2 + 2][i * 2 + 2].checkmark = "entrance"
						}
						// Look for completed other rooms
					}
					if (color == 34) {
						if (dungeonMap[j * 2 + 2][i * 2 + 2].checkmark == "None") {
							dungeonMap[j * 2 + 2][i * 2 + 2].checkmark = "white"
						}
					}
					if (color == 18) {
						if (dungeonMap[j * 2 + 2][i * 2 + 2].roomType !== "blood") {
							dungeonMap[j * 2 + 2][i * 2 + 2].checkmark = "failed"
						}
					}
					if (color == 30 || color == 34) {
						let roomCol = map2d[parseInt((i*10+mapOffset[1]) - 2 * scale)][parseInt((j*10+mapOffset[0]) - 2 * scale)]
						if (roomCol == 62) { trapDone = true }
						if (roomCol == 18) { bloodDone = true }
						if (roomCol == 74) { yellowDone = true }
					}
				}
				catch (error) {}
			}
		}
	}).start()
}).setFps(5)

// Visualization of what points on the hotbar map are being analysed. Won't work for you because mapColors.json file missing.
// register("renderOverlay", () => {
// 	let theColors = JSON.parse(FileLib.read("IllegalMap", "mapColors.json"))
// 	let map
// 	let mapData
// 	let mapColors
// 	try {
// 		map = Player.getInventory().getItems()[8]
// 		mapData = map.getItem().func_77873_a(map.getItemStack(), World.getWorld())
// 		mapColors = mapData.field_76198_e
// 	}
// 	catch(error) {
// 		return
// 	}
// 	let temp = [[]]
// 	let line = 0
// 	for (let i = 0; i < mapColors.length; i++) {
// 		if (i % 128 == 0 && i !== 0) {
// 			temp.push([])
// 			line++
// 		}
// 		temp[line].push(mapColors[i])
// 	}
// 	let unexploredColors = [0, 85, 119]
	
// 	for (let i = 0; i < temp.length; i++) {
// 		for (let j = 0; j < temp[i].length; j++) {
// 			let rgbValue = theColors[temp[i][j]]
// 			if (temp[i][j] !== 0) {
// 				Renderer.drawRect(Renderer.color(rgbValue[0], rgbValue[1], rgbValue[2], rgbValue[3]), 300+j, 150+i, 1, 1)
// 			}
// 		}
// 	}
// 	for (let i = 0; i < 11; i++) {
// 		for (let j = 0; j < 11; j++) {
// 			let color
// 			try {
// 				color = temp[parseInt((i*10+mapOffset[1]) * scale)][parseInt((j*10+mapOffset[0]) * scale)]
// 				if (!unexploredColors.includes(color)) {
// 					Renderer.drawRect(Renderer.color(0, 255, 0, 255), 300+((j * 10)+mapOffset[0]) * scale, 150+((i * 10)+mapOffset[1]) * scale, 1, 1)
// 				}
// 				else {
// 					Renderer.drawRect(Renderer.color(255, 0, 0, 255), 300+((j * 10)+mapOffset[0]) * scale, 150+((i * 10)+mapOffset[1]) * scale, 1, 1)
// 				}
// 				if (color == 30 || color == 34) {
// 					Renderer.drawRect(Renderer.color(255, 255, 255, 255), 300+((j * 10)+mapOffset[0]) - 2 * scale, 150+((i * 10)+mapOffset[1]) - 2 * scale, 1, 1)
// 					let roomCol = temp[parseInt((i*10+mapOffset[1]) - 2 * scale)][parseInt((j*10+mapOffset[0]) - 2 * scale)]
// 					if (roomCol == 62) { trapDone = true }
// 					if (roomCol == 18) { bloodDone = true }
// 					if (roomCol == 74) { yellowDone = true }
// 				}
// 			}
// 			catch(error) {}
// 		}
// 	}
// })

// register("renderOverlay", () => {
// 	Renderer.drawString(
// 		`Yellow Done: ${yellowDone}\n` +
// 		`Trap Done: ${trapDone}\n` +
// 		`Blood Done: ${bloodDone}`,
// 		450, 200
// 		)
// })

// Wither door ESP
register("renderWorld", () => {
	if (!settings.witherDoorEsp || settings.legitMode || !inDungeon) { return }
	let rgba = [settings.witherDoorEspColor.getRed(), settings.witherDoorEspColor.getGreen(), settings.witherDoorEspColor.getBlue(),]
	for (let i = 0; i < doorEsps.length; i++) {
		RenderLib.drawBaritoneEspBox(doorEsps[i][0] - 1, doorEsps[i][1], doorEsps[i][2] - 1, 3, 4, rgba[0], rgba[1], rgba[2], 255, true)
		if (getDistance(Player.getX(), Player.getY(), Player.getZ(), doorEsps[i][0], doorEsps[i][1], doorEsps[i][2]) < 5 || (World.getBlockAt(doorEsps[i][0], doorEsps[i][1], doorEsps[i][2]).getRegistryName() !== "minecraft:coal_block" && World.getBlockAt(doorEsps[i][0], doorEsps[i][1], doorEsps[i][2]).getRegistryName() !== "minecraft:stained_hardened_clay")) {
			doorEsps.splice(i, 1)
		}
	}
})

// Star Mob ESP
register("renderEntity", (entity, position, partialTicks, event) => {
	if (!settings.starMobEsp || settings.legitMode || !inDungeon) { return }
	let entityName = entity.getName()
	if (entityName.includes("✯")) {
		if (entityName.includes("Fel") || entityName.includes("Withermancer")) {
			drawBox(entity, settings.starMobEspColor.getRed(), settings.starMobEspColor.getGreen(), settings.starMobEspColor.getBlue(), 1, 0.75, 3, partialTicks, -3)
		}
		else {
			drawBox(entity, settings.starMobEspColor.getRed(), settings.starMobEspColor.getGreen(), settings.starMobEspColor.getBlue(), 1, 0.75, 2, partialTicks, -2)
		}
	}
})

function logDungeon() {
	let dungeonLogs = {}
	try {
		dungeonLogs = JSON.parse(FileLib.read("IllegalMap", "dungeonLogs.json"))
	}
	catch(err) { dungeonLogs = null }
	if (dungeonLogs == null) {
		dungeonLogs = {
			"roomCounts":{},
			"puzzleCounts":{},
			"dungeons":[]
		}
	}
	let thisDungeon = {
		"timestamp":new Date().getTime(),
		"floor": dungeonFloor,
		"secrets":lastSecrets,
		"crypts":lastCrypts,
		"puzzles": puzzles,
		"trap": trapType,
		"witherDoors": witherDoors - 1,
		"rooms":[]
	}
	for (let i = 0; i < dungeonMap.length; i++) {
		for (let j = 0; j < dungeonMap[i].length; j++) {
			if (dungeonMap[i][j] instanceof Room) {
				let thisRoom = dungeonMap[i][j]
				if (thisRoom.roomType == "normal" && thisRoom.roomName !== "Unknown" && thisRoom.roomName !== "") {
					let thisRoomName = dungeonMap[i][j].roomName
					thisDungeon["rooms"].push(thisRoomName)
					if (Object.keys(dungeonLogs["roomCounts"]).includes(thisRoomName)) {
						dungeonLogs["roomCounts"][thisRoomName]++
					}
					else {
						dungeonLogs["roomCounts"][thisRoomName] = 1
					}
				}
				else if (thisRoom.roomType == "puzzle") {
					let thisRoomName = dungeonMap[i][j].roomName
					thisDungeon["rooms"].push(thisRoomName)
					if (Object.keys(dungeonLogs["puzzleCounts"]).includes(thisRoomName)) {
						dungeonLogs["puzzleCounts"][thisRoomName]++
					}
					else {
						dungeonLogs["puzzleCounts"][thisRoomName] = 1
					}
				}
			}
		}
	}
	dungeonLogs["dungeons"].push(thisDungeon)
	// s(JSON.stringify(dungeonLogs, "", 4))
	FileLib.write("IllegalMap", "dungeonLogs.json", JSON.stringify(dungeonLogs))
	// s(`${prefix} &aWritten rooms to JSON!`)
}

register("tick", () => {
	if (!inDungeon || wholeDungeonLoaded) { return }
	let world = World.getWorld()
	let cornerCoords = [[corners["start"][0], 69, corners["start"][1]], [corners["start"][0], 69, corners["end"][0]], [corners["end"][0], 69, corners["start"][0]], [corners["end"][0], 69, corners["end"][1]]]
	for (let i = 0; i < cornerCoords.length; i++) {
		if (!world.func_175726_f(new BlockPos(cornerCoords[i][0], cornerCoords[i][1], cornerCoords[i][2])).func_177410_o()) {
			wholeDungeonLoaded = false
			return
		}
	}
	wholeDungeonLoaded = true
})

register("command", () => {
	let dungeonLogs
	try {
		dungeonLogs = JSON.parse(FileLib.read("IllegalMap", "dungeonLogs.json"))
	}
	catch(error) { dungeonLogs = null }
	if (dungeonLogs == null) {
		s(`${prefix} &cError: No dungeons logged. Enable them in /dmap -> Data Collection and play some dungeons to start building up the data.`)
		return
	}
	const getAverage = (data, key, decimalPlaces) => {
		// [Sum, Entries]
		let total = [0, 0]
		for (let i = 0; i < data.length; i++) {
			if (Object.keys(data[i]).includes(key)) {
				total[0] += data[i][key]
				total[1] ++
			}
		}
		return Math.round((total[0] / total[1]) * (10**decimalPlaces)) / (10**decimalPlaces)
	}
	const getMin = (data, key) => {
		let smallest
		for (let i = 0; i < data.length; i++) {
			if (Object.keys(data[i]).includes(key)) {
				let value = data[i][key]
				if (smallest == undefined || value < smallest) {
					smallest = value
				}
			}
		}
		return smallest
	}
	const getMax = (data, key) => {
		let largest
		for (let i = 0; i < data.length; i++) {
			if (Object.keys(data[i]).includes(key)) {
				let value = data[i][key]
				if (largest == undefined || value > largest) {
					largest = value
				}
			}
		}
		return largest
	}
	let dungLogsDungs = dungeonLogs["dungeons"]
	let chatMessage = [
		`&a&m${ChatLib.getChatBreak(" ")}`,
		`&b&l&n Dungeon Logs `,
		" ",
		`&aRuns Logged: &7${dungLogsDungs.length}`,
		`&bSecrets: &eAvg ${getAverage(dungLogsDungs, "secrets", 2)} &8| &aMin: ${getMin(dungLogsDungs, "secrets")} &8| &cMax: ${getMax(dungLogsDungs, "secrets")}`,
		`&cCrypts: &eAvg ${getAverage(dungLogsDungs, "crypts", 2)} &8| &aMin: ${getMin(dungLogsDungs, "crypts")} &8| &cMax: ${getMax(dungLogsDungs, "crypts")}`,
		`&8Wither Doors: &eAvg ${getAverage(dungLogsDungs, "witherDoors", 2)} &8| &aMin: ${getMin(dungLogsDungs, "witherDoors")} &8| &cMax: ${getMax(dungLogsDungs, "witherDoors")}`,
		"",
		`&a&m${ChatLib.getChatBreak(" ")}`,
	]
	chatMessage.forEach(message => {
		s(ChatLib.getCenteredText(message))
	})

}).setName("dlogs")

register("dragged", (mX, mY, x, y) => {
	if (settings.mapDragGui.isOpen()) {
		Settings.mapX = x
		Settings.mapY = y
	}
	if (settings.scMoveGui.isOpen()) {
		Settings.scoreCalcX = x
		Settings.scoreCalcY = y
	}
})

const myDc = new TextComponent("&cUnclaimed#6151").setHover("show_text", "&aClick to copy!").setClick("run_command", "/ct copy Unclaimed#6151")
let firstTimeMessage = new Message(
	`&b&m${ChatLib.getChatBreak(" ")}\n` +
	`${prefix} &aHello noob, thank you for installing IllegalMap.\n` +
	`&aLegit mode is enabled by default. If you have any suggestions for ideas or find bugs, please DM me (`, myDc, `&a).` +
	`\n&cThis module is NOT a hacked client. Please do not ask for me to add things unrelated to the map.` +
`\n&b&m${ChatLib.getChatBreak(" ")}`
)

let saidInstallMsg = false
register("step", () => {
	if (saidInstallMsg) { return }
	try {
		let first = JSON.parse(FileLib.read("IllegalMap", "firstTime.json"))
		if (first["firstTime"] == true || first["uuid"] !== Player.getUUID()) {
			firstTimeMessage.chat()
			first["firstTime"] = false
			first["uuid"] = Player.getUUID()
			FileLib.write("IllegalMap", "firstTime.json", JSON.stringify(first))
			saidInstallMsg = true
		}
	}
	catch (error) {
		firstTimeMessage.chat()
		FileLib.write("IllegalMap", "firstTime.json", JSON.stringify({ "firstTime": false, "uuid": Player.getUUID() }))
		saidInstallMsg = true
	}
}).setFps(5)

let checkedUpdate = false
register("step", () => {
	if (checkedUpdate || !settings.notifyUpdates) { return }
	checkedUpdate = true
	request("https://raw.githubusercontent.com/UnclaimedBloom6/IllegalMap/main/IllegalMapAPI.json").then(stuff => {
		let metadata = JSON.parse(FileLib.read("IllegalMap", "metadata.json"))
		stuff = JSON.parse(stuff.replace(new RegExp("    ", "g"), ""))

		if (metadata["version"] !== stuff["latestVersion"]) {
			new Message(`&9&m${ChatLib.getChatBreak(" ")}\n`,
			new TextComponent(`${prefix} &aA new version of IllegalMap is available! (&c${stuff["latestVersion"]}&a) Click to go to the Github page! `).setClick(
				"open_url",
				"https://github.com/UnclaimedBloom6/IllegalMap"
			).setHover(
				"show_text",
				"&aClick to open\n&7https://github.com/UnclaimedBloom6/IllegalMap"
			),
			new TextComponent(`&7(Changelog)`).setHover(
				"show_text",
				`&6&nChangeLog for ${stuff["latestVersion"]}:\n &7- ` + stuff["changelog"].join("\n &7- ")
			),
			`\n&9&m${ChatLib.getChatBreak(" ")}`).chat()
		}
	}).catch(error => {
		s(`${prefix} &cError whilst checking for update: ${error}`)
	})
}).setFps(5)