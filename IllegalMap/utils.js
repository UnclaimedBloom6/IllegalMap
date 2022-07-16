import { BlockPoss, getBlock, isBetween, TileEntityChest } from "../BloomCore/Utils/Utils"
import PogObject from "../PogData"
import Config from "./data/Config"

export const prefix = "&8[&bMap&8]"
export const dmapData = new PogObject("IllegalMap", {
    "firstTime": true,
    "uuid": null,
    "map": {
        "x": 0,
        "y": 0,
        "scale": 1,
        "headScale": 1,
        "checkScale": 1
    },
    "dungeonInfo": {
        "x": 0,
        "y": 0,
        "scale": 1
    },
    "border": {
        "scale": 1,
        "rgbSpeed": 1
    }
}, "data/data.json")

export const defaultMapSize = [138, 138]

export const roomSize = 31
export const startCoords = [-200, -200]
export const minCoords = [
    startCoords[0] + Math.floor(roomSize/2),
    startCoords[1] + Math.floor(roomSize/2)
]
export const maxCoords = [
    startCoords[0] + Math.floor(roomSize/2) + roomSize*5 + 5,
    startCoords[1] + Math.floor(roomSize/2) + roomSize*5 + 5
]

export const getHighestBlock = (x, z) => {
    for (let y = 255; y > 0; y--) {
        if (World.getBlockAt(x, y, z)?.type?.getID() !== 0) return y
    }
    return null
}

/**
 * Sets the block state of the block at a set of coordinates to the default state of the string given.
 * @param {String} block 
 * @param {Number[]} coords 
 * @returns 
 */
 export const setBlock = (block, [x, y, z]) => {
    const b = getBlock(block)
    if (!b) return
    World.getWorld().func_175656_a(new BlockPoss(x, y, z), b.func_176223_P())
}

// Gets the real coordinates of the center of a room.
// If includeDoors is set to true, it will get the coord of the closest door or room.
export const getRealCoords = ([x, z], includeDoors=true) => {
    if (includeDoors) return [
        MathLib.map(x, 0, 10, minCoords[0], maxCoords[0]),
        MathLib.map(z, 0, 10, minCoords[1], maxCoords[1])
    ]
    return [
        MathLib.map(x, 0, 5, minCoords[0], maxCoords[0]),
        MathLib.map(z, 0, 5, minCoords[1], maxCoords[1])
    ]
}
// Maps real coords to 0-10
export const getGridCoords = ([x, z], includeDoors=true) => {
    if (includeDoors) return [
        MathLib.map(x, minCoords[0], maxCoords[0], 0, 10),
        MathLib.map(z, minCoords[1], maxCoords[1], 0, 10)
    ]
    return [
        MathLib.map(x, minCoords[0], maxCoords[0], 0, 5),
        MathLib.map(z, minCoords[1], maxCoords[1], 0, 5)
    ]
}
const blacklisted = [5, 54]
export const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) // From https://stackoverflow.com/a/15710692/15767968
export const getCore = (x, z) => hashCode(Array.from(Array(129).keys()).reverse().map(y => World.getBlockAt(x, y+12, z).type.getID()).filter(a => !blacklisted.includes(a)).join(""))
export const getClosestRoomCore = ([x, z]) => getRealCoords(getGridCoords([x, z]))
export const getRoomsFile = () => JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))

export const chunkLoaded = ([x, y, z]) => World.getWorld().func_175726_f(new BlockPoss(x, y, z)).func_177410_o()

export const getRoomFromFile = (core) => {
    const rooms = getRoomsFile().rooms
    if (!core || !rooms) return null
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].cores.includes(core)) return rooms[i]
    }
    return null
}

export const findConnectedRooms = ([ix, y, iz]) => {
    let queue = []
    let visited = []
    let connected = []
    
    const wasVisited = ([x, z]) => visited.some(a => a[0] == x && a[1] == z)
    // Prevents extended entrance
    const checkAndAdd = (x, z) => {
        if (!World.getBlockAt(x, y, z)?.type?.getID() || !isBetween(x, -200, -10) || !isBetween(z, -200, -10)) return
        if (![0, 41].includes(World.getBlockAt(x, y+1, z)?.type?.getID())) return
        queue.push([x, z])
    }
    
    queue.push([ix, iz])
    while (queue.length) {
        let [x, z] = queue.shift()
        if (wasVisited([x, z])) continue
        visited.push([x, z])
        connected.push([x, z])
        if (World.getBlockAt(x+Math.ceil(roomSize/2), y, z).type.getID()) checkAndAdd(x+roomSize+1, z)
        if (World.getBlockAt(x-Math.ceil(roomSize/2), y, z).type.getID()) checkAndAdd(x-roomSize-1, z)
        if (World.getBlockAt(x, y, z+Math.ceil(roomSize/2)).type.getID()) checkAndAdd(x, z+roomSize+1)
        if (World.getBlockAt(x, y, z-Math.ceil(roomSize/2)).type.getID()) checkAndAdd(x, z-roomSize-1)
    }
    return connected.map(a => getGridCoords([...a], true))
}

