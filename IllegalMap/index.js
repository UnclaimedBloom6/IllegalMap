//
// By UnclaimedBloom6
//
//
// v1.1.0 - Added secrets/score calc
// v1.1.1 - Added darken unexplored rooms
// v1.1.2 - Fixed 300 score reached not working at all
// v1.1.4 - Numerous bugs fixed/some features added
//	- Fixed assumed mimic being on permanently
//	- Fixed boss room from showing as dungeon rooms on smaller dungeonSecrets
// 	- Fixed announce 300 not working
// 	- Option to hide map outside of dungeon
// 	- Option to hide map in boss room
// 	- Add map background transparency option
// v1.1.5 - Added peek room names
// v1.1.6 - Fixed inBoss thing (Thanks AzuredNoob)
// v1.1.7 - Bug fixes, rewriting some parts
// 	- Fixed a room not detecting
// 	- Redid score calc to count incomplete rooms
// 	- Changed order of some of the score calc stuff
// 	- Fixed SBA hide mort messages not resetting 'say300'
//	- Paul Option
//	- Map RGB border is actually a border now
// v1.1.8 - Some new rooms, more 300 score bs
//	- Customize 300 score reached message
// v1.1.81 - New room & removed debug message left in from 1.1.8
// v1.2.0 - Major features added
//	- Wither door ESP
//	- Show player heads
//	- Show player names on map
//	- Checkmarks
// 	- Changed functionality of peek keybind, hold to show secrets and puzzles/trap, 
//	  hold shift ontop of that to show room names
// 	- Fixed hide map in boss not working
//	- Probably some other stuff that I forgot
// v1.2.1 - Forgot lol
// v1.2.2 - Bunch of stuff
//	- Made the auto scan toggle actually do something
// 	- Added new checkmark style (Thanks Hosted)
//	- Overhauled /dmap settings to be more categories with less settings per
// 	- Background color for map
//	- Improved auto scan
// 	- Made the refresh keybind not spammable
// v1.2.3 - Bug fixes and minor features
//	- Fixed checkmarks not working when darken unexplored is disabled
//	- Fixed doors still being dark when darken unexplored is disabled
//	- Vanilla checkmarks option
//	- Show names under player heads while holding spirit leaps
//	- Made text align better with different scales
// v1.2.4 - More small stuff
//	- Player heads on map show both layers of the players' skin
//	- Mob ESP Keybind
//	- Convert wither doors to regular doors after they have been opened
// v1.2.5 - idk
//	- Total crypts
//	- Unexplored rooms transparency slider
//	- Changed how roomColors is stored
//	- Auto Scan lasts 10 seconds instead of 7
//	- Made player heads more accurate
//
//
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Settings from "./settings"
import settings from "./settings"
import RenderLib from "../RenderLib"

const BlockPos = Java.type("net.minecraft.util.BlockPos")
const Blocks = Java.type("net.minecraft.init.Blocks")
const GlStateManager = Java.type("net.minecraft.client.renderer.GlStateManager")
const GL11 = Java.type("org.lwjgl.opengl.GL11")
const BufferedImage = Java.type("java.awt.image.BufferedImage")

// Keybinds
const refreshBind = new KeyBind("Refresh Map", Keyboard.KEY_NONE, "Map")
const peekRoomNames = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "Map")
const starMobsBind = new KeyBind("Toggle Star Mobs", Keyboard.KEY_NONE, "Map")

// Unknown player head icon
const questionMark = new Image("questionMark.png", "https://i.imgur.com/SOHcrFv.png")

// Vanilla Checkmarks with Black Borders
const greenCheck = new Image("greenCheck.png", "https://i.imgur.com/eM2SAFe.png")
const whiteCheck = new Image("whiteCheck.png", "https://i.imgur.com/01NCsWX.png")
const failedRoom = new Image("failedRoom.png", "https://i.imgur.com/8kUDvFj.png")

// New Checkmarks
const greenCheck2 = new Image("greenCheck2.png", "https://i.imgur.com/GQfTfmp.png")
const whiteCheck2 = new Image("whiteCheck2.png", "https://i.imgur.com/9cZ28bJ.png")
const failedRoom2 = new Image("failedRoom2.png", "https://i.imgur.com/qAb4O9H.png")

