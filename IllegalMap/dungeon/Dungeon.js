import { Door } from "./Door"
import Config from "../data/Config"
import { DungeonPlayer } from "../extra/DungeonPlayer"
import Lookup from "../utils/Lookup"
import Map from "../utils/Map"
import {
    prefix,
    setDiamond,
    setEmerald,
    setGold,
    setCoal,
    isColumnAir,
    isDoor,
    blankRoom,
    chunkLoaded,
    getTrappedChests,
    BufferedImage,
    isBetween,
    dataObject
} from "../utils/Utils"
import { Room } from "./Room"
import request from "../../requestV2"

class Dungeon {
    constructor() {
        this.reset()

        this.peekBind = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "Map")

        this.greenCheck = new Image("BloomMapGreenCheck.png", "https://i.imgur.com/GQfTfmp.png")
        this.whiteCheck = new Image("BloomMapWhiteCheck.png", "https://i.imgur.com/9cZ28bJ.png")
        this.failedRoom = new Image("BloomMapFailedRoom.png", "https://i.imgur.com/qAb4O9H.png")
        this.questionMark = new Image("BloomMapQuestionMark.png", "https://i.imgur.com/kp92Inw.png")

        this.entryMessages = [
            "[BOSS] Bonzo: Gratz for making it this far, but I’m basically unbeatable.",
            "[BOSS] Scarf: This is where the journey ends for you, Adventurers.",
            "[BOSS] The Professor: I was burdened with terrible news recently...",
            "[BOSS] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!",
            "[BOSS] Livid: Welcome, you arrive right on time. I am Livid, the Master of Shadows.",
            "[BOSS] Sadan: So you made it all the way here...and you wish to defy me? Sadan?!",
            "[BOSS] Necron: Finally, I heard so much about you. The Eye likes you very much."
        ]

        this.floorSecrets = {
            "F1": 0.3,
            "F2": 0.4,
            "F3": 0.5,
            "F4": 0.6,
            "F5": 0.7,
            "F6": 0.85,
            "F7": 1
        }

        // -----------------------------------

        register("chat", (event) => {
            let formatted = ChatLib.getChatMessage(event)
            let unformatted = ChatLib.removeFormatting(formatted)
            if (unformatted.match(/\[NPC\] Mort: Here, I found this map when I first entered the dungeon\./)) { this.runStarted = new Date().getTime() }
            if (unformatted.match(/\[BOSS\] The Watcher/) && !this.bloodOpen) { this.bloodOpen = new Date().getTime() }
            if (unformatted == "[BOSS] The Watcher: You have proven yourself. You may pass.") { this.watcherDone = new Date().getTime() }
            if (unformatted.match(/.+ opened a WITHER door\!/)) { this.openedWitherDoors++ }
            if (this.entryMessages.includes(unformatted)) { this.bossEntry = new Date().getTime() }
            if (unformatted == "                             > EXTRA STATS <") { this.runEnded = new Date().getTime() }
            // if (unformatted == "[NPC] Mort: You should find it useful if you get lost." && this.floorInt >= 6 && !Config.legitMode) { this.findMimic() }
        })

        register("command", () => { this.scan() }).setName("/s")

        register("command", () => {
            ChatLib.chat(this.floor)
        }).setName("/floor")

        register("command", () => {
            let lines = TabList.getNames()
            for (let i = 0; i < lines.length; i++) {
                ChatLib.chat(`"${i}": ${lines[i]}`)
            }
        }).setName("/tablist")

        register("command", () => {
            ChatLib.chat(`Found: ${this.secretsFound}`)
            ChatLib.chat(`For Max: ${this.secretsForMax}`)
            ChatLib.chat(`Overflow: ${this.overflowSecrets}`)
            ChatLib.chat(`Calculated Total: ${this.calculatedTotalSecrets}`)
            ChatLib.chat(`Scanned Total: ${this.totalSecrets}`)
        }).setName("/secrets")

        // Auto Scan
        this.lastAutoScan = null
        register("tick", () => {
            if (this.inDungeon && !this.scanning && Config.autoScan && !this.fullyScanned && new Date().getTime() - this.lastAutoScan >= 500 && (Config.mapEnabled && Config.scoreCalc !== 2)) {
                this.lastAutoScan = new Date().getTime()
                new Thread(() => {
                    this.scan()
                }).start()
            }
        })

        // Check for mimic
        register("tick", () => {
            if (!this.inDungeon || this.mimicDead || (!Config.mapEnabled && Config.scoreCalc == 2) || !this.time) { return }
            if (!this.mimicLocation && !this.mimicDead) {
                this.findMimic()
            }
            if (this.mimicLocation && !this.bossEntry) {
                this.checkMimicFound()
            }
        })

