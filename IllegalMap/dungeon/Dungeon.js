import { Door } from "./Door"
import Config from "../data/Config"
import { DungeonPlayer } from "../extra/DungeonPlayer"
import Lookup from "../utils/Lookup"
import Map from "../utils/Map"
import {
    prefix,
    isColumnAir,
    isDoor,
    blankRoom,
    chunkLoaded,
    BufferedImage,
    isBetween,
    dataObject
} from "../utils/Utils"
import { Room } from "./Room"

class Dungeon {
    constructor() {
        this.reset()

        this.peekBind = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "Map")

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
            if (unformatted.match(/\[NPC\] Mort: Here, I found this map when I first entered the dungeon\./)) this.runStarted = new Date().getTime()
            if (unformatted.match(/\[BOSS\] The Watcher/) && !this.bloodOpen) this.bloodOpen = new Date().getTime()
            if (unformatted == "[BOSS] The Watcher: You have proven yourself. You may pass.") this.watcherDone = new Date().getTime()
            if (unformatted.match(/.+ opened a WITHER door\!/)) this.openedWitherDoors++
            if (this.entryMessages.includes(unformatted)) this.bossEntry = new Date().getTime()
            if (unformatted == "                             > EXTRA STATS <") this.runEnded = new Date().getTime()
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
            if (this.inDungeon && !this.scanning && Config.autoScan && !this.fullyScanned && new Date().getTime() - this.lastAutoScan >= 500) {
                if (!Config.mapEnabled && Config.scoreCalc == 2) return
                this.lastAutoScan = new Date().getTime()
                new Thread(() => {
                    this.scan()
                }).start()
            }
        })

        register("step", () => {
            if (!Config.mapEnabled || !this.inDungeon || !this.fullyScanned) return
            this.makeMap()
        }).setFps(2)
        
        register("step", () => {
            if (!this.inDungeon || !this.fullyScanned || (!Config.mapEnabled && Config.scoreCalc == 2)) return
            // Thread because this usually takes between 10-30ms to complete, which lowers overall fps
            new Thread(() => {
                this.updatePlayers()
                this.updateRooms()
                this.updateDoors()
            }).start()
        }).setFps(5)

        // Makes toggling between legit mode work as intended
        let lastLegitMode = Config.legitMode
        register("tick", () => {
            if (lastLegitMode !== Config.legitMode) {
                lastLegitMode = Config.legitMode
                for (let i = 0; i < this.rooms.length; i++) {
                    this.rooms[i].normallyVisible = !Config.legitMode
                    this.rooms[i].explored = !Config.legitMode
                }
                for (let i = 0; i < this.doors.length; i++) {
                    this.doors[i].normallyVisible = !Config.legitMode
                    this.doors[i].explored = !Config.legitMode
                }
            }
        })

        register("command", () => {
            for (let i = 0; i < this.players.length; i++) {
                this.players[i].print()
            }
        }).setName("icons")

        register("tick", () => {
            if (!Config.mapEnabled && Config.scoreCalc == 2) return
            let scoreboard = Scoreboard.getLines().map(a => ChatLib.removeFormatting(a))
            let lines = TabList.getNames().map(a => ChatLib.removeFormatting(a))

            // Check the scoreboard to see if the player is in a dungeon, get the floor as well.
            for (let line of scoreboard) {
                let match = line.match(/ ⏣ The Catac.+ombs \((.+)\)/)
                if (match) {
                    this.inDungeon = true
                    this.floor = match[1]
                    this.floorInt = parseInt(this.floor.replace(/[^\d]/g, ""))
                }
                match = line.match(/Dungeon Cleared:.+ (\d+)%/)
                if (match) {
                    this.percentCleared = parseFloat(match[1])
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

            if (!this.inDungeon || !lines[0] || !lines[0].includes("Party (")) return
            // Get all of the info from the tablist, mostly useless but still good to have.
            try {
                this.party = [5, 9, 13, 17, 1].map(line => lines[line].split(" ")[0]).filter(player => player !== "")
                this.puzzles = [48, 49, 50, 51, 52].map(line => lines[line]).filter(line => line !== "")
                // [TotalPuzzles, CompletedPuzzles] eg [5, 2] for 5 total, 2 complete.
                this.puzzlesDone = [parseInt(ChatLib.removeFormatting(lines[47]).match(/Puzzles: \((\d+)\)/)[1]), [48, 49, 50, 51, 52].map(a => lines[a]).filter(b => b.includes("✔")).length]
                this.time = lines[45].match(/Time: (.+)/)[1]
                this.time = this.time == "Soon!" ? null : this.time
                this.seconds = this.time ? parseInt(this.time.match(/(\d+)m (\d+)s/)[1]) * 60 + parseInt(this.time.match(/(\d+)m (\d+)s/)[2]) : 0
                this.secretsFound = parseInt(lines[31].match(/ Secrets Found: (\d+)/)[1])
                let m = lines[44].match(/ Secrets Found: (.+)%/)
                this.secretsPercent = parseFloat(m[1])
                this.secretsNeeded = Object.keys(this.floorSecrets).includes(this.floor) ? this.floorSecrets[this.floor] : 1
                this.overflowSecrets = this.secretsFound > this.secretsForMax ? this.secretsFound - this.secretsForMax : 0
                // Total secrets in the dungeon based off of the percentage found
                if (this.secretsFound > 0) this.calculatedTotalSecrets = Math.floor(100/this.secretsPercent * this.secretsFound + 0.5)
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
            if (Config.paul == 0) this.isPaul = true
            if (Config.paul == 1) this.isPaul = false
            if (Config.paul == 2 && dataObject.isPaul) this.isPaul = true

        })

        // Update the player's icon 60 times per second
        register("step", () => {
            if (!Config.mapEnabled || !this.inDungeon) return
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

        register("worldLoad", () => this.reset())
        register("worldUnload", () => this.reset())
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
        this.percentCleared = 0
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
        this.yellowVariant = "Unknown"

        this.map = new BufferedImage(25, 25, BufferedImage.TYPE_4BYTE_ABGR)
        this.mapSize = []

        this.bloodDone = false
        this.trapDone = false
        this.yellowDone = false

        // Score Calc Stuff
        this.scStr1 = ""
        this.scStr2 = ""

        this.said300 = false
        this.said270 = false

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

        this.checkedForPaul = false
        this.isPaul = false


    }
    scan() {
        if (this.scanning) return

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
                    if (isColumnAir(x, z)) continue
                    let room = Lookup.getRoomFromCoords([x, z], this)
                    if (!room) continue
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
                    if (room.type == "yellow") {
                        this.yellowVariant = room.name
                    }

                    // setEmerald(x, 101, z)
                }

                // Door or part of a larger room
                else if (((x%(this.roomSize+1)==this.roomSize && z%(this.roomSize+1)==Math.floor(this.roomSize/2)) || (x%(this.roomSize+1)==Math.floor(this.roomSize/2) && z%(this.roomSize+1)==this.roomSize)) && !isColumnAir(x, z)) {
                    // Door
                    if (isDoor(x, z)) {
                        let door = new Door(x, z)
                        let doorBlock = World.getBlockAt(x, 69, z)
                        if (doorBlock.type.getID() == 173) {
                            door.type = "wither"
                            this.witherDoors++
                        }
                        else if (doorBlock.type.getID() == 159 && doorBlock.getMetadata() == 14) door.type = "blood"
                        else if (doorBlock.type.getRegistryName() == "minecraft:monster_egg") door.type = "entrance"
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
                            room.isSeparator = true
                        })
                        if (room.type == "entrance") {
                            let door = new Door(room.x, room.z)
                            door.type = "entrance"
                            this.doors.push(door)
                        }
                        else this.rooms.push(room)
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
                    room.isSeparator = true
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
        const setPixels = (x1, y1, width, height, color) => {
            for (let x = x1; x < x1 + width; x++) {
                for (let y = y1; y < y1 + height; y++) {
                    this.map.setRGB(x, y, color.getRGB())
                }
            }
        }
        setPixels(0, 0, this.map.getWidth(), this.map.getHeight(), new java.awt.Color(1, 1, 1, 0))
        this.rooms.forEach(room => {
            if (!room.normallyVisible && Config.legitMode) return
            let color = room.getColor()
            if (room.name == "Unknown") color = new java.awt.Color(255/255, 176/255, 31/255)
            else if (!Config.legitMode && !room.explored && Config.darkenUnexplored) color = color.darker().darker()

            setPixels(Math.floor(room.x/16)*2+1, Math.floor(room.z/16)*2+1, 3, 3, color)
        })
        this.doors.forEach(door => {
            if (!door.normallyVisible && Config.legitMode) return
            let color = !Config.legitMode && !door.explored && Config.darkenUnexplored ? door.getColor().darker().darker() : door.getColor()
            setPixels(Math.floor(door.x/16)*2+2, Math.floor(door.z/16)*2+2, 1, 1, color)
        })
    }
    getPlayer(player) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].player == player) return this.players[i]
        }
    }
    drawBackground() {
        this.mapSize = Config.scoreCalc == 0 || (Config.scoreCalc == 3 && !this.bossEntry) ? [25, 27] : [25, 25]
        Renderer.drawRect(Config.backgroundColor.hashCode(), dataObject.map.x, dataObject.map.y, this.mapSize[0] * Config.mapScale, this.mapSize[1] * Config.mapScale)
    }
    renderMap() {
        Renderer.drawImage(new Image(this.map), dataObject.map.x, dataObject.map.y, 25*Config.mapScale, 25*Config.mapScale)
    }
    renderCheckmarks() {
        let names = []
        for (let i = 0; i < this.rooms.length; i++) {
            let room = this.rooms[i]
            if ((Config.legitMode && !room.normallyVisible) || names.includes(room.name)) continue
            if (Config.legitMode && !room.explored && room.normallyVisible) room.renderCheckmark()
            if (Config.showSecrets == 3) {
                if (!["normal", "rare"].includes(room.type)) continue
                else room.renderSecrets()
            }
            else if (room.checkmark) room.renderCheckmark()
            names.push(room.name)
        }
    }

    updatePlayers() {
        if (!this.inDungeon) return
        let tabList
        try {
            tabList = TabList.getNames()
        }
        catch(e) {}
        if (!tabList) return
        if (tabList.length < 10) return
        let num = 0
        let decor = Map.getMapDecorators()
        for (line of ["5", "9", "13", "17", "1"]) {
            let found = false
            let tabLine = ChatLib.removeFormatting(tabList[line]).trim()
            let dead = tabLine.includes("(DEAD)")
            let name = tabLine.replace(/\[\w+\] /, "").trim().split(" ")[0]
            if (name == "" || !name || name == "undefined") continue
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].player == name) {
                    if (!this.players[i].player) {
                        delete this.players[i]
                    }
                    // this.players[i].print()
                    found = true
                    this.players[i].icon = dead ? null : `icon-${num}`
                    this.players[i].isDead = dead ? true : false
                    this.players[i].currentRoom = this.getRoomAt([this.players[i].realX, this.players[i].realZ])
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
            if (!dead) num++
        }
        if (decor) {
            try {
                decor.forEach((icon, vec4b) => {
                    for (let i = 0; i < this.players.length; i++) {
                        // Don't update if the player is in render distance since just getting their coords is way more accurate
                        if (this.players[i].inRender) continue
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
            catch(e) { }
        }
    }
    getRoomAt([x, z]) {
        let coords = Lookup.getRoomCenterCoords([x, z], this)
        if (!coords) return null
        for (let room of this.rooms) {
            if (room.x == coords[0] && room.z == coords[1]) {
                return room
            }
        }
        return null
    }
    getPlayerRoom() {
        return this.getRoomAt([Player.getX(), Player.getZ()])
    }
    updateRooms() {
        let colors = Map.getMapColors()
        if (!colors) return
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
                if (!coords) continue
                let color = colors[i + j*128]
                let secondColor = colors[(i-3) + j*128]
                let room = this.getRoomAt(coords)
                
                if (!room) continue

                // Middle of rooms
                if (width % 2 == 0 && height % 2 == 0) {
                    if (color == 30 && secondColor !== 30) checkroom(room.name, "green")
                    if (color == 34) checkroom(room.name, "white")
                    if (color == 18 && secondColor !== 18) checkroom(room.name, "failed")

                    // Check if trap, blood and yellow are done
                    if (color == 30 || color == 34) {
                        if (secondColor == 62) this.trapDone = true
                        if (secondColor == 18) this.bloodDone = true
                        if (secondColor == 74) this.yellowDone = true
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
                    if (color == 0) room.normallyVisible = false
                    else room.normallyVisible = true
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
        for (let i = 0; i < this.doors.length; i++) {
            let door = this.doors[i]
            if (!door) continue
            let id = World.getBlockAt(door.x, 69, door.z)?.type.getID()
            if ((id == 0 || id == 166) && this.time && door.explored && chunkLoaded([door.x, 69, door.z])) door.type = "normal"
            const gr = (xoff, zoff) => this.getRoomAt(Lookup.getRoomCenterCoords([door.x+xoff, door.z+zoff], this)) // getroom
            let room1 = gr(4, 16)
            let room2 = gr(-4, -16)
            let room3 = gr(16, 4)
            let room4 = gr(-16, -4)
            let rooms = [room1, room2, room3, room4]
            // Stop the wither door before fairy from being turned into a normal door before it's opened
            if (rooms.some(a => !!a && a.type == "fairy") && door.type == "wither" && Config.legitMode) door.explored = false
            
            if (room1?.x == room2?.x && (!room1.explored || !room2.explored)) {
                door.explored = false
                door.normallyVisible = room1.explored !== room2.explored
                continue
            }
            else if (room3?.z == room4?.z && (!room3.explored || !room4.explored)) {
                door.explored = false
                door.normallyVisible = room3.explored !== room4.explored
                continue
            }
            // Remove the sticky outy part of entrance that happens on some maps
            if (door.type == "entrance" && !rooms.some(a => !!a) && [[room1, room2], [room3, room4]].map(a => a.filter(b => !!b).length == 1)) this.doors.splice(i, 1)

            door.explored = true
            door.normallyVisible = true
        }
    }
}
export default new Dungeon()