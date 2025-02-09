import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { chunkLoaded } from "../../BloomCore/utils/Utils"
import Config from "../utils/Config"
import { DoorTypes, RoomTypes, dungeonCorners, getHighestBlock, halfCombinedSize, halfRoomSize, realCoordToComponent, roomsJson } from "../utils/utils"
import Door from "./Door"
import Room from "./Room"

/**
 * Stores the rooms and doors. Separate from DmapDungeon so that 'fake' dungeons can be created
 * for dungeon logging stuff.
 */
export default class DungeonMap {

    /**
     * Creates a new DungeonMap filled with rooms and doors from a log string (see DungeonMap#convertToString)
     * @param {String} mapString 
     * @param {Boolean} setupTree - Finds the parent and children for every room. 
     */
    static fromString(mapString, setupTree) {
        const map = new DungeonMap()
        let [floor, timeStamp, roomsStr, doorsStr] = mapString.split(";")

        map.floor = floor
        
        const components = new Map() // roomID: [[0, 0], [0, 1], [1, 1]]
        const roomIDs = []
        for (let i = 0; i < roomsStr.length; i += 3) {
            roomIDs.push(parseInt(roomsStr.substring(i, i+3)))
        }
        const doorIDs = doorsStr.split("").map(a => parseInt(a))

        map.getScanCoords().forEach((v, k) => {
            let [x, y] = k
            
            // Door
            if (x%2 || y%2) {
                const doorType = doorIDs.shift()
                if (doorType == 9) return
                const door = new Door(-200+x*16, -200+y*16, x, y).setType(doorType)
                door.explored = true
                door.opened = false
                map.doors.add(door)
                return
            }
            
            // Room
            const roomID = roomIDs.shift()
            if (roomID == 999) return
            if (!components.has(roomID)) components.set(roomID, [])
            components.get(roomID).push([x/2, y/2])
        })

        // Create rooms
        components.forEach((v, k) => {
            let room = new Room(v)
            room.loadFromRoomId(k)
            room.explored = true
            map.rooms.add(room)
    
            map.secrets += room.secrets
            map.crypts += room.crypts

        })

        if (setupTree) map.setupTree()
        map.calcMapScore()
        map.string = mapString

        return map
    }

    constructor() {
        /** @type {Set<Room>} */
        this.rooms = new Set()
        /** @type {Set<Door>} */
        this.doors = new Set()

        this.roomIDMap = new Map()

        this.scanCoords = this.getScanCoords()
        this.fullyScanned = false

        this.secrets = 0
        this.crypts = 0

        this.mapScore = Infinity // How good the map is. Lower values are better.

        /**
         * - Cached `getRoomWithComponent` to avoid more computation than needed
         * @type {Room[]}
         */
        this.cachedComponentRooms = []
    }
    
    /**
     * Adds a room to this DungeonMap. Only used for the logging system for optimization.
     * @param {Room} room 
     * @returns 
     */
    addRoom(room) {
        if (room.roomID) {
            const existing = this.roomIDMap.get(room.roomID)
            if (existing) {
                existing.merge(room)
                return
            }
            this.roomIDMap.set(room.roomID, room)
        }
        this.rooms.add(room)
    }

    /**
     * Removes a room and its roomID. Only used for the logging system.
     * @param {Room} room 
     */
    removeRoom(room) {
        if (room.roomID) this.roomIDMap.delete(room.roomID)
        this.rooms.delete(room)
    }

    checkRoomRotations() {
        for (let room of this.rooms) {
            if (room.rotation !== null) continue
            room.findRotation()
        }
    }

    checkDoorsOpened() {
        for (let door of this.doors) door.checkOpened()
    }

    /**
     * 
     * @param {[Number, Number]} component - 0-10 component 
     * @returns {Door}
     */
    getDoorWithComponent(component) {
        let [x, z] = component
        for (let door of this.doors) {
            if (door.gx !== x || door.gz !== z) continue
            return door
        }
        return null
    }

