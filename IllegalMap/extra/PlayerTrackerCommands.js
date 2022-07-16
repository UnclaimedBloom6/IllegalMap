import { sortObject } from "../../BloomCore/Utils/Utils"
import DmapDungeon from "../Components/DmapDungeon"
import { getColoredName, prefix } from "../utils"


const toSeconds = (ms) => Math.floor(ms/10)/100

export const visitedCommand = register("command", (...room) => {
    room = room.join(" ")
    if (!DmapDungeon.players.length) return
    let found = []
    for (let p of DmapDungeon.players) {
        for (let r of Object.keys(p.visitedRooms)) {
            if (r.toLowerCase() !== room.toLowerCase()) continue
            room = r
            found.push(`&e- ${p.getName(true)} &e- &b${toSeconds(p.visitedRooms[room])}s`)
        }
    }
    if (!found.length) return ChatLib.chat(`${prefix} &cNobody has entered that room!`)
    ChatLib.chat(`${prefix} &aPlayers Who Visisted &b${getColoredName(room)}&a: (&6${found.length}&a)\n${found.join("\n")}`)
}).setName("visited")

export const roomsCommand = register("command", (player) => {
    if (!player && !DmapDungeon.players.length) return
    if (player && !DmapDungeon.players.some(a => a.player.toLowerCase() == player.toLowerCase())) return ChatLib.chat(`${prefix} &cThat player hasn't entered any rooms!`)

    const printRooms = (p) => {
        let hover = `&a${p.getName(true)}&e's Visited Rooms &6(${Object.keys(p.visitedRooms).length})`
        let sorted = sortObject(p.visitedRooms)
        hover += Object.keys(sorted).map(a => `\n&a${getColoredName(a)} &e- &b${toSeconds(sorted[a])}s`).join("")
        new Message(new TextComponent(`&b${p.getName(true)}&a's Visited Rooms &7(Hover)`).setHover("show_text", hover)).chat()
    }
    for (let p of DmapDungeon.players) {
        if (!player) {
            printRooms(p)
            continue
        }
        else if (p.player.toLowerCase() == player.toLowerCase()) return printRooms(p)
    }
}).setName("rooms")