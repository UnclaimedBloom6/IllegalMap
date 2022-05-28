/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Config from "./data/Config"
import IMDungeon from "./dungeon/IMDungeon"
import Discord from "./utils/Discord"
import "./extra/Mimic"
import "./extra/DungeonLogger"
import "./extra/ScoreMilestones"
import "./extra/StarMobEsp"
import "./extra/WitherDoorEsp"
import "./utils/NewRoomCommand"
import "./utils/UpdateChecker"
import "./extra/MapBorder"
import StarMob from "./utils/StarMob"

import { prefix, dataObject, getVersion, getEntranceVariants } from "./utils/Utils"
import { getApiKeyInfo } from "../BloomCore/Utils/APIWrappers"
import { bcData } from "../BloomCore/Utils/Utils"
import Map from "./extra/Map"
import Dungeon from "../BloomCore/Dungeons/Dungeon"

register("command", (...args) => {
    if (!args || !args[0]) return Config.openGUI()
    else if (["setkey", "key"].includes(args[0])) {
        let key = args[1]
        new Message(`${prefix} &aChecking API key...`).setChatLineId(46574).chat()
        getApiKeyInfo(key).then(keyInfo => {
            bcData.apiKey = key
            bcData.save()
            ChatLib.editChat(46574, new Message(`${prefix} &aAPI Key set successfully!`))
        }).catch(error => {
            ChatLib.editChat(46574, new Message(`${prefix} &cError: API Key invalid!`))
        })
    }
}).setName("dmap")

// Moving the map/score calc
register("dragged", (dx, dy, x, y) => {
    if (Config.moveMapGui.isOpen()) {
        dataObject.map.x = x
        dataObject.map.y = y
        dataObject.save()
    }
})
// Render the map/score calc background when the player is moving them
register("renderOverlay", () => {
    if (!Config.moveMapGui.isOpen()) return
    Map.drawBackground()
})

let starMobs = []
register("tick", () => {
    if (!Config.radar || !Config.mapEnabled || Config.legitMode) return starMobs = []
    starMobs.map(a => a.update())
    let validMobs = ["✯", "Shadow Assassin"]
    let star = World.getAllEntities().filter(e => validMobs.some(a => e.getName().includes(a)))
    let validUUIDs = star.map(a => a.getUUID())
    starMobs = starMobs.filter(a => validUUIDs.includes(a.id))
    let validStarMobs = star.filter(a => !starMobs.some(e => e.id == a.getUUID())).map(a => new StarMob(a))
    starMobs = starMobs.concat(validStarMobs)
})

register("command", () => {
    Config.radar = !Config.radar
    ChatLib.chat(`${prefix} ${Config.radar ? '&aRadar Enabled!' : "&cRadar Disabled"}`)
}).setName("star")

// Rendering the score calc and the map. Can't be in different files due to priorities not working.
// Main rendering for everything on the map
const renderDungeonStuff = () => {
    if (!Dungeon.inDungeon || !Config.mapEnabled || (Dungeon.bossEntry && Config.hideInBoss)) return
    if (Config.hideInBoss && Dungeon.bossEntry) return
    if (Config.legitMode && !Dungeon.time) return
    // Render the map and checkmarks
    Map.drawBackground()
    if (Map.map) Map.renderMap()
    Map.renderCheckmarks()
    // Render room names
    let namesRendered = []

    IMDungeon.rooms.forEach(room => {
        if (namesRendered.includes(room.name)) return
        namesRendered.push(room.name)
        if ((IMDungeon.peekBind.isKeyDown() || Config.showRooms) && (["normal", "rare", "yellow"].includes(room.type))) {
            if (Config.legitMode && !room.explored) return
            room.renderSecrets()
            room.renderName()
            sec = true
            name = true
        }
        if ((Config.showImportantRooms && ["puzzle", "trap"].includes(room.type))) {
            if (Config.legitMode && !room.explored) return
            room.renderName()
        }
    })
    // Render star mobs on the map
    if (Config.radar) starMobs.map(a => a.render())

    // Render player icons and player names
    for (let i = 0; i < IMDungeon.players.length; i++) {
        if (IMDungeon.players[i].isDead && !Config.showDeadPlayers) continue
        IMDungeon.players[i].render()
        // if player holding leaps
        if ((Player.getHeldItem() && ["Spirit Leap", "Infinileap"].includes(Player.getHeldItem().getName().removeFormatting()) && Config.playerNames == 1) || Config.playerNames == 2) {
            if (IMDungeon.players[i].player == Player.getName() && !Config.showOwnNametag) continue
            IMDungeon.players[i].renderName(Config.showPlayerRank)
        }
    }
}
// Rendering for score calc
const renderDungeonInfo = () => {
    if (!Dungeon.inDungeon || Config.dungeonInfo == 2 || (Dungeon.bossEntry && Config.hideInBoss && Config.dungeonInfo == 0)) return
    if (Config.legitMode && !Dungeon.time) return

    // Render score calc under map
    if (Config.dungeonInfo == 0 || (Config.dungeonInfo == 3 && !Dungeon.bossEntry)) {
        if (!Config.mapEnabled) return
        Renderer.translate(dataObject.map.x + (25 * Config.mapScale)/2, dataObject.map.y + 24.5 * Config.mapScale)
        Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        Renderer.drawStringWithShadow(Map.row1, -Renderer.getStringWidth(Map.row1.removeFormatting())/2, 0)

        Renderer.translate(dataObject.map.x + (25 * Config.mapScale)/2, dataObject.map.y + 25.5 * Config.mapScale)
        Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        Renderer.drawStringWithShadow(Map.row2, -Renderer.getStringWidth(Map.row2.removeFormatting())/2, 0)
    }
    // Render score calc seperately from the map
    if (Config.dungeonInfo == 1 || (Config.dungeonInfo == 3 && Dungeon.bossEntry) || Config.dungeonInfoMoveGui.isOpen()) {
        let split = Map.row1.split("     ").join("\n")
        let split2 = Map.row2.split("     ").join("\n")
        Renderer.translate(dataObject.dungeonInfo.x + Config.mapScale, dataObject.dungeonInfo.y + Config.mapScale)
        Renderer.scale(0.2 * Config.mapScale, 0.2 * Config.mapScale)
        Renderer.drawString(`${split}\n${split2}`, 0, 0)
    }
}
register("renderOverlay", () => {
    renderDungeonStuff()
    renderDungeonInfo()
})