const ll = 128/23
export const getRoomPosition = (x, y) => [ll*1.5 + (ll*4*x), ll*1.5 + (ll*4*y)]

export const getRoomShape = (components) => {
    if (!components || !components.length || components.length > 4) return "Unknown"
    if (components.length == 4) return "2x2"
    if (components.length == 1) return "1x1"
    if (components.length == 2) return "1x2"
    if (new Set(components.map(a => a[0])).size == components.length || new Set(components.map(a => a[1])).size == components.length) return "1x3"
    return "L"
}

export const defaultMapImage = new Image("DefaultMap.png", "https://i.imgur.com/vDIoq1B.png")
export const greenCheck = new Image("BloomMapGreenCheck.png", "https://i.imgur.com/GQfTfmp.png")
export const whiteCheck = new Image("BloomMapWhiteCheck.png", "https://i.imgur.com/9cZ28bJ.png")
export const failedRoom = new Image("BloomMapFailedRoom.png", "https://i.imgur.com/qAb4O9H.png")
export const questionMark = new Image("BloomMapQuestionMark.png", "https://i.imgur.com/kp92Inw.png")

export const BlueMarker = new Image("BlueMarker.png", "https://i.imgur.com/J1I7muZ.png")
export const GreenMarker = new Image("GreenMarker.png", "https://i.imgur.com/DAW5XyI.png")

// Vanilla Checkmarks
export const greenCheckVanilla = new Image("greenCheckVanilla.png", "https://i.imgur.com/h2WM1LO.png")
export const whiteCheckVanilla = new Image("whiteCheckVanilla.png", "https://i.imgur.com/hwEAcnI.png")
export const failedRoomVanilla = new Image("failedRoomVanilla.png", "https://i.imgur.com/WqW69z3.png")
export const questionMarkVanilla = new Image("questionMarkVanillaa.png", "https://i.imgur.com/1jyxH9I.png")

export const getCheckmarks = () => {
    if (!Config.checkmarkStyle) return {
        "green": greenCheck,
        "white": whiteCheck,
        "failed": failedRoom,
        "unexplored": questionMark
    }
    else return {
        "green": greenCheckVanilla,
        "white": whiteCheckVanilla,
        "failed": failedRoomVanilla,
        "unexplored": questionMarkVanilla
    }
}
export const getColoredName = (roomName) => {
    let rooms = getRoomsFile().rooms
    let keys = {
        "puzzle": "&d",
        "yellow": "&e",
        "trap": "&6",
        "blood": "&4",
        "fairy": "&d",
        "entrance": "&2"
    }
    for (let r of rooms) {
        if (r.name == roomName && Object.keys(keys).includes(r.type)) return `${keys[r.type]}${roomName}`
    }
    return roomName
}

// LcarusPhantom code
let red = 1
let green = 0
let blue = 0
let lastRgb = null
const rgb = () => {
    if (red >= 1) {
        if (blue > 0) blue = blue - 0.05
        else green = green + 0.05
        if (green >= 1) {
            green = 1
            red = red - 0.05
        }
    }
    else if (green >= 1.0) {
        if (red > 0) red = red - 0.05
        else blue = blue + 0.05
        if (blue >= 1) {
            blue = 1
            green = green - 0.05
        }
    }
    else if (blue >= 1) {
        if (green > 0) green = green - 0.05
        else red = red + 0.05
        if (red >= 1) {
            red = 1
            blue = blue - 0.05
        }
    }
}

register("step", () => {
    const d = new Date().getTime()
    if (Config.mapBorder !== 1 || d - lastRgb < 100/dmapData.border.rgbSpeed)
    rgb()
    lastRgb = d
})

export const getRgb = () => [red, green, blue]

export const getTrappedChests = () => World.getWorld().field_147482_g.filter(e => e instanceof TileEntityChest && e.func_145980_j() == 1).map(e => [e.func_174877_v().func_177958_n(), e.func_174877_v().func_177956_o(), e.func_174877_v().func_177952_p()])