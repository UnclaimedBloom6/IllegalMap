/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Config from "./data/Config";
import Dungeon from "./dungeon/Dungeon";
import DungeonLogger from "./extra/DungeonLogger";
import PaulChecker from "./extra/PaulChecker";
import StarMobEsp from "./extra/StarMobEsp";
import WitherDoorEsp from "./extra/WitherDoorEsp";
import Discord from "./utils/Discord";
import NewRoomCommand from "./utils/NewRoomCommand";
import UpdateChecker from "./utils/UpdateChecker";

import {
    prefix,
    dataObject,
    getKeyInfo
} from "./utils/Utils";

register("command", (...args) => {
    if (!args || !args[0]) { return Config.openGUI() }
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
        Config.mapX = x
        Config.mapY = y
    }
    if (Config.scoreCalcMoveGui.isOpen()) {
        Config.scoreCalcSeperateX = x
        Config.scoreCalcSeperateY = y
    }
})
// Render the map/score calc background when the player is moving them
register("renderOverlay", () => {
    if (Config.moveMapGui.isOpen()) {
        Dungeon.drawBackground()
    }
    if (Config.scoreCalcMoveGui.isOpen()) {
        Dungeon.drawScoreCalcBackground()
    }
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

const myDc = new TextComponent("&bUnclaimed#6151").setHover("show_text", "&aClick to copy!").setClick("run_command", "/ct copy Unclaimed#6151")
let firstTimeMessage = new Message(
	`&b&m${ChatLib.getChatBreak(" ")}\n` +
	`&aThank you for installing IllegalMap 2.0!\n` +
	`&aLegit mode is enabled by default. If you have any suggestions or find bugs, please DM me (`, myDc, `&a).` +
	`\n&cThis module is NOT a hacked client. Please do not ask for me to add things unrelated to the map.\n` +
    `\n&c&lDO NOT USE THIS AS A MEANS TO DRAG DOWN YOUR TEAM BY DODGING ROOMS YOU DON'T WANT TO DO.` +
`\n&b&m${ChatLib.getChatBreak(" ")}`
)

let installMsg = [
    "&b&l&nIllegalMap 3.0",
    "",
    "&aThank for for installing IllegalMap!",
    "&7Legit mode is enabled by default. Use the &b/dmap",
    "&7command to open the settings gui.",
    "",
    "&cNOTE: This module is NOT a hacked client.",
    "",
    "&aIf you have suggestions or find a bug, DM &bUnclaimed#6151"
]

let checked = false
register("step", () => {
    if (dataObject.firstTime || dataObject.uuid !== Player.getUUID()) {
        dataObject.firstTime = false
        dataObject.uuid = Player.getUUID()
        dataObject.save()
        ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
        for (let msg of installMsg) {
            ChatLib.chat(ChatLib.getCenteredText(msg))
        }
        ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)

    }
}).setFps(5)

//  {"name":"Tombstone","type":"rare","secrets":2,"cores":[1965783806]}

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
    if (!Dungeon.inDungeon || Object.keys(Dungeon.players).length == 0) { return }
    for (let player of Dungeon.players) {
        if (player.visitedRooms.map(a => { return a.toLowerCase() }).includes(room.toLowerCase())) {
            players.push(player.player)
        }
    }
    if (players.length == 0) {
        return ChatLib.chat(`${prefix} &aNobody has visited &b${room}&a!`)
    }
    ChatLib.chat(`${prefix} &aVisited &b${room}&a:\n &a- &b` + players.join("\n&a - &b"))
}).setName("visited")

register("command", (player) => {
    if (!Dungeon.players.map(a => { return a.player.toLowerCase()}).includes(player.toLowerCase())) {
        return ChatLib.chat(`${prefix} &cNo Rooms!`)
    }
    let p
    let rooms
    for (let pl of Dungeon.players) {
        if (pl.player.toLowerCase() == player.toLowerCase()) {
            p = pl.player
            rooms = pl.visitedRooms
        }
    }
    ChatLib.chat(`${prefix} &a${p}\n&a - &b` + rooms.join("\n&a - &b"))
}).setName("rooms")

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

// const getRoom = (index) => { return rooms[index].name }
// const getType = (index) => { return rooms[index].type }

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
