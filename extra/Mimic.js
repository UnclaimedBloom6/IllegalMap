import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { chunkLoaded, getTrappedChests, roomsJson } from "../utils/utils"
import Config from "../utils/Config"
import DmapDungeon from "../components/DmapDungeon"

let possibleMimicCoords = null

// Find the (possible) mimic chest.
register("step", () => {
    if (!Dungeon.inDungeon || Dungeon.floorNumber < 6 || !Dungeon.time || Dungeon.mimicKilled || possibleMimicCoords || Dungeon.bossEntry || !Config().scanMimic) return
    let trappedChests = getTrappedChests()
    let chestRooms = trappedChests.reduce((a, b) => {
        let [x, y, z] = b
        const room = DmapDungeon.getRoomAt(x, z)
        if (!room) return a

        if (!Object.keys(a).includes(room.name)) a[room.name] = []
        a[room.name].push(b)
        return a
    }, {})

    Object.keys(chestRooms).forEach(r => {
        const roomData = roomsJson.find(a => a.name == r)
        if (!roomData) return

        const trappedChests = roomData.trappedChests ?? 0
        if (chestRooms[r].length <= trappedChests) return delete chestRooms[r]

        const room = DmapDungeon.getRoomFromName(r)
        if (!room) return

        room.hasMimic = true
    })
    if (!Object.keys(chestRooms).length) return

    possibleMimicCoords = chestRooms[Object.keys(chestRooms)[0]] // Should be the only room left
}).setFps(2)

register("step", () => {
    if (!Dungeon.inDungeon || Dungeon.mimicKilled || !possibleMimicCoords || Dungeon.bossEntry || !Config().scanMimic) return
    possibleMimicCoords.forEach(([x, y, z]) => {
        if (!chunkLoaded([x, y, z])) return

        const block = World.getBlockAt(x, y, z)
        if (block.type.getID()) return // Block is not air, so mimic not killed

        Dungeon.mimicKilled = true
        if (Config().announceMimic) ChatLib.command(`pc ${Config().announceMimicMessage}`)
    })
}).setFps(2)

register("worldUnload", () => {
    possibleMimicCoords = null
})