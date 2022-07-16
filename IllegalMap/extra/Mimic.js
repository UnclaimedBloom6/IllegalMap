import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import DmapDungeon from "../Components/DmapDungeon"
import Config from "../data/Config"
import { chunkLoaded, getTrappedChests, prefix } from "../utils"

let hasAnnouncedMimic = false

// Legit mimic stuff
// Check party chat for mimic messages
register("chat", (p, message, e) => {
    let customMessages = Config.extraMimicMessages.split(",").map(a => a.trim())
    if (customMessages.some(a => a == message.toLowerCase())) Dungeon.mimicKilled = true
}).setCriteria("Party > ${p}: ${message}")

register("tick", () => {
    if (!Config.enabled || !Dungeon.inDungeon || !Dungeon.mimicKilled || !Config.announceMimic || hasAnnouncedMimic) return
    killedMimic()
})

const killedMimic = () => {
    if (Config.announceMimic && !hasAnnouncedMimic) ChatLib.command(`pc ${Config.announceMimicMessage}`)
    ChatLib.chat(`${prefix} &aMimic Killed!`)
    hasAnnouncedMimic = true
    DmapDungeon.mimicLocation = null
    Dungeon.mimicKilled = true
    DmapDungeon.rooms.forEach(room => {
        room.hasMimic = false
    })
}

// Mimic scanning stuff
register("step", () => {
    if (!Config.enabled || !Config.scanMimic || !Dungeon.time) return
    if (!Dungeon.inDungeon || Dungeon.mimicKilled || Dungeon.floorNumber < 6 || Config.dungeonInfo == 2) return
    if (!Dungeon.mimicKilled && !DmapDungeon.mimicLocation) findMimic()
    if (DmapDungeon.mimicLocation && !Dungeon.bossEntry) checkMimicFound()
}).setFps(2)

const findMimic = () => {
    let chests = {}
    getTrappedChests().forEach(chest => {
        let room = DmapDungeon.getRoomAt([chest[0], chest[2]])
        if (!room) return
        if (!Object.keys(chests).includes(room.name)) chests[room.name] = 1
        else chests[room.name]++
    })
    let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
    for (let loc of Object.keys(chests)) {
        for (let room of rooms) {
            if (loc !== room.name) continue
            if (Object.keys(room).includes("trappedChests") && chests[loc] <= room.trappedChests) continue
            DmapDungeon.mimicLocation = room.name
            ChatLib.chat(`${prefix} &aMimic found in &b${loc}&a!`)
        }
    }
    if (!DmapDungeon.mimicLocation) return
    DmapDungeon.rooms.forEach(room => {
        if (room.name !== DmapDungeon.mimicLocation) return
        room.hasMimic = true
    })
}

const checkMimicFound = () => {
    let chests = {}
    for (let chest of getTrappedChests()) {
        if (!chunkLoaded([chest[0], chest[1], chest[2]])) return 
        let room = DmapDungeon.getRoomAt([chest[0], chest[2]])
        if (!room) return
        if (!Object.keys(chests).includes(room.name)) chests[room.name] = 1
        else chests[room.name]++
    }

    if (!Object.keys(chests).includes(DmapDungeon.mimicLocation)) {
        killedMimic()
    }
    let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
    for (let loc of Object.keys(chests)) {
        if (loc !== DmapDungeon.mimicLocation) continue
        for (let room of rooms) {
            if (loc !== room.name) continue
            if (!Object.keys(room).includes("trappedChests") || chests[loc] !== room.trappedChests) continue
            killedMimic()
        }
    }
}

register("worldUnload", () => hasAnnouncedMimic = false)