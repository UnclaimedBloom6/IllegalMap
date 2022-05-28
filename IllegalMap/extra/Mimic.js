import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import Config from "../data/Config"
import IMDungeon from "../dungeon/IMDungeon"
import { chunkLoaded, getTrappedChests, prefix } from "../utils/Utils"

register("step", () => {
    if (!Dungeon.inDungeon) return
    if (Config.mimicDetection == 0) Dungeon.mimicKilled = true
    if (Config.mimicDetection == 1) Dungeon.mimicKilled = false
}).setFps(2)

register("step", () => {
    if (!Dungeon.inDungeon || Config.legitMode || Dungeon.mimicKilled || Dungeon.floorNumber < 6 || Config.dungeonInfo == 2 || !Dungeon.time || Config.mimicDetection !== 3) return
    if (!Dungeon.mimicKilled && !IMDungeon.mimicLocation) findMimic()
    if (IMDungeon.mimicLocation && !Dungeon.bossEntry) checkMimicFound()
}).setFps(2)

const findMimic = () => {
    let chests = {}
    getTrappedChests().forEach(chest => {
        let room = IMDungeon.getRoomAt([chest[0], chest[2]])
        if (!room) return
        if (!Object.keys(chests).includes(room.name)) chests[room.name] = 1
        else chests[room.name]++
    })
    let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
    for (let loc of Object.keys(chests)) {
        for (let room of rooms) {
            if (loc !== room.name) continue
            if (Object.keys(room).includes("trappedChests") && chests[loc] <= room.trappedChests) continue
            IMDungeon.mimicLocation = room.name
            ChatLib.chat(`${prefix} &aMimic found in &b${loc}&a!`)
        }
    }
    if (!IMDungeon.mimicLocation) return
    IMDungeon.rooms.forEach(room => {
        if (room.name !== IMDungeon.mimicLocation) return
        room.hasMimic = true
    })
}

const checkMimicFound = () => {
    let chests = {}
    for (let chest of getTrappedChests()) {
        if (!chunkLoaded([chest[0], chest[1], chest[2]])) return 
        let room = IMDungeon.getRoomAt([chest[0], chest[2]])
        if (!room) return
        if (!Object.keys(chests).includes(room.name)) chests[room.name] = 1
        else chests[room.name]++
    }

    const killedMimic = (roomName) => {
        if (Config.announceMimic) ChatLib.command(`pc ${Config.announceMimicMessage.replace("{room}", IMDungeon.mimicLocation)}`)
        IMDungeon.mimicLocation = null
        Dungeon.mimicKilled = true
        ChatLib.chat(`${prefix} &aMimic Killed!`)
        IMDungeon.rooms.forEach(room => {
            if (room.name !== roomName) return
            room.hasMimic = false
        })
    }

    if (!Object.keys(chests).includes(IMDungeon.mimicLocation)) {
        killedMimic(IMDungeon.mimicLocation)
    }
    let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
    for (let loc of Object.keys(chests)) {
        if (loc !== IMDungeon.mimicLocation) continue
        for (let room of rooms) {
            if (loc !== room.name) continue
            if (!Object.keys(room).includes("trappedChests") || chests[loc] !== room.trappedChests) continue
            killedMimic(IMDungeon.mimicLocation)
        }
    }
}