    /**
     * 
     * @param {Room} childRoom 
     * @param {Room} parentRoom 
     * @returns {Door}
     */
    getDoorBetweenRooms(childRoom, parentRoom) {
        for (let door of this.doors) {
            if ((door.childRoom !== childRoom || door.parentRoom !== parentRoom) && (door.childRoom !== parentRoom || door.parentRoom !== childRoom)) continue
            return door
        }
        return null
    }

    /**
     * 
     * @param {Number} x - Real world coordinate
     * @param {Number} z - Real world coordinate
     * @returns {Room}
     */
    getRoomAt(x, z) {
        let component = realCoordToComponent([x, z])
        let room = this.getRoomWithComponent(component)
        if (!room || !room.corner) return null
        return room
    }

    /**
     * 
     * @param {String} roomName 
     * @returns {Room}
     */
    getRoomFromName(roomName) {
        for (let room of this.rooms) {
            if (room.name?.toLowerCase() !== roomName.toLowerCase()) continue
            return room
        }
    }
    
    getRoomFromID(roomID) {
        if (this.roomIDMap.has(roomID)) return this.roomIDMap.get(roomID)
        for (let room of this.rooms) {
            if (room.roomID !== roomID) continue
            return room
        }
        return null
    }

    /**
     * 
     * @param {[Number, Number]} component - An array of two numbers from 0-5 
     * @returns {Room}
     */
    getRoomWithComponent(component) {
        const idx = component[0] * 6 + component[1]
        const cached = this.cachedComponentRooms[idx]
        if (cached) return cached

        let mainRoom = null
        this.rooms.forEach(room => {
            if (!room.hasComponent(component)) return

            // Caching the value
            this.cachedComponentRooms[idx] = room
            mainRoom = room
        })
        return mainRoom
    }

    /**
     * Returns a map containing every possible [gridx, gridy] coordinate mapped to its [realx, realz] coordinate.
     * @returns 
     */
    getScanCoords() {
        const coords = new Map()
        let [x0, z0] = dungeonCorners.start
        for (let z = 0; z < 11; z++) {
            for (let x = 0; x < 11; x++) {
                if (x%2 && z%2) continue
                let rx = x0 + halfRoomSize + x * halfCombinedSize
                let rz = z0 + halfRoomSize + z * halfCombinedSize
                coords.set([x, z], [rx, rz])
            }
        }
        return coords
    }