        // Main rendering for everything on the map
        register("renderOverlay", () => {
            if (!this.inDungeon || (!Config.mapEnabled && Config.scoreCalc == 2)) { return }
            if ((Config.scoreCalc == 3 && this.bossEntry) || (Config.scoreCalc == 1 && !Config.mapEnabled)) {
                this.drawScoreCalcStuff()
                return
            }
            // Render the map and checkmarks
            this.drawBackground()
            if (this.map) {
                this.renderMap()
            }
            this.renderCheckmarks()
            // Render room names
            let namesRendered = []

            this.rooms.forEach(room => {
                if (!namesRendered.includes(room.name)) {
                    let sec = false
                    let name = false
                    namesRendered.push(room.name)
                    if (this.peekBind.isKeyDown() && (["normal", "rare", "yellow"].includes(room.type))) {
                        if (Config.legitMode && !room.explored) { return }
                        room.renderSecrets()
                        sec = true
                        if (Keyboard.isKeyDown(Keyboard.KEY_LSHIFT)) {
                            room.renderName()
                            name = true
                        }
                    }
                    if ((Config.showImportantRooms && ["puzzle", "trap"].includes(room.type)) || (["puzzle", "trap", "normal", "rare"].includes(room.type) && Config.showRooms)) {
                        if (Config.legitMode && !room.explored) { return }
                        room.renderName()
                    }
                    if (Config.showSecrets !== 0 && !sec && (room.type == "normal" || room.type == "rare")) {
                        if (Config.legitMode && !room.explored) { return }
                        room.renderSecrets()
                    }
                }
            })
            // Render player icons and player names
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].isDead && !Config.showDeadPlayers) { continue }
                this.players[i].render()
                // if player holding leaps
                if ((Player.getHeldItem().getName().includes("Spirit Leap") && Config.playerNames == 1) || Config.playerNames == 2) {
                    if (this.players[i].player !== Player.getName()) {
                        this.players[i].renderName()
                    }
                }
            }
            // Render the score calc
            if (Config.scoreCalc !== 2) {
                this.drawScoreCalcStuff()
            }
        })

        register("step", () => {
            if (!Config.mapEnabled || !this.inDungeon || !this.fullyScanned) { return }
            this.makeMap()
        }).setFps(2)
        
        register("step", () => {
            if (!this.inDungeon || (!Config.mapEnabled && Config.scoreCalc == 2)) { return }
            // Thread because this usually takes between 10-30ms to complete, which lowers overall fps
            new Thread(() => {
                this.updatePlayers()
                this.updateRooms()
                this.updateDoors()
            }).start()
        }).setFps(5)

        register("tick", () => {
            if (this.inDungeon && Config.scoreCalc !== 2) {
                if (!this.fullyScanned) {
                    this.scStr1 = "&cDungeon has not been"
                    this.scStr2 = "&cfully scanned."
                }
                else {
                    this.calcScore()
                }
            }
        })

        register("command", () => {
            for (let i = 0; i < this.players.length; i++) {
                this.players[i].print()
            }
        }).setName("icons")

        register("command", () => {
            ChatLib.chat(`Skill: ${this.skillScore}\n` +
                `Explore: ${this.exploreScore}\n` +
                `Bonus: ${this.bonusScore}\n` +
                `Mimic: ${this.mimicDead}\n` +
                `Crypts: ${this.crypts}`
                )
        }).setName("score")

        register("tick", () => {
            if (!Config.mapEnabled && Config.scoreCalc == 2) { return }
            let scoreboard = Scoreboard.getLines().map(a => { return ChatLib.removeFormatting(a) })
            let lines = TabList.getNames().map(a => { return ChatLib.removeFormatting(a) })

            // Check the scoreboard to see if the player is in a dungeon, get the floor as well.
            for (let line of scoreboard) {
                let match = line.match(/ ⏣ The Catac.+ombs \((.+)\)/)
                if (match) {
                    this.inDungeon = true
                    this.floor = match[1]
                    this.floorInt = parseInt(this.floor.replace(/[^\d]/g, ""))
                }
            }
            if ([1, 2, 3].includes(this.floorInt)) {
                this.endX = 158
                this.endZ = 158
            }
            else if ([4].includes(this.floorInt)) {
                this.endX = 190
                this.endZ = 158
            }
            else {
                this.endX = 190
                this.endZ = 190
            }

            // ChatLib.chat(
            //     `EndX: ${this.endX}\n` +
            //     `EndZ: ${this.endZ}\n` +
            //     `Floor: ${this.floorInt}`
            // )

            if (!this.inDungeon || !lines[0] || !lines[0].includes("Party (")) { return }
            // Get all of the info from the tablist, mostly useless but still good to have.
            try {
                this.party = [5, 9, 13, 17, 1].map(line => { return lines[line].split(" ")[0] }).filter(player => { return player !== "" })
                this.puzzles = [48, 49, 50, 51, 52].map(line => { return lines[line] }).filter(line => { return line !== "" })
                this.puzzlesDone = [parseInt(ChatLib.removeFormatting(lines[47]).match(/Puzzles: \((\d+)\)/)[1]), 0]
                for (let i = 0; i < 5; i++) {
                    if (lines[47 + i].includes("✔")) {
                        this.puzzlesDone[1]++
                    }
                }
                this.time = lines[45].match(/Time: (.+)/)[1]
                this.time = this.time == "Soon!" ? null : this.time
                this.seconds = parseInt(this.time.match(/(\d+)m (\d+)s/)[1]) * 60 + parseInt(this.time.match(/(\d+)m (\d+)s/)[2])
                this.secretsFound = parseInt(lines[31].match(/ Secrets Found: (\d+)/)[1])
                let m = lines[44].match(/ Secrets Found: (.+)%/)
                this.secretsPercent = parseFloat(m[1])
                this.secretsNeeded = Object.keys(this.floorSecrets).includes(this.floor) ? this.floorSecrets[this.floor] : 1
                this.overflowSecrets = this.secretsFound > this.secretsForMax ? this.secretsFound - this.secretsForMax : 0
                // Total secrets in the dungeon based off of the percentage found
                if (this.secretsFound > 0) { this.calculatedTotalSecrets = Math.floor(100/this.secretsPercent * this.secretsFound + 0.5) }
                // If a secret has been found then use the percentage on the tablist to calculate exactly how many are in the run. Makes it so that if the scan fails to detect a room
                // it will still be accurate after a secret has been found.
                this.secretsForMax = this.calculatedTotalSecrets > 0 ? this.calculatedTotalSecrets * this.secretsNeeded : this.totalSecrets * this.secretsNeeded
                this.crypts = parseInt(lines[32].match(/ Crypts: (\d+)/)[1])
                this.deaths = parseInt(lines[25].match(/Deaths: \((\d+)\)/)[1])
                this.discoveries = parseInt(lines[30].match(/Discoveries: \((\d+)\)/)[1])
                this.milestone = 0
                this.openedRooms = parseInt(lines[42].match(/ Opened Rooms: (\d+)/)[1])
                this.completedRooms = parseInt(lines[43].match(/ Completed Rooms: (\d+)/)[1])
            }
            catch(error) {
                // this.reset()
            }
            if (Config.paul == 0) { this.isPaul = true }
            if (Config.paul == 1) { this.isPaul = false }
            if (Config.paul == 2 && dataObject.isPaul) { this.isPaul = true }

        })

        // Update the player's icon 60 times per second
        register("step", () => {
            if (!Config.mapEnabled || !this.inDungeon) { return }
            for (let i = 0; i < this.players.length; i++) {
                let player = World.getPlayerByName(this.players[i].player)
                if (!player) {
                    this.players[i].inRender = false
                    continue
                }
                if (isBetween(player.getX(), 0, 190) && isBetween(player.getZ(), 0, 190)) {
                    this.players[i].inRender = true
                    this.players[i].iconX = (player.getX() * (0.1225 * 5) - 2) * 0.2 * Config.mapScale + Config.mapScale/2
                    this.players[i].iconY = (player.getZ() * (0.1225 * 5) - 2) * 0.2 * Config.mapScale + Config.mapScale/2
                    this.players[i].yaw = player.getYaw() + 180

                    this.players[i].realX = player.getX()
                    this.players[i].realZ = player.getZ()
                }
            }
        }).setFps(60)

        register("chat", (message) => {
            if (Config.spiritPet !== 2) { return }
            let player = message.removeFormatting().split(" ")[0]
            player = player == "You" ? Player.getName() : player
            // ChatLib.chat(`Player: ${player}`)
            // ChatLib.chat(`Deaths: ${this.deaths}`)
            // ChatLib.chat(`Time: ${this.time}`)
            let noob = this.getPlayer(player)
            if (noob && this.time && this.deaths == 0) {
                if (noob.hasSpirit) {
                    ChatLib.chat(`${prefix} &a${player} has a spirit pet!`)
                    this.firstDeathSpirit = true
                }
            }
        }).setCriteria(" ☠ ${message}")

        register("worldLoad", () => {
            this.reset()
        })
    }
    reset() {
        // Stuff from the scoreboard and tablist
        this.inDungeon = false
        this.floor = ""
        this.floorInt = 0
        this.time = null
        this.seconds = 0
        this.party = []
        this.puzzles = {}
        this.secretsFound = 0
        this.crypts = 0
        this.deaths = 0
        this.discoveries = 0
        this.milestone = 0
        this.openedRooms = 0
        this.completedRooms = 0
        this.secretsPercent = 0
        // Run Splits and stuff
        this.openedWitherDoors = 0
        this.runStarted = null
        this.bloodOpen = null
        this.watcherDone = null
        this.bossEntry = null
        this.runEnded = null

        // ------------------------------------------
        // IllegalMap Stuff

        // Misc stuff
        this.startX = 15
        this.startZ = 15

        this.endX = 190
        this.endZ = 190
        this.roomSize = 31

        this.autoScanning = false
        this.scanning = false
        this.fullyScanned = false

        this.players = []

        // Dungeon itself
        this.rooms = []
        this.doors = []
        this.totalRooms = -1
        this.witherDoors = 0
        this.trapType = "Unknown"

        this.map = null
        this.mapSize = []

        this.bloodDone = false
        this.trapDone = false
        this.yellowDone = false

        // Score Calc Stuff
        this.scStr1 = ""
        this.scStr2 = ""

        this.said300 = false

        this.secretsNeeded = 0
        this.secretsForMax = 0
        this.calculatedTotalSecrets = 0

        this.skillScore = 0
        this.exploreScore = 0
        this.bonusScore = 0
        this.score = 0
        
        this.puzzlesDone = []
        this.totalSecrets = 0
        this.overflowSecrets = 0

        this.mimicDead = null
        this.mimicLocation = null
        this.firstDeathSpirit = false

        this.checkedForPaul = false
        this.isPaul = false


    }
    scan() {
        if (this.scanning) { return }

        this.scanning = true
        let players = this.players

        this.reset()
        this.players = players

        const started = new Date().getTime()
        let names = []
        let puzzles = []
        // const allRooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))

        let allLoaded = true

        for (let x = this.startX; x <= this.startX + (this.roomSize+1) * (Math.floor((this.endX / 31) - 1)); x+=Math.floor((this.roomSize+1)/2)) {
            for (let z = this.startZ; z <= this.startZ + (this.roomSize+1) * (Math.floor((this.endZ / 31) - 1)); z+=Math.floor((this.roomSize+1)/2)) {
                // Center of where a room should be
                if (x%(this.roomSize+1)==Math.floor(this.roomSize/2) && z%(this.roomSize+1)==Math.floor(this.roomSize/2)) {
                    if (!chunkLoaded([x, 100, z])) { allLoaded = false }
                    if (isColumnAir(x, z)) { continue }
                    let room = Lookup.getRoomFromCoords([x, z], this)
                    if (!room) {
                        continue
                    }
                    if (!names.includes(room.name)) {
                        names.push(room.name)
                        this.totalSecrets += room.secrets
                    }
                    this.totalRooms++
                    this.rooms.push(room)
                    if (room.type == "trap") {
                        this.trapType = room.name.split(" ")[0]
                    }
                    if (room.type == "puzzle") {
                        puzzles.push(room.name)
                    }

                    // setEmerald(x, 101, z)
                }

                // Door or part of a larger room
                else if (((x%(this.roomSize+1)==this.roomSize && z%(this.roomSize+1)==Math.floor(this.roomSize/2)) || (x%(this.roomSize+1)==Math.floor(this.roomSize/2) && z%(this.roomSize+1)==this.roomSize)) && !isColumnAir(x, z)) {
                    // Door
                    if (isDoor(x, z)) {
                        let door = new Door(x, z)
                        let doorBlock = World.getBlockAt(x, 70, z)
                        if (doorBlock.getID() == 173) {
                            door.type = "wither"
                            this.witherDoors++
                        }
                        else if (doorBlock.getID() == 159 && doorBlock.getMetadata() == 14) { door.type = "blood" }
                        else if (doorBlock.getRegistryName() == "minecraft:monster_egg") { door.type = "entrance" }
                        this.doors.push(door)
                    }
                    // Part of a larger room
                    else {
                        let room = new Room(x, z, blankRoom)
                        this.rooms.forEach(a => {
                            if (a.x == room.x-16 && a.z == room.z) {
                                room = new Room(x, z, a.getJson())
                            }
                            if (a.x == room.x && a.z == room.z-16) {
                                room = new Room(x, z, a.getJson())
                            }
                        })
                        if (room.type == "entrance") {
                            let door = new Door(room.x, room.z)
                            door.type = "entrance"
                            this.doors.push(door)
                        }
                        else { this.rooms.push(room) }
                        // setGold(x, 101, z)
                    }
                }

                // Middle of a 2x2 room
                else if (x%(this.roomSize+1)==this.roomSize && z%(this.roomSize+1)==this.roomSize && !isColumnAir(x, z)) {
                    let room = new Room(x, z, blankRoom)
                    this.rooms.forEach(a => {
                        if (a.x == room.x - 16 && a.z == room.z - 16) {
                            room = new Room(x, z, a.getJson())
                        }
                    })
                    this.rooms.push(room)
                }
            }
        }
        // Hide all of the rooms if legit mode is enabled
        if (Config.legitMode) {
            for (let i = 0; i < this.rooms.length; i++) {
                this.rooms[i].normallyVisible = false
                this.rooms[i].explored = false
            }
            for (let i = 0; i < this.doors.length; i++) {
                this.doors[i].normallyVisible = false
                this.doors[i].explored = false
            }
        }

        this.makeMap()
        this.fullyScanned = allLoaded

        if (this.fullyScanned) {
            Map.calibrate(this)
            if (Config.chatInfo) {
                ChatLib.chat(
                    `${prefix} &aDone! Took &b${new Date().getTime() - started}&ams!\n` +
                    `${prefix} &aCurrent Dungeon:\n` +
                    ` &aPuzzles &c${puzzles.length}&a: \n &b- &d${puzzles.join("\n &b- &d")}\n` +
                    ` &6Trap: &a${this.trapType}\n` +
                    ` &8Wither Doors: &7${this.witherDoors - 1}\n` +
                    ` &7Total Secrets: &b${this.totalSecrets}`
                )
            }
        }
        this.scanning = false
    }
    makeMap() {
        let map = new BufferedImage(25, 25, BufferedImage.TYPE_4BYTE_ABGR)
        const setPixels = (x1, y1, width, height, color) => {
            for (let x = x1; x < x1 + width; x++) {
                for (let y = y1; y < y1 + height; y++) {
                    map.setRGB(x, y, color.getRGB())
                }
            }
        }
        this.rooms.forEach(room => {
            if (!room.normallyVisible && Config.legitMode) { return }
            let color = room.getColor()
            if (room.name == "Unknown") { color = new java.awt.Color(255/255, 176/255, 31/255) }
            else if (!Config.legitMode && !room.explored && Config.darkenUnexplored) { color = color.darker().darker() }

            setPixels(Math.floor(room.x/16)*2+1, Math.floor(room.z/16)*2+1, 3, 3, color)
        })
        this.doors.forEach(door => {
            if (!door.normallyVisible && Config.legitMode) { return }
            let color = !Config.legitMode && !door.explored && Config.darkenUnexplored ? door.getColor().darker().darker() : door.getColor()
            setPixels(Math.floor(door.x/16)*2+2, Math.floor(door.z/16)*2+2, 1, 1, color)
        })
        this.map = map
    }
    getPlayer(player) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].player == player) {
                return this.players[i]
            }
        }
    }
    drawBackground() {
        this.mapSize = Config.scoreCalc == 0 || (Config.scoreCalc == 3 && !this.bossEntry) ? [25, 27] : [25, 25]
        Renderer.drawRect(Config.backgroundColor.hashCode(), Config.mapX, Config.mapY, this.mapSize[0] * Config.mapScale, this.mapSize[1] * Config.mapScale)
    }
    renderMap() {
        Renderer.drawImage(new Image(this.map), Config.mapX, Config.mapY, 25*Config.mapScale, 25*Config.mapScale)
    }
    renderCheckmarks() {
        let names = []
        Renderer.retainTransforms(true)
        Renderer.translate(Config.mapX, Config.mapY)
        Renderer.scale(0.1*Config.mapScale, 0.1*Config.mapScale)
        let checkSize = Config.mapScale * 4
        for (let i = 0; i < this.rooms.length; i++) {
            let room = this.rooms[i]
            if (!names.includes(room.name) && room.type !== "entrance") {
                
                let x = room.x*1.25 + Config.mapScale*1.25 - checkSize/2
                let y = room.z*1.25 - checkSize/4
                
                if (Config.showSecrets == 3 && ["normal", "rare"].includes(room.type)) {
                    if (Config.legitMode && !room.explored && room.normallyVisible) {
                        Renderer.drawImage(this.questionMark, x, y, checkSize, checkSize); names.push(room.name)
                    }
                    continue
                }

                if (room.checkmark == "green") { Renderer.drawImage(this.greenCheck, x, y, checkSize, checkSize); names.push(room.name) }
                if (room.checkmark == "white") { Renderer.drawImage(this.whiteCheck, x, y, checkSize, checkSize); names.push(room.name) }
                if (room.checkmark == "failed") { Renderer.drawImage(this.failedRoom, x, y, checkSize, checkSize); names.push(room.name) }
                if (Config.legitMode && !room.explored && room.normallyVisible) { Renderer.drawImage(this.questionMark, x, y, checkSize, checkSize); names.push(room.name) }
            }
        }
        Renderer.retainTransforms(false)
    }
    calcScore() {
        // The nerd stuff

        // let deathPenalty = this.deaths == 0 ? 0 : this.deaths * 2 - 1
        let deathPenalty = (this.firstDeathSpirit || Config.spiritPet == 0) && this.deaths > 0 ? this.deaths * 2 - 1 : this.deaths * 2

        let completedR = !this.bloodDone ? this.completedRooms + 1 : this.completedRooms
		completedR = !this.inBoss ? completedR + 1 : completedR

        // ChatLib.chat(`Needed: ${this.secretsNeeded}`)
        // ChatLib.chat(`For Max: ${this.secretsForMax}`)
        // ChatLib.chat(`Overflow: ${this.overflowSecrets}`)
        // ChatLib.chat(`Found: ${this.secretsFound}`)

        this.skillScore = Math.floor(20 + ((completedR > this.totalRooms ? this.totalRooms : completedR) / this.totalRooms) * 80 - (10 * this.puzzlesDone[0]) + (10 * this.puzzlesDone[1]) - deathPenalty)
        this.skillScore = this.skillScore < 20 ? 20 : this.skillScore

        this.exploreScore = Math.floor(((60 * (completedR > this.totalRooms ? this.totalRooms : completedR)) / this.totalRooms) + ((40 * (this.secretsFound - this.overflowSecrets)) / this.secretsForMax))
        this.exploreScore = Number.isNaN(this.exploreScore) ? 0 : this.exploreScore

        // ChatLib.chat(this.exploreScore)

        let speedScore = 100 // Not worth calculating. If you can't get 100 speed score then you shouldn't be playing Dungeons.

        this.bonusScore = (this.crypts >= 5 ? 5 : this.crypts) + (this.mimicDead ? 2 : 0) + (this.isPaul ? 10 : 0)
        this.score = this.skillScore + this.exploreScore + speedScore + this.bonusScore
        this.score = this.trapDone ? this.score : this.score -= 5
        this.score = this.yellowDone ? this.score : this.score -= 5

        let totalSecrets = this.calculatedTotalSecrets > 0 ? this.calculatedTotalSecrets : this.totalSecrets
        // Line 1
        let scSecrets = `&7Secrets: &b${this.secretsFound}`
        let scSecretsExtra = this.calculatedTotalSecrets == 0 ? "" : `&8-&e${totalSecrets - this.secretsFound}&8-&c${totalSecrets}`
        let scCrypts = this.crypts == 0 ? `&7Crypts: &c0` : this.crypts < 5 ? `&7Crypts: &e${this.crypts}` : `&7Crypts: &a${this.crypts}`
        let scMimic = this.floorInt < 6 ? "" : this.mimicDead ? `&7Mimic: &a✔` : `&7Mimic: &c✘`

        // Line 2
        let scTrap = [0, 1, 2].includes(this.floorInt) ? "" : this.trapDone ? `&7Trap: &a✔` : `&7Trap: &c✘`
        let scDeaths = this.deaths == 0 ? `&7Deaths: &a0` : `&7Deaths: &c-${deathPenalty}`
        let scScore = this.score < 270 ? `&7Score: &c${this.score}` : this.score < 300 ? `&7Score: &e${this.score}` : `&7Score: &a${this.score}`

        // Assemble the strings
        this.scStr1 = `${scSecrets}${scSecretsExtra}     ${scCrypts}     ${scMimic}`.trim()
        this.scStr2 = `${scTrap}     ${scDeaths}     ${scScore}`.trim()

        // Announce 300
        if (Config.announce300 && !this.said300 && this.score >= 300) {
            this.said300 = true
            ChatLib.command(`pc ${Config.announce300Message}`)
        }
    }
    drawScoreCalcStuff() {
        if (Config.scoreCalc == 0 || (Config.scoreCalc == 3 && !this.bossEntry)) {
            Renderer.translate(Config.mapX + (25 * Config.mapScale)/2, Config.mapY + 24.5 * Config.mapScale)
            Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
            Renderer.drawStringWithShadow(this.scStr1, -Renderer.getStringWidth(this.scStr1.removeFormatting())/2, 0)
    
            Renderer.translate(Config.mapX + (25 * Config.mapScale)/2, Config.mapY + 25.5 * Config.mapScale)
            Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
            Renderer.drawStringWithShadow(this.scStr2, -Renderer.getStringWidth(this.scStr2.removeFormatting())/2, 0)
        }
        else if (Config.scoreCalc == 1 || (Config.scoreCalc == 3 && this.bossEntry)) {
            let split = this.scStr1.split("     ").join("\n")
            let split2 = this.scStr2.split("     ").join("\n")
            this.drawScoreCalcBackground()
            Renderer.translate(Config.scoreCalcSeperateX + Config.mapScale, Config.scoreCalcSeperateY + Config.mapScale)
            Renderer.scale(0.2 * Config.mapScale, 0.2 * Config.mapScale)
            Renderer.drawString(`${split}\n${split2}`, 0, 0)
        }
    }
    drawScoreCalcBackground() {
        let width = Config.legitMode ? 13 : 19
        Renderer.translate(Config.scoreCalcSeperateX, Config.scoreCalcSeperateY)
        Renderer.drawRect(Config.backgroundColor.hashCode(), 0, 0, Config.mapScale*width, Config.mapScale*12.5)
    }
    updatePlayers() {
        if (!this.inDungeon) { return }
        let tabList = TabList.getNames()
        if (tabList.length < 10) { return }
        let num = 0
        let decor = Map.getMapDecorators()
        for (line of ["5", "9", "13", "17", "1"]) {
            let found = false
            let tabLine = ChatLib.removeFormatting(tabList[line]).trim()
            let dead = tabLine.includes("(DEAD)")
            let name = tabLine.replace(/\[\w+\] /, "").trim().split(" ")[0]
            if (name == "" || !name || name == "undefined") { continue }
            // tempIcons[`icon-${num}`] = name
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].player == name) {
                    if (!this.players[i].player) {
                        delete this.players[i]
                    }
                    // this.players[i].print()
                    found = true
                    this.players[i].icon = dead ? null : `icon-${num}`
                    this.players[i].isDead = dead ? true : false
                    this.players[i].currentRoom = this.players[i].getCurrentRoom(this)
                    if (this.players[i].currentRoom && !this.players[i].visitedRooms.includes(this.players[i].currentRoom.name)) {
                        this.players[i].visitedRooms.push(this.players[i].currentRoom.name)
                    }
                }
            }
            if (!found) {
                let player = new DungeonPlayer(name)
                player.icon = dead ? null : `icon-${num}`
                player.isDead = dead ? true : false
                this.players.push(player)
            }
            // Don't increment icon number if the player is dead
            if (!dead) { num++ }
        }
        if (decor) {
            decor.forEach((icon, vec4b) => {
                for (let i = 0; i < this.players.length; i++) {
                    // Don't update if the player is in render distance since just getting their coords is way more accurate
                    if (this.players[i].inRender) { continue }
                    if (this.players[i].icon == icon) {
                        this.players[i].iconX = (vec4b.func_176112_b() + 128 - Map.startCorner[0]*2.5)/10 * Config.mapScale
                        this.players[i].iconY = (vec4b.func_176113_c() + 128 - Map.startCorner[1]*2.5)/10 * Config.mapScale
                        this.players[i].yaw = (vec4b.func_176111_d() * 360) / 16 + 180

                        this.players[i].realX = this.players[i].iconX * 1.64
                        this.players[i].realZ = this.players[i].iconY * 1.64
                    }
                }
            })
        }
    }
    getRoomAt(coords) {
        coords = Lookup.getRoomCenterCoords(coords, this)
        if (!coords) { return null }
        for (let room of this.rooms) {
            if (room.x == coords[0] && room.z == coords[1]) {
                return room
            }
        }
        return null
    }
    updateRooms() {
        let colors = Map.getMapColors()
        if (!colors) { return }
        let unexploredColors = [0, 85, 119]

        let width = 0
        let height = 0

        // Go through and set every room with the same name at the same time
        const checkroom = (roomname, checkmark) => {
            for (let i = 0; i < this.rooms.length; i++) {
                if (this.rooms[i].name == roomname) {
                    this.rooms[i].checkmark = checkmark
                }
            }
        }
        const setExplored = (roomname, explored) => {
            for (let i = 0; i < this.rooms.length; i++) {
                if (this.rooms[i].name == roomname) {
                    this.rooms[i].explored = explored
                }
            }
        }
        const setVisible = (roomname, visibility) => {
            for (let i = 0; i < this.rooms.length; i++) {
                if (this.rooms[i].name == roomname) {
                    this.rooms[i].normallyVisible = visibility
                }
            }
        }

        for (let i = Map.startCorner[0] + (Map.roomSize / 2); i < 128; i+= Map.roomSize/2 + 2) {
            for (let j = Map.startCorner[1] + (Map.roomSize / 2); j < 128; j+= Map.roomSize/2 + 2) {

                let coords = Lookup.getRoomCenterCoords([Math.floor((i - Map.startCorner[0]) * (190/128)), Math.floor((j - Map.startCorner[1]) * (190/128))], this)
                if (!coords) { continue }
                let color = colors[i + j*128]
                let secondColor = colors[(i-3) + j*128]
                let room = this.getRoomAt(coords)
                
                if (!room) { continue }

                // Middle of rooms
                if (width % 2 == 0 && height % 2 == 0) {
                    if (color == 30 && secondColor !== 30) { checkroom(room.name, "green") }
                    if (color == 34) { checkroom(room.name, "white") }
                    if (color == 18 && secondColor !== 18) { checkroom(room.name, "failed") }

                    // Check if trap, blood and yellow are done
                    if (color == 30 || color == 34) {
                        if (secondColor == 62) { this.trapDone = true }
                        if (secondColor == 18) { this.bloodDone = true }
                        if (secondColor == 74) { this.yellowDone = true }
                    }

                    // Set room to explored = true so it isn't darkened on the map
                    if (unexploredColors.includes(color)) {
                        setExplored(room.name, false)
                    }
                    // Set room to explored = false so it gets darkened
                    else {
                        setExplored(room.name, true)
                        setVisible(room.name, true)
                    }

                    // For legit mode
                    if (color == 0) { room.normallyVisible = false }
                    else { room.normallyVisible = true }
                }
                // Middle of 2x2's
                // else if (width % 2 == 1 && height % 2 == 1) { }
                // Doors
                // else { }
                
                height++
            }
            width++
        }
    }
    updateDoors() {
        let toDelete = []
        for (let i = 0; i < this.doors.length; i++) {
            let door = this.doors[i]
            if (!door) { continue }
            let id = World.getBlockAt(door.x, 70, door.z).getID()
            if (id == 0 || id == 166) { door.type = "normal" }
            let room1 = this.getRoomAt(Lookup.getRoomCenterCoords([door.x+4, door.z+16], this))
            let room2 = this.getRoomAt(Lookup.getRoomCenterCoords([door.x-4, door.z-16], this))
            let room3 = this.getRoomAt(Lookup.getRoomCenterCoords([door.x+16, door.z+4], this))
            let room4 = this.getRoomAt(Lookup.getRoomCenterCoords([door.x-16, door.z-4], this))
            if (room1 && room2 && room1.x == room2.x) {
                if (!room1.explored || !room2.explored) {
                    door.explored = false
                    door.normallyVisible = room1.explored !== room2.explored
                    continue
                }
            }
            else if (room3 && room4 && room3.z == room4.z) {
                if (!room3.explored || !room4.explored) {
                    door.explored = false
                    door.normallyVisible = room3.explored !== room4.explored
                    continue
                }
            }
            // Room has one or no connected sides, not actually a door or in wrong place
            else if (door.type == "entrance") {
                // This is usally the extended part of the entrance room, so delete it.
                this.doors.splice(i, 1)
            }
            door.explored = true
            door.normallyVisible = true
        }
    }
    findMimic() {
        let chests = {}
        getTrappedChests().forEach(chest => {
            let room = this.getRoomAt([chest[0], chest[2]])
            if (!room) { return }
            if (!Object.keys(chests).includes(room.name)) {
                chests[room.name] = 1
            }
            else {
                chests[room.name]++
            }
        })
        let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
        for (let loc of Object.keys(chests)) {
            for (let room of rooms) {
                if (loc == room.name) {
                    if (!Object.keys(room).includes("trappedChests") || chests[loc] > room.trappedChests) {
                        this.mimicLocation = room.name
                        // ChatLib.chat(`${prefix} &aMimic found in &b${loc}&a!`)
                    }
                }
            }
        }
        if (this.mimicLocation) {
            this.rooms.forEach(room => {
                if (room.name == this.mimicLocation) {
                    room.hasMimic = true
                }
            })
        }
        // ChatLib.chat(`${prefix} &cMimic found in &b${this.mimicLocation}&a!`)
    }
    checkMimicFound() {
        let chests = {}
        for (let chest of getTrappedChests()) {
            if (!chunkLoaded([chest[0], chest[1], chest[2]])) { return } 
            let room = this.getRoomAt([chest[0], chest[2]])
            if (!room) { return }
            if (!Object.keys(chests).includes(room.name)) {
                chests[room.name] = 1
            }
            else {
                chests[room.name]++
            }
        }

        const killedMimic = (roomName) => {
            if (Config.announceMimic) { ChatLib.command(`pc ${Config.announceMimicMessage.replace("{room}", this.mimicLocation)}`) }
            this.mimicLocation = null
            this.mimicDead = true
            ChatLib.chat(`${prefix} &aMimic Killed!`)
            this.rooms.forEach(room => {
                if (room.name == roomName) {
                    room.hasMimic = false
                }
            })
        }

        if (!Object.keys(chests).includes(this.mimicLocation)) {
            killedMimic(this.mimicLocation)
        }
        let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
        for (let loc of Object.keys(chests)) {
            if (loc !== this.mimicLocation) { continue }
            for (let room of rooms) {
                if (loc == room.name) {
                    if (Object.keys(room).includes("trappedChests") && chests[loc] == room.trappedChests) {
                        killedMimic(this.mimicLocation)
                    }
                }
            }
        }
    }
}
export default new Dungeon()

//  ☠ Noob was killed by Frozen Adventurer and became a ghost.