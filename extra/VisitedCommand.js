import DmapDungeon from "../components/DmapDungeon"
import { prefix } from "../utils/utils"


register("command", (...roomName) => {

    if (!roomName) return ChatLib.chat(`&c/visited <room name>`)

    roomName = roomName.join(" ").toLowerCase()
    let room = DmapDungeon.getRoomFromName(roomName)
    
    // Don't have to type the whole room name
    if (!room) {
        for (let r of DmapDungeon.dungeonMap.rooms) {
            if (!r.name?.toLowerCase()?.startsWith(roomName)) continue
            room = r
            break
        }
    }
    if (!room) return ChatLib.chat(`${prefix} &cRoom is not in this dungeon!`)

    let msg = ""
    for (let player of DmapDungeon.players) {
        if (!player.visitedRooms.has(room)) continue
        
        let seconds = Math.floor(player.visitedRooms.get(room)/10)/100
        msg += `\n  ${player.getName(true)} &7- &b${seconds}s`
    }
    if (msg == "") return ChatLib.chat(`&eNobody has visited ${room.getName(true)}&e!`)

    ChatLib.chat(`${prefix} &aPlayers who visited ${room.getName()}&a:${msg}`)
}).setName("visited")