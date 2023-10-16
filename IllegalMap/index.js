/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Dungeon from "../BloomCore/dungeons/Dungeon"
import { renderCenteredString, title } from "../BloomCore/utils/Utils"
import Config from "./data/Config"
import { componentToRealCoords, defaultMapSize, dmapData, getCore, getRgb, mapCellSize, realCoordToComponent, roomsJson, RoomTypes } from "./utils"

import "./Extra/DungeonLogger"
import "./extra/ScoreMilestones"
import "./extra/Mimic"
import "./extra/StarMobStuff"
import "./extra/WitherDoorEsp"
import "./extra/UpdateChecker"
import "./Extra/FirstInstall"
import "./extra/VisitedCommand"
import "./extra/DungeonLoggerNew"
import "./extra/DungeonViewer"
import "./extra/NewRoomCommand"
import { renderStarMobStuff } from "./extra/StarMobStuff"
import DmapDungeon from "./components/DmapDungeon"
import Room from "./components/Room"

const peekKey = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "IllegalMap")

// Store the pre-calculated render related stuff to improve performance

const neverRenderNameTypes = new Set([RoomTypes.BLOOD, RoomTypes.ENTRANCE, RoomTypes.FAIRY])
const renderWhenPeekKeyTypes = new Set([RoomTypes.NORMAL, RoomTypes.YELLOW, RoomTypes.RARE, RoomTypes.UNKNOWN])
const alwaysRenderTypes = new Set([RoomTypes.PUZZLE, RoomTypes.TRAP])
const showSecretsRooms = new Set([RoomTypes.NORMAL, RoomTypes.RARE, RoomTypes.UNKNOWN])

const leapNames = new Set(["Spirit Leap", "Infinileap", "Haunt"])

const renderRoomNames = () => {
    if (!Config.showRoomNames && !Config.showPuzzleNames && !peekKey.isKeyDown()) return
    DmapDungeon.dungeonMap.rooms.forEach(room => {
        if (neverRenderNameTypes.has(room.type)) return

        if (renderWhenPeekKeyTypes.has(room.type) && (peekKey.isKeyDown() || Config.showRoomNames)) room.renderName()
        if (alwaysRenderTypes.has(room.type) && (peekKey.isKeyDown() || Config.showPuzzleNames)) room.renderName()
    })
}

const renderCheckmarks = () => {
    DmapDungeon.dungeonMap.rooms.forEach(room => {
        if (!room.checkmark) return
        room.renderCheckmark()
    })
}

const renderPlayers = () => {
    // Send the user to the end of the list so they get rendered on top of everyone else's
    const playerIndex = DmapDungeon.players.findIndex(a => a.player == Player.getName())
    if (playerIndex !== -1) DmapDungeon.players.push(DmapDungeon.players.splice(playerIndex, 1)[0])

    for (let p of DmapDungeon.players) {
        if ((Dungeon.deadPlayers.has(p.player) || !Dungeon.party.has(p.player)) && p.player !== Player.getName()) continue
        p.renderHead()
        
        if (!Config.showOwnName && p.player == Player.getName()) continue

        // Render the player name
        if (Config.spiritLeapNames && leapNames.has(Player.getHeldItem()?.getName()?.removeFormatting()) || Config.showPlayerNames) {
            p.renderName()
        }
    }
}

// Flag which will add 10 more pixels under the map to make room for the extra info if set to true
let renderingUnderMap = false

const renderDungeonInfoUnderMap = () => {
    const [w, h] = defaultMapSize
    renderingUnderMap = true
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale, dmapData.map.scale)
    Renderer.translate(w / 2, h - mapCellSize*2.5 + mapCellSize*2)
    Renderer.scale(0.6, 0.6)
    let w1 = Renderer.getStringWidth(DmapDungeon.mapLine1)
    let w2 = Renderer.getStringWidth(DmapDungeon.mapLine2)
    Renderer.drawStringWithShadow(DmapDungeon.mapLine1, -w1 / 2, 0)
    Renderer.drawStringWithShadow(DmapDungeon.mapLine2, -w2 / 2, 10)
    Renderer.retainTransforms(false)
}

const renderDungeonInfoSeperate = () => {
    let lines = DmapDungeon.mapLine1.split("    ").concat(DmapDungeon.mapLine2.split("    "))
    let width = lines.map(a => Renderer.getStringWidth(a)).sort((a, b) => b - a)[0] + 4
    let height = 7 * lines.length + (lines.length - 1) * 2 + 4
    let c = Config.dungeonInfoBackgroundColor
    let [r, g, b, a] = [c.getRed(), c.getGreen(), c.getBlue(), c.getAlpha()]
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.dungeonInfo.x, dmapData.dungeonInfo.y)
    Renderer.scale(dmapData.dungeonInfo.scale, dmapData.dungeonInfo.scale)
    Renderer.drawRect(Renderer.color(r, g, b, a), 0, 0, width, height)
    for (let i = 0; i < lines.length; i++) {
        Renderer.drawStringWithShadow(lines[i], 2, 7 * i + i * 2 + 2)
    }
    Renderer.retainTransforms(false)
}

const renderDungeonInfo = () => {
    if (!Config.dungeonInfo) return renderDungeonInfoUnderMap()
    if (Config.dungeonInfo == 3 && !Dungeon.bossEntry) return renderDungeonInfoUnderMap()
    if (!Config.dungeonInfo && (!Config.hideInBoss && !Dungeon.bossEntry)) return renderDungeonInfoUnderMap()

    renderingUnderMap = false
    if (Config.dungeonInfo == 3 && Dungeon.bossEntry) return renderDungeonInfoSeperate()
    if (Config.dungeonInfo == 1 || Config.editDungeonInfoGui.isOpen()) return renderDungeonInfoSeperate()
    if (Config.hideInBoss && Dungeon.bossEntry && Config.dungeonInfo == 3) return renderDungeonInfoSeperate()
}

