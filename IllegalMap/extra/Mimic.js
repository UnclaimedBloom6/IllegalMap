import Dungeon from "../../BloomCore/dungeons/Dungeon"
import DmapDungeon from "../Components/DmapDungeon"
import { chunkLoaded, getRoomsFile, getTrappedChests } from "../utils"
import Config from "../data/Config"

// Find the (possible) mimic chest.
register("step", () => {
    if (!Dungeon.inDungeon || Dungeon.floorNumber < 6 || !Dungeon.time || Dungeon.mimicKilled || DmapDungeon.possibleMimicCoords || Dungeon.bossEntry || !Config.scanMimic) return
    let trappedChests = getTrappedChests()
    let chestRooms = trappedChests.reduce((a, b) => {
        let [x, y, z] = b
        let r = DmapDungeon.getRoomAt([x, z])
        if (!r) return a
        if (!Object.keys(a).includes(r.name)) a[r.name] = []
        a[r.name].push(b)
        return a
    }, {})
    let rooms = getRoomsFile().rooms
    Object.keys(chestRooms).forEach(r => {
        let roomData = rooms.find(a => a.name == r)
        if (!roomData) return
        let trappedChests = roomData.trappedChests ?? 0
        if (chestRooms[r].length <= trappedChests) return delete chestRooms[r]
        let room = DmapDungeon.rooms.find(a => a.name == r)
        if (!room) return
        room.hasMimic = true
    })
    if (!Object.keys(chestRooms).length) return
    DmapDungeon.possibleMimicCoords = chestRooms[Object.keys(chestRooms)[0]] // Should be the only room left
}).setFps(2)

register("step", () => {
    if (Dungeon.mimicKilled || !DmapDungeon.possibleMimicCoords || Dungeon.bossEntry || !Config.scanMimic) return
    DmapDungeon.possibleMimicCoords.forEach(([x, y, z]) => {
        if (!chunkLoaded([x, y, z])) return
        let block = World.getBlockAt(x, y, z)
        if (block.type.getID()) return // Block is not air, so mimic not killed
        Dungeon.mimicKilled = true
        // DmapDungeon.rooms.forEach(r => r.hasMimic = false)
        if (Config.announceMimic) ChatLib.command(`pc ${Config.announceMimicMessage}`)
    })
}).setFps(2)