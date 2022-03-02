/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Config from "./data/Config"
import Dungeon from "./dungeon/Dungeon"
import Discord from "./utils/Discord"
import ScoreCalculator from "./extra/ScoreCalculator"
import "./extra/Mimic"
import "./extra/DungeonLogger"
import "./extra/PaulChecker"
import "./extra/ScoreMilestones"
import "./extra/StarMobEsp"
import "./extra/WitherDoorEsp"
import "./utils/NewRoomCommand"
import "./utils/UpdateChecker"
import "./extra/MapBorder"

import {
    prefix,
    dataObject,
    getKeyInfo,
    getVersion
} from "./utils/Utils"

register("command", (...args) => {
    if (!args || !args[0]) return Config.openGUI()
    else if (["setkey", "key"].includes(args[0])) {
        new Message(`${prefix} &aChecking API key...`).setChatLineId(46574).chat()
        getKeyInfo(args[1]).then(keyInfo => {
            dataObject.apiKey = args[1]
            dataObject.save()
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
    if (Config.moveMapGui.isOpen()) {
        Dungeon.drawBackground()
    }
})

// Rendering the score calc and the map. Can't be in different files due to priorities not working.
// Main rendering for everything on the map
const renderDungeonStuff = () => {
    if (!Dungeon.inDungeon || !Config.mapEnabled || (Dungeon.bossEntry && Config.hideInBoss)) return
    if (Config.hideInBoss && Dungeon.bossEntry) return
    if (Config.legitMode && !Dungeon.time) return
    // Render the map and checkmarks
    Dungeon.drawBackground()
    if (Dungeon.map) Dungeon.renderMap()
    Dungeon.renderCheckmarks()
    // Render room names
    let namesRendered = []

    Dungeon.rooms.forEach(room => {
        if (!namesRendered.includes(room.name)) {
            namesRendered.push(room.name)
            if ((Dungeon.peekBind.isKeyDown() || Config.showRooms) && (["normal", "rare", "yellow"].includes(room.type))) {
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
        }
    })
    // Render player icons and player names
    for (let i = 0; i < Dungeon.players.length; i++) {
        if (Dungeon.players[i].isDead && !Config.showDeadPlayers) continue
        Dungeon.players[i].render()
        // if player holding leaps
        if ((Player.getHeldItem() && Player.getHeldItem().getName().includes("Spirit Leap") && Config.playerNames == 1) || Config.playerNames == 2) {
            if (Dungeon.players[i].player !== Player.getName()) {
                Dungeon.players[i].renderName()
            }
        }
    }
}
// Rendering for score calc
const renderScorecalcStuff = () => {
    if (!Dungeon.inDungeon || Config.scoreCalc == 2 || (Dungeon.bossEntry && Config.hideInBoss && Config.scoreCalc == 0)) return
    if (Config.legitMode && !Dungeon.time) return

    // Render score calc under map
    if (Config.scoreCalc == 0 || (Config.scoreCalc == 3 && !Dungeon.bossEntry)) {
        Renderer.translate(dataObject.map.x + (25 * Config.mapScale)/2, dataObject.map.y + 24.5 * Config.mapScale)
        Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        Renderer.drawStringWithShadow(ScoreCalculator.row1, -Renderer.getStringWidth(ScoreCalculator.row1.removeFormatting())/2, 0)

        Renderer.translate(dataObject.map.x + (25 * Config.mapScale)/2, dataObject.map.y + 25.5 * Config.mapScale)
        Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        Renderer.drawStringWithShadow(ScoreCalculator.row2, -Renderer.getStringWidth(ScoreCalculator.row2.removeFormatting())/2, 0)
    }
    // Render score calc seperately from the map
    if (Config.scoreCalc == 1 || (Config.scoreCalc == 3 && Dungeon.bossEntry) || Config.scoreCalcMoveGui.isOpen()) {
        let split = ScoreCalculator.row1.split("     ").join("\n")
        let split2 = ScoreCalculator.row2.split("     ").join("\n")
        Renderer.translate(dataObject.scoreCalc.x + Config.mapScale, dataObject.scoreCalc.y + Config.mapScale)
        Renderer.scale(0.2 * Config.mapScale, 0.2 * Config.mapScale)
        Renderer.drawString(`${split}\n${split2}`, 0, 0)
    }
}
register("renderOverlay", () => {
    renderDungeonStuff()
    renderScorecalcStuff()
})

// Spirits command, shows which players do or don't have a spirit pet
register("command", () => {
    if (Dungeon.players.length == 0) {
        return ChatLib.chat(`${prefix} &cDungeon party is empty!`)
    }
    let str = `${prefix} &aSpirit Pets\n`
    for (let i = 0; i < Dungeon.players.length; i++) {
        let p = Dungeon.players[i]
        str += ` &a- &b${p.player}&a: `
        str += p.hasSpirit ? "&a✔\n" : "&c✘\n"
    }
    ChatLib.chat(str)
}).setName("spirits")

// Check if it's the first time the player is using the mod
// const myDc = new TextComponent("&bUnclaimed#6151").setHover("show_text", "&aClick to copy!").setClick("run_command", "/ct copy Unclaimed#6151")

let installMsg = `
    &b&l&nIllegalMap ${getVersion()}

    &aThank for for installing IllegalMap!
    &7Legit mode is enabled by default. Use the &b/dmap
    &7command to open the settings gui.

    &cNOTE: This module is NOT a hacked client.

    &aIf you have suggestions or find a bug, DM &bUnclaimed#6151
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

// register("renderOverlay", () => {
//     if (!Dungeon.inDungeon) { return }
//     let str = ""
//     for (let i = 0; i < Dungeon.players.length; i++) {
//         let p = Dungeon.players[i]
//         if (!p.currentRoom) { continue }
//         str += `&a${p.player}&f - &b${p.currentRoom.name}\n`
//     }
//     Renderer.drawString(str, 500, 100)
// })

// register("renderOverlay", () => {
//     if (!Dungeon.inDungeon) { return }
//     let str = ""
//     for (let i = 0; i < Dungeon.players.length; i++) {
//         let p = Dungeon.players[i]
//         let f = World.getPlayerByName(p.player)
//         let x = Math.floor(p.iconX)
//         let z = Math.floor(p.iconY)
//         let rx = !f ? 0 : Math.floor(f.getX())
//         let rz = !f ? 0 : Math.floor(f.getZ())
//         let dx = Math.round(p.iconX / f.getX() * 100) / 100
//         let dz = Math.round(p.iconY / f.getZ() * 100) / 100
//         str += `&a${p.player}\n` +
//         `ICON: &e(${x}, ${z})\n` +
//         `REAL: &c(${Math.floor(p.realX)}, ${Math.floor(p.realZ)})\n` +
//         `World: &b(${rx}, ${rz})\n` +
//         `Diff %: &a${dx}, ${dz}`
//     }
//     Renderer.drawString(str, 400, 200)
// })


// These commands were mainly for when I was doing floor 5 party finder and wanted to see who skipped a room lol
// Not 100% accurate, good enough though.
register("command", (...room) => {
    room = room.join(" ")
    let players = []
    if (!Dungeon.inDungeon || Object.keys(Dungeon.players).length == 0) return
    for (let player of Dungeon.players) {
        if (player.visitedRooms.map(a => a.toLowerCase()).includes(room.toLowerCase())) {
            players.push(player.player)
        }
    }
    if (players.length == 0) return ChatLib.chat(`${prefix} &aNobody has visited &b${room}&a!`)
    ChatLib.chat(`${prefix} &aVisited &b${room}&a:\n &a- &b${players.join("\n&a - &b")}`)
}).setName("visited")

register("command", (player) => {
    if (!Dungeon.players.map(a => a.player.toLowerCase()).includes(player.toLowerCase())) return ChatLib.chat(`${prefix} &cNo Rooms!`)
    let p
    let rooms
    for (let pl of Dungeon.players) {
        if (pl.player.toLowerCase() == player.toLowerCase()) {
            p = pl.player
            rooms = pl.visitedRooms
        }
    }
    ChatLib.chat(`${prefix} &a${p}\n&a - &b${rooms.join("\n&a - &b")}`)
}).setName("rooms")

// Thanks to iTqxic for suggesting this
register("scrolled", (x, y, dir) => {
    if (Config.moveMapGui.isOpen()) {
        Config.mapScale += dir == 1 && Config.mapScale < 10 ? 0.1 : Config.mapScale > 0 ? -0.1 : 0
    }
})
// And this
register("guiClosed", () => {
    if (Config.moveMapGui.isOpen() || Config.scoreCalcMoveGui.isOpen()) {
        Config.openGUI()
    }
})
// noob

// 13, 44
// let logs = JSON.parse(FileLib.read("IllegalMap", "data/dungeonLogs.json"))
// for (let log of logs.dungeons) {
//     for (let i = 0; i < log.r.length; i++) {
//         if ([13, 44].includes(log.r[i])) {
//             log.r.splice(i, 1)
//         }
//     }
// }
// FileLib.write("IllegalMap", "data/dungeonLogs.json", JSON.stringify(logs))

// let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json")).rooms
// let logs = JSON.parse(FileLib.read("IllegalMap", "data/dungeonLogs.json"))

// const getRoom = (index) => rooms[index].name
// const getType = (index) => rooms[index].type

// for (let log of logs.dungeons) {
//     for (let i = 0; i < log.r.length; i++) {
//         if (getType(log.r[i]) == "yellow") {
//             ChatLib.chat(`Yellow Found! (${getRoom(log.r[i])})`)
//             log.y = log.r[i]
//             log.r.splice(i, 1)
//             // ChatLib.chat(JSON.stringify(a))
//         }
//     }
// }
// FileLib.write("IllegalMap", "data/dungeonLogs.json", JSON.stringify(logs))

register("command", () => {
    ChatLib.command("tp @p ~1000 ~ ~")
    setTimeout(() => {
        ChatLib.command("tp @p ~-1000 ~ ~") 
    }, 200);
}).setName("rc")