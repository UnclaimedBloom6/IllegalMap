import { Door } from "./Door"
import Config from "../data/Config"
import { DungeonPlayer } from "../extra/DungeonPlayer"
import Lookup from "../utils/Lookup"
import HotbarMap from "../utils/HotbarMap"
import { prefix, isColumnAir, isDoor, chunkLoaded, dataObject, getEntranceVariants } from "../utils/Utils"
import { Room } from "./Room"
import { BufferedImage, Color, getDungeonMap, getMapColors, getMapDecorators, isBetween } from "../../BloomCore/Utils/Utils"
import Dungeon from "../../BloomCore/Dungeons/Dungeon"

export default new class IMDungeon {
    constructor() {
        this.reset()

        this.peekBind = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "Map")

        // -----------------------------------

        register("command", () => this.scan()).setName("/s")

        register("command", () => {
            let lines = TabList.getNames()
            lines.map((v, i) => ChatLib.chat(`"${i}": ${v}`))
        }).setName("/tablist")

        register("command", () => {
            let lines = Scoreboard.getLines()
            lines.map(a => ChatLib.chat(a))
        }).setName("/scoreboard")

        // Auto Scan
        getEntranceVariants()
        this.lastAutoScan = null
        register("tick", () => {
            if (Dungeon.inDungeon && !this.scanning && Config.autoScan && !this.fullyScanned && new Date().getTime() - this.lastAutoScan >= 500) {
                if (!Config.mapEnabled && Config.dungeonInfo == 2) return
                this.lastAutoScan = new Date().getTime()
                new Thread(() => {
                    this.scan()
                }).start()
            }
        })

        register("step", () => {
            if (!Dungeon.inDungeon || !this.fullyScanned || (!Config.mapEnabled && Config.dungeonInfo == 2)) return
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

        // Update the player's icon 60 times per second and any other player in render distance
        register("step", () => {
            if (!Config.mapEnabled || !Dungeon.inDungeon) return
            for (let i = 0; i < this.players.length; i++) {
                let p = this.players[i]
                let player = World.getPlayerByName(p.player)
                if (!player) {
                    p.inRender = false
                    continue
                }
                if (player.getPing() == -1 && !Dungeon.runEnded) {
                    this.players.splice(i, 1)
                    continue
                }
                if (!isBetween(player.getX(), -200, -10) || !isBetween(player.getZ(), -200, -10)) continue
                p.inRender = true
                p.iconX = MathLib.map(player.getX(), -200, 0, 0, 24.5*Config.mapScale)
                p.iconY = MathLib.map(player.getZ(), -200, 0, 0, 24.5*Config.mapScale)
                p.yaw = player.getYaw() + 180

                p.realX = player.getX()
                p.realZ = player.getZ()
            }
        }).setFps(60)

        register("worldLoad", () => this.reset())
        register("worldUnload", () => this.reset())
    }
    reset() {
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

        this.puzzlesDone = []
        this.totalSecrets = 0
        this.overflowSecrets = 0

        this.mimicDead = null
        this.mimicLocation = null
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

        if (this.fullyScanned) {
            HotbarMap.calibrate(this)
            if (Config.chatInfo) {
                ChatLib.chat(`${prefix} &aDone! Took &b${new Date().getTime() - start}ms\n` +
                    `${prefix} &aCurrent Dungeon:\n` +
                    `&aPuzzles: &c${puzzles.length}&a:\n &b- &d${puzzles.join("\n &b- &d")}\n` +
                    `&6Trap: &a${this.trapType}\n` +
                    `&8Wither Doors: &7${this.witherDoors-1}\n` +
                    `&7Total Secrets: &b${this.totalSecrets}`)
            }
        }

    }
    getPlayer(player) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].player == player) return this.players[i]
        }
    }
    updatePlayers() {
        if (!Dungeon.inDungeon) return
        // Add players to the players array if they aren't already there
        for (let p of Dungeon.party) {
            if (this.players.some(a => a.player == p)) continue
            this.players.push(new DungeonPlayer(p))
        }
        // Update existing players
        for (let p of this.players) {
            p.isDead = Dungeon.deadPlayers.includes(p.player)
            p.icon = Object.keys(Dungeon.playerIcons).includes(p.player) ? Dungeon.playerIcons[p.player] : null
            if (!Dungeon.time || Dungeon.bossEntry || Dungeon.runEnded) continue
            let currentRoom = this.getRoomAt([p.realX, p.realZ])
            if (!currentRoom) continue
            if (!p.lastRoomCheck || !Object.keys(p.visitedRooms).includes(currentRoom.name)) {
                p.visitedRooms[currentRoom.name] = 0
                p.lastRoomCheck = new Date().getTime()
                continue
            }
            p.visitedRooms[currentRoom.name] += new Date().getTime() - p.lastRoomCheck
            p.lastRoomCheck = new Date().getTime()
        }

        let decor = getMapDecorators(getDungeonMap())
        if (!decor) return
        decor.forEach((icon, vec4b) => {
            for (let p of this.players) {
                // Don't update if the player is in render distance since just getting their coords is way more accurate
                if (p.inRender) continue
                if (p.icon == icon) {
                    let x = vec4b.func_176112_b() + 128 - HotbarMap.startCorner[0] * (HotbarMap.roomSize == 16 ? 2 : 2.25)
                    let y = vec4b.func_176113_c() + 128 - HotbarMap.startCorner[1] * (HotbarMap.roomSize == 16 ? 1 : 2.5)
                    p.iconX = MathLib.map(x, 0, 256, 0, 24.5*Config.mapScale)
                    p.iconY = MathLib.map(y, 0, 256, 0, 24.5*Config.mapScale)
                    p.yaw = (vec4b.func_176111_d() * 360) / 16 + 180

                    p.realX = MathLib.map(p.iconX, 0, 24.5*Config.mapScale, -200, 0)
                    p.realZ = MathLib.map(p.iconY, 0, 24.5*Config.mapScale, -200, 0)
                }
            }
        })
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
        let colors = getMapColors(getDungeonMap())
        if (!colors) return
        let unexploredColors = [0, 85, 119]

        // Go through and set every room with the same name at the same time
        const checkroom = (roomname, checkmark) => this.rooms.filter(a => a.name == roomname).map(a => a.checkmark = checkmark)
        const setExplored = (roomname, explored) => this.rooms.filter(a => a.name == roomname).map(a => a.explored = explored)
        const setVisible = (roomname, visibility) => this.rooms.filter(a => a.name == roomname).map(a => a.normallyVisible = visibility)
        // this.rooms.filter(a => a.name == "Lava Ravine").map(a => a.normallyVisible = false)

        for (let x = 0; x <= 5; x++) {
            for (let z = 0; z <= 5; z++) {
                let mx = x*HotbarMap.roomSize+HotbarMap.startCorner[0]+HotbarMap.roomSize/2+x*4
                let my = z*HotbarMap.roomSize+HotbarMap.startCorner[1]+HotbarMap.roomSize/2+z*4

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
            let id = World.getBlockAt(door.x, 69, door.z)?.type?.getID()
            if ((id == 0 || id == 166) && Dungeon.time && door.explored && chunkLoaded([door.x, 69, door.z])) door.type = "normal"
            const gr = (xoff, zoff) => this.getRoomAt(Lookup.getRoomCenterCoords([door.x+xoff, door.z+zoff], this)) // getroom
            let rooms = [gr(4, 16), gr(-4, -16), gr(16, 4), gr(-16, -4)]
            let [room1, room2, room3, room4] = rooms
            // Stop the wither door before fairy from being turned into a normal door before it's opened
            if (rooms.some(a => !!a && a.type == "fairy") && door.type == "wither" && Config.legitMode) door.explored = false
            
            if (room1 && room2 && room1?.x == room2?.x && (!room1.explored || !room2.explored)) {
                door.explored = false
                door.normallyVisible = room1.explored !== room2.explored
                continue
            }
            else if (room3 && room4 && room3?.z == room4?.z && (!room3.explored || !room4.explored)) {
                door.explored = false
                door.normallyVisible = room3.explored !== room4.explored
                continue
            }
            door.explored = true
            door.normallyVisible = true
        }
    }
}