    /**
     * Scans the world for Rooms and Doors. Will not scan the same location more than once.
     */
    scan() {
        const directions = [
            [halfCombinedSize, 0, 1, 0],
            [-halfCombinedSize, 0, -1, 0],
            [0, halfCombinedSize, 0, 1],
            [0, -halfCombinedSize, 0, -1]
        ]

        this.scanCoords.forEach((v, k) => {
            let [gx, gz] = k
            let [x, z] = v

            if (!chunkLoaded(x, 100, z)) return
            this.scanCoords.delete(k)

            let roofHeight = getHighestBlock(x, z)
            if (!roofHeight) return

            // Room
            if (!(gx%2 || gz%2)) {
                let room = this.getRoomWithComponent([gx/2, gz/2])

                if (room) room.scanAndLoad()
                else {
                    room = new Room([[gx/2, gz/2]], roofHeight)
                    room.scanAndLoad()
                    this.rooms.add(room)
                }

                if (room.type == RoomTypes.ENTRANCE) return

                for (let dir of directions) {
                    let [dx1, dz1, dx2, dz2] = dir
                    let [nx, nz] = [x+dx1, z+dz1]
                    if (!World.getBlockAt(nx, roofHeight, nz).type.getID()) continue
                    if (World.getBlockAt(nx, roofHeight+1, nz).type.getID()) continue
                    // Stop that pesky 2x2 entrance room
                    let doorBlock = World.getBlockAt(nx, 69, nz)
                    if (doorBlock.type.getID() == 97 && doorBlock.getMetadata() == 5) continue

                    let newComponent = [gx/2+dx2, gz/2+dz2]
                    let existing = this.getRoomWithComponent(newComponent)
                    if (existing && existing !== room) {
                        room.merge(existing)
                        this.rooms.delete(existing)
                        delete this.cachedComponentRooms[newComponent[0] * 6 + newComponent[1]]
                        continue
                    }
                    room.merge(new Room([newComponent], roofHeight))
                }
                return
            }
            // Door/Connector to larger room
            if (this.getDoorWithComponent([gx, gz])) return

            // Door block, eg air, coal block, red clay.
            let blocc = World.getBlockAt(x, 69, z)
            if (roofHeight < 85 || blocc.type.getID() == 97 && blocc.getMetadata() == 5) {
                let door = new Door(x, z, gx, gz)

                if (gz%2) door.rotation = 0
                else door.rotation = 90
                
                this.doors.add(door)
                return
            }
            // Edge case where two main sections of a room have been loaded and are disconnected and the center is being scanned.
            for (let dir of directions) {
                let [_, __, dx2, dz2] = dir
                let [cx1, cz1] = [gx+dx2, gz+dz2]
                let [cx2, cz2] = [gx-dx2, gz-dz2]
                let r1 = this.getRoomWithComponent([cx1/2, cz1/2])
                let r2 = this.getRoomWithComponent([cx2/2, cz2/2])
                if (!r1 || !r2 || r1 == r2 || r1.type == RoomTypes.ENTRANCE || r2.type == RoomTypes.ENTRANCE) continue
                r1.merge(r2)
                this.rooms.delete(r2)
                break
            }
        })
        
        this.secrets = 0
        this.rooms.forEach(r => this.secrets += r.secrets)
        
        this.crypts = 0
        this.rooms.forEach(r => this.crypts += r.crypts)

        // Dungeon is fully scanned
        if (!this.scanCoords.size) {
            this.fullyScanned = true

            let [mX, mZ] = Dungeon.dungeonDimensions
            this.rooms.forEach(room => {
                if (room.components.some(a => a[0] > mX || a[1] > mZ)) this.rooms.delete(room)
            })
        }

        if (Config().scanSetupTree || Config().witherDoorEsp) this.setupTree()

    }

    drawToImage(bufferedImage) {
        for (let room of this.rooms) {
            room.draw(bufferedImage)
        }

        for (let door of this.doors) {
            door.draw(bufferedImage)
        }

        return bufferedImage
    }

    /**
     * Returns the string representation of the Dungeon Map which preserves the location and shapes of all of the rooms and doors.
     * 
     * "floor;date;rooms;doors"
     * floor = F5, F7, M5 etc
     * date = unix timestamp
     * rooms = room id padded to 3 characters long. Eg roomid 13 = 013, roomid 7 = 007, roomid 103 = 103 etc. 999 = no room, 998 = unknown room.
     * doors = door type number, 
     * @returns 
     */
    convertToString() {
        let roomStr = ""
        let doorStr = ""
        this.getScanCoords().forEach((v, k) => {

            let [x, y] = k
            let [rx, ry] = v

            // Room
            if (!(x%2 || y%2)) {
                const room = this.getRoomWithComponent([x/2, y/2])
                if (!room) {
                    roomStr += "999"
                    return
                }
                if (room.roomID == null) {
                    roomStr += "998"
                    return
                }
                const roomID = room.roomID
                roomStr += `${"0".repeat(3 - roomID.toString().length)}${roomID}`
                return
            }

            // Door
            const door = this.getDoorWithComponent([x, y])
            if (!door) {
                doorStr += "9"
                return
            }
            doorStr += door.type.toString()
        })
        if (!Dungeon.floor || roomStr == "" || doorStr == "") return null
        return `${Dungeon.floor};${Date.now()};${roomStr};${doorStr}`
    }