// Spirits command, shows which players do or don't have a spirit pet
register("command", () => {
    if (IMDungeon.players.length == 0) {
        return ChatLib.chat(`${prefix} &cDungeon party is empty!`)
    }
    let str = `${prefix} &aSpirit Pets\n`
    for (let i = 0; i < IMDungeon.players.length; i++) {
        let p = IMDungeon.players[i]
        str += ` &a- &b${p.player}&a: `
        str += p.hasSpirit ? "&a✔\n" : "&c✘\n"
    }
    ChatLib.chat(str)
}).setName("spirits")

let installMsg = `
    &b&l&nIllegalMap ${getVersion()}

    &aThank for for installing IllegalMap!
    &7Legit mode is enabled by default. Use the &b/dmap
    &7command to open the settings gui.

    &aIf you have suggestions or find a bug, DM &bUnclaimed#6151.
    &cI will not consider features which are unrelated
    &cto the map. This is not a hacked client.
`

let checked = false
register("step", () => {
    if (checked) return
    if (dataObject.firstTime || dataObject.uuid !== Player.getUUID()) {
        dataObject.firstTime = false
        dataObject.uuid = Player.getUUID()
        dataObject.save()
        ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
        for (let msg of installMsg.split("\n")) {
            ChatLib.chat(ChatLib.getCenteredText(msg))
        }
        ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
    }
    checked = true
}).setFps(5)

const sort = (obj) => Object.keys(obj).map(a => [a, obj[a]]).sort((a, b) => a[1] - b[1]).reverse().reduce((a, b) => {
    a[b[0]] = b[1]
    return a
}, {})
const getColoredName = (roomName) => {
    let rooms = JSON.parse(FileLib.read("IllegalMap", "./data/rooms.json")).rooms
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
const toSeconds = (ms) => Math.floor(ms/10)/100
register("command", (...room) => {
    room = room.join(" ")
    if (!IMDungeon.players.length) return
    let found = []
    for (let p of IMDungeon.players) {
        for (let r of Object.keys(p.visitedRooms)) {
            if (r.toLowerCase() !== room.toLowerCase()) continue
            room = r
            found.push(`&e- ${p.getName(true)} &e- &b${toSeconds(p.visitedRooms[room])}s`)
        }
    }
    if (!found.length) return ChatLib.chat(`${prefix} &cNobody has entered that room!`)
    ChatLib.chat(`${prefix} &aPlayers Who Visisted &b${getColoredName(room)}&a: (&6${found.length}&a)\n${found.join("\n")}`)
}).setName("visited")

register("command", (player) => {
    if (!player && !IMDungeon.players.length) return
    if (player && !IMDungeon.players.some(a => a.player.toLowerCase() == player.toLowerCase())) return ChatLib.chat(`${prefix} &cThat player hasn't entered any rooms!`)

    const printRooms = (p) => {
        let hover = `&a${p.getName(true)}&e's Visited Rooms &6(${Object.keys(p.visitedRooms).length})`
        let sorted = sort(p.visitedRooms)
        hover += Object.keys(sorted).map(a => `\n&a${getColoredName(a)} &e- &b${toSeconds(sorted[a])}s`).join("")
        new Message(new TextComponent(`&b${p.getName(true)}&a's Visited Rooms &7(Hover)`).setHover("show_text", hover)).chat()
    }
    for (let p of IMDungeon.players) {
        if (!player) {
            printRooms(p)
            continue
        }
        else if (p.player.toLowerCase() == player.toLowerCase()) return printRooms(p)
    }
}).setName("rooms")

// Thanks to iTqxic for suggesting this
register("scrolled", (x, y, dir) => {
    if (Config.moveMapGui.isOpen()) {
        Config.mapScale += dir == 1 && Config.mapScale < 10 ? 0.1 : Config.mapScale > 0 ? -0.1 : 0
    }
})
// And this
register("guiClosed", () => {
    if (Config.moveMapGui.isOpen() || Config.dungeonInfoMoveGui.isOpen()) {
        Config.openGUI()
    }
})

// Move the seperate score calc
register("dragged", (mx, my, x, y, btn) => {
    if (!Config.dungeonInfoMoveGui.isOpen()) return
    dataObject.dungeonInfo.x = x
    dataObject.dungeonInfo.y = y
})

register("command", () => {
    ChatLib.command("tp @p ~1000 ~ ~")
    setTimeout(() => {
        ChatLib.command("tp @p ~-1000 ~ ~") 
    }, 200);
}).setName("/rc")

register("command", () => {
    Config.legitMode = !Config.legitMode
}).setName("lm")