import { BufferedImage, readFileLines, renderCenteredString } from "../../BloomCore/utils/Utils"
import DungeonMap from "../components/DungeonMap"
import { RoomTypes } from "../utils"

const getTimeSince = (ts) => {
    const delta = new Date().getTime() - ts
    const secs = Math.floor(delta / 1000)%60
    const mins = Math.floor(delta / 60000)%60
    const hours = Math.floor(delta / 3.6e6)%24
    const days = Math.floor(delta / 8.64e7)

    if (days) return `${days}d ${hours}h`
    if (hours) return `${hours}h ${mins}m`
    if (mins) return `${mins}m ${secs}s`
    return `${secs}s`
}

const viewerGui = new Gui()
let currentDung = new DungeonMap()
let mapImageBuffered = null
let mapImage = null
let floor = null
let timestamp = null
register("command", (str) => {
    if (!str) return ChatLib.chat(`&cInvalid String! Should be formatted as "F7;147546355;004012...;900199991...`)
    let split = str.split(";")
    floor = split[0]
    timestamp = parseInt(split[1])
    
    mapImageBuffered = new BufferedImage(23, 23, BufferedImage.TYPE_4BYTE_ABGR)

    currentDung = DungeonMap.fromString(str)
    currentDung.drawToImage(mapImageBuffered)

    if (mapImage) mapImage.destroy()
    mapImage = new Image(mapImageBuffered)

    viewerGui.open()
}).setName("viewdung")

register("renderOverlay", () => {
    if (!viewerGui.isOpen() || !floor) return
    // The Dungeon
    const screenHeight = Renderer.screen.getHeight()

    let x0 = Renderer.screen.getWidth()/3 - screenHeight/3
    let y0 = screenHeight/2 - screenHeight/3

    const mapSize = screenHeight - screenHeight/3
    const cellSize = mapSize/23

    Renderer.drawRect(Renderer.color(0, 0, 0, 175), x0-10, y0-10, Renderer.screen.getWidth() - x0*2 + 20, Renderer.screen.getHeight() - y0*2 + 20)
    mapImage.draw(x0, y0, mapSize, mapSize)

    currentDung.rooms.forEach(room => {
        let [x, y] = room.center
        let roomName = room.getName(true)
        let color = roomName.slice(0, 2)
        renderCenteredString(roomName.replace(/ /g, ` ${color}`), x0 + cellSize*1.5 + x*cellSize*4, y0 + cellSize*1.5 + y*cellSize*4, 1, true)
    })

    // The Dungeon Info
    const center = Renderer.screen.getWidth()/2
    let x1 = center
    let y1 = y0+5

    // Room Shit
    const puzzles = [...currentDung.rooms].filter(a => a.type == RoomTypes.PUZZLE).sort((a, b) => b.getRoomScore() - a.getRoomScore())
    const rooms = [...currentDung.rooms].filter(a => !puzzles.includes(a) && a.getRoomScore() !== 0).sort((a, b) => b.getRoomScore() - a.getRoomScore())

    let floorStr = (floor.startsWith("M") ? "&c&lMaster Mode " : "") + `&r&aFloor ${floor.slice(1)}` 
    renderCenteredString(floorStr, x1 + mapSize/2, y1, 1.5)

    // The Puzzle and Room lists
    const puzzleListStr = puzzles.map(a => ` - ${a.getName(true)} &6 - (${Math.floor(a.getRoomScore()*10)/10})`).join("\n")
    const roomListStr = rooms.map(a => ` - ${a.getName(true)} &6 - (${Math.floor(a.getRoomScore()*10)/10})`).join("\n")

    const firstCol = [
        `&7Generated: &8${getTimeSince(timestamp)} &7ago.`,
        `&bMap Score: &6${Math.floor(currentDung.mapScore*10)/10}`,
        `&fSecrets: &b${currentDung.secrets}`,
        `&aCrypts: &6${currentDung.crypts}`,
        ``,
    ]
    const secondCol = [
        `&d&lPuzzles (&6${puzzles.length}&d&l):`,
        `${puzzleListStr}`,
        ``,
        `&a&lRooms:`,
        `${roomListStr}`
    ]
    Renderer.drawString(firstCol.join("\n"), x1, y1+20)
    Renderer.drawString(secondCol.join("\n"), x1 + mapSize/2, y1+20)
})

register("command", (floor) => {
    new Thread(() => {
        const started = new Date().getTime()
        ChatLib.chat(`&aProcessing logs for ${floor?.toUpperCase() || "All Floors"}...`)
        const logMap = new Map()
        const logs = readFileLines("IllegalMap", "data/dungeons.txt")
        if (!logs || !logs.length) return ChatLib.chat(`&cNo dungeons logged!`)

        for (let dungeonString of logs) {
            let [f] = dungeonString.split(";")
            if (floor && f !== floor.toUpperCase()) continue
            logMap.set(dungeonString, DungeonMap.fromString(dungeonString, false))
        }
        
        if (!logMap.size) return ChatLib.chat(`&cNo dungeons logged on that floor!`)

        let sorted = Array.from(logMap.entries()).sort((a, b) => a[1].mapScore - b[1].mapScore).filter(a => a[1].mapScore !== Infinity)

        ChatLib.chat(`&aLogs for ${floor?.toUpperCase() || "All Floors"}:`)
        const msg = new Message()
        for (let thing of sorted) {
            let [str, dung] = thing
            msg.addTextComponent(new TextComponent(`&6${Math.floor(dung.mapScore*10)/10}&r, `).setClick("run_command", `/viewdung ${str}`))
        }
        msg.chat()

        // Chat Stats
        const ratings = sorted.map(a => a[1].mapScore)
        const max = Math.max(...ratings)
        const min = Math.min(...ratings)
        const avg = Math.floor(ratings.reduce((a, b) => a+b, 0) / ratings.length * 10) / 10

        ChatLib.chat(`&aLogs: &7${ratings.length}`)
        ChatLib.chat(`&aMin: &7${min}`)
        ChatLib.chat(`&cMax: &7${max}`)
        ChatLib.chat(`&bAverage: &7${avg}`)
        ChatLib.chat(`&aTook &b${new Date().getTime() - started}ms`)
    }).start()
}).setName("logs")