    /**
     * Searches through the dungeon starting from the entrance room to turn the rooms
     * and doors into a graph so that it can be traversed easily.
     * @returns 
     */
    setupTree() {

        // let started = Date.now()
        let entrance = this.getRoomFromName("Entrance")
        if (!entrance) return
        entrance.explored = true

        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        
        // Reset doors and rooms from previous scans to prevent duplicates
        this.doors.forEach(door => {
            door.childRoom = null
            door.parentRoom = null
        })
        this.rooms.forEach(room => {
            room.doors = []
            room.children = []
            room.parent = null
        })
        // this.mapScore = 0
        this.calcMapScore()

        const queue = [entrance]
        const visited = new Set()
        const depthMap = new Map([[entrance, 0]])
        while (queue.length) {
            let room = queue.pop()
            if (visited.has(room)) continue
            visited.add(room)

            // Room score shit
            let depth = depthMap.get(room)
            // let roomScore = room.getRoomScore()
            // this.mapScore += roomScore

            // Branch off to the doors from the rest of the components
            room.components.forEach(([cx, cz]) => {
                directions.forEach(([dx, dz]) => {
                    let [nx, nz] = [cx*2+dx, cz*2+dz]
                    let door = this.getDoorWithComponent([nx, nz])
                    if (!door) return
                    room.doors.push(door)
                    // Check for room on the other side of door
                    let newRoom = this.getRoomWithComponent([cx+dx, cz+dz])
                    if (!newRoom || visited.has(newRoom)) return

                    door.childRoom = newRoom
                    door.parentRoom = room
                    newRoom.parent = room
                    room.children.push(newRoom)

                    queue.push(newRoom)
                    depthMap.set(newRoom, depth+1)
                })
            })
        }
        
        // Fill in missing doors if the wither/entrance/blood doors have already been opened.
        const bloodRoute = this.getRoomsTo(this.getRoomFromName("Entrance"), this.getRoomFromName("Blood"), true)
        if (!bloodRoute) return
        bloodRoute.forEach((thing, i) => {
            if (!(thing instanceof Door) || thing.type !== DoorTypes.NORMAL) return
            thing.type = DoorTypes.WITHER
            thing.opened = false

            // Door directly after Entrance
            if (i > 0) {
                let lastRoom = bloodRoute[i-1]
                if (lastRoom instanceof Room && lastRoom.type == RoomTypes.ENTRANCE) {
                    thing.type = DoorTypes.ENTRANCE
                }
            }
            // Door right before blood room
            if (i == bloodRoute.length-2) {
                let nextRoom = bloodRoute[i+1]
                if (nextRoom instanceof Room && nextRoom.type == RoomTypes.BLOOD) {
                    thing.type = DoorTypes.BLOOD
                }
            }
        })
    }

    calcMapScore() {
        this.mapScore = 0
        for (let room of this.rooms) this.mapScore += room.getRoomScore()
    }

    /**
     * Returns the rooms (and doors if includeDoors=true) in order to go from the start room to the end room.
     * The returned array will include both the start and end rooms.
     * @param {Room} startRoom - The room to start at. 
     * @param {Room} endRoom - The room to end at.
     * @param {Boolean} includeDoors 
     */
    getRoomsTo(startRoom, endRoom, includeDoors=false) {
        if (!endRoom || !startRoom) return null

        const queue = [startRoom]
        const cameFrom = new Map()
        const visited = new Set()
        
        while (queue.length) {
            let current = queue.shift()
            
            if (!current) continue

            visited.add(current)

            // End room has been reached
            if (current == endRoom) {
                const path = []
                while (current) {
                    path.unshift(current)
                    current = cameFrom.get(current)
                }
                if (includeDoors) return path
                // Filter out the doors
                return path.filter(a => a instanceof Room)
            }

            // Go deeper to the next room
            if (current instanceof Door) {
                for (let room of [current.childRoom, current.parentRoom]) {
                    if (visited.has(room)) continue
                    cameFrom.set(room, current)
                    queue.push(room)
                }
                continue
            }
            // Add the connected doors
            for (let door of current.doors) {
                if (visited.has(door)) continue
                cameFrom.set(door, current)
                queue.push(door)
            }
        }

        return null
    }
}