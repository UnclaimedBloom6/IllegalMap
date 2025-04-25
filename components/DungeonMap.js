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

        /** @type {Door[]} */
        this.witherDoors = [] // An ordered list of Wither Doors in the dungeon from Entrance to Blood (incl entrance and blood doors)

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

        if (room2.foundSecrets > 0) {
            room1.foundSecrets = room2.foundSecrets
        }

        if (room2.hasMimic) {
            room2.hasMimic = true
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
        if (component[0] < 0 || component[1] < 0 || component[0] > 11 || component[1] > 11) {
            return null
        }

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
        for (let door of childRoom.doors) {

            if (parentRoom.doors.includes(door)) {
                return door
            }
        }

        return null
        // for (let door of this.doors) {
        //     if ((door.childRoom !== childRoom || door.parentRoom !== parentRoom) && (door.childRoom !== parentRoom || door.parentRoom !== childRoom)) continue
        //     return door
        // }
        // return null
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
        if (component[0] < 0 || component[1] < 0 || component[0] > 5 || component[1] > 5) {
            return  null
        }

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

            toDelete.push(i)
            
            let roofHeight = getHighestBlock(worldX, worldZ)

            // There is nothing here
            if (!roofHeight) {
                continue
            }
            
            // Door logic
            if (x%2 == 1 || z%2 == 1) {
                // ChatLib.chat(`&2Checking door component ${x}, ${z}`)
                // Entrance with no gap
                const block = World.getBlockAt(worldX, 69, worldZ)
    
                if (block.type.getRegistryName() == "minecraft:monster_egg") {
                    let door = new Door(worldX, worldZ, x, z)
                    door.type = DoorTypes.ENTRANCE
                    door.opened = false
    
                    this.addDoor(door)
                    continue
                }
    
                // Normal Door
                if (roofHeight < 85) {
                    let door = new Door(worldX, worldZ, x, z)
    
                    if (z%2 == 1) door.rotation = 0
                    door.opened = block.type.getID() == 0
    
                    this.addDoor(door)
                    continue
                }
    
                // No gap entrance door which has already been opened
                if (this.isDoorComponentNextToEntrance(x, z) && World.getBlockAt(worldX, 76, worldZ).type.getID() !== 0) {
                    let door = new Door(worldX, worldZ, x, z).setType(DoorTypes.ENTRANCE)
                    door.opened = block.type.getID() == 0
                    this.addDoor(door)
                }
    
                if (x % 2 == 0 && z > 0 && z < 11) {
                    let topRoom = this.getRoomWithComponent([x/2, (z-1)/2])
                    let bottomRoom = this.getRoomWithComponent([x/2, (z+1)/2])
    
                    if (topRoom && bottomRoom && topRoom !== bottomRoom && topRoom.roofHeight == bottomRoom.roofHeight && roofHeight == topRoom.roofHeight) {
                        // ChatLib.chat(`&dMerging ${topRoom.getName()} and ${bottomRoom.getName()}`)
                        this.mergeRooms(topRoom, bottomRoom)
                    }
                }
    
                if (z % 2 == 0 && x > 0 && x < 11) {
                    let leftRoom = this.getRoomWithComponent([(x-1)/2, z/2])
                    let rightRoom = this.getRoomWithComponent([(x+1)/2, z/2])
    
                    if (leftRoom && rightRoom && leftRoom !== rightRoom && leftRoom.roofHeight == rightRoom.roofHeight && roofHeight == leftRoom.roofHeight) {
                        // ChatLib.chat(`&dMerging ${leftRoom.getName()} and ${rightRoom.getName()}`)
                        this.mergeRooms(leftRoom, rightRoom)
                    }
                }
    
                continue
            }

            // Room
            x >>= 1
            z >>= 1


            let room = this.getRoomWithComponent([x, z])
            if (!room) {
                room = new Room([[x, z]], roofHeight)
                room.scanAndLoad()
                // ChatLib.chat(`Created room ${room.getName()} at ${x}, ${z}`)
                this.addRoom(room)
            }

            // Try to extend this room out or look for doors
            for (let dir of directions) {
                // break
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

                let newIndex = hashComponent([x+dx, z+dz])
                // Bounds Check
                if (newIndex < 0 || newIndex > 35) {
                    continue
                }

                let existing = this.getRoomWithComponent([x+dx, z+dz])

                if (existing == room) {
                    continue
                }

                // Valid extension
                if (roofHeightBlock.type.getID() !== 0 && aboveBlock.type.getID() == 0) {
                    // Merge with the existing room
                    if (existing) {
                        // ChatLib.chat(`Merged rooms ${room.getName()} (${room.components}) and ${existing.getName()} (${existing.components})`)
                        // Don't merge entrance
                        if (room.name == "Entrance" || existing.name == "Entrance") {
                            continue
                        }

                        this.mergeRooms(room, existing)
                        // ChatLib.chat(`&7After MERGE: ${room.components}`)
                    }
                    // Or add a new component
                    else {
                        // ChatLib.chat(`Extended ${room.getName()} out to ${x+dx}, ${z+dz}`)
                        this.addComponentToRoom(room, [x+dx, z+dz])
                        // ChatLib.chat(`&7After EXTENSION: ${room.components}`)
                    }

                    continue
                }

                // Invalid Extension

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

            let [maxX, maxZ] = Dungeon.dungeonDimensions
            // Remove out of bounds rooms
            for (let i = 0; i < this.rooms.length; i++) {
                let hasInvalid = this.rooms[i].components.some(a => a[0] > maxX || a[1] > maxZ)
                if (hasInvalid) {
                    this.removeRoom(this.rooms[i])
                }
            }
        }

        if (Config().scanSetupTree || Config().witherDoorEsp) this.setupTree()

    }

    isDoorComponentNextToEntrance(x, z) {
        if (x % 2 == 0) {
            if (this.getRoomWithComponent([x / 2, (z - 1) / 2])?.type == RoomTypes.ENTRANCE) {
                return true
            }
            if (this.getRoomWithComponent([x / 2, (z + 1) / 2])?.type == RoomTypes.ENTRANCE) {
                return true
            }
        }

        if (this.getRoomWithComponent([(x - 1) / 2, z / 2])?.type == RoomTypes.ENTRANCE) {
            return true
        }
        if (this.getRoomWithComponent([(x + 1) / 2, z / 2])?.type == RoomTypes.ENTRANCE) {
            return true
        }

        return false
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

    setupTree() {
        const startRoom = this.getRoomFromName("Entrance")
        if (!startRoom) {
            return
        }

        const queue = [startRoom] // Room[]
        const visited = new Set() // Set<Room>
        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]

        this.witherDoors = []
        this.mapScore = 0

        while (queue.length) {
            let curr = queue.pop()

            if (visited.has(curr)) {
                continue
            }

            visited.add(curr)
            curr.children = []
            curr.doors = []

            this.mapScore += curr.getRoomScore()

            for (let component of curr.components) {
                let [x, z] = component

                for (let dir of directions) {
                    let [dx, dz] = dir

                    let door = this.getDoorWithComponent([x*2+dx, z*2+dz])
                    if (!door) {
                        continue
                    }
                    
                    curr.doors.push(door)
                    
                    let room = this.getRoomWithComponent([x+dx, z+dz])
                    if (!room || room == curr || room == curr.parent) {
                        continue
                    }

                    if (door.type == DoorTypes.ENTRANCE || door.type == DoorTypes.WITHER || door.type == DoorTypes.BLOOD) {
                        this.witherDoors.push(door)
                    }

                    door.childRoom = room
                    door.parentRoom = curr
                    
                    room.parent = curr
                    curr.children.push(room)

                    // Set door rotation
                    if (dz == -1) {
                        door.rotation = 0
                    }
                    else if (dx == 1) {
                        door.rotation = 90
                    }
                    else if (dz == 1) {
                        door.rotation = 180
                    }
                    else if (dx == -1) {
                        door.rotation = 270
                    }

                    queue.push(room)
                }

            }
        }

        // ChatLib.chat("\n\n\n\n\n\n\n\n")

        // for (let room of this.rooms) {
        //     ChatLib.chat(`\n${room.getName()}`)
        //     ChatLib.chat(`=> Parent:`)
        //     ChatLib.chat(`    ${room.parent?.getName()}`)
        //     ChatLib.chat(`=> Children:`)
        //     for (let child of room.children) {
        //         ChatLib.chat(`    ${child.getName()}`)
        //     }
        // }

        // Make sure that all of the door types between the blood room and the entrance room are correct
        const bloodRoom = this.getRoomFromName("Blood")
        if (bloodRoom) {
            // this.witherDoors = []
            let curr = bloodRoom
            let iters = 0
            while (curr.parent !== null) {
                if (iters++ > 100) {
                    ChatLib.chat(`&c&lInfinite loop in setting up tree!`)
                    break
                }
                let parent = curr.parent
                let door = this.getDoorBetweenRooms(curr, parent)

                // This shouldn't be able to happen
                if (!door) {
                    break
                }

                // ChatLib.chat(`${curr.getName()} -> ${door.gx}, ${door.gz}`)

                // Set the door type
                if (curr.type == RoomTypes.BLOOD) {
                    door.setType(DoorTypes.BLOOD)
                }
                else if (parent.type == RoomTypes.ENTRANCE) {
                    door.setType(DoorTypes.ENTRANCE)
                }
                else {
                    door.setType(DoorTypes.WITHER)
                }

                // this.witherDoors.push(door)

                curr = parent
            }

            // this.witherDoors.reverse()
        }

        // for (let room of visited) {
        //     ChatLib.chat(`${room.getName(true)} Doors: ${room.doors.length}`)
        //     for (let child of room.children) {
        //         ChatLib.chat(`${room.getName(true)} -> ${child.getName(true)}`)
        //     }
        // }

    }

    // /**
    //  * Searches through the dungeon starting from the entrance room to turn the rooms
    //  * and doors into a graph so that it can be traversed easily.
    //  * @returns 
    //  */
    // setupTree() {

    //     // TODO: Optimize this.
        
    //     // let started = Date.now()
    //     let entrance = this.getRoomFromName("Entrance")
    //     if (!entrance) {
    //         // ChatLib.chat(`Could not get entrance!`)
    //         return
    //     }

    //     entrance.explored = true

    //     const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        
    //     // Reset doors and rooms from previous scans to prevent duplicates
    //     for (let i = 0; i < this.rooms.length; i++) {
    //         this.rooms[i].doors = []
    //         this.rooms[i].children = []
    //         this.rooms[i].parent = null  
    //     }
    //     for (let i = 0; i < this.doors.length; i++) {
    //         this.doors[i].childRoom = null
    //         this.doors[i].parentRoom = null

    //     }

    //     this.calcMapScore()

    //     const queue = [entrance]
    //     const visited = new Set()
    //     const depthMap = new Map([[entrance, 0]])

    //     while (queue.length) {
    //         let room = queue.pop()
    //         if (visited.has(room)) continue
    //         visited.add(room)

    //         // ChatLib.chat(`Curr: ${room}`)

    //         // Room score shit
    //         let depth = depthMap.get(room)
    //         // let roomScore = room.getRoomScore()
    //         // this.mapScore += roomScore

    //         // Branch off to the doors from the rest of the components
    //         room.components.forEach(([cx, cz]) => {
    //             directions.forEach(([dx, dz]) => {
    //                 let [nx, nz] = [cx*2+dx, cz*2+dz]
    //                 let door = this.getDoorWithComponent([nx, nz])
    //                 if (!door) return
    //                 room.doors.push(door)
    //                 // Check for room on the other side of door
    //                 let newRoom = this.getRoomWithComponent([cx+dx, cz+dz])
    //                 // if (!newRoom) ChatLib.chat(`No room at ${cz}, ${cz} => ${cx+dx}, ${cz+dz}`)
    //                 if (!newRoom || visited.has(newRoom)) return

    //                 // ChatLib.chat(`${room.name} => ${newRoom.name}`)

    //                 door.childRoom = newRoom
    //                 door.parentRoom = room
    //                 newRoom.parent = room
    //                 room.children.push(newRoom)

    //                 queue.push(newRoom)
    //                 depthMap.set(newRoom, depth+1)
    //             })
    //         })
    //     }
        
    //     // Fill in missing doors if the wither/entrance/blood doors have already been opened.
    //     const bloodRoute = this.getRoomsTo(this.getRoomFromName("Entrance"), this.getRoomFromName("Blood"), true)
    //     if (!bloodRoute) return
    //     bloodRoute.forEach((thing, i) => {
    //         if (!(thing instanceof Door) || thing.type !== DoorTypes.NORMAL) return
    //         thing.type = DoorTypes.WITHER
    //         thing.opened = false

    //         // Door directly after Entrance
    //         if (i > 0) {
    //             let lastRoom = bloodRoute[i-1]
    //             if (lastRoom instanceof Room && lastRoom.type == RoomTypes.ENTRANCE) {
    //                 thing.type = DoorTypes.ENTRANCE
    //             }
    //         }
    //         // Door right before blood room
    //         if (i == bloodRoute.length-2) {
    //             let nextRoom = bloodRoute[i+1]
    //             if (nextRoom instanceof Room && nextRoom.type == RoomTypes.BLOOD) {
    //                 thing.type = DoorTypes.BLOOD
    //             }
    //         }
    //     })

    //     // ChatLib.chat("wow!")
    // }

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
        if (!endRoom || !startRoom) {
            return null
        }

        const startList = []
        const endList = []

        let startCurr = startRoom
        let endCurr = endRoom

        while (startCurr !== null) {
            startList.push(startCurr)

            if (startCurr == endRoom) {
                return startList
            }

            startCurr = startCurr.parent
        }

        while (endCurr !== null) {
            endList.push(endCurr)

            if (endCurr == startRoom) {
                endList.reverse()
                return endList
            }

            endCurr = endCurr.parent
        }

        // ChatLib.chat(`\nstartList: ${startList.map(a => a.getName()).join("\n")}`)
        // ChatLib.chat(`\nendList: ${endList.map(a => a.getName()).join("\n")}`)

        // Intersection of both paths
        let lastPopped = startList[startList.length - 1]
        while (startList[startList.length - 1] == endList[endList.length - 1]) {
            lastPopped = startList.pop()
            endList.pop()
        }

        endList.push(lastPopped)

        // ChatLib.chat(`\nPOST startList: ${startList.map(a => a.getName()).join("\n")}`)
        // ChatLib.chat(`\nPOST endList: ${endList.map(a => a.getName()).join("\n")}`)

        // Remove duplicate from the end and reverse it to make it go the right direction
        // endList.pop()
        endList.reverse()

        const final = startList.concat(endList)

        // Insert doors
        if (includeDoors) {
            const finalDoors = []
            finalDoors.push(final[final.length - 1])
            for (let i = 1; i < final.length; i++) {
                finalDoors.push(this.getDoorBetweenRooms(final[i-1], final[i]))
                finalDoors.push(final[i])
            }

            return finalDoors
        }

        return final
    }

    /**
     * Gets the chain of rooms (And doors) between two coordinates.
     * @param {number} x0 
     * @param {number} z0 
     * @param {number} x1 
     * @param {number} z1 
     * @param {boolean} includeDoors 
     * @returns 
     */
    getRoomsBetween(x0, z0, x1, z1, includeDoors=false) {
        return this.getRoomsTo(
            this.getRoomAt(x0, z0),
            this.getRoomAt(x1, z1)),
            includeDoors
    }
}