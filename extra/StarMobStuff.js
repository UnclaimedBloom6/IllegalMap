import { renderBoxOutline } from "../../BloomCore/RenderUtils"
import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { registerWhen } from "../../BloomCore/utils/Utils"
import StarMob from "../components/StarMob"
import Config from "../utils/Config"
import { prefix } from "../utils/utils"

// https://regex101.com/r/mlyWIK/2
const starMobRegex = /^§6✯ (?:§.)*(.+)§r.+§c❤$|^(Shadow Assassin)$/

// Radar
let starMobs = []
register("tick", () => {
    if ((!Config.radar && !Config.starMobEsp) || !Config.enabled || !Dungeon.inDungeon) return starMobs = []

    let star = []

    World.getAllEntities().forEach(entity => {
        const match = entity.getName().match(starMobRegex)
        if (!match) return false

        const mob = new StarMob(entity)
        const [_, mobName, sa] = match

        let height = 1.9

        if (!sa) {
            if (/^(?:\w+ )*Fels$/.test(mobName)) height = 2.8
            else if (/^(?:\w+ )*Withermancer$/.test(mobName)) height = 2.8
        }

        mob.height = height

        star.push(mob)
    })

    starMobs = star
})

register("command", () => {
    Config.radar = !Config.radar
    ChatLib.chat(`${prefix} ${Config.radar ? '&aRadar Enabled!' : "&cRadar Disabled"}`)
}).setName("star")

export const renderStarMobStuff = () => {
    if (Config.radar) starMobs.forEach(a => a.render())
}

registerWhen(register("renderWorld", () => {
    if (!starMobs.length) return

    const r = Config.starMobEspColor.getRed()/255
    const g = Config.starMobEspColor.getGreen()/255
    const b = Config.starMobEspColor.getBlue()/255

    starMobs.forEach(mob => {
        renderBoxOutline(mob.x, mob.y - Math.ceil(mob.height), mob.z, 0.6, mob.height, r, g, b, 1, 2, true)
    })

}), () => Config.starMobEsp)

// registerWhen(register("renderEntity", (entity) => {
//     const entityName = entity.getName()
//     const match = entityName.match(starMobRegex)
//     if (!match) return

//     const [_, mobName, sa] = match

//     const r = Config.starMobEspColor.getRed()/255
//     const g = Config.starMobEspColor.getGreen()/255
//     const b = Config.starMobEspColor.getBlue()/255
//     const x = entity.getRenderX()
//     const y = entity.getRenderY()
//     const z = entity.getRenderZ()

//     let height = 1.9

//     // Shadow assassins are just called "Shadow Assassin"
//     if (sa) {
//         renderBoxOutline(x, y, z, 0.6, height, r, g, b, 1, 2, true)
//         return
//     }

//     if (/^(?:\w+ )*Fels$/.test(mobName)) height = 2.8
//     if (/^(?:\w+ )*Withermancer$/.test(mobName)) height = 2.8

//     renderBoxOutline(x, y - Math.ceil(height), z, 0.6, height, r, g, b, 1, 2, true)
// }), () => Config.starMobEsp)

register("command", () => {
    Config.starMobEsp = !Config.starMobEsp
    ChatLib.chat(`${prefix} &aStar mobs set to ${Config.starMobEsp ? "&aTrue" : "&cFalse"}`)
}).setName("staresp")