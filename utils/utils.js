import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { Blockk, BlockPoss, Color, getBlock, isBetween, TileEntityChest } from "../../BloomCore/utils/Utils"
import PogObject from "../../PogData/index"
import request from "../../requestV2"
import Config from "./Config"

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
        "rgbSpeed": 10000
    },
    "lastLogServer": null,
    "lastLogServerNew": null
}, "data/data.json")

// mapCellSize is the small square component which makes up the whole map. A 1x1 room consists of 3x3 of them, a door is a single one,
// the padding between the map and the border is one mapCellSize etc.
export const mapCellSize = 5
export const defaultMapSize = [125, 125] // cell size * (23 for the map cells + 2 for the border each side)
export let roomsJson = JSON.parse(FileLib.read("IllegalMap", "utils/rooms.json"))
// Room data indexed by their roomIDs
export const RoomMap = new Map(roomsJson.map(a => [a.roomID, a]))

export const peekKey = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "IllegalMap")

export const leapNames = ["Spirit Leap", "Infinileap", "Haunt"]

// Fetch the rooms.json file from the github repo in case rooms were added or modified
if (Config().autoFetchRoomsFromGithub) {
    request({url: "https://raw.githubusercontent.com/UnclaimedBloom6/IllegalMap/main/utils/rooms.json", json: true}).then(data => {
        roomsJson = data
        RoomMap.clear()
        for (let roomData of roomsJson) {
            RoomMap.set(roomData.roomID, roomData)
        }

        FileLib.write("IllegalMap", "utils/rooms.json", JSON.stringify(roomsJson, null, 4))
    })
}

/**
 * Starting from the map position, finds the coordinate to get to the x/y on the map. Eg 0, 0 would
 * render at the center of the top left room and so on.
 * @param {Number} x - Component x
 * @param {Number} y - Component y
 * @returns 
 */
export const getRoomPosition = (x, y) => {
    return [
        mapCellSize*2.5 + x*mapCellSize*4,
        mapCellSize*2.5 + y*mapCellSize*4
    ]
}

export const dungeonCorners = {
    start: [-200, -200],
    end: [-10, -10]
}

export const dungeonRoomSize = 31
export const dungeonDoorSize = 1
export const roomDoorCombinedSize = dungeonRoomSize + dungeonDoorSize
export const halfRoomSize = Math.floor(dungeonRoomSize/2)
export const halfCombinedSize = Math.floor(roomDoorCombinedSize/2)

export const playerInfoCache = {} // {"unclaimedbloom6": {name: "UnclaimedBloom6", uuid: "307005e7f...", head: Image}}

export const DoorTypes = {
    NORMAL: 0,
    WITHER: 1,
    BLOOD: 2,
    ENTRANCE: 3
}

export const ClearTypes = {
    MOB: 0,
    MINIBOSS: 1
}

export const Checkmark = {
    NONE: 0,
    WHITE: 1,
    GREEN: 2,
    FAILED: 3,
    UNEXPLORED: 4
}

