/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Dungeon from "../BloomCore/Dungeons/Dungeon"
import { bcData, renderCenteredString } from "../BloomCore/Utils/Utils"
import DmapDungeon from "./Components/DmapDungeon"
import Config from "./data/Config"
import { defaultMapSize, dmapData, getCheckmarks, getRgb, prefix } from "./utils"

import "./Extra/DungeonLogger"
import "./Extra/ScoreMilestones"
import "./Extra/Mimic"
import "./Extra/StarMobStuff"
import "./Extra/WitherDoorEsp"
import "./Extra/UpdateChecker"
import "./Extra/FirstInstall"
import { renderStarMobStuff } from "./Extra/StarMobStuff"
import { visitedCommand } from "./Extra/PlayerTrackerCommands"

const peekKey = new KeyBind("Peek Rooms", Keyboard.KEY_NONE, "IllegalMap")

const renderRoomNames = () => {
    if (!Config.showRoomNames && !Config.showPuzzleNames && !peekKey.isKeyDown()) return
    for (let room of DmapDungeon.rooms) {
        if (["blood", "entrance", "fairy"].includes(room.type)) continue
        if (["normal", "yellow", "rare", null].includes(room.type) && (peekKey.isKeyDown() || Config.showRoomNames)) room.renderName()
        if (["puzzle", "trap"].includes(room.type) && (peekKey.isKeyDown() || Config.showPuzzleNames)) room.renderName()
    }
}

const renderCheckmarks = () => {
    for (let room of DmapDungeon.rooms) {
        if (!room.checkmark) continue
        room.renderCheckmark()
    }
}

const renderPlayers = () => {
    // Send the player to the end of the list so it gets rendered on top of everyone else's
    let p = DmapDungeon.players.findIndex(a => a.player == Player.getName())
    if (p) DmapDungeon.players.concat(DmapDungeon.players.splice(p, 1))

    for (let p of DmapDungeon.players) {
        if (Dungeon.deadPlayers.includes(p.player) || !Dungeon.party.includes(p.player)) continue
        p.renderHead()
        if (!Config.showOwnName && p.player == Player.getName()) continue
        // Render the player name
        if (Config.spiritLeapNames && ["Spirit Leap", "Infinileap"].includes(Player.getHeldItem()?.getName()?.removeFormatting()) || Config.showPlayerNames) {
            p.renderName()
        }
    }
}

let renderingUnderMap = false

const renderDungeonInfoUnderMap = () => {
    renderingUnderMap = true
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale, dmapData.map.scale)
    Renderer.translate(138/2, 135)
    Renderer.scale(0.6, 0.6)
    let w1 = Renderer.getStringWidth(DmapDungeon.mapLine1)
    let w2 = Renderer.getStringWidth(DmapDungeon.mapLine2)
    Renderer.drawStringWithShadow(DmapDungeon.mapLine1, -w1/2, 0)
    Renderer.drawStringWithShadow(DmapDungeon.mapLine2, -w2/2, 10)
    Renderer.retainTransforms(false)
}

const renderDungeonInfoSeperate = () => {
    let lines = DmapDungeon.mapLine1.split("    ").concat(DmapDungeon.mapLine2.split("    "))
    let width = lines.map(a => Renderer.getStringWidth(a)).sort((a, b) => b-a)[0] + 4
    let height = 7*lines.length + (lines.length-1)*2 + 4
    let c = Config.dungeonInfoBackgroundColor
    let [r, g, b, a] = [c.getRed(), c.getGreen(), c.getBlue(), c.getAlpha()]
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.dungeonInfo.x, dmapData.dungeonInfo.y)
    Renderer.scale(dmapData.dungeonInfo.scale, dmapData.dungeonInfo.scale)
    Renderer.drawRect(Renderer.color(r, g, b, a), 0, 0, width, height)
    for (let i = 0; i < lines.length; i++) {
        Renderer.drawStringWithShadow(lines[i], 2, 7*i + i*2 + 2)
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
    renderCenteredString("Scroll to change the scale", Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/3, 1, false)
}

