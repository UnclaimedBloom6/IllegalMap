import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import RenderLib from "../../RenderLib"
import StarMob from "../Components/StarMob"
import Config from "../data/Config"
import { prefix } from "../utils"

// Radar
let starMobs = []
register("tick", () => {
    if (!Config.radar || !Config.enabled || !Dungeon.inDungeon) return starMobs = []
    starMobs.map(a => a.update())
    let validMobs = ["✯", "Shadow Assassin"]
    let star = World.getAllEntities().filter(e => validMobs.some(a => e.getName().includes(a)))
    let validUUIDs = star.map(a => a.getUUID())
    starMobs = starMobs.filter(a => validUUIDs.includes(a.id))
    let validStarMobs = star.filter(a => !starMobs.some(e => e.id == a.getUUID())).map(a => new StarMob(a))
    starMobs = starMobs.concat(validStarMobs)
    // ChatLib.chat(starMobs.length)
})

register("command", () => {
    Config.radar = !Config.radar
    ChatLib.chat(`${prefix} ${Config.radar ? '&aRadar Enabled!' : "&cRadar Disabled"}`)
}).setName("star")

export const renderStarMobStuff = () => {
    if (Config.radar) starMobs.map(a => a.render())
}

register("renderEntity", (entity, pos, partialTicks, event) => {
    if (!Config.enabled || !Config.starMobEsp || !Dungeon.inDungeon) return
    let name = entity.getName()
    const espBox = (x, y, z, height) => {
        RenderLib.drawEspBox(x, y-height, z, 0.9, height, Config.starMobEspColor.getRed()/255, Config.starMobEspColor.getGreen()/255, Config.starMobEspColor.getBlue()/255, 1, true)
    }
    if (name.includes("✯") || name.includes("Shadow Assassin") || name.includes("Frozen Adventurer") || name.includes("Lost Adventurer")) {
        if (name.includes("Fel") || name.includes("Withermancer")) {
            espBox(entity.getX(), entity.getY(), entity.getZ(), 2.8)
        }
        else {
            espBox(entity.getX(), entity.getY(), entity.getZ(), 1.9)
        }
    }
})

register("command", () => {
    Config.starMobEsp = !Config.starMobEsp
    ChatLib.chat(`${prefix} &aStar mobs set to ${Config.starMobEsp ? "&aTrue" : "&cFalse"}`)
}).setName("staresp")