// Vanilla Checkmarks
const greenCheckVanilla = new Image("greenCheckVanilla.png", "https://i.imgur.com/ywrakP5.png")
const whiteCheckVanilla = new Image("whiteCheckVanilla.png", "https://i.imgur.com/mMbSla0.png")
const failedRoomVanilla = new Image("failedRoomVanilla.png", "https://i.imgur.com/9v8mXZI.png")

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
		Renderer.drawStringWithShadow(word, x - Renderer.getStringWidth(ChatLib.removeFormatting(word))/2, y + (i * scale * 1.75) - (split.length * scale) / 2)
	}
}
function getDistance(x1, y1, z1, x2, y2, z2) {
	return Math.sqrt((x1-x2)**2 + (y1-y2)**2 + (z1-z2)**2)
}
// Gets a player's face - Both layers of their skin as an Image
function getPlayerIcon(playerName) {
	try {
		let player = World.getPlayerByName(playerName).getPlayer()
		if (player == null) {
			return questionMark
		}
		// OLD
		// let playerInfo = Client.getMinecraft().func_147114_u().func_175102_a(player.func_146103_bH().id)
		// return new Image(Client.getMinecraft().func_110434_K().func_110581_b(playerInfo.field_178865_e).field_110560_d)

		// NEW
		let playerInfo = Client.getMinecraft().func_147114_u().func_175102_a(player.func_146103_bH().id)
		let skin = Client.getMinecraft().func_110434_K().func_110581_b(playerInfo.field_178865_e).field_110560_d
		let bottom = skin.getSubimage(8, 8, 8, 8)
		let top = skin.getSubimage(40, 8, 8, 8)
		let combined = new BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB)
		let g = combined.getGraphics()
		g.drawImage(bottom, 0, 0, null)
		g.drawImage(top, 0, 0, null)
		return new Image(combined)
	}
	catch(error) { return questionMark }
}

// register("renderOverlay", () => {
// 	Renderer.drawImage(getPlayerIcon(Player.getName()), 200, 100, 100, 100)
// })

