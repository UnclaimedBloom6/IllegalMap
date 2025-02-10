import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { bcData, BufferedImage, clampAndMap, getDungeonMap, getMapColors, isBetween } from "../../BloomCore/utils/Utils"
import { Checkmark, clearImage, defaultMapSize, DoorTypes, findAllConnected, roomsJson, RoomTypes } from "../utils/utils"
import Config, { mapEditGui } from "../utils/Config"
import { DungeonPlayer } from "./DungeonPlayer"
import Room from "./Room"
import Door from "./Door"
import DungeonMap from "./DungeonMap"

/**
 * Class which stores and processed most of the data for the whole module.
 * 
 * The Rooms and Doors are all stored in the dungeonMap field (A DungeonMap class).
 */
export default new class DmapDungeon {
    constructor() {

        this.reset()

        this.playerRoomEnterListeners = []
        this.playerRoomExitListeners = []
        this.dungeonFullyScannedListeners = []
        
        register("step", () => {
            if (!Dungeon.inDungeon || this.dungeonMap.fullyScanned) return
            this.dungeonMap.scan()

            if (this.dungeonMap.fullyScanned) {
                this.dungeonFullyScannedListeners.forEach(func => func(this))
            }
            
            if (!Config().enabled) return

            this.redrawMap()

        }).setFps(4)

        register("step", () => {
            if (!Dungeon.inDungeon) return

            this.dungeonMap.checkRoomRotations()
            // if ([...this.dungeonMap.rooms].some(a => a.rotation == null)) return

            // if (!this.dungeonMap.fullyScanned) return
            
            // // Save doors for 1x1's
            // this.dungeonMap.rooms.forEach(r => {
            //     if (r.shape !== "1x1" || r.rotation == null) return
            //     let final = []
            //     let [x0, z0] = r.components[0]
            //     for (let dir of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
            //         let [dx, dy] = dir
            //         let door = this.dungeonMap.getDoorWithComponent([x0*2+dx, z0*2+dy])
            //         if (!door) final.push(0)
            //         else final.push(1)
            //     }
            //     final = final.concat(final.splice(0, r.rotation/90)).join("")
            //     for (let room of roomsJson) {
            //         if (room.name !== r.name) continue
            //         if ("doors" in room) return
            //         room.doors = final
            //         ChatLib.chat(`&aAdded doors for ${r.getName(true)}&a: &6${final}`)
            //         FileLib.write("IllegalMap", "utils/rooms.json", JSON.stringify(roomsJson, null, 4))
            //         return
            //     }
            // })
        }).setFps(1)

        // Singleplayer debug stuff
        let lastRoom = null
        register("tick", () => {
            // isSingleplayer()
            if (!Client.getMinecraft().func_71356_B() || !Dungeon.inDungeon) return
            let room = this.getCurrentRoom()
            if (room == lastRoom) return
            if (lastRoom) this.playerRoomExitListeners.forEach(f => f(null, lastRoom))
            lastRoom = room
            if (!room) return
            this.playerRoomEnterListeners.forEach(f => f(null, room))
        })

        Dungeon.onMapData((mapData) => {
            // Check for checkmarks, new rooms etc
            if (!mapData || !Dungeon.mapCorner) return

            this.scanHotbarMap(mapData)

            // Update the player icons
            for (let i of Object.keys(Dungeon.icons)) {
                let icon = Dungeon.icons[i]
                let player = this.players.find(a => a?.player == icon?.player)
                if (!player || player.inRender) continue
                // SO I DONT FORGET NEXT TIME:
                // ICON.X / 2 BECAUSE THEY ARE NORMALLY 256 MAX INSTEAD OF 128 (MAP SIZE)
                // OFFSET BY MAP CORNER
                // MAKE VALUE ALWAYS MAP AS IF THE DUNGEON WAS 6 ROOMS WIDE, EVEN IF MAX NUMBER IS LARGER THAN 128
                player.iconX = clampAndMap(icon.x/2 - Dungeon.mapCorner[0], 0, Dungeon.mapRoomSize * 6 + 20, 0, defaultMapSize[0])
                player.iconY = clampAndMap(icon.y/2 - Dungeon.mapCorner[1], 0, Dungeon.mapRoomSize * 6 + 20, 0, defaultMapSize[1])
                player.realX = clampAndMap(player.iconX, 0, 125, -200, -10)
                player.realZ = clampAndMap(player.iconY, 0, 125, -200, -10)
                player.rotation = icon.rotation
                player.currentRoom = this.getRoomAt(player.realX, player.realZ)
            }
        })

        Dungeon.registerWhenInDungeon(register("tick", () => {
            this.dungeonMap.checkDoorsOpened()
        }))


        // Update all players in render distance
        Dungeon.registerWhenInDungeon(register("tick", () => {
            if (!Config().enabled) return

            // Add any new players
            for (let p of Dungeon.party) {
                if (this.players.some(a => a.player == p) || World.getPlayerByName(p)?.getPing() == -1) continue
                this.players.push(new DungeonPlayer(p))
            }

            // Update players who are in render distance
            for (let p of this.players) {
                let player = World.getPlayerByName(p.player)
                if (!player) {
                    p.inRender = false
                    continue
                }
                // Don't update players after the run ends
                if (player.getPing() == -1 && !Dungeon.runEnded) continue

                let x = player.getX()
                let z = player.getZ()

                // Outside of the Dungeon
                if (!isBetween(x, -200, -10) || !isBetween(z, -200, -10)) continue
                
                p.inRender = true
                p.iconX = clampAndMap(x, -200, -10, 0, defaultMapSize[0])
                p.iconY = clampAndMap(z, -200, -10, 0, defaultMapSize[1])
                p.realX = x
                p.realZ = z
                p.rotation = player.getYaw() + 180

                p.currentRoom = this.getRoomAt(p.realX, p.realZ)
            }
        }))


        register("step", () => {
            if ((!Dungeon.inDungeon || !Config().enabled) && !mapEditGui.isOpen()) return

            let secretsForMax = Math.ceil(this.dungeonMap.secrets * Dungeon.secretsPercentNeeded)
            let ms = Math.ceil(secretsForMax*((40 - (Dungeon.isPaul ? 10 : 0) - (Dungeon.mimicKilled ? 2 : 0) - (Dungeon.crypts > 5 ? 5 : Dungeon.crypts) + (Dungeon.deathPenalty))/40))

            let totalSecrets = Dungeon.totalSecrets || this.dungeonMap.secrets
            let dSecrets = `&7Secrets: &b${Dungeon.secretsFound}&8-&e${totalSecrets - Dungeon.secretsFound}&8-&c${totalSecrets}`
            let dCrypts = "&7Crypts: " + (Dungeon.crypts >= 5 ? `&a${Dungeon.crypts}` : Dungeon.crypts > 0 ? `&e${Dungeon.crypts}` : `&c0`) + (Config().showTotalCrypts ? ` &8(${this.dungeonMap.crypts})` : "")
            let dMimic = [6, 7].includes(Dungeon.floorNumber) ? ("&7Mimic: " + (Dungeon.mimicKilled ? "&a✔" : "&c✘")) : ""
        
            let minSecrets = "&7Min Secrets: " + (!this.dungeonMap.secrets && !Dungeon.minSecrets ? "&b?" : Dungeon.minSecrets ? `&e${Dungeon.minSecrets}` : `&a${ms}`)
            let dDeaths = "&7Deaths: " + (Dungeon.deathPenalty < 0 ? `&c${Dungeon.deathPenalty}` : "&a0")
            let dScore = "&7Score: " + (Dungeon.score >= 300 ? `&a${Dungeon.score}` : Dungeon.score >= 270 ? `&e${Dungeon.score}` : `&c${Dungeon.score}`)

            const paulStar = Dungeon.isPaul ? "&b★" : ""
        
            this.mapLine1 = `${dSecrets}    ${dCrypts}    ${dMimic}`.trim()
            this.mapLine2 = `${minSecrets}    ${dDeaths}    ${dScore}${paulStar}`.trim()
        }).setFps(4)

        // Update player visited rooms
        Dungeon.registerWhenInDungeon(register("tick", () => {
            if (!Config().enabled || !this.players.length || !Dungeon.time || Dungeon.bossEntry) return
            for (let p of this.players) {
                let currentRoom = p.currentRoom
                if (!currentRoom) continue

                // Room enter/exit event
                if (currentRoom !== p.lastRoom) {
                    if (p.lastRoom) this.playerRoomExitListeners.forEach(func => func(p, p.lastRoom))
                    this.playerRoomEnterListeners.forEach(func => func(p, currentRoom))
                }
                if (!p.visitedRooms.has(currentRoom)) p.visitedRooms.set(currentRoom, 0)
                if (p.lastRoomCheck) p.visitedRooms.set(currentRoom, p.visitedRooms.get(currentRoom) + Date.now() - p.lastRoomCheck)
                p.lastRoomCheck = Date.now()
                p.lastRoom = currentRoom
            }
        }))

        const printPlayerStats = () => this.players.forEach(p => p.printClearStats())

        register("chat", () => {
            if (!Config().showPlayerPerformances || !bcData.apiKey) return
            // Delay so it doesn't get mixed up in the post-run summary messages
            setTimeout(() => {
                printPlayerStats()
            }, 1000);
        }).setCriteria("                             > EXTRA STATS <")
        register("command", () => printPlayerStats()).setName("clearinfo").setAliases(["ci", "rooms"])

        register("chat", (player) => {
            if (player == "You") player = Player.getName()
            let player = this.players.find(a => a.player == player)
            if (!player) return
            player.deaths++
        }).setCriteria(/^ ☠ (\w+) .+$/)

        register("worldUnload", () => this.reset())

        register("command", () => {
            this.dungeonMap.rooms.forEach(r => {
                ChatLib.chat(r.toString())
            })
        }).setName("/rooms")

        register("command", () => {
            this.dungeonMap.doors.forEach(r => {
                ChatLib.chat(r.toString())
            })
        }).setName("/doors")

        register("chat", (keyType) => {
            if (keyType == "Wither") this.witherKeys++
            if (keyType == "Blood") this.bloodKey = true
        }).setCriteria(/^(?:\[[^\]]+\] )*\w+ has obtained (\w+) Key!$/)
        
        register("chat", () => this.witherKeys--).setCriteria(/^(?:\[[^\]]+\] )*\w+ opened a WITHER door!/)
        register("chat", () => this.bloodKey = false).setCriteria(/^The BLOOD DOOR has been opened!$/)

        

    }
    reset() {
        this.dungeon = Dungeon
        this.dungeonMap = new DungeonMap()

        /** @type {DungeonPlayer[]} */
        this.players = []

        this.witherKeys = 0
        this.bloodKey = false

        this.mapLine1 = "&cDungeon not fully"
        this.mapLine2 = "&cscanned!"

        this.mapBuffered = new BufferedImage(23, 23, BufferedImage.TYPE_4BYTE_ABGR)
        this.map = new Image(this.mapBuffered)

        /** @type {Room[]} */
        this.roomsCheckmark = []
    }

    /**
     * @callback RoomEnterExit
     * @param {DungeonPlayer} player
     * @param {Room} room
    */

    /**
     * Runs the function when a player enters a room. The DungeonPlayer and Room objects are passed.
     * @param {RoomEnterExit} func 
     */
    onRoomEnter(func) {
        this.playerRoomEnterListeners.push(func)
    }
    
    /**
     * Runs the function when a player exits a room. The DungeonPlayer and Room objects are passed.
     * @param {RoomEnterExit} func 
     */
    onRoomExit(func) {
        this.playerRoomExitListeners.push(func)
    }

    /**
     * @callback DungeonFullyScanned
     * @param {DmapDungeon} dungeon
    */

    /**
     * 
     * @param {DungeonFullyScanned} func 
     */
    onDungeonAllScanned(func) {
        this.dungeonFullyScannedListeners.push(func)
    }

    /**
     * Draws all of the rooms and doors on the map
     */
    redrawMap() {
        clearImage(this.mapBuffered)
        this.dungeonMap.drawToImage(this.mapBuffered)
        Client.scheduleTask(() => {
            if (this.map) this.map.destroy()
            this.updateMapImage()
        })
    }

    updateMapImage() {
        this.map = new Image(this.mapBuffered)
    }

    /**
     * Scans each room's spot on the hotbar map to check for a checkmark or if it's explored.
     * @returns 
     */
    scanHotbarMap(mapData) {
        const colors = mapData.field_76198_e
        if (!colors || colors.length < 16384 || !Dungeon.mapCorner) return

        // Update rooms
        for (let room of this.dungeonMap.rooms) {
            if (!room.components.length) continue
            let [x, y] = room.components[0]

            let mapX = Dungeon.mapCorner[0] + Math.floor(Dungeon.mapRoomSize/2) + Dungeon.mapGapSize * x
            let mapY = Dungeon.mapCorner[1] + Math.floor(Dungeon.mapRoomSize/2)+1 + Dungeon.mapGapSize * y
            let index = mapX + mapY * 128

            let center = colors[index-1]
            let roomColor = colors[index+5 + 128*4]

            if (roomColor == 0 || roomColor == 85) {
                room.draw(this.mapBuffered)
                room.explored = false
                continue
            }
            room.explored = true

            if (room.type == RoomTypes.UNKNOWN && !room.roofHeight) room.loadFromRoomMapColor(roomColor)
            
            if (center == 30 && roomColor !== 30) {
                if (!room.checkmark) this.handleRoomCleared(room)
                room.checkmark = Checkmark.GREEN
            }
            else if (center == 34) {
                if (!room.checkmark) this.handleRoomCleared(room)
                room.checkmark = Checkmark.WHITE
            }
            else if (center == 18 && roomColor !== 18) room.checkmark = Checkmark.FAILED
            else if (room.checkmark == Checkmark.UNEXPLORED) {
                room.checkmark = Checkmark.NONE
            }
            
            if (room.checkmark !== Checkmark.NONE) {
                if (this.roomsCheckmark.indexOf(room) == -1)
                    this.roomsCheckmark.push(room)
            }
            room.draw(this.mapBuffered)
            room.updateRenderVariables()
        }

        // Update doors
        for (let door of this.dungeonMap.doors) {
            let mapX = Dungeon.mapCorner[0] + Math.floor(Dungeon.mapRoomSize/2) + Math.floor(Dungeon.mapGapSize/2) * door.gx
            let mapY = Dungeon.mapCorner[1] + Math.floor(Dungeon.mapRoomSize/2) + Math.floor(Dungeon.mapGapSize/2) * door.gz
            let index = mapX + mapY * 128
            
            let color = colors[index]
            if (color == 0 || color == 85) {
                door.draw(this.mapBuffered)
                door.explored = false
                continue
            }
            door.explored = true

            door.draw(this.mapBuffered)
        }

        // Load rooms which haven't been scanned but are loaded on the hotbar map
        for (let entry of this.dungeonMap.scanCoords) {
            let [v, k] = entry
            let [gx, gz] = k
            let [x, z] = v

            let mapX = Dungeon.mapCorner[0] + Math.floor(Dungeon.mapRoomSize/2) + Math.floor(Dungeon.mapGapSize/2) * gx
            let mapY = Dungeon.mapCorner[1] + Math.floor(Dungeon.mapRoomSize/2) + Math.floor(Dungeon.mapGapSize/2) * gz
            let index = mapX + mapY * 128

            let color = colors[index]
            if (!color) continue
            let roomColor = colors[index+5 + 128*4]

            // Rooms
            if (!(gx%2) && !(gz%2)) {
                let existingRoom = this.getRoomWithComponent([gx/2, gz/2])
                if (existingRoom) continue

                if (color == 119) {
                    // ChatLib.chat(`Room at ${gx/2}, ${gz/2}`)
                    let room = new Room([[gx/2, gz/2]])
                    room.checkmark = Checkmark.UNEXPLORED
                    this.dungeonMap.rooms.add(room)
                    // ChatLib.chat(`Added unknown room ${gx/2}, ${gz/2}`)
                    room.draw(this.mapBuffered)
                    continue
                }
                
                let components = findAllConnected(colors, [mapX, mapY])
                // ChatLib.chat(`Components: ${JSON.stringify(components)}`)
                // continue
                for (let component of components) {
                    // Started scanning different component of already partially scanned room
                    let existing = this.getRoomWithComponent(component)
                    if (!existing) continue
                    existing.addComponents(components)
                    // Don't scan here again
                    if (existing.name) this.dungeonMap.scanCoords.delete(k)
                    
                    continue
                }
                let newRoom = new Room(components)
                newRoom.loadFromRoomMapColor(roomColor)
                this.dungeonMap.rooms.add(newRoom)
                // ChatLib.chat(`New colored room ${color} - ${gx/2}, ${gz/2}`)
                continue
            }

            // Doors
            if (!color) continue
            let existingDoor = this.getDoorWithComponent([gx, gz])
            if (existingDoor) continue

            if (gx%2 && (colors[index-128*5] || colors[index*128*3])) continue
            if (gz%2 && (colors[index-128-4] || colors[index-128+4])) continue

            let door = new Door(x, z, gx, gz)
            if (color == 85 || color == 63) door.type = DoorTypes.NORMAL
            else if (color == 119) door.type = DoorTypes.WITHER
            else if (color == 18) door.type = DoorTypes.BLOOD

            this.dungeonMap.doors.add(door)
        }

        // this.updateMapImage()
        this.redrawMap()
    }

    /**
     * Called when a room gets cleared (No checkmark -> checkmark)
     * Updates the player's cleared rooms if they are in there.
     * @param {Room} room 
     */
    handleRoomCleared(room) {
        let players = this.getPlayersInRoom(room)

        for (let player of players) {
            if (players.length == 1) player.clearedRooms.solo++
            else player.clearedRooms.stacked++
        }
    }

    /**
     * 
     * @param {[Number, Number]} component - 0-10 component 
     * @returns {Door}
     */
    getDoorWithComponent(component) {
        return this.dungeonMap.getDoorWithComponent(component)
    }
    
    /**
     * 
     * @param {[Number, Number]} component - An array of two numbers from 0-5 
     * @returns {Room}
     */
    getRoomWithComponent(component) {
        return this.dungeonMap.getRoomWithComponent(component)
    }

    /**
     * 
     * @param {Number} x - Real world coordinate
     * @param {Number} z - Real world coordinate
     * @returns {Room}
     */
    getRoomAt(x, z, mustBeFullyLoaded=false) {
        return this.dungeonMap.getRoomAt(x, z)
    }

    /**
     * 
     * @param {String} roomName 
     * @returns {Room}
     */
    getRoomFromName(roomName) {
        return this.dungeonMap.getRoomFromName(roomName)
    }

    getDoorBetweenRooms(childRoom, parentRoom) {
        return this.dungeonMap.getDoorBetweenRooms(childRoom, parentRoom)
    }

    /**
     * Gets the room which the specified player is currently in. If the player does not exist in the current dungeon,
     * or they are not in a room then return null.
     * @param {DungeonPlayer | String} player 
     * @returns {Room}
     */
    getPlayerRoom(player) {
        if (!(player instanceof DungeonPlayer)) player = this.players.find(a => a.player == player)
        if (!player) return null

        return this.getRoomAt(player.realX, player.realZ)
    }

    /**
     * Gets the room at your current location. Returns null if you are not in a room.
     * @param {Boolean} mustHaveCorner - The corner and rotation of the room must be loaded, otherwise return null.
     * @returns {Room | null}
     */
    getCurrentRoom(mustHaveCorner=false) {
        const room = this.getRoomAt(Player.getX(), Player.getZ())
        if (!room || (mustHaveCorner && !room.corner)) return null
        return room
    }

    /**
     * 
     * @param {String | Room} room 
     */
    getPlayersInRoom(room) {
        if (!(room instanceof Room)) room = this.getRoomFromName(room)
        if (!room) return []

        return this.players.filter(a => this.getPlayerRoom(a) == room)
    }

    /**
     * Highlights rooms on the map
     * @param {Room[]} rooms 
     */
    highlightRooms(rooms) {
        this.dungeonMap.rooms.forEach(r => r.highlighted = false)
        rooms.forEach(room => room.highlighted = true)
        this.updateMapImage()
    }

    /**
     * Returns the rooms (and doors if includeDoors=true) in order to go from the start room to the end room.
     * The returned array will include both the start and end rooms.
     * @param {Room} startRoom - The room to start at. 
     * @param {Room} endRoom - The room to end at.
     * @param {Boolean} includeDoors 
     */
    getRoomsTo(startRoom, endRoom, includeDoors=false) {
        if (!startRoom) startRoom = this.getCurrentRoom()
        return this.dungeonMap.getRoomsTo(startRoom, endRoom, includeDoors)
    }
    
}