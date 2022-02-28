import Dungeon from "../dungeon/Dungeon"
import Config from "../data/Config"
import { chunkLoaded, getTrappedChests, prefix } from "../utils/Utils"

const mimicMessages = [
    /Mimic Killed!/,
    /\$SKYTILS-DUNGEON-SCORE-MIMIC\$/,
    /mimic dead/,
    /Mimic Dead!/,
    /Mimic Revealed in .+!/
]
// Check party chat messages for mimic dead messages
register("chat", (message) => {
    if (!Dungeon.inDungeon || [0, 2].includes(Config.mimicDetection) || Dungeon.mimicDead) return
    message = message.removeFormatting()
    let match = message.match(/Party > (.+): (.+)/)
    if (!match || !match[2]) return
    if (mimicMessages.map(a => match[2].match(a)).filter(a => !!a).length) {
        Dungeon.mimicDead = true
    }
}).setCriteria("${message}")

register("step", () => {
    if (!Dungeon.inDungeon) return
    if (Config.mimicDetection == 0) Dungeon.mimicDead = true
    if (Config.mimicDetection == 1) Dungeon.mimicDead = null
}).setFps(2)

register("step", () => {
    if (!Dungeon.inDungeon || Dungeon.mimicDead || Dungeon.floorInt < 6 || Config.scoreCalc == 2 || !Dungeon.time || Config.mimicDetection !== 3) return
    if (!Dungeon.mimicDead && !Dungeon.mimicLocation) findMimic()
    if (Dungeon.mimicLocation && !Dungeon.bossEntry) checkMimicFound()
}).setFps(2)

// Code from AlonAddons (Thanks Alon)
// Thanks Soopy for making it less laggy (Probably)
register("entityDeath", (entity) => {
    if (!Dungeon.inDungeon || Dungeon.mimicDead || Config.mimicDetection !== 2) return
    if (entity.getClassName() === "EntityZombie") {
        let e = entity.getEntity()
        if (e.func_70631_g_()) {
            if (!e.func_82169_q(0) && !e.func_82169_q(1) && !e.func_82169_q(2) && !e.func_82169_q(3)) {
                Dungeon.mimicDead = true
                let room = Dungeon.getRoomAt([entity.getX(), entity.getZ()])
                if (Config.announceMimic) {
                    ChatLib.command(`pc ${Config.announceMimicMessage.replace("{room}", room.name)}`)
                }
            }
        }
    }
})

const findMimic = () => {
    let chests = {}
    getTrappedChests().forEach(chest => {
        let room = Dungeon.getRoomAt([chest[0], chest[2]])
        if (!room) return
        if (!Object.keys(chests).includes(room.name)) chests[room.name] = 1
        else chests[room.name]++
    })
    let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
    for (let loc of Object.keys(chests)) {
        for (let room of rooms) {
            if (loc == room.name) {
                if (!Object.keys(room).includes("trappedChests") || chests[loc] > room.trappedChests) {
                    Dungeon.mimicLocation = room.name
                    ChatLib.chat(`${prefix} &aMimic found in &b${loc}&a!`)
                }
            }
        }
    }
    if (Dungeon.mimicLocation) {
        Dungeon.rooms.forEach(room => {
            if (room.name == Dungeon.mimicLocation) {
                room.hasMimic = true
            }
        })
    }
}

const checkMimicFound = () => {
    let chests = {}
    for (let chest of getTrappedChests()) {
        if (!chunkLoaded([chest[0], chest[1], chest[2]])) return 
        let room = Dungeon.getRoomAt([chest[0], chest[2]])
        if (!room) return
        if (!Object.keys(chests).includes(room.name)) chests[room.name] = 1
        else chests[room.name]++
    }

    const killedMimic = (roomName) => {
        if (Config.announceMimic) ChatLib.command(`pc ${Config.announceMimicMessage.replace("{room}", Dungeon.mimicLocation)}`)
        Dungeon.mimicLocation = null
        Dungeon.mimicDead = true
        ChatLib.chat(`${prefix} &aMimic Killed!`)
        Dungeon.rooms.forEach(room => {
            if (room.name == roomName) {
                room.hasMimic = false
            }
        })
    }

    if (!Object.keys(chests).includes(Dungeon.mimicLocation)) {
        killedMimic(Dungeon.mimicLocation)
    }
    let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
    for (let loc of Object.keys(chests)) {
        if (loc !== Dungeon.mimicLocation) continue
        for (let room of rooms) {
            if (loc == room.name) {
                if (Object.keys(room).includes("trappedChests") && chests[loc] == room.trappedChests) {
                    killedMimic(Dungeon.mimicLocation)
                }
            }
        }
    }
}