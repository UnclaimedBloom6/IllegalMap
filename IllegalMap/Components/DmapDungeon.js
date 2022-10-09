import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { BufferedImage, Color, getDungeonMap, getMapColors, isBetween } from "../../BloomCore/utils/Utils"
import { chunkLoaded, defaultMapSize, findConnectedRooms, getGridCoords, getHighestBlock, getRealCoords, getRoomsFile, prefix, setBlock } from "../utils"
import { Room } from "./Room"
import { Door } from "./Door"
import Config from "../data/Config"
import { DungeonPlayer } from "./DungeonPlayer"

export default new class DmapDungeon {
    constructor() {

        this.mapBuffered = new BufferedImage(23, 23, BufferedImage.TYPE_4BYTE_ABGR)
        this.map = new Image(this.mapBuffered)
        this.mapIsEmpty = true
        this.scan_lastChunk = null
        this.scan_scannedFromChunks = []

        this.reset()
        
        register("tick", () => {
            if (!Dungeon.inDungeon || !Config.enabled || this.fullyScanned || this.scanning || new Date().getTime() - this.lastScan < 500) return
            this.scan()
        })

        register("step", () => {
            if (!Dungeon.inDungeon || !Config.enabled || !this.rooms.length) return
            for (let room of this.rooms) {
                if (!room.confirmedRotation) room.findRoomRotation()
            }
        }).setFps(4)

        register("step", () => {
            if (!Config.enabled || !Dungeon.inDungeon || !this.fullyScanned) return
            this.makeMap()
        }).setFps(4)

        register("step", () => {
            if (!Config.enabled || !Dungeon.inDungeon || !Dungeon.mapCorner) return
            this.scanHotbarMap()
            this.updateDoors()
        }).setFps(4)

        // Updating player map icons
        register("step", () => {
            if (!Config.enabled || !Dungeon.inDungeon || !Dungeon.mapCorner || Dungeon.bossEntry) return
            for (let i of Object.keys(Dungeon.icons)) {
                let icon = Dungeon.icons[i]
                let player = this.players.find(a => a.player == icon.player)
                if (!player || player.inRender) continue
                player.iconX = MathLib.map(icon.x-Dungeon.mapCorner[0]*2, 0, 256, 0, defaultMapSize[0])
                player.iconY = MathLib.map(icon.y-Dungeon.mapCorner[1]*2, 0, 256, 0, defaultMapSize[1])
                player.realX = MathLib.map(player.iconX, 0, 128, -200, -10)
                player.realZ = MathLib.map(player.iconY, 0, 128, -200, -10)
                player.rotation = icon.rotation
            }
        }).setFps(4)

        // Update all players in render distance
        register("step", () => {
            if (!Dungeon.inDungeon || !Config.enabled) return
            for (let p of Dungeon.party) {
                if (this.players.some(a => a.player == p) || World.getPlayerByName(p)?.getPing() == -1) continue
                this.players.push(new DungeonPlayer(p))
            }
            for (let p of this.players) {
                let player = World.getPlayerByName(p.player)
                if (!player) {
                    p.inRender = false
                    continue
                }
                if (player.getPing() == -1 && !Dungeon.runEnded) {
                    continue
                }
                if (!isBetween(player.getX(), -200, -10) || !isBetween(player.getZ(), -200, -10)) continue
                p.inRender = true
                let x = player.getX()
                let z = player.getZ()
                p.iconX = MathLib.map(x, -200, -10, 0, 128)
                p.iconY = MathLib.map(z, -200, -10, 0, 128)
                p.realX = x
                p.realZ = z
                p.rotation = player.getYaw() + 180
            }
        })

        register("step", () => {
            if ((!Dungeon.inDungeon || !Config.enabled) && !Config.mapEditGui.isOpen()) return

            let secretsForMax = Math.ceil(this.secrets * Dungeon.secretsPercentNeeded)
            let ms = Math.ceil(secretsForMax*((40 - (Dungeon.isPaul ? 10 : 0) - (Dungeon.mimicKilled ? 2 : 0) - (Dungeon.crypts > 5 ? 5 : Dungeon.crypts) + (Dungeon.deathPenalty))/40))

            let totalSecrets = Dungeon.totalSecrets || this.secrets
            let dSecrets = `&7Secrets: &b${Dungeon.secretsFound}&8-&e${totalSecrets - Dungeon.secretsFound}&8-&c${totalSecrets}`
            let dCrypts = "&7Crypts: " + (Dungeon.crypts >= 5 ? `&a${Dungeon.crypts}` : Dungeon.crypts > 0 ? `&e${Dungeon.crypts}` : `&c0`) + (Config.showTotalCrypts ? ` &8(${this.crypts})` : "")
            let dMimic = [6, 7].includes(Dungeon.floorNumber) ? ("&7Mimic: " + (Dungeon.mimicKilled ? "&a✔" : "&c✘")) : ""
        
            let minSecrets = "&7Min Secrets: " + (!this.secrets && !Dungeon.minSecrets ? "&b?" : Dungeon.minSecrets ? `&e${Dungeon.minSecrets}` : `&a${ms}`)
            let dDeaths = "&7Deaths: " + (Dungeon.deathPenalty < 0 ? `&c${Dungeon.deathPenalty}` : "&a0")
            let dScore = "&7Score: " + (Dungeon.score >= 300 ? `&a${Dungeon.score}` : Dungeon.score >= 270 ? `&e${Dungeon.score}` : `&c${Dungeon.score}`)
        
            this.mapLine1 = `${dSecrets}    ${dCrypts}    ${dMimic}`.trim()
            this.mapLine2 = `${minSecrets}    ${dDeaths}    ${dScore}`.trim()
        }).setFps(4)

        // Update player visited rooms
        register("tick", () => {
            if (!Dungeon.inDungeon || !Config.enabled || !this.players.length || !Dungeon.time || Dungeon.bossEntry) return
            for (let p of this.players) {
                let currentRoom = this.getPlayerRoom(p.player)
                if (!currentRoom) continue
                if (!Object.keys(p.visitedRooms).includes(currentRoom.name)) p.visitedRooms[currentRoom.name] = 0
                if (p.lastRoomCheck) {
                    p.visitedRooms[currentRoom.name] += new Date().getTime() - p.lastRoomCheck
                }
                
                // let checkSkipped = () => {
                //     if (!Config.notifyOfRoomSkippers || !p.lastRoom || !["puzzle", "trap"].includes(p.lastRoom.type) || p.lastRoom == currentRoom || p.lastRoom.checkmark) return
                //     // let time = p.visitedRooms[p.lastRoom.name]
                //     if (p.lastRoom.name == "Quiz") return
                //     let roomColored = `${p.lastRoom.type == "puzzle" ? "&d" : "&6"}${p.lastRoom.name}`
                //     let msg = `${prefix} ${p.rank} ${p.player} &cskipped ${roomColored}&c.`
                //     new TextComponent(msg).setClick("run_command", `/ct copy ${msg.removeFormatting()}`).setHover("show_text", "&aClick to copy!").chat()
                // }
                // checkSkipped()
                
                p.lastRoomCheck = new Date().getTime()
                p.lastRoom = currentRoom
            }
        })

        register("worldUnload", () => this.reset())

        register("command", () => {
            this.rooms.forEach(a => ChatLib.chat(`${a.name} - ${JSON.stringify(a.components)}`))
        }).setName("/r")
    }
    reset() {
        this.dungeon = Dungeon

        this.rooms = []
        this.doors = []
        this.secrets = 0
        this.crypts = 0
        this.trapType = null

        this.players = []

        this.clearMap()

        this.scanning = false
        this.fullyScanned = false
        this.lastScan = null

        this.possibleMimicCoords = null
        this.witherDoors = 0

        this.mapLine1 = "&cDungeon not fully"
        this.mapLine2 = "&cscanned!"

        this.stringRep = null
    }
    scan() {
        const chunkX = Math.floor(Player.getX() / 16)
        const chunkZ = Math.floor(Player.getZ() / 16)

        if(this.scan_lastChunk && this.scan_lastChunk.x === chunkX && this.scan_lastChunk.z === chunkZ) return
        if(this.scan_scannedFromChunks.includes({
            x: chunkX,
            z: chunkZ
        })) return

        let started = new Date().getTime()
        this.scanning = true
        this.fullyScanned = false
        // ChatLib.chat(`${this.rooms.map(a => a.name).join(", ")}`)
        let tempRooms = this.rooms.filter(a => !!a.isLoaded)
        // ChatLib.chat(`Rooms: ${tempRooms.length}`)
        let scanned = new Set([...tempRooms.reduce((a, b) => b.isLoaded ? a.concat(b.components.reduce((c, d) => c.concat(d.map(a => a*2).join(",")), [])) : a, [])])
        // ChatLib.chat(`&aBEFORE: ${JSON.stringify([...scanned])}`)
        let allLoaded = true
        for (let col = 0; col < 11; col++) {
            for (let row = 0; row < 11; row ++) {
                const [x, z] = getRealCoords([row, col], true)
                if (x > this.dungeon.mapBounds[1][0] || z > this.dungeon.mapBounds[1][1]) continue
                if (scanned.has([row, col].join(","))) continue
                if (!chunkLoaded([x, 69, z])) allLoaded = false
                
                let highest = getHighestBlock(x, z)
                if (!highest) continue
                if (World.getBlockAt(x, highest, z).type.getID() == 41) highest--
                
                // Center of normal room
                if (!(row%2) && !(col%2)) {
                    let connected = findConnectedRooms([x, highest, z])
                    if (connected.some(a => a[0] > 10 || a[0] < 0 || a[1] > 10 || a[1] < 0)) continue
                    // if (connected.some(a => scanned.has(a.join(",")))) continue
                    connected.forEach(a => scanned.add(a.map(b => b*2).join(",")))
                    tempRooms.push(new Room(connected, highest))
                }
                // Door
                if (((!(row%2) && col%2) || (row%2 && !(col%2)))) {
                    if (this.doors.some(a => a.gX == row && a.gZ == col)) continue
                    if (highest >= 90 && World.getBlockAt(x, 69, z)?.type?.getID() !== 97) continue
                    // ChatLib.chat(`Door added to ${row}, ${col}`)
                    let door = new Door(x, z)
                    if (door.type == "wither") this.witherDoors++
                    this.doors.push(door)
                }
            }
        }

        this.scan_lastChunk = {
            x: chunkX,
            z: chunkZ
        }
        this.scan_scannedFromChunks.push(this.scan_lastChunk)

        // ChatLib.chat(`&eAFTER: ${JSON.stringify([...scanned])}`)
        this.rooms = tempRooms
        this.scanning = false
        this.fullyScanned = allLoaded
        this.lastScan = new Date().getTime()
    
        this.makeMap()
        this.secrets = this.rooms.reduce((a, b) => a + b.secrets, 0)
        this.crypts = this.rooms.reduce((a, b) => a + b.crypts, 0)
        let t = this.rooms.find(a => a.type == "trap")
        if (t) this.trapType = t.name.split(" ")[0]
        // ChatLib.chat(`Rooms After: ${this.rooms.length}`)
        if (this.fullyScanned) {
            // this.scanFromEntrance()
            if (Config.chatInfo) {
                let puzzles = this.rooms.filter(a => a.type == "puzzle")
                ChatLib.chat(`${prefix} &aDone! Took &b${new Date().getTime() - started}ms\n` +
                    `${prefix} &aCurrent Dungeon:\n` +
                    `&aPuzzles: &c${puzzles.length}&a:\n &b- &d${puzzles.map(a => a.name).join("\n &b- &d")}\n` +
                    `&6Trap: &a${this.trapType}\n` +
                    `&8Wither Doors: &7${this.doors.filter(a => a.type == "wither").length-1}\n` +
                    `&7Total Secrets: &b${this.secrets}` +
                    `&8Total Crypts: &f${this.crypts}`)
            }
            // if (this.rooms.every(a => a.name)) this.makeString()

            this.scan_lastChunk = null
            this.scan_scannedFromChunks = []
        }
    }

    // makeString() {
    //     let roomStr = ""
    //     let doorStr = ""
    //     for (let y = 0; y < 11; y++) {
    //         for (let x = 0; x < 11; x++) {
    //             if (!(x%2) && !(y%2)) {
    //                 let room = this.rooms.find(a => a.components.some(b => b[0] == x && b[1] == y))
    //                 if (!room) {
    //                     roomStr += "999" // Not a room
    //                     continue
    //                 }
    //                 roomStr += `${"0".repeat(3 - room.roomFileID.toString().length)}${room.roomFileID}`
    //             }
    //             if ((!(x%2) && y%2) || (x%2 && !(y%2))) {
    //                 let door = this.doors.find(a => a.gX == x && a.gZ == y)
    //                 if (!door) {
    //                     doorStr += "0"
    //                     continue
    //                 }
    //                 doorStr += ["normal", "entrance", "wither", "blood"].indexOf(door.type) + 1
    //             }
    //         }
    //     }
    //     let finalStr = `${Dungeon.floor},${roomStr},${doorStr}`
    //     // ChatLib.chat(finalStr)
    //     // ChatLib.command(`ct copy ${finalStr}`, true)
    //     this.stringRep = finalStr
    // }

    setPixels(x1, y1, width, height, color) {
        if (!color) return
        for (let x = x1; x < x1 + width; x++) for (let y = y1; y < y1 + height; y++) {
            if (x < 0 || x > 22 || y < 0 || y > 22) continue
            this.mapBuffered.setRGB(x, y, color.getRGB())
        }
    }

    clearMap() {
        this.setPixels(0, 0, 23, 23, new Color(0, 0, 0, 0))
        mapIsEmpty = true
    }
    
    makeMap() {
        // let start = new Date().getTime()
        this.clearMap()
        for (let room of this.rooms) {
            let components = room.components
            let color = room.getColor()
            // Main room and connectors
            components.forEach(a => {
                let [x, y] = a
                this.setPixels(4*x, 4*y, 3, 3, color)
                if (components.some(b => b[0] == x && b[1] == y+1)) this.setPixels(4*x, 4*y+3, 3, 1, color)
                if (components.some(b => b[0] == x+1 && b[1] == y)) this.setPixels(4*x+3, 4*y, 1, 3, color)
            })
            // Hole in the middle of 2x2's
            if (room.shape == "2x2") {
                let minX = Math.min(...components.map(a => a[0]))*4
                let minY = Math.min(...components.map(a => a[1]))*4
                this.setPixels(minX + 3, minY + 3, 1, 1, color)
            }
        }
        for (let door of this.doors) {
            this.setPixels(door.gX*2+1, door.gZ*2+1, 1, 1, door.getColor())
        }
        this.mapIsEmpty = false
        this.map.getTexture().func_147631_c() // deleteGlTexture
        this.map = new Image(this.mapBuffered)
        // ChatLib.chat(`Map creation took ${new Date().getTime() - start}ms`)
    }
    updateDoors() {
        this.doors.forEach(d => {
            if (d.type !== "wither" || !d.explored) return
            d.updateDoorType()
        })
    }
    scanHotbarMap() {
        let map = getDungeonMap()
        let colors = getMapColors(map)
        const getRoomAt = (x, y) => this.rooms.find(a => a.components.some(b => b[0] == x && b[1] == y))
        const getDoorAt = (x, y) => this.doors.find(a => a.x == x && a.z == y)
        let visited = []
        const wasVisited = (x, y) => visited.some(a => a[0] == x && a[1] == y)
        if (!colors) return
        // Find important points on the map and build a new one
        let xx = -1
        for (let x = Dungeon.mapCorner[0]+(Dungeon.mapRoomSize/2); x < 118; x+=Dungeon.mapGapSize/2) {
            xx++
            let yy = -1
            for (let y = Dungeon.mapCorner[1]+(Dungeon.mapRoomSize/2)+1; y < 118; y+=Dungeon.mapGapSize/2) {
                yy++
                if (wasVisited(xx, yy)) continue
                let i = x + y*128
                if (colors[i] == 0) continue
                
                let center = colors[i-1] // Pixel where the checkmarks spawn
                let roomColor = colors[i+5 + 128*4] // Pixel in the borrom right-ish corner of the room which tells the room color.

                // Main room
                if (!(xx%2) && !(yy%2)) {
                    let room = getRoomAt(xx/2, yy/2)
                    if (!room || !room.isLoaded) continue
                    // ChatLib.chat(`${room.name} - ${roomColor} - ${room.explored}`)
                    visited = visited.concat(room.components.map(a => a.map(b => b*2)))
                    if (roomColor !== 85) room.explored = true
                    if (center == 30 && room.type !== "entrance") room.checkmark = "green"
                    if (center == 34) room.checkmark = "white"
                    if (center == 18 && room.type !== "blood") room.checkmark = "failed"
                    continue
                }
                // Doors
                let door = getDoorAt(...getRealCoords([xx, yy], true))
                if (door && center !== 85) door.explored = true
            }
        }
        if (Config.whiteCheckBlood && Dungeon.watcherSpawned && !Dungeon.watcherCleared) this.rooms.find(a => a.type == "blood")?.checkmark = "white"
    }
    /**
     * Gets the room at a set of real world coordinates. Iif there is no room at those coordinates, then return null.
     * @param {Numver[]} realCoords 
     * @returns {Room}
     */
    getRoomAt([x, z]) {
        [x, z] = getGridCoords([x, z], false).map(a => Math.floor(a+0.5))
        return this.rooms.find(a => a.components.some(b => b[0] == x && b[1] == z)) ?? null
    }
    /**
     * Gets the room which the specified player is currently in. If the player does not exist in the current dungeon,
     * or they are not in a room then return null.
     * @param {String} player 
     * @returns {Room}
     */
    getPlayerRoom(player) {
        if (player == Player.getName()) return this.getRoomAt([Player.getX(), Player.getZ()])
        let player = this.players.find(a => a.player == player)
        if (!player) return null
        let [px, pz] = [player.realX, player.realZ]
        if (!px || !pz) return null
        return this.getRoomAt([px, pz])
    }

    /**
     * Uses the rooms already scanned from the original scanning function and finds the parents of each room
     * All of the rooms will eventually originate at the entrance room.
     * @returns 
     */
    scanFromEntrance() {
        let entrance = this.rooms.find(a => a.type == "entrance")
        if (!entrance) return
        entrance.parent = null
        let queue = [entrance]
        let visited = []
        let rooms = []
        while (queue.length) {
            let currentRoom = queue.pop()
            if (visited.some(a => a.name == currentRoom.name)) continue
            visited.push(currentRoom)
            rooms.push(currentRoom)
            currentRoom.realComponents.forEach(c => {
                let [x, z] = c
                // Branch out in all four directions looking for doors
                ;[
                    [16, 0],
                    [-16, 0],
                    [0, 16],
                    [0, -16]
                ].forEach(a => {
                    let [dx, dz] = a
                    if (!World.getBlockAt(x+dx, 68, z+dz).type.getID()) return // Not a door or room
                    let room = this.getRoomAt([x+dx*2, z+dz*2])
                    if (!room || room == currentRoom) return
                    if (visited.some(a => a.name == room.name)) return currentRoom.parent = room
                    queue.push(room)
                })
                
            })
        }
        // rooms.forEach(r => {
        //     let parent = r.parent ? r.parent.name : null
        //     ChatLib.chat(`${r.name}: ${parent}`)
        // })
        this.rooms = rooms
    }
    /**
     * Returns an array of room objects of the rooms from room1 to room2. If room1 or room2 does not exist, returns null.
     * @param {String} room1 - The room to start at 
     * @param {String} room2 - The end room
     * @returns {Room[]|null}
     */
    getRouteFrom(room1, room2) {
        if (!room1 || !room2) return null
        room1 = room1.replace(/_/g, " ").toLowerCase()
        room2 = room2.replace(/_/g, " ").toLowerCase()
        let room = this.rooms.find(a => a.name.toLowerCase() == room1)
        if (!room) return null
        
        let route1 = this.getRoomsToEntrance(room)
        let ind = route1.findIndex(a => a.name.toLowerCase() == room2)
        if (ind !== -1) return route1.slice(0, ind+1)
        
        let room2 = this.rooms.find(a => a.name.toLowerCase() == room2)
        let route2 = this.getRoomsToEntrance(room2)

        let dupe = route1.find(a => route2.some(b => a == b))
        let sliced1 = route1.slice(0, route1.indexOf(dupe))
        let sliced2 = route2.slice(0, route2.indexOf(dupe)+1).reverse()

        return sliced1.concat(sliced2)
    }

    /**
     * Finds the path from the given room object to the entrance room.
     * @param {Room} room 
     * @returns {Room[]}
     */
    getRoomsToEntrance(room) {
        let route = []
        while (room) {
            route.push(room)
            room = room.parent
        }
        return route
    }
}