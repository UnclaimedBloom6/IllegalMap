import Dungeon from "../BloomCore/dungeons/Dungeon"
import { Blockk, BlockPoss, getBlock, isBetween, TileEntityChest } from "../BloomCore/utils/Utils"
import PogObject from "../PogData/index"
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

export const getBlock = (block) => Blockk.func_149684_b("minecraft:" + block.replace("minecraft:", ""))

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
/**
 * Maps real world coordinates to values of 0-10 or 0-5 if includeDoors is false.
 * The mapped numbers correspond to where a room is in relation to the other ones. For example a room at 0,0 would be
 * at the top left of the map, whereas one at 5,5 would be at the bottom right.
 * includeDoors means that the four doors which can spawn between the six rooms on each column/row are also counted.
 * @param {Number[]} realCoords 
 * @param {Boolean} includeDoors 
 * @returns 
 */
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
export const splitCoord = (str) => str.split(",").map(a => parseFloat(a))

/**
 * Gets the room data from the core of the room
 * @param {Number} core 
 * @returns {Object|null}
 */
export const getRoomDataFromCore = (core) => getRoomsFile().rooms.find(a => a.cores.includes(core)) ?? null

/**
 * Gets the room data from the room name
 * @param {String} roomName 
 * @returns {Object|null}
 */
export const getRoomDataFromName = (roomName) => getRoomsFile().rooms.find(a => a.name.toLowerCase() == roomName.toLowerCase()) ?? null

export const findConnectedRooms = ([ix, y, iz]) => {
    let queue = []
    let visited = []
    let connected = []
    let isLoaded = true
    
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
    return connected.map(a => getGridCoords([...a], false))
}

const ll = 128/23
// Returns the x,y coordinates where the room is on the rendered map.
// Don't ask me what these numbers mean, I don't know anymore.
export const getRoomPosition = (x, y) => [ll*1.5 + (ll*8*x), ll*1.5 + (ll*8*y)]

export const getRoomShape = (components) => {
    if (!components || !components.length || components.length > 4) return "Unknown"
    else if (components.length == 4) {
        if (new Set(components.map(a => a[0])).size == 1 || new Set(components.map(a => a[1])).size == 1) return "1x4"
        else return "2x2"
    }
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

export const BlueMarker = new Image("blueMarker.png", "../BloomCore/assets/blueMarker.png")
export const GreenMarker = new Image("greenMarker.png", "../BloomCore/assets/greenMarker.png")

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

// IcarusPhantom code
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

/**
 * Gets the [x, y, z] of every trapped chest in the world.
 * @returns {Number[][]}
 */
export const getTrappedChests = () => World.getWorld().field_147482_g.filter(e => e instanceof TileEntityChest && e.func_145980_j() == 1).map(e => [e.func_174877_v().func_177958_n(), e.func_174877_v().func_177956_o(), e.func_174877_v().func_177952_p()])

export const findAllConnected = (mapColors, searchColor, [roomX, roomY]) => {
    let checked = []
    const wasVisited = ([x, y]) => checked.some(a => a[0] == x && a[1] == y)
    let [ox, oy] = [Math.floor(Dungeon.mapRoomSize/3), Dungeon.mapRoomSize/2+1]
    let queue = []
    let components = []
    queue.push([roomX, roomY])
    while (queue.length) {
        let [rx, ry] = queue.shift()
        let [cx, cy] = [
            Math.floor((rx-Dungeon.mapCorner[0]-Dungeon.mapRoomSize/2)/Dungeon.mapGapSize),
            Math.floor((ry-Dungeon.mapCorner[1]-Dungeon.mapRoomSize/2)/Dungeon.mapGapSize)
        ]
        if (wasVisited([cx, cy])) continue
        // Renderer.drawRect(Renderer.YELLOW, rx-1, ry-1, 3, 3)
        components.push([cx, cy])
        checked.push([cx, cy])
        ;[
            [[ox, -oy-2], [0, -Dungeon.mapGapSize]],
            [[-oy-1, -ox], [-Dungeon.mapGapSize, 0]],
            [[-ox, oy-1], [0, Dungeon.mapGapSize]],
            [[oy, ox], [Dungeon.mapGapSize, 0]]
        ].forEach(a => {
            let [nx, ny] = a[0]
            nx += rx
            ny += ry
            let color = mapColors[nx + ny*128]
            if (color !== searchColor) return
            // Renderer.drawRect(Renderer.GREEN, nx, ny, 1, 1)
            let [dx, dy] = a[1]
            queue.push([rx+dx, ry+dy])
        })
    }
    return components
}

export const roomColors = {
    30: "entrance",
    66: "puzzle",
    82: "fairy",
    18: "blood",
    62: "trap",
    74: "yellow",
    63: "normal",
    85: "unexplored"
}