const renderDungeonInfoEditGui = () => {
    renderCenteredString("Scroll to change the scale", Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 3, 1, false)
}

const renderBorderEditGui = () => {
    let txt = ["Scroll to change the scale"]
    if (Config.mapBorder == 1) {
        txt.push("Control + Scroll to change RGB speed")
        txt.push(`RGB Speed: ${dmapData.border.rgbSpeed}`)
    }
    renderCenteredString(txt, Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 3, 1, false)
}

const renderMapBorder = () => {
    let [w, h] = defaultMapSize
    if (renderingUnderMap) h += 10
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale, dmapData.map.scale)
    let drawMode = Config.mapBorder == 3 ? 1 : 7
    let color = Config.borderColor.hashCode()
    if (Config.mapBorder == 1) {
        const [r, g, b] = getRgb()
        color = Renderer.color(r * 255, g * 255, b * 255, 255)
    }
    Renderer.drawLine(color, 0, 0, 0, h, dmapData.border.scale, drawMode)
    Renderer.drawLine(color, 0, 0, w, 0, dmapData.border.scale, drawMode)
    Renderer.drawLine(color, w, 0, w, h, dmapData.border.scale, drawMode)
    Renderer.drawLine(color, 0, h, w, h, dmapData.border.scale, drawMode)
    Renderer.retainTransforms(false)
}

const renderMapEditGui = () => {
    renderCenteredString([
        "Scroll to change the map scale.",
        "Shift + Scroll to change player head scale.",
        "Control + Scroll to change checkmark scale."
    ], Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 3, 1, false)
    if (Dungeon.inDungeon && Config.enabled) return

    let [headx, heady] = [(dmapData.map.x + 60) * dmapData.map.scale, (dmapData.map.y + 80) * dmapData.map.scale]
    let [headw, headh] = [10 * dmapData.map.headScale, 10 * dmapData.map.headScale]
    Renderer.drawRect(Renderer.WHITE, headx - (headw / 2), heady - (headh / 2), headw, headh)
}

const renderRoomSecrets = () => {
    if (!Config.showSecrets && !peekKey.isKeyDown()) return
    DmapDungeon.dungeonMap.rooms.forEach(room => {
        if (!showSecretsRooms.has(room.type)) return
        room.renderSecrets()
    })
}

const renderDungeonMap = () => {
    const [w, h] = defaultMapSize

    // Inset the whole map by 5 pixels in all directions to make a border around the main map and background
    const mapWidth = w-mapCellSize*2
    const mapHeight = h-mapCellSize*2

    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale, dmapData.map.scale)

    // Draw the background
    Renderer.drawRect(Config.backgroundColor.hashCode(), 0, 0, w, h + (renderingUnderMap ? mapCellSize*2 : 0))
    // Draw the map
    Renderer.drawImage(DmapDungeon.map, 5, 5, mapWidth, mapHeight)
    
    Renderer.retainTransforms(false)
}

const renderMapStuff = () => {
    renderDungeonMap()
    if (Config.mapBorder !== 0) renderMapBorder()
    renderCheckmarks()
    renderStarMobStuff()
    renderRoomSecrets()
    renderRoomNames()
    renderPlayers()
}

register("renderOverlay", () => {
    if (Config.editDungeonInfoGui.isOpen()) renderDungeonInfoEditGui()
    if (Config.mapEditGui.isOpen()) {
        renderMapEditGui()
        renderDungeonMap()
        renderMapBorder()
        return
    }
    if (Config.borderScaleGui.isOpen()) renderBorderEditGui()

    if (!Config.enabled || !Dungeon.inDungeon) return
    if (!(Config.hideInBoss && Dungeon.bossEntry)) renderMapStuff()
    renderDungeonInfo()
})

register("command", (...args) => {
    if (!args || !args.length || !args[0]) return Config.openGUI()

    // Used for debugging
    if (args[0] == "reset") DmapDungeon.reset()
}).setName("dmap")

register("dragged", (dx, dy, x, y, btn) => {
    if (Config.mapEditGui.isOpen()) {
        dmapData.map.x = x
        dmapData.map.y = y
        dmapData.save()
    }
    if (Config.editDungeonInfoGui.isOpen()) {
        dmapData.dungeonInfo.x = x
        dmapData.dungeonInfo.y = y
        dmapData.save()
    }
})

// Map edit GUI
register("scrolled", (mx, my, dir) => {
    if (!Config.mapEditGui.isOpen()) return
    if (Client.isShiftDown()) {
        if (dir == 1) dmapData.map.headScale += 0.05
        else dmapData.map.headScale -= 0.05
    }
    else if (Client.isControlDown()) {
        if (dir == 1) dmapData.map.checkScale += 0.05
        else dmapData.map.checkScale -= 0.05
    }
    else {
        if (dir == 1) dmapData.map.scale += 0.01
        else dmapData.map.scale -= 0.01
    }
    dmapData.save()
})

register("scrolled", (mx, my, dir) => {
    if (!Config.borderScaleGui.isOpen()) return
    if (Client.isControlDown()) {
        if (dir == 1) dmapData.border.rgbSpeed += 0.05
        else dmapData.border.rgbSpeed -= 0.05
    }
    else {
        if (dir == 1) dmapData.border.scale += 0.05
        else dmapData.border.scale -= 0.05
    }
    dmapData.save()
})

register("scrolled", (mx, my, dir) => {
    if (!Config.editDungeonInfoGui.isOpen()) return
    if (dir == 1) dmapData.dungeonInfo.scale += 0.05
    else dmapData.dungeonInfo.scale -= 0.05
    dmapData.save()
})