// From DungeonUtilities
const drawBox = (entity, red, green, blue, lineWidth, width, height, partialTicks, yOffset) => {
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

    Tessellator.begin(3).colorize(red, green, blue);
    positions.forEach(pos => {
        Tessellator.pos(
            entity.getX() + (entity.getX() - entity.getLastX()) * partialTicks + pos[0] * width,
            entity.getY()+yOffset + (entity.getY() - entity.getLastY()) * partialTicks + pos[1] * height,
            entity.getZ() + (entity.getZ() - entity.getLastZ()) * partialTicks + pos[2] * width
        ).tex(0, 0);

        counter++;
        if (counter % 2 === 0) {
            Tessellator.draw();
            if (counter !== 24) {
                Tessellator.begin(3).colorize(red, green, blue);
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

const dungStartMessages = [
	"Dungeon starts in 1 second.",
	"Dungeon starts in 1 second. Get Ready!",
	"[NPC] Mort: Here, I found this map when I first entered the dungeon."
]

const mimicKilledMessages = [
	"Mimic Dead!",
	"$SKYTILS-DUNGEON-SCORE-MIMIC$",
	"Child Destroyed!",
	"Mimic Obliterated!",
	"Mimic Exorcised!",
	"Mimic Destroyed!",
	"Mimic Annhilated!"
]

let debugMode = false
register("command", () => {debugMode = !debugMode}).setName("dmapdebug") // Visualization. Sets blocks above the dungeon to diamond, gold etc.

let corners = {"start":[-1, -1], "end":[191, 191]}
let inDungeon = false
let dungeonFloor = null
let dungeonPuzzles = [0, 0]
let dungeonSecrets = 0
let dungeonCrypts = 0
let dungeonDeaths = 0
let completedRooms = 0
let bloodDone = false
let saidIfSPlus = false
let overflowSecrets
const mimicFloors = ["F6", "F7", "M6", "M7"]
let mapOffset = [24, 13]
let playerIcons = {}
let dungeonParty = {} // {"playerName":headIcon}
let timeWarped
let autoScanning = false
let scanning = false
let lastSecrets = 0
let lastCrypts = 0
let mimicKilled = false

// Getting info from the scoreboard and tablist about the dungeon
register("step", () => {
	let dung = false
	Scoreboard.getLines().forEach(x => {
		let unformatted = ChatLib.removeFormatting(x)
		if (/ ⏣ The Catac.+ombs \(.+\)/.test(unformatted)) {
			dungeonFloor = unformatted.match(/ ⏣ The Catac.+ombs \((.+)\)/)[1]
			inDungeon = true
			dung = true
		}
	})
	if (!dung) {
		inDungeon = false
		extraStats = false
	}
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
	catch(error) {
		dungeonSecrets = 0
		dungeonCrypts = 0
		dungeonDeaths = 0
		dungeonPuzzles = [0, 0]
		overflowSecrets = 0
	}

	if (dungeonFloor == "F1" || dungeonFloor == "M1") { corners["end"] = [127, 159]}
	else if (dungeonFloor == "F2" || dungeonFloor == "M2") { corners["end"] = [159, 159]}
	else {corners["end"] = [191, 191]}

	if (!inDungeon && settings.autoResetMap) {dungeonMap = []}
}).setFps(20)

register("tick", () => {
	if (refreshBind.isPressed()) {
		refreshMap()
	}

	if (new Date().getTime() - timeWarped < 10000 && settings.autoScan && !scanning) {
		autoScanning = true
		refreshMap()
	}
	else { autoScanning = false }

	if (starMobsBind.isPressed()) {
		settings.starMobEsp = !settings.starMobEsp
		s(`${prefix} &aStar Mobs set to ${settings.starMobEsp}`)
	}
})

// Get the player's own head
let myHead = questionMark
register("step", () => {
	if (myHead !== questionMark) { return }
	myHead = getPlayerIcon(Player.getName())
}).setFps(5)

// Sets wither doors back to regular doors once they've been opened
register("step", () => {
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
			dungeonParty[player] = questionMark
		}
	})
})

// Get player head for all dungeon party members
register("tick", () => {
	if (!inDungeon) { return }
	Object.keys(dungeonParty).forEach(player => {
		if (dungeonParty[player] == questionMark && player !== Player.getName()) {
			dungeonParty[player] = getPlayerIcon(player)
		}
	})
})

// Chat events
register("chat", event => {
	let formatted = ChatLib.getChatMessage(event, true)
	let unformatted = ChatLib.removeFormatting(formatted)
	if (dungStartMessages.includes(unformatted)) {
		inBoss = false
		saidIfSPlus = false
		bloodDone = false
		playerIcons = {}
		mimicKilled = false
	}
	if (unformatted.startsWith("SkyBlock Dungeon Warp") || unformatted.endsWith("warped the party to a SkyBlock dungeon!")) {
		timeWarped = new Date().getTime()
		inBoss = false
	}
	entryMessages.forEach(message => {
		if (unformatted == message) {
			inBoss = true
		}
	})
	if (unformatted == "[BOSS] The Watcher: You have proven yourself. You may pass.") {
		new Thread(() => {
			Thread.sleep(5000)
			bloodDone = true
		}).start()
	}
	mimicKilledMessages.forEach(message => {
		if (!/Party > .+: (.+)/.test(unformatted)) { return }
		if (mimicKilledMessages.includes(unformatted.match(/Party > .+: (.+)/)[1])) {
			mimicKilled = true
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
	"wall":[[45, 45, 45], [14, 14, 14]], 						// Wall of Dungeon / Background
	"normal":[[107, 58, 17], [34, 21, 10]],	   				// Brown Rooms
	"green":[[20, 133, 0], [20, 31, 19]],     				// Green Room
	"blood":[[255, 0, 0], [90, 8, 8]],       					// Blood Room
	"puzzle":[[117, 0, 133], [47, 6, 53]],     				// Puzzle
	"witherDoor":[[13, 13, 13], [150, 150, 150]],    			// Wither Door
	"yellow":[[254, 223, 0], [118, 87, 0]],      				// Yellow Room
	"fairy":[[224, 0, 255], [43, 21, 46]],       				// Fairy Room
	"trap":[[216, 127, 51], [94, 62, 35]],       				// Trap
	"door":[[92, 52, 14], [41, 25, 12]],      				// Regular Door
	"bloodDoor":[[231, 0, 0], [37, 15, 15]],					// Blood Door
	"entryDoor":[[20, 133, 0], [20, 31, 19]]					// Entry door
}

// yeah
class Room {
	constructor(x=0, z=0, roomName="Unknown", roomType="normal", isLarge=false, secrets=0, yLevel, crypts) {
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
let showingRoomNames = false
let currentScore = 0

let doorEsps = []

// Scan the entire dungeon
function refreshMap() {
	new Thread(() => {
		if (scanning) { return }
		let tempMap = []
		let witherDoors = 0
		let puzzles = []
		let trapType = "Unknown"
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
		for (let x = corners["start"][0]; x < corners["end"][0]+1; x++) {
			let zOff = 0
			for (let z = corners["start"][1]; z < corners["end"][1]+1; z++) {
				// Every 8th block - efficiency
				if (xOff % 8 == 0 && zOff % 8 == 0) {
					// If 1x1 column isnt completely air then it's not a wall of a dungeon
					if (!checkForBlockBelow(x, z)) {
						if (debugMode) {setDiamond(x, 170, z)}
						tempMap[xOff/8][zOff/8] = "0"
					}
					// Exact center of a room
					if (xOff % 32 == 16 && zOff % 32 == 16 && checkForBlockBelow(x, z)) {
						if (debugMode) {setEmerald(x, 170, z)}
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
									tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, roomEntry["roomName"], roomEntry["roomType"], true, roomEntry["secrets"], roomEntry["yLevel"], roomEntry["crypts"])
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
							tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "Unknown", "normal", true)
							totalRooms++
						}
						
					}
					// Positions of where a door can spawn
					if ((xOff % 16 == 0 && zOff % 16 == 0 && checkForBlockBelow(x, z)) && !(xOff % 32 == 16 && zOff % 32 == 16) && (xOff !== 0 && xOff !== 192 && zOff !== 0 && zOff !== 192)) {
						if (tempMap[xOff/8][zOff/8] instanceof Room && tempMap[xOff/8-2][zOff/8].roomType == "green") {
							tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "", "entryDoor", false)
							continue
						}
						let blocksClose = 0
						if (debugMode) {setCoal(x+8, 171, z); setCoal(x-8, 171, z); setCoal(x, 171, z+8); setCoal(x, 171, z-8)}
						if (checkForBlockBelow(x+8, z)) { blocksClose++ }
						if (checkForBlockBelow(x-8, z)) { blocksClose++ }
						if (checkForBlockBelow(x, z+8)) { blocksClose++ }
						if (checkForBlockBelow(x, z-8)) { blocksClose++ }
						// 2 adjacent air and 2 adjacent non-air means that there is a door here
						if (blocksClose == 2) {
							if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:coal_block") {
								if (debugMode) {setCoal(x, 171, z)}
								doorEsps.push([x, 69, z])
								tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "", "witherDoor", false)
								witherDoors++
							}
							else if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:stained_hardened_clay" && World.getBlockAt(x, 69, z).getMetadata() == 14) {
								tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "", "bloodDoor", false)
							}
							else if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:monster_egg" && World.getBlockAt(x, 69, z).getMetadata() == 5) {
								tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "", "entryDoor", false)
							}
							else {
								if (debugMode) {setGold(x, 171, z)}
								tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "", "door", false)
							}
						}
						// All around this position is blocks so it's the middle of a larger room
						else if (blocksClose == 4) {
							if (World.getBlockAt(x, 69, z).getRegistryName() == "minecraft:monster_egg" && World.getBlockAt(x, 69, z).getMetadata() == 5) {
								tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "", "entryDoor", false)
							}
							else {
								tempMap[xOff/8][zOff/8] = new Room(xOff, zOff, "Unknown", "normal", false)
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
							if (tempMap[i-2][j+2].isLarge && tempMap[i-2][j-2].isLarge && tempMap[i+2][j+2].isLarge && tempMap[i+2][j-2].isLarge) {
								continue
							}
							else if (tempMap[i+2][j].isLarge && tempMap[i-2][j].isLarge) {
								tempMap[i][j].separatorType = "tall"
							}
							else {
								tempMap[i][j].separatorType = "long"
							}
						}
						// Clean up green room
						try {
							if (tempMap[i-2][j].roomType == "green" || tempMap[i+2][j].roomType == "green" || tempMap[i][j-2].roomType == "green" || tempMap[i][j+2].roomType == "green" ) {
								if (tempMap[i-4][j] instanceof Room && roomType == "entryDoor") { tempMap[i][j] = "0" }
								else { tempMap[i][j] = new Room(tempMap[i][j].x, tempMap[i][j].z, "", "entryDoor", false) }
							}
						}
						catch(error) {}
					}
				}
			}
		}
		catch(error) {
			s(error)
		}
		lastSecrets = totalSecrets // So the number under the map doesn't keep changing while the dungeon is being scanned
		lastCrypts = totalCrypts
		dungeonMap = tempMap
		renderingMap = true
		scanning = false
		ChatLib.clearChat(487563475)
		if (settings.mapChatInfo && !autoScanning) {
			s(`${prefix} &aCurrent Dungeon:`)
			s(` &aPuzzles &c${puzzles.length}&a: \n &b- &d${puzzles.join("\n &b- &d")}`)
			s(` &6Trap: &a${trapType}`)
			s(` &8Wither Doors: &7${witherDoors-1}`)
		}
	}).start()
}

