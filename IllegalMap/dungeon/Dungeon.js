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
    dataObject,
    setEmerald,
    setCoal,
    setGold,
    Color,
    getEntranceVariants,
    setDiamond
} from "../utils/Utils"
import { Room } from "./Room"
import { getPaul } from "../extra/PaulChecker"

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
            "[BOSS] Maxor: WELL WELL WELL LOOK WHO’S HERE!"
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

        register("command", () => this.scan()).setName("/s")

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
        getEntranceVariants()
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
                this.updateRooms()
                this.updateDoors()
            }).start()
        }).setFps(2)

        register("tick", () => this.updatePlayers())

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
                match = line.match(/Cleared: (\d+)%.+/)
                if (match) {
                    this.percentCleared = parseFloat(match[1])
                }
                match = line.match(/Time Elapsed: (.+)/)
                this.time = match ? match[1] : this.time
            }

            if (!this.inDungeon || !lines[0] || !lines[0].includes("Party (")) return
            // Get all of the info from the tablist, mostly useless but still good to have.
            try {
                this.party = [5, 9, 13, 17, 1].map(line => lines[line].split(" ")[0]).filter(player => player !== "")
                this.puzzles = [48, 49, 50, 51, 52].map(line => lines[line]).filter(line => line !== "")
                // [TotalPuzzles, CompletedPuzzles] eg [5, 2] for 5 total, 2 complete.
                this.puzzlesDone = [parseInt(ChatLib.removeFormatting(lines[47]).match(/Puzzles: \((\d+)\)/)[1]), [48, 49, 50, 51, 52].map(a => lines[a]).filter(b => b.includes("✔")).length]
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

        // Update the player's icon 60 times per second and any other player in render distance
        register("step", () => {
            if (!Config.mapEnabled || !this.inDungeon) return
            for (let i = 0; i < this.players.length; i++) {
                let player = World.getPlayerByName(this.players[i].player)
                if (!player) {
                    this.players[i].inRender = false
                    continue
                }
                if (isBetween(player.getX(), -200, -10) && isBetween(player.getZ(), -200, -10)) {
                    this.players[i].inRender = true
                    this.players[i].iconX = MathLib.map(player.getX(), -200, 0, 0, 24.5*Config.mapScale)
                    this.players[i].iconY = MathLib.map(player.getZ(), -200, 0, 0, 24.5*Config.mapScale)
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
        this.startX = -185
        this.startZ = -185

        this.endX = -25
        this.endZ = -25
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

        this.secretsNeeded = 0
        this.secretsForMax = 0
        this.calculatedTotalSecrets = 0
        
        this.puzzlesDone = []
        this.totalSecrets = 0
        this.overflowSecrets = 0

        this.mimicDead = null
        this.mimicLocation = null

        this.checkedForPaul = false
        this.isPaul = false

    }
    scan() {
        this.scanning = true
        let rooms = []
        let doors = []
        let puzzles = []

        let players = this.players
        this.reset()
        this.players = players

        const start = new Date().getTime()
        let allLoaded = true

        for (let rz = 0; rz <= 10; rz++) {
            for (let rx = 0; rx <= 10; rx++) {
                let x = rx*(this.roomSize+1)/2-185
                let z = rz*(this.roomSize+1)/2-185
                if (!chunkLoaded([x, 100, z])) allLoaded = false
                if (isColumnAir(x, z)) continue
                // Center of room
                if (!(rx%2) && !(rz%2)) {
                    let room = Lookup.getRoomFromCoords([x, z], this)
                    if (!room) continue
                    if (room.name == "Unknown" && !rooms.some(a => a.x == room.x-32 && a.z == room.z)) continue
                    this.trapType = room.type == "trap" ? room.name.split(" ")[0] : this.trapType
                    if (room.type == "puzzle") puzzles.push(room.name)
                    this.totalSecrets += rooms.map(a => a.name).includes(room.name) ? 0 : room.secrets
                    this.totalRooms++
                    rooms.push(room)
                    // setEmerald(x, 100, z)
                }
                // Door or part of larger room
                else if (((rx%2) && !(rz%2)) || (!(rx%2) && (rz%2))) {
                    // setCoal(x, 100, z)
                    if (isDoor(x, z)) {
                        let door = new Door(x, z)
                        // setCoal(x, 100, z)

                        let id = World.getBlockAt(x, 69, z)?.type?.getID()
                        if (id == 159) door.type = "blood"
                        if (id == 97) door.type = "entrance"
                        if (id == 173) door.type = "wither"
                        doors.push(door)
                    }
                    else {
                        let thing = rooms.filter(a => (a.x+16 == x && a.z == z) || (a.x == x && a.z+16 == z))
                        if (thing.length) {
                            // Entrance door with no gap
                            if (thing[0].type == "entrance") doors.push(new Door(x, z, "entrance"))
                            // Middle of room eg small part in between a 1x2
                            else rooms.push(new Room(x, z, thing[0].getJson(), true))
                        }
                    }
                }
                // Center of 2x2
                else {
                    let thing = rooms.filter(a => a.x+16 == x && a.z+16 == z)
                    if (thing.length) rooms.push(new Room(x, z, thing[0].getJson(), true))
                    // setGold(x, 100, z)
                }
            }
        }
        this.witherDoors = doors.filter(a => a.type == "wither").length
        this.fullyScanned = allLoaded
        this.rooms = rooms
        this.doors = doors

        // Delete extended entrance
        for (let i = 0; i < this.doors.length; i++) {
            if (this.doors[i].type !== "entrance") continue
            // If there are three columns of air around the door then it is not an actual door and should be deleted
            if ([[[16,0],[-16,0]],[[0,16],[0,-16]]].map(a => a.map(b => this.rooms.filter(c => c.x == this.doors[i].x + b[0] && c.z == this.doors[i].z + b[1]).some(d => !!d))).reduce((a, b) => a.concat(b), []).filter(a => !a).length == 3) this.doors.splice(i, 1)
        }
        if (Config.legitMode) {
            this.rooms.map(a => {
                a.explored = false
                a.normallyVisible = false
            })
            this.doors.map(a => {
                a.explored = false
                a.normallyVisible = false
            })
        }
        
        this.scanning = false
        this.makeMap()

        if (this.fullyScanned) {
            Map.calibrate(this)
            if (Config.chatInfo) {
                ChatLib.chat(`${prefix} &aDone! Took &b${new Date().getTime() - start}ms\n` +
                    `${prefix} &aCurrent Dungeon:\n` +
                    `&aPuzzles: &c${puzzles.length}&a:\n &b- &d${puzzles.join("\n &b- &d")}\n` +
                    `&6Trap: &a${this.trapType}\n` +
                    `&8Wither Doors: &7${this.witherDoors-1}\n` +
                    `&7Total Secrets: &b${this.totalSecrets}`)
            }
            if (Config.paul == 2) getPaul()
        }

    }
    makeMap() {
        const setPixels = (x1, y1, width, height, color) => {
            for (let x = x1; x < x1 + width; x++) {
                for (let y = y1; y < y1 + height; y++) {
                    this.map.setRGB(x, y, color.getRGB())
                }
            }
        }
        setPixels(0, 0, this.map.getWidth(), this.map.getHeight(), new Color(1, 1, 1, 0))
        for (let room of this.rooms) {
            if (!room.normallyVisible && Config.legitMode) continue
            let color = !Config.legitMode && !room.explored && Config.darkenUnexplored ? room.getColor().darker().darker() : room.getColor()
            setPixels(Math.floor((200 + room.x)/8), Math.floor((200 + room.z)/8), 3, 3, color)
        }
        for (let door of this.doors) {
            if (!door.normallyVisible && Config.legitMode) continue
            let color = !Config.legitMode && !door.explored && Config.darkenUnexplored ? door.getColor().darker().darker() : door.getColor()
            setPixels(Math.floor((200 + door.x)/8)+1, Math.floor((200 + door.z)/8)+1, 1, 1, color)
        }
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
        if (!tabList || tabList.length < 10) return
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
                    let p = this.players[i]
                    if (!p.player) {
                        delete this.players[i]
                    }
                    found = true
                    p.icon = dead ? null : `icon-${num}`
                    p.isDead = dead ? true : false
                    
                    if (!this.time || this.bossEntry || this.runEnded) continue
                    let currentRoom = this.getRoomAt([this.players[i].realX, this.players[i].realZ])
                    if (!currentRoom) continue
                    if (!p.lastRoomCheck || !Object.keys(p.visitedRooms).includes(currentRoom.name)) {
                        p.visitedRooms[currentRoom.name] = 0
                        p.lastRoomCheck = new Date().getTime()
                        continue
                    }
                    p.visitedRooms[currentRoom.name] += new Date().getTime() - p.lastRoomCheck
                    p.lastRoomCheck = new Date().getTime()
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
                            let x = vec4b.func_176112_b() + 128 - Map.startCorner[0] * (Map.roomSize == 16 ? 2 : 2.25)
                            let y = vec4b.func_176113_c() + 128 - Map.startCorner[1] * (Map.roomSize == 16 ? 1 : 2.5)
                            this.players[i].iconX = MathLib.map(x, 0, 256, 0, 24.5*Config.mapScale)
                            this.players[i].iconY = MathLib.map(y, 0, 256, 0, 24.5*Config.mapScale)
                            this.players[i].yaw = (vec4b.func_176111_d() * 360) / 16 + 180
    
                            this.players[i].realX = MathLib.map(this.players[i].iconX, 0, 24.5*Config.mapScale, -200, 0)
                            this.players[i].realZ = MathLib.map(this.players[i].iconY, 0, 24.5*Config.mapScale, -200, 0)
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
            if (room.x == coords[0] && room.z == coords[1]) return room
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

        // Go through and set every room with the same name at the same time
        const checkroom = (roomname, checkmark) => this.rooms.filter(a => a.name == roomname).map(a => a.checkmark = checkmark)
        const setExplored = (roomname, explored) => this.rooms.filter(a => a.name == roomname).map(a => a.explored = explored)
        const setVisible = (roomname, visibility) => this.rooms.filter(a => a.name == roomname).map(a => a.normallyVisible = visibility)
        // this.rooms.filter(a => a.name == "Lava Ravine").map(a => a.normallyVisible = false)

        for (let x = 0; x <= 5; x++) {
            for (let z = 0; z <= 5; z++) {
                let mx = x*Map.roomSize+Map.startCorner[0]+Map.roomSize/2+x*4
                let my = z*Map.roomSize+Map.startCorner[1]+Map.roomSize/2+z*4

                let color = colors[mx + my*128]
                let color2 = colors[mx-3 + (my-1)*128]

                let room = this.getRoomAt([Math.floor(x*(this.roomSize)/2)*2-185, Math.floor(z*(this.roomSize)/2)*2-185])
                if (!room) continue

                if (color == 30 && color2 !== 30) checkroom(room.name, "green")
                if (color == 34) checkroom(room.name, "white")
                if (color == 18 && color2 !== 18) checkroom(room.name, "failed")

                // Check if blood is done
                if (color == 30 && color2 == 18) this.bloodDone = true

                // Set room to explored = false so it is darkened
                if (unexploredColors.includes(color)) {
                    setExplored(room.name, false)
                }
                // Set room to explored = true
                else {
                    setExplored(room.name, true)
                    setVisible(room.name, true)
                }
                // For legit mode
                if (color == 0) room.normallyVisible = false
                else room.normallyVisible = true
            }
        }
    }
    updateDoors() {
        for (let i = 0; i < this.doors.length; i++) {
            let door = this.doors[i]
            if (!door) continue
            let id = World.getBlockAt(door.x, 69, door.z)?.type.getID()
            if ((id == 0 || id == 166) && this.time && door.explored && chunkLoaded([door.x, 69, door.z])) door.type = "normal"
            const gr = (xoff, zoff) => this.getRoomAt(Lookup.getRoomCenterCoords([door.x+xoff, door.z+zoff], this)) // getroom
            let rooms = [gr(4, 16), gr(-4, -16), gr(16, 4), gr(-16, -4)]
            let [room1, room2, room3, room4] = rooms
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