export const getHighestBlock = (x, z) => {
    for (let y = 255; y > 0; y--) {
        let id = World.getBlockAt(x, y, z)?.type?.getID()
        // Ignore gold blocks too because of Gold room with a random ass gold block on the roof sometimes.
        if (id == 0 || id == 41) continue
        return y
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

/**
 * 
 * @param {[Number, Number]} component 
 * @param {Boolean} isIncludingDoors - Map the coordinates based on a 0-10 grid instead of 0-5
 */
export const componentToRealCoords = ([x, z], isIncludingDoors=false) => {
    const [x0, z0] = dungeonCorners.start
    if (isIncludingDoors) return [
        x0 + halfRoomSize + halfCombinedSize * x,
        z0 + halfRoomSize + halfCombinedSize * z,
    ]
    return [
        x0 + halfRoomSize + roomDoorCombinedSize * x,
        z0 + halfRoomSize + roomDoorCombinedSize * z,
    ]
}

/**
 * 
 * @param {[Number, Number]} coord - Real world x, z coordinate
 * @param {Boolean} isIncludingDoors - Map the coordinates based on a 0-10 grid instead of 0-5
 */
export const realCoordToComponent = ([x, z], isIncludingDoors=false) => {
    const [x0, z0] = dungeonCorners.start
    
    let componentSize = isIncludingDoors ? halfCombinedSize : roomDoorCombinedSize

    return [
        Math.floor((x - x0 + 0.5) / componentSize),
        Math.floor((z - z0 + 0.5) / componentSize)
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
const blacklisted = [
    101,    // Iron Bars
    54,     // Chest
]
export const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) // From https://stackoverflow.com/a/15710692/15767968
export const getCore = (x, z) => {
    let blockIds = ""
    for (let y = 140; y >= 12; y--) {
        let block = World.getBlockAt(x, y, z)
        // Blacklisted blocks should just be counted as air.
        if (blacklisted.includes(block.type.getID())) {
            blockIds += "0"
            continue
        }

        blockIds += block.type.getID()
    }

    return hashCode(blockIds)
}
export const getClosestRoomCore = ([x, z]) => getRealCoords(getGridCoords([x, z]))
export const getRoomsFile = () => JSON.parse(FileLib.read("IllegalMap", "utils/rooms.json"))

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

// Used when editing map location outside of dungeon
export const defaultMapImage = new Image("DefaultMap.png", "./assets/defaultMap.png")

// Map Markers
export const BlueMarker = new Image("blueMarker.png", "../BloomCore/assets/blueMarker.png")
export const GreenMarker = new Image("greenMarker.png", "../BloomCore/assets/greenMarker.png")

// Default Checkmarks
export const greenCheck = new Image("greenCheck.png", "./assets/greenCheck.png")
export const whiteCheck = new Image("whiteCheck.png", "./assets/whiteCheck.png")
export const failedRoom = new Image("failedRoom.png", "./assets/failedRoom.png")
export const questionMark = new Image("questionMark.png", "./assets/questionMark.png")

// Vanilla Checkmarks
export const greenCheckVanilla = new Image("greenCheckVanilla.png", "./assets/greenCheckVanilla.png")
export const whiteCheckVanilla = new Image("whiteCheckVanilla.png", "./assets/whiteCheckVanilla.png")
export const failedRoomVanilla = new Image("failedRoomVanilla.png", "./assets/failedRoomVanilla.png")
export const questionMarkVanilla = new Image("questionMarkVanillaa.png", "./assets/questionMarkVanilla.png")

const regularCheckmarks = new Map([
    [Checkmark.GREEN, greenCheck],
    [Checkmark.WHITE, whiteCheck],
    [Checkmark.FAILED, failedRoom],
    [Checkmark.UNEXPLORED, questionMark]
])

const vanillaCheckmarks = new Map([
    [Checkmark.GREEN, greenCheckVanilla],
    [Checkmark.WHITE, whiteCheckVanilla],
    [Checkmark.FAILED, failedRoomVanilla],
    [Checkmark.UNEXPLORED, questionMarkVanilla]
])

export const getCheckmarks = () => {
    if (Config().checkmarkStyle == 0) return regularCheckmarks
    return vanillaCheckmarks
}

export const RoomTypes = {
    NORMAL: 0,
    PUZZLE: 1,
    TRAP: 2,
    YELLOW: 3,
    BLOOD: 4,
    FAIRY: 5,
    RARE: 6,
    ENTRANCE: 7,
    UNKNOWN: 8
}

export const RoomTypesStrings = new Map([
    ["normal", RoomTypes.NORMAL],
    ["puzzle", RoomTypes.PUZZLE],
    ["trap", RoomTypes.TRAP],
    ["yellow", RoomTypes.YELLOW],
    ["blood", RoomTypes.BLOOD],
    ["fairy", RoomTypes.FAIRY],
    ["rare", RoomTypes.RARE],
    ["entrance", RoomTypes.ENTRANCE]
])

export const MapColorToRoomType = new Map([
    [18, RoomTypes.BLOOD],
    [30, RoomTypes.ENTRANCE],
    [63, RoomTypes.NORMAL],
    [82, RoomTypes.FAIRY],
    [62, RoomTypes.TRAP],
    [74, RoomTypes.YELLOW],
    [66, RoomTypes.PUZZLE]
])

export const RoomNameColorKeys = new Map([
    [RoomTypes.PUZZLE, "&d"],
    [RoomTypes.YELLOW, "&e"],
    [RoomTypes.TRAP, "&6"],
    [RoomTypes.BLOOD, "&4"],
    [RoomTypes.FAIRY, "&d"],
    [RoomTypes.ENTRANCE, "&2"],
])

export const RoomColors = new Map([
    [RoomTypes.NORMAL, new Color(107/255, 58/255, 17/255, 1)],
    [RoomTypes.PUZZLE, new Color(117/255, 0/255, 133/255, 1)],
    [RoomTypes.BLOOD, new Color(255/255, 0/255, 0/255, 1)],
    [RoomTypes.TRAP, new Color(216/255, 127/255, 51/255, 1)],
    [RoomTypes.YELLOW, new Color(254/255, 223/255, 0/255, 1)],
    [RoomTypes.FAIRY, new Color(224/255, 0/255, 255/255, 1)],
    [RoomTypes.ENTRANCE, new Color(20/255, 133/255, 0/255, 1)],
    [RoomTypes.RARE, new Color(255/255, 203/255, 89/255, 1)],
    [RoomTypes.UNKNOWN, new Color(255/255, 176/255, 31/255)]
])

// modified version of https://stackoverflow.com/a/54014428
const hslToRgb = (h, s, l) => {
    s /= 100
    l /= 100
    const k = (n) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

let startTime = Date.now()

export const getRgb = () => {
    const elapsedTime = Date.now() - startTime
    const cycleDuration = dmapData.border.rgbSpeed || 10000 // Default duration 10 seconds
    const timeFactor = (elapsedTime % cycleDuration) / cycleDuration
    const hue = timeFactor * 360
    // make config for adjusting saturation and lightness if not lazy
    return hslToRgb(hue, 100, 50)
}

/**
 * Gets the [x, y, z] of every trapped chest in the world.
 * @returns {Number[][]}
 */
export const getTrappedChests = () => World.getWorld().field_147482_g.filter(e => e instanceof TileEntityChest && e.func_145980_j() == 1).map(e => [e.func_174877_v().func_177958_n(), e.func_174877_v().func_177956_o(), e.func_174877_v().func_177952_p()])

/**
 * Starting from the x, y map coordinate, does a flood fill to get all of the components of the room.
 * Eg if the function was called on a 1x3, it would return an array of 3 components, for example [[0, 0], [0, 1], [0, 2]]
 * @param {*} mapColors 
 * @param {*} param1 
 * @returns 
 */
export const findAllConnected = (mapColors, [roomX, roomY]) => {
    let checked = []
    const wasVisited = ([x, y]) => checked.some(a => a[0] == x && a[1] == y)
    
    let [ox, oy] = [Math.floor(Dungeon.mapRoomSize/3), Dungeon.mapRoomSize/2+1]

    // [[spotBetweenRooms], [centerOfNextRoom]]
    const directions = [
        [[ox, -oy-2], [0, -Dungeon.mapGapSize]],
        [[-oy-1, -ox], [-Dungeon.mapGapSize, 0]],
        [[-ox, oy-1], [0, Dungeon.mapGapSize]],
        [[oy, ox], [Dungeon.mapGapSize, 0]]
    ]

    let queue = []
    let components = []
    queue.push([roomX, roomY])
    while (queue.length) {
        let [rx, ry] = queue.shift()
        // Room Component X/Y
        let [cx, cy] = [
            Math.floor((rx-Dungeon.mapCorner[0]-Dungeon.mapRoomSize/2)/Dungeon.mapGapSize),
            Math.floor((ry-Dungeon.mapCorner[1]-Dungeon.mapRoomSize/2)/Dungeon.mapGapSize)
        ]
        if (wasVisited([cx, cy])) continue
        // Renderer.drawRect(Renderer.YELLOW, rx-1, ry-1, 3, 3)
        components.push([cx, cy])
        checked.push([cx, cy])
        directions.forEach(a => {
            let [nx, ny] = a[0]
            nx += rx
            ny += ry
            let color = mapColors[nx + ny*128]
            if (!color) return
            // Renderer.drawRect(Renderer.GREEN, nx, ny, 1, 1)
            let [dx, dy] = a[1]
            queue.push([rx+dx, ry+dy])
        })
    }
    return components
}

/**
 * Draws a rectangle on the buffered image
 * @param {bufferedImage} bufferedImage 
 * @param {Number} x1 
 * @param {Number} y1 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Color} color 
 * @returns 
 */
export const setPixels = (bufferedImage, x1, y1, width, height, color) => {
    if (!color) return
    const g = bufferedImage.getGraphics()
    g.setColor(color)
    g.fillRect(x1, y1, width, height)
    g.dispose()
}

export const clearImage = (bufferedImage) => {
    const g = bufferedImage.getGraphics()
    g.setColor(new Color(0, 0, 0, 0))
    g.drawRect(0, 0, bufferedImage.getWidth(), bufferedImage.getHeight())
    g.dispose()
}

/**
 * - Renders a wrapped like string taking into consideration the previous strings
 * @param {string|string[]} string The string(s) to render
 * @param {number} x
 * @param {number} y
 * @param {number} scale The scale for the string(s)
 * @param {boolean} center Whether to render the string centered (`true` by default)
 * @returns
 */
export const renderWrappedString = (string, x, y, scale, center = true) => {
    string = Array.isArray(string) ? string : (string.split(" ") || [string])

    Renderer.scale(scale)

    // Avoid further processing if it's only 1 length
    if (string.length === 1) {
        let width = center ? Renderer.getStringWidth(string[0]) / 2 : Renderer.getStringWidth(string[0])
        // TODO: maybe add a center check in Y axis ?
        Renderer.drawStringWithShadow(string[0], (x / scale) + -width, (y / scale) + -3)
        Renderer.scale(1 / scale)

        return
    }

    for (let idx = 0; idx < string.length; idx++) {
        let width = center ? Renderer.getStringWidth(string[idx]) / 2 : Renderer.getStringWidth(string[idx])
        Renderer.drawStringWithShadow(string[idx], (x / scale) + -width, (y / scale) + idx === 0 ? 0 : 10 * idx)
    }
    Renderer.scale(1 / scale)
}

export const sendError = (error, fn) => {
    ChatLib.chat(`${prefix} &cCaught an error in method &b#${fn ?? "&7none"}&f: &c${JSON.stringify(error)}`)
    print(`IllegalMap error #${fn ?? "none"}: ${JSON.stringify(error, null, 4)}`)
}

const MCTessellator = Java.type("net.minecraft.client.renderer.Tessellator").func_178181_a()
const DefaultVertexFormats = Java.type("net.minecraft.client.renderer.vertex.DefaultVertexFormats")
const WorldRenderer = MCTessellator.func_178180_c()

export const drawRect = (x, y, width, height, solid = true, lineWidth = null) => {
    if (lineWidth && lineWidth > 0) GL11.glLineWidth(lineWidth)
    WorldRenderer.func_181668_a(solid ? 6 : 2, DefaultVertexFormats.field_181705_e)
    WorldRenderer.func_181662_b(x, y + height, 0).func_181675_d()
    WorldRenderer.func_181662_b(x + width, y + height, 0).func_181675_d()
    WorldRenderer.func_181662_b(x + width, y, 0).func_181675_d()
    WorldRenderer.func_181662_b(x, y, 0).func_181675_d()
    MCTessellator.func_78381_a()
    if (lineWidth && lineWidth > 0) GL11.glLineWidth(1)
}

export const preDraw = () => {
    Tessellator.enableBlend()
    Tessellator.disableTexture2D()
    Tessellator.tryBlendFuncSeparate(770, 771, 1, 0)
}

export const postDraw = () => {
    Tessellator.disableBlend()
    Tessellator.enableTexture2D()
    Tessellator.colorize(1, 1, 1,)
}

export const drawImage = (image, x, y, width, height) => {
    Tessellator.bindTexture(image)
    WorldRenderer.func_181668_a(6, DefaultVertexFormats.field_181707_g)
    WorldRenderer.func_181662_b(x, y + height, 0).func_181673_a(0, 1).func_181675_d()
    WorldRenderer.func_181662_b(x + width, y + height, 0).func_181673_a(1, 1).func_181675_d()
    WorldRenderer.func_181662_b(x + width, y, 0).func_181673_a(1, 0).func_181675_d()
    WorldRenderer.func_181662_b(x, y, 0).func_181673_a(0, 0).func_181675_d()
    MCTessellator.func_78381_a()
}