let rainbowStep = 0
register("step", () => { rainbowStep++ }).setFps(5)

register("renderOverlay", () => {
	if (!renderingMap) { return }
	if (!settings.mapEnabled) { return }
	if (settings.hideInBoss && inBoss) { return }
	if (settings.hideOutsideDungeon && !inDungeon) { return }

	let ms = settings.mapScale
	let toDrawLater = []
	let checks = []
	let rainbow = Renderer.getRainbowColors(rainbowStep, 1)
	let mapXY = settings.scoreCalc ? [25 * ms, 27 * ms] : [25 * ms, 25 * ms]
	// Draw RGB Border
	if (settings.mapRGB) {
		Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX-1, settings.mapY-1, mapXY[0] + 2, 1)
		Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX-1, settings.mapY+mapXY[1], mapXY[0] + 2, 1)
		Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX-1, settings.mapY, 1, mapXY[1])
		Renderer.drawRect(Renderer.color(rainbow[0], rainbow[1], rainbow[2], 255), settings.mapX+mapXY[0], settings.mapY, 1, mapXY[1])
	}
	const bgRgba = [settings.backgroundColor.getRed(), settings.backgroundColor.getBlue(), settings.backgroundColor.getGreen(), settings.backgroundTransparency]
	roomColors["witherDoor"][1] = [settings.witherDoorColor.getRed(), settings.witherDoorColor.getBlue(), settings.witherDoorColor.getGreen()]
	Renderer.drawRect(Renderer.color(bgRgba[0], bgRgba[1], bgRgba[2], bgRgba[3]), settings.mapX, settings.mapY, mapXY[0], mapXY[1]) // Main Background

	// Get the checkmark style the player has selected in settings to be used later
	let greenCheckmark = settings.checkmarks !== 0 ? [greenCheck, greenCheck2, greenCheckVanilla][settings.checkmarks-1] : greenCheck2
	let whiteCheckmark = settings.checkmarks !== 0 ? [whiteCheck, whiteCheck2, whiteCheckVanilla][settings.checkmarks-1] : whiteCheck2
	let failedRoomIcon = settings.checkmarks !== 0 ? [failedRoom, failedRoom2, failedRoomVanilla][settings.checkmarks-1] : failedRoom2

	if (dungeonMap !== []) {
		for (i in dungeonMap) {
			for (j in dungeonMap[i]) {
				if (dungeonMap[i][j] instanceof Room) {
					let col = roomColors[dungeonMap[i][j].roomType]
					if (dungeonMap[i][j].isLarge) {
						// Draw Unexplored
						if (!dungeonMap[i][j].explored) {
							if (settings.darkenUnexplored) {
								Renderer.drawRect(Renderer.color(col[1][0], col[1][1], col[1][2], settings.unexploredTransparency), settings.mapX + (i*ms)-ms, settings.mapY + (j*ms)-ms, 3*ms, 3*ms)
							}
							else {
								Renderer.drawRect(Renderer.color(col[0][0], col[0][1], col[0][2], settings.unexploredTransparency), settings.mapX + (i*ms)-ms, settings.mapY + (j*ms)-ms, 3*ms, 3*ms)
							}
						}
						// Draw Explored
						else {
							Renderer.drawRect(Renderer.color(col[0][0], col[0][1], col[0][2]), settings.mapX + (i*ms)-ms, settings.mapY + (j*ms)-ms, 3*ms, 3*ms)
						}
						if ((dungeonMap[i][j].roomType == "puzzle" || dungeonMap[i][j].roomType == "trap") && (settings.showImportantRooms || peekRoomNames.isKeyDown())) { toDrawLater.push([dungeonMap[i][j].roomName, (settings.mapX + i*ms) * (10/ms) + ms, (settings.mapY + j*ms) * (10/ms)]) }
						else if (dungeonMap[i][j].roomType == "normal" && dungeonMap[i][j].roomName !== "Unknown") {
							let a = ""
							if (settings.showSecrets || peekRoomNames.isKeyDown()) { toDrawLater.push([`&7${dungeonMap[i][j].secrets}`, (settings.mapX + i*ms) * (10/ms) - ms+1, (settings.mapY + j*ms) * (10/ms)-ms+1]) }
							if (settings.showNewRooms) { if (dungeonMap[i][j].roomName.startsWith("NEW")) { a += ` NEW` }}
							if (settings.showAllRooms || (peekRoomNames.isKeyDown() && Keyboard.isKeyDown(Keyboard.KEY_LSHIFT))) { a += ` ${dungeonMap[i][j].roomName.replace("NEW ", "")}` }
							if (settings.showCrypts && dungeonMap[i][j].crypts !== "Unknown") { a += ` ${dungeonMap[i][j].crypts}`}
							toDrawLater.push([a, (settings.mapX + i*ms) * (10/ms) + ms, (settings.mapY + j*ms) * (10/ms)])
						}
						if (settings.checkmarks !== 0) {
							if (dungeonMap[i][j].checkmark == "green") { checks.push([greenCheckmark, settings.mapX + (i*ms)-ms/2, settings.mapY + (j*ms)-ms/2, 2*ms, 2*ms]) }
							if (dungeonMap[i][j].checkmark == "white") { checks.push([whiteCheckmark, settings.mapX + (i*ms)-ms/2, settings.mapY + (j*ms)-ms/2, 2*ms, 2*ms]) }
							if (dungeonMap[i][j].checkmark == "failed") { checks.push([failedRoomIcon, settings.mapX + (i*ms)-ms/2, settings.mapY + (j*ms)-ms/2, 2*ms, 2*ms]) }
						}
					}
					else {
						let roomSize = [ms, ms]
						let roomOffset = [0, 0]
						if (dungeonMap[i][j].separatorType == "tall") {
							roomSize = [ms, 3*ms]
							roomOffset = [0, ms]
						}
						if (dungeonMap[i][j].separatorType == "long") {
							roomSize = [3*ms, ms]
							roomOffset = [ms, 0]
						}
						// Draw Unexplored
						if (!dungeonMap[i][j].explored) {
							if (settings.darkenUnexplored) {
								Renderer.drawRect(Renderer.color(col[1][0], col[1][1], col[1][2], settings.unexploredTransparency), settings.mapX + (i*ms) - roomOffset[0], settings.mapY + (j*ms) - roomOffset[1], roomSize[0], roomSize[1])
							}
							else {
								Renderer.drawRect(Renderer.color(col[0][0], col[0][1], col[0][2], settings.unexploredTransparency), settings.mapX + (i*ms) - roomOffset[0], settings.mapY + (j*ms) - roomOffset[1], roomSize[0], roomSize[1])
							}
						}
						// Draw explored
						else {
							Renderer.drawRect(Renderer.color(col[0][0], col[0][1], col[0][2]), settings.mapX + (i*ms) - roomOffset[0], settings.mapY + (j*ms) - roomOffset[1], roomSize[0], roomSize[1])
						}
					}
				}
			}
		}
		// Draw checkmarks after the rooms to prevent them being drawn ontop of by rooms
		checks.forEach(check => {
			Renderer.drawImage(check[0], check[1], check[2], check[3], check[4])
		})
		// Same for text
		toDrawLater.forEach(entry => {
			renderCenteredText(entry[0], entry[1], entry[2], ms, true)
		})
	}
	// Score calc!
	if (settings.scoreCalc) {
		let completedR = !bloodDone ? completedRooms + 1 : completedRooms
		let skillScore = 100 - (settings.assumeSpirit && dungeonDeaths > 0 ? dungeonDeaths * 2 - 1 : dungeonDeaths * 2) - (14 * dungeonPuzzles[0]) + (14 * dungeonPuzzles[1])
		let exploreScore = Math.floor(((60 * (completedR > totalRooms ? totalRooms : completedR))/totalRooms) + ((40 * (dungeonSecrets - overflowSecrets))/lastSecrets))
		exploreScore = Number.isNaN(exploreScore) ? 0 : exploreScore
		let speedScore = 100
		let bonusScore = (dungeonCrypts >= 5 ? 5 : dungeonCrypts) + ((mimicFloors.includes(dungeonFloor) && settings.assumeMimic) || mimicKilled ? 2 : 0) + (settings.ezpzPaul ? 10 : 0)

		currentScore = skillScore + exploreScore + speedScore + bonusScore

		let remaining = lastSecrets - dungeonSecrets < 0 ? `+${(lastSecrets - dungeonSecrets) * -1}` : lastSecrets - dungeonSecrets
		// Components of the main score info shown under the map - Too tedious to put into a single line
		let aaaaa = currentScore >= 300 ? `&a${currentScore}` : (currentScore >= 270 ? `&e${currentScore}` : `&c${currentScore}`)
		let bbbbb = `${dungeonSecrets} &7(&e${remaining}&7, &c${lastSecrets}&7)`
		let ccccc = dungeonCrypts >= 5 ? `&a${dungeonCrypts} &8(${lastCrypts})` : `&c${dungeonCrypts} &8(${lastCrypts})`
		let ddddd = settings.assumeSpirit && dungeonDeaths > 0 ? (dungeonDeaths * 2 - 1) * -1 : (dungeonDeaths * 2) * -1
		// Only show mimic if on floor 6/7 and assume mimic is off
		let mimicStr = !mimicFloors.includes(dungeonFloor) || settings.assumeMimic ? "" : (mimicKilled ? `    &7Mimic: &aYes` : `    &7Mimic: &cNo`)

		let aaaa = dungeonPuzzles[1] == dungeonPuzzles[0] ? `&a${dungeonPuzzles[1]}&7/&a${dungeonPuzzles[0]}` : `&c${dungeonPuzzles[1]}&7/&c${dungeonPuzzles[0]}`

		let msg1 = `&7Secrets: &a${bbbbb}    &7Crypts: &a${ccccc}${mimicStr}`
		// let msg2 = `&7Skill: &a${skillScore}    &7Explore: &a${exploreScore}    &7Bonus: &a${bonusScore}`
		let msg2 = `&7Puzzles: ${aaaa}    &7Deaths: &c${ddddd}    &7Score: ${aaaaa}`

		// Renderer.retainTransforms(true)
		Renderer.translate(settings.mapX + mapXY[0]/2-ms, settings.mapY + mapXY[1]-ms*2)

		renderCenteredText(msg1, 0, 0-0.75*ms, ms, false)
		Renderer.translate(settings.mapX + mapXY[0]/2, settings.mapY + mapXY[1])
		// renderCenteredText(msg1, (settings.mapX + mapXY[0]/2) * 10/ms, (settings.mapY + mapXY[1]) * 10/ms - ms * (10-ms*1.15), ms, false)
		renderCenteredText(msg2, 0, 0-2*ms, ms, false)
		// renderCenteredText(msg2, (settings.mapX + mapXY[0]/2) * 10/ms, (settings.mapY + mapXY[1]) * 10/ms - ms * (10-ms*1.15) + (ms * 2), ms, false)

		// Renderer.retainTransforms(false)

		if (currentScore >= 300 && settings.say300 && !saidIfSPlus) {
			ChatLib.command(`pc ${settings.say300Message}`)
			saidIfSPlus = true
		}
	}
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
				"name":Player.getName(),
				"iconX": settings.mapX+(Player.getX()*(0.1225 * ms)),
				"iconY": settings.mapY+(Player.getZ()*(0.1225 * ms)),
				"rotation": Player.getRawYaw()+180,
				"icon": myHead
			})
		}
	}
})