const renderBorderEditGui = () => {
    let txt = ["Scroll to change the scale"]
    if (Config.mapBorder == 1) {
        txt.push("Control + Scroll to change RGB speed")
        txt.push(`RGB Speed: ${lmData.border.rgbSpeed}`)
    }
    renderCenteredString(txt, Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/3, 1, false)
}

const renderMapBorder = () => {
    let [w, h] = defaultMapSize
    if (renderingUnderMap) h += 10
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale,dmapData.map.scale)
    let drawMode = Config.mapBorder == 3 ? 1 : 7
    let color = Config.borderColor.hashCode()
    if (Config.mapBorder == 1) {
        const [r, g, b] = getRgb()
        color = Renderer.color(r*255, g*255, b*255, 255)
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
    ], Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/3, 1, false)
    if (Dungeon.inDungeon && Config.enabled) return

    let [headx, heady] = [(dmapData.map.x+60)*dmapData.map.scale, (dmapData.map.y+80)*dmapData.map.scale]
    let [headw, headh] = [10*dmapData.map.headScale, 10*dmapData.map.headScale]
    Renderer.drawRect(Renderer.WHITE, headx-(headw/2), heady-(headh/2), headw, headh)

    let checks = getCheckmarks()
    checkmarks = [[checks["green"], 0, 0], [checks["white"], 2, 0], [checks["failed"], 5, 2], [checks["green"], 2, 1], [checks["failed"], 2, 4]]
}

const renderRoomSecrets = () => {
    if (!Config.showSecrets && !peekKey.isKeyDown()) return
    for (let room of DmapDungeon.rooms) {
        if (!["normal", "rare", null].includes(room.type)) continue
        room.renderSecrets()
    }
}

const renderMapStuff = () => {
    let [w, h] = defaultMapSize
    if (renderingUnderMap) h += 10
    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale, dmapData.map.scale)
    Renderer.drawRect(Config.backgroundColor.hashCode(), 0, 0, w, h)
    Renderer.drawImage(DmapDungeon.map, 5, 5, 128, 128)
    Renderer.retainTransforms(false)
    if (Config.mapBorder !== 0) renderMapBorder()
    renderCheckmarks()
    renderStarMobStuff()
    renderRoomSecrets()
    renderRoomNames()
    renderPlayers()
}

register("renderOverlay", () => {
    if (!Config.enabled || !Dungeon.inDungeon) return
    if (!(Config.hideInBoss && Dungeon.bossEntry)) renderMapStuff()
    renderDungeonInfo()
})

register("renderOverlay", () => {
    if (Config.editDungeonInfoGui.isOpen()) renderDungeonInfoEditGui()
    if (Config.mapEditGui.isOpen()) renderMapEditGui()
    if (Config.borderScaleGui.isOpen()) renderBorderEditGui()
})

register("command", (...args) => {
    if (!args || !args.length || !args[0]) return Config.openGUI()
    if (args[0] == "setkey" || args[0] == "key") {
        if (!args[1]) return ChatLib.chat(`${prefix} &c/dmap setkey <api key>`)
        new Message(`${prefix} &aChecking API key...`).setChatLineId(765223).chat()
        getApiKeyInfo(args[1]).then(ki => {
            if (!ki.success) return ChatLib.editChat(765223 , new Message(`${prefix} &cInvalid API Key`))
            ChatLib.editChat(765223 , new Message(`${prefix} &aAPI key set successfully!`))
            bcData.apiKey = ki.record.key
        }).catch(e => ChatLib.editChat(765223 , new Message(`&cError: ${e}`)))
    }
}).setName("dmap")

register("command", () => {
    DmapDungeon.scan()
}).setName("scan")

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
    if (!Config.editDungeonInfoGui.isOpen()) return
    if (dir == 1) dmapData.dungeonInfo.scale += 0.05
    else dmapData.dungeonInfo.scale -= 0.05
    dmapData.save()
})
