import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { chunkLoaded } from "../../BloomCore/utils/Utils"
import Config from "../utils/Config"
import { DoorTypes, RoomNameMap, RoomTypes, dungeonCorners, getHighestBlock, halfCombinedSize, halfRoomSize, hashComponent, hashDoorComponent, realCoordToComponent, roomsJson } from "../utils/utils"
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
    static fromString(mapString, setupTree=false) {
        const map = new DungeonMap()
        let [floor, timeStamp, roomsStr, doorsStr] = mapString.split(";")

        map.floor = floor
        
        const components = new Map() // roomID: [[0, 0], [0, 1], [1, 1]]
        const roomIDs = []
        for (let i = 0; i < roomsStr.length; i += 3) {
            roomIDs.push(parseInt(roomsStr.substring(i, i+3)))
        }
        const doorIDs = doorsStr.split("").map(a => parseInt(a))

        for (let entry of map.getScanCoords()) {
            let { x, z, worldX, worldZ } = entry
            
            // Door
            if (x%2 || z%2) {
                let doorType = doorIDs.shift()
                if (doorType == 9) continue
                let door = new Door(-200+x*16, -200+z*16, x, z).setType(doorType)
                door.explored = true
                door.opened = false
                map.addDoor(door)
                continue
            }
            
            // Room
            let roomID = roomIDs.shift()
            if (roomID == 999) continue
            if (!components.has(roomID)) components.set(roomID, [])
            components.get(roomID).push([x>>1, z>>1])
        }

        // Create rooms
        components.forEach((v, k) => {
            let room = new Room(v)
            room.loadFromRoomId(k)
            room.explored = true
            map.addRoom(room)
    
            map.secrets += room.secrets
            map.crypts += room.crypts

        })

        if (setupTree) map.setupTree()
        map.calcMapScore()
        map.string = mapString

        return map
    }

    constructor() {
        this.scanCoords = this.getScanCoords()

        /** @type {Room[]} */
        this.rooms = []

        /** @type {Door[]} */
        this.doors = []

        /** @type {Room[]} */
        this.roomIdMap = new Array(256).fill(null) // Each index corresponds to a room id, can contain a room or null if room isn't present in current dungeon

        /** @type {Room[]} */
        this.componentMap = new Array(36).fill(null) // Component 6y+x -> Room or null

        /** @type {Door[]} */
        this.doorComponentMap = new Array(60).fill(null) // 60 possible door locations in a dungeon

        /** @type {Room[]} */
        this.checkmarkedRooms = []
        
        this.fullyScanned = false

        this.secrets = 0
        this.crypts = 0

        this.mapScore = Infinity // How good the map is. Lower values are better.
    }

    /**
     * Merges two rooms
     * @param {Room} room1 
     * @param {Room} room2 
     */
    mergeRooms(room1, room2) {

        if (room1.roomID !== null && room2.roomID !== null && room1.roomID !== room2.roomID) {
            ChatLib.chat(`&cRoom mismatch: ${room1.name} is not the same as ${room2.name}!`)
        }

        // Need to remove this room first
        this.removeRoom(room2)

        for (let component of room2.components) {
            if (!room1.hasComponent(component)) {
                room1.addComponent(component, false)
            }

            this.componentMap[hashComponent(component)] = room1
        }

        // Refresh all of the room shape stuff
        room1.updateComponents()
    }
    
    /**
     * Adds a room to this DungeonMap. Merges rooms when necessary.
     * @param {Room} room 
     * @returns 
     */
    addRoom(room) {

        for (let component of room.components) {
            let index = 6*component[1] + component[0]
            if (this.componentMap[index]) {
                // ChatLib.chat(`Component ${component[0]}, ${component[1]} already occupied by ${room.toString()}`)
            }
            this.componentMap[index] = room
        }

        if (room.roomID !== null) {
            this.roomIdMap[room.roomID] = room
        }

        this.rooms.push(room)

    }

    /**
     * Removes a room and its roomID. Only used for the logging system.
     * @param {Room} room 
     */
    removeRoom(room) {
        // Unset component map
        for (let component of room.components) {
            let index = hashComponent(component)
            this.componentMap[index] = null
        }

        // Unset room ID map
        if (room.roomID) {
            this.roomIdMap[room.roomID] = null
        }

        // Delete from checkmarked rooms
        for (let i = 0; i < this.checkmarkedRooms.length; i++) {
            if (this.checkmarkedRooms[i] == room) {
                this.checkmarkedRooms.splice(i, 1)
                break
            }
        }
        
        // And delete the room for good
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i] == room) {
                // ChatLib.chat(`Deleted ${this.rooms[i].toString()}`)
                this.rooms.splice(i, 1)
                break
            }
        }
    }

    /**
     * 
     * @param {Door} door 
     */
    addDoor(door) {
        const index = hashDoorComponent([door.gx, door.gz])

        if (index < 0 || index > 59) return

        if (this.doorComponentMap[index]) {
            // ChatLib.chat(`Door already existed at ${door.gz}, ${door.gz} (${index})`)
            this.removeDoorAtIndex(index)
        }

        this.doorComponentMap[index] = door
        this.doors.push(door)
    }

    /**
     * 
     * @param {Door} door 
     */
    removeDoorAtIndex(index) {
        const door = this.doorComponentMap[index]

        if (!door) return

        this.doorComponentMap[index] = null
        for (let i = 0; i < this.doors.length; i++) {
            if (this.doors[i] == door) {
                this.doors.splice(i, 1)
                break
            }
        }
    }

    /**
     * 
     * @param {Room} room 
     * @param {[Number, Number]} component 
     */
    addComponentToRoom(room, component) {
        room.addComponent(component)

        this.componentMap[hashComponent(component)] = room
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
        const index = hashDoorComponent(component)

        if (index < 0 || index > 59) return null

        return this.doorComponentMap[index]
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
        const component = realCoordToComponent([x, z])
        const room = this.getRoomWithComponent(component)

        return room
    }

    /**
     * 
     * @param {String} roomName 
     * @returns {Room}
     */
    getRoomFromName(roomName) {
        const roomData = RoomNameMap.get(roomName)

        if (!roomData) return null

        return this.roomIdMap[roomData.roomID]
    }
    
    getRoomFromID(roomID) {
        if (roomID < 0 || roomID > 255) return null

        return this.roomIdMap[roomID]
    }

    /**
     * 
     * @param {[Number, Number]} component - An array of two numbers from 0-5 
     * @returns {Room}
     */
    getRoomWithComponent(component) {
        const index = hashComponent(component)

        if (index < 0 || index > 35) {
            return null
        }

        return this.componentMap[index]
    }

    /**
     * 
     * @param {Room} room 
     */
    setCheckmarkedRoom(room) {
        if (!this.checkmarkedRooms.includes(room)) {
            this.checkmarkedRooms.push(room)
        }
    }

    /**
     * Returns a map containing every possible [gridx, gridy] coordinate mapped to its [realx, realz] coordinate.
     * @returns 
     */
    getScanCoords() {
        const coords = []
        const [x0, z0] = dungeonCorners.start

        for (let z = 0; z < 11; z++) {
            for (let x = 0; x < 11; x++) {
                if (x%2 && z%2) continue
                let worldX = x0 + halfRoomSize + x * halfCombinedSize
                let worldZ = z0 + halfRoomSize + z * halfCombinedSize

                coords.push({
                    x,
                    z,
                    worldX,
                    worldZ
                })
            }
        }

        return coords
    }

    /**
     * Scans the world for Rooms and Doors. Will not scan the same location more than once.
     */
    scan() {
        // return
        const directions = [
            [halfCombinedSize, 0, 1, 0],
            [-halfCombinedSize, 0, -1, 0],
            [0, halfCombinedSize, 0, 1],
            [0, -halfCombinedSize, 0, -1]
        ]

        const toDelete = [] // Indexes
        for (let i = 0; i < this.scanCoords.length; i++) {
            let { x, z, worldX, worldZ } = this.scanCoords[i]

            // Can't scan areas which aren't loaded yet
            if (!chunkLoaded(worldX, 0, worldZ)) {
                continue
            }

            // this.scanCoords.splice(i, 1)
            toDelete.push(i)
            
            let roofHeight = getHighestBlock(worldX, worldZ)

            // There is nothing here
            if (!roofHeight) {
                continue
            }
            
            // Door
            if (x%2 == 1 || z%2 == 1) {
                // Check for a door
                let highest = getHighestBlock(worldX, worldZ)

                if (highest !== null && highest < 85) {
                    let door = new Door(worldX, worldZ, x, z)

                    if (z%2 == 1) door.rotation = 0

                    this.addDoor(door)
                }

                continue
            }

            // Room
            x >>= 1
            z >>= 1

            // let existing = this.getRoomWithComponent([x, z])
            // if (existing) {
            //     ChatLib.chat(`&cRoom at ${x}, ${z} already exists! ${existing.name}`)
            //     continue
            // }

            let room = new Room([[x, z]], roofHeight)
            room.scanAndLoad()
            this.addRoom(room)

            // Try to extend this room out or look for doors
            for (let dir of directions) {
                let [dxWorld, dzWorld, dx, dz] = dir
                
                let roofHeightBlock = World.getBlockAt(worldX + dxWorld, roofHeight, worldZ + dzWorld)
                let aboveBlock = World.getBlockAt(worldX + dxWorld, roofHeight+1, worldZ + dzWorld)

                // No gap entrance yay! Add an entrance door here and then stop looking in this direction
                if (room.type == RoomTypes.ENTRANCE && roofHeightBlock.type.getID() !== 0) {
                    // Extended back part of entrance room
                    if (World.getBlockAt(worldX+dxWorld, 76, worldZ+dzWorld).type.getID() == 0) {
                        continue
                    }

                    let doorInd = hashDoorComponent([x*2+dx, z*2+dz])
                    if (doorInd >= 0 && doorInd < 60) {
                        // ChatLib.chat(`Added entrance door to ${x*2+dx}, ${z*2+dz}`)
                        this.addDoor(new Door(worldX+dxWorld, worldZ+dzWorld, x*2+dx, z*2+dz).setType(DoorTypes.ENTRANCE))
                    }
                    continue
                }
                
                // This room extends out in this direction. The roof heights match
                if (roofHeightBlock.type.getID() == 0 || aboveBlock.type.getID() !== 0) {
                    continue
                }

                let newIndex = hashComponent([x+dx, z+dz])
                if (newIndex < 0 || newIndex > 35) {
                    // ChatLib.chat(`&4&lInvalid index found! ${x}, ${z} -> ${x+dx}, ${z+dz}`)
                    continue
                }

                // There is already a room out here
                if (!this.componentMap[newIndex]) {
                    // ChatLib.chat(`&aExtended ${x}, ${z} out to ${x+dx}, ${z+dz}`)
                    this.addComponentToRoom(room, [x+dx, z+dz])
                    continue
                }

                let existing = this.componentMap[newIndex]
                if (existing.type == RoomTypes.ENTRANCE || existing == room) {
                    continue
                }
                // ChatLib.chat(`Merging ${existing.name} ${JSON.stringify(existing.components)} with ${room.name} ${JSON.stringify(room.components)}`)
                this.mergeRooms(existing, room)
                room = existing
                
            }
        }

        // Filter out all of the indicides which were deleted. Doing it like this is faster since we know that toDelete are all ordered, so once we
        // get to one element in that array, we never have to check the ones behind it
        const temp = []
        let deleteInd = 0
        for (let i = 0; i < this.scanCoords.length; i++) {
            if (toDelete[deleteInd] == i) {
                deleteInd++
                continue
            }
            temp.push(this.scanCoords[i])
        }

        // Update the list
        this.scanCoords = temp

        this.secrets = this.rooms.reduce((a, b) => a + b.secrets, 0)
        this.crypts = this.rooms.reduce((a, b) => a + b.crypts, 0)

        // Dungeon is fully scanned
        if (!this.scanCoords.length) {
            this.fullyScanned = true

            let [mX, mZ] = Dungeon.dungeonDimensions
            // Remove out of bounds rooms
            for (let i = 0; i < this.rooms.length; i++) {
                let hasInvalid = this.rooms[i].components.some(a => a[0] > mX || a[1] > mZ)
                if (hasInvalid) {
                    this.removeRoom(this.rooms[i])
                }
            }
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

        for (let entry of this.getScanCoords()) {
            let { x, z, worldX, worldZ } = entry

            // Room
            if (!(x%2 || z%2)) {
                let room = this.getRoomWithComponent([x/2, z/2])
                if (!room) {
                    roomStr += "999"
                    continue
                }
                if (room.roomID == null) {
                    roomStr += "998"
                    continue
                }
                let roomID = room.roomID
                roomStr += `${"0".repeat(3 - roomID.toString().length)}${roomID}`
                continue
            }

            // Door
            let door = this.getDoorWithComponent([x, z])
            if (!door) {
                doorStr += "9"
                continue
            }
            doorStr += door.type.toString()
        }

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
        if (!entrance) {
            // ChatLib.chat(`Could not get entrance!`)
            return
        }

        entrance.explored = true

        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        
        // Reset doors and rooms from previous scans to prevent duplicates
        for (let i = 0; i < this.rooms.length; i++) {
            this.rooms[i].doors = []
            this.rooms[i].children = []
            this.rooms[i].parent = null  
        }
        for (let i = 0; i < this.doors.length; i++) {
            this.doors[i].childRoom = null
            this.doors[i].parentRoom = null

        }

        this.calcMapScore()

        const queue = [entrance]
        const visited = new Set()
        const depthMap = new Map([[entrance, 0]])

        while (queue.length) {
            let room = queue.pop()
            if (visited.has(room)) continue
            visited.add(room)

            // ChatLib.chat(`Curr: ${room}`)

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
                    // if (!newRoom) ChatLib.chat(`No room at ${cz}, ${cz} => ${cx+dx}, ${cz+dz}`)
                    if (!newRoom || visited.has(newRoom)) return

                    // ChatLib.chat(`${room.name} => ${newRoom.name}`)

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

        // ChatLib.chat("wow!")
    }

    calcMapScore() {
        this.mapScore = this.rooms.reduce((a, b) => a + b.getRoomScore(), 0)
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