// Getting player icons from the map in the 9th slot
register("step", () => {
	if (!settings.mapEnabled) { return }
	if (inBoss) { playerIcons = {}; return}
	if (!settings.mapEnabled) { return }
	if (!settings.showHeads) { return }
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
				// 		"icon":questionMark
				// 	}
				// }
				Object.keys(dungeonParty).forEach(player => {
					let playerObj = World.getPlayerByName(player)
					if (playerObj == null) { return }
					let dist = []
					mapData.field_76203_h.forEach((icon, vec4b) => {
						let iconX = settings.mapX + (vec4b.func_176112_b() + 128 - mapOffset[0])/2
						let iconY = settings.mapY + (vec4b.func_176113_c() + 128 - mapOffset[1])/2

						let rotation = (vec4b.func_176111_d() * 360) / 16

						let myDistance = Math.sqrt((settings.mapX+(playerObj.getX()*(0.1225 * ms)) - iconX)**2 + (settings.mapY+(playerObj.getZ()*(0.1225 * ms)) - iconY)**2)
	
						if (dist.length == 0 || dist[1] > myDistance) {
							dist = [icon, myDistance, playerObj.getName(), iconX, iconY, rotation]
						}
					})
					if (dist.length !== 0) {
						let icon = dist[0]
						if (playerIcons[icon] == undefined) { playerIcons[icon] = {}}
						playerIcons[icon]["name"] = dist[2]
						playerIcons[icon]["iconX"] = dist[3]
						playerIcons[icon]["iconY"] = dist[4]
						playerIcons[icon]["rotation"] = dist[5] + 180
						playerIcons[icon]["icon"] = dungeonParty[dist[2]]
					}
				})
				mapData.field_76203_h.forEach((icon, vec4b) => {
					let iconX = Math.round(settings.mapX + (vec4b.func_176112_b() + 128 - mapOffset[0])/2)
					let iconY = Math.round(settings.mapY + (vec4b.func_176113_c() + 128 - mapOffset[1])/2)
					
					let rotation = (vec4b.func_176111_d() * 360) / 16 + 180

					if (playerIcons[icon] == undefined) {
						playerIcons[icon] = {
							"name": "Unknown",
							"iconX": iconX,
							"iconY": iconY,
							"rotation": rotation,
							"icon": questionMark
						}
					}
					else {
						playerIcons[icon].iconX = iconX
						playerIcons[icon].iconY = iconY
						playerIcons[icon].rotation = rotation
					}
					
				})
			}
			catch(error) {
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
	let iconDims = [ms*(settings.headScale * 5), ms*(settings.headScale * 5)]
	// Renderer.retainTransforms(true)
	Renderer.translate(markerInfo.iconX, markerInfo.iconY)
	Renderer.translate(iconDims[0]/2, iconDims[1]/2)
	Renderer.rotate(markerInfo.rotation)
	Renderer.translate(-iconDims[0]/2, -iconDims[1]/2)
	// Renderer.retainTransforms(false)
	if (markerInfo.icon == undefined) { markerInfo.icon = questionMark }
	Renderer.drawImage(markerInfo.icon, 0, 0, iconDims[0], iconDims[1])
	if (settings.showIconNames || Player.getHeldItem().getName().endsWith("Spirit Leap") && markerInfo.name !== Player.getName()) {
		renderCenteredText(markerInfo.name, (markerInfo.iconX+iconDims[0]/2)*2, (markerInfo.iconY+ms)*2, 5, false)
	}
}
// Data from the map in the player's 9th slot to figure out which rooms are unexplored or have checkmarks
register("step", () => {
	if (!settings.mapEnabled) { return }
	if (!renderingMap) { return }
	if (!settings.darkenUnexplored && settings.checkmarks == 0) { return }
	if (inBoss) { return }
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
		catch(error) { return }
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
		if (dungeonFloor == "F1") { mapOffset = [32, 22] }
		if (dungeonFloor == "F4" || dungeonFloor == "M4") { mapOffset = [13, 24] }
		else if (totalRooms == 24) { mapOffset = [20, 20] }
		else if (totalRooms == 29) { mapOffset = [24, 13] }
		else if (totalRooms == 15) { mapOffset = [32, 32] }
		else if (totalRooms > 29) { mapOffset = [13, 13] }
		else if (totalRooms >= 19) { mapOffset = [31, 22] }
		let unexploredColors = [0, 85, 119]
		for (let i = 0; i < 11; i++) {
			for (let j = 0; j < 11; j++) {
				try {
					let color = map2d[i*10+mapOffset[1]][j*10+mapOffset[0]]
					if (!unexploredColors.includes(color)) { dungeonMap[j*2+2][i*2+2].explored = true }
					else { dungeonMap[j*2+2][i*2+2].explored = false }
					// Pixel color = checkmark color
					if (color == 30 && dungeonMap[j*2+2][i*2+2].roomType !== "green") { dungeonMap[j*2+2][i*2+2].checkmark = "green" }
					if (color == 34 && dungeonMap[j*2+2][i*2+2].checkmark == "None") { dungeonMap[j*2+2][i*2+2].checkmark = "white" }
					if (color == 18 && dungeonMap[j*2+2][i*2+2].roomType !== "blood") { dungeonMap[j*2+2][i*2+2].checkmark = "failed" }
				}
				catch(error) {}
			}
		}
	}).start()
}).setFps(3)

// Wither door ESP
register("renderWorld", () => {
	if (!settings.witherDoorEsp) { return }
	let rgba = [settings.witherDoorEspColor.getRed(), settings.witherDoorEspColor.getGreen(), settings.witherDoorEspColor.getBlue(), ]
	for (let i = 0; i < doorEsps.length; i++) {
		RenderLib.drawBaritoneEspBox(doorEsps[i][0]-1, doorEsps[i][1], doorEsps[i][2]-1, 3, 4, rgba[0], rgba[1], rgba[2], 255, true)
		if (getDistance(Player.getX(), Player.getY(), Player.getZ(), doorEsps[i][0], doorEsps[i][1], doorEsps[i][2]) < 5 || World.getBlockAt(doorEsps[i][0], doorEsps[i][1], doorEsps[i][2]).getRegistryName() !== "minecraft:coal_block") {
			doorEsps.splice(i, 1)
		}
	}
})

// Star Mob ESP
register("renderEntity", (entity, position, partialTicks, event) => {
	if (!settings.starMobEsp) { return }
	let entityName = entity.getName()
	if (entityName.includes("✯")) {
		if (entityName.includes("Fel") || entityName.includes("Withermancer")) {
			drawBox(entity, settings.starMobEspColor.getRed(), settings.starMobEspColor.getGreen(), settings.starMobEspColor.getBlue(), 1, 0.75, 3, partialTicks, -3	)
		}
		else {
			drawBox(entity, settings.starMobEspColor.getRed(), settings.starMobEspColor.getGreen(), settings.starMobEspColor.getBlue(), 1, 0.75, 2, partialTicks, -2)
		}
	}
})

// First time using module message. Doesn't show if the user installed the module then launched their game, will show if they used /ct load after importing.
// Too lazy to make work with people who re-launch.
let firstTimeMessage = new Message(`\n${prefix} &aHello ${Player.getName()}, you now have epic map!\n&aTo configure map, do /dmap.\n&aIf you find any bugs or features you want added, please let me know on Discord! `, new TextComponent("&cUnclaimed#6151\n").setHover("show_text", "&aClick to copy!").setClick("run_command", "/ct copy Unclaimed#6151"))

try {
	let first = JSON.parse(FileLib.read("IllegalMap", "firstTime.json"))
	if (first["firstTime"] == true || first["uuid"] !== Player.getUUID()) {
		firstTimeMessage.chat()
		first["firstTime"] = false
		first["uuid"] = Player.getUUID()
		FileLib.write("IllegalMap", "firstTime.json", JSON.stringify(first))
	}
}
catch(error) {
	firstTimeMessage.chat()
	FileLib.write("IllegalMap", "firstTime.json", JSON.stringify({"firstTime":false, "uuid":Player.getUUID()}))
}