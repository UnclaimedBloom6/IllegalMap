import DmapDungeon from "../components/DmapDungeon"
import { DungeonPlayer } from "../components/DungeonPlayer"
import Room from "../components/Room"
import { hashComponent, prefix } from "../utils/utils"

const getRoomFromName = (roomName) => {
    const room = DmapDungeon.getRoomFromName(roomName)

    if (room) {
        return room
    }

    for (let room of DmapDungeon.dungeonMap.rooms) {
        if (!room.name?.toLowerCase()?.startsWith(roomName)) continue
        return room
    }

    return null
}

/**
 * 
 * @param {Room} room 
 * @param {DungeonPlayer} player 
 */
const getTimeIn = (room, player) => {
    let totalTime = 0
    for (let component of room.components) {
        let index = hashComponent(component)

        totalTime += player.visitedComponents[index]
    }

    return totalTime
}

register("command", (...roomName) => {

    if (!roomName) return ChatLib.chat(`&c/visited <room name>`)

    roomName = roomName.join(" ").toLowerCase()
    const room = getRoomFromName(roomName)
    
    // Don't have to type the whole room name
    if (!room) {
        ChatLib.chat(`${prefix} &cRoom is not in this dungeon!`)
        return
    }

    let msg = ""
    for (let player of DmapDungeon.players) {
        let timeSpent = getTimeIn(room, player)
        if (timeSpent == 0) {
            continue
        }
        
        let seconds = (timeSpent / 1000).toFixed(2)
        msg += `\n  ${player.getName(true)} &7- &b${seconds}s`
    }
    
    if (msg == "") {
        ChatLib.chat(`&eNobody has visited ${room.getName(true)}&e!`)
        return
    }

    ChatLib.chat(`${prefix} &aPlayers who visited ${room.getName()}&a:${msg}`)
}).setName("visited")