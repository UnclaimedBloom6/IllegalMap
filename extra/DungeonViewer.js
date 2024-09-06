import { BufferedImage, linSpread, readFileLines, renderCenteredString } from "../../BloomCore/utils/Utils"
import DungeonMap from "../components/DungeonMap"
import { RoomTypes, renderWrappedString } from "../utils/utils"

const getTimeSince = (ts) => {
    const delta = Date.now() - ts
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

const viewReg = register("renderOverlay", () => {
    if (!floor) return
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
        renderWrappedString(roomName.replace(/ /g, ` ${color}`), x0 + cellSize*1.5 + x*cellSize*4, y0 + cellSize*1.5 + y*cellSize*4, 1)
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
}).unregister()

// Avoid funny registering [viewReg] if [viewerGui] is not opened
viewerGui.registerOpened(() => {
    viewReg.register()
})

viewerGui.registerClosed(() => {
    viewReg.unregister()
})

register("command", (floor) => {
    new Thread(() => {
        const started = Date.now()
        ChatLib.chat(`&aProcessing logs for ${floor?.toUpperCase() || "All Floors"}...`)
        const logMap = new Map()
        const logs = readFileLines("IllegalMap", "data/dungeons.txt")
        if (!logs || !logs.length) return ChatLib.chat(`&cNo dungeons logged!`)

        for (let dungeonString of logs) {
            let [f] = dungeonString.split(";")
            if (floor && f !== floor.toUpperCase()) continue
            logMap.set(dungeonString, DungeonMap.fromString(dungeonString))
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
        ChatLib.chat(`&aTook &b${Date.now() - started}ms`)
    }).start()
}).setName("logs")



const secretGui = new Gui()
let secretData = null // {secrets: secretShit, floor: "Floor 5"}

register("command", (string) => {
    if (!string) return ChatLib.chat("&cInvalid String!")

    let [floor, secretString] = string.split("|")
    const secretMap = new Map()
    
    let floorString = floor
    if (floorString == "ALL") floorString = "&a&lAll Floors"
    floorString = floorString.replace(/^M/, "&c&lMaster Mode Floor ")
    floorString = floorString.replace(/^F/, "&a&lFloor ")

    secretString.split(",").forEach(a => {
        let [num, count] = a.split(":")
        secretMap.set(parseInt(num), parseInt(count))
    })
    secretData = {
        secrets: secretMap,
        floor: floorString
    }
    secretGui.open()
}).setName("viewsecretgraph")

const secretsReg = register("renderOverlay", () => {
    if (!secretGui.isOpen() || !secretData) return
    const secretsToShow = secretData.secrets
    const floorString = secretData.floor
    // secretsToShow.forEach((v, k) => ChatLib.chat(`${k}: ${v}`))
    const height = Math.floor(Renderer.screen.getHeight() * 0.9)
    const width = Math.floor((16 * height) / 9)
    const x = Renderer.screen.getWidth() / 2 - width/2
    const y = Renderer.screen.getHeight() / 2 - height/2
    Renderer.drawRect(Renderer.color(0, 0, 0, 175), x, y, width, height)
    
    const minSecrets = Math.min(...[...secretsToShow.entries()].map(a => a[0]))
    const maxSecrets = Math.max(...[...secretsToShow.entries()].map(a => a[0]))
    const bars = maxSecrets - minSecrets

    const graphWidth = width * 0.9
    const graphHeight = height * 0.7

    const totalBarWidth = graphWidth / bars
    const barWidth = Math.floor(totalBarWidth * 0.9)
    const gapWidth = Math.floor(totalBarWidth * 0.1)

    const graphBottom = y + height * 0.9
    const graphRight = x + width * 0.95

    const graphTop = y + height * 0.2
    const graphLeft = x + width * 0.05


    const spread = linSpread(minSecrets, maxSecrets, bars).map(a => Math.floor(a))
    const secretSets = new Map()
    for (let i = 0; i < spread.length; i++) {
        let count = 0
        let next = Infinity
        if (i < spread.length-1) next = spread[i+1]
        secretsToShow.forEach((v, k) => {
            if (k < spread[i] || k >= next) return
            count += v
        })
        secretSets.set(spread[i], count)
    }
    
    const maxValue = Math.max(...[...secretSets.entries()].map(a => a[1]))
    const valueSpread = linSpread(0, maxValue, 10).map(a => Math.floor(a))
    
    // Renderer.drawRect(Renderer.DARK_RED, graphLeft, graphTop, graphWidth, graphHeight)
    renderCenteredString(floorString, x + width * 0.5,  y + graphHeight * 0.1, 2, false)

    for (let i = 0; i < spread.length; i++) {
        let secrets = spread[i]
        let secretsValue = secretSets.get(spread[i])
        let barX = graphLeft + i * (barWidth + (gapWidth + 1)) + gapWidth
        let barY = graphBottom
        let barHeight = MathLib.map(secretsValue, 0, maxValue, 0, graphHeight)
        Renderer.drawRect(Renderer.color(0, 175, 0, 255), barX, barY - barHeight, barWidth, barHeight)
        renderCenteredString(`${secrets}`, barX + barWidth/2, barY + height * 0.025, 1)
    }
    for (let i = 0; i < valueSpread.length; i++) {
        renderCenteredString(`${valueSpread[i]}`, x + width * 0.025, (y + height * 0.2) + MathLib.map(9-i, 0, 9, 0, graphHeight), 1)
    }
}).unregister()

// Avoid funny registering [secretsReg] if [secretGui] is not opened
secretGui.registerOpened(() => {
    secretsReg.register()
})

secretGui.registerClosed(() => {
    secretsReg.unregister()
})