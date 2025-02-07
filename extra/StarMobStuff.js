import { renderBoxOutline } from "../../BloomCore/RenderUtils"
import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { EntityArmorStand, EntityOtherPlayerMP } from "../../BloomCore/utils/Utils"
import StarMob from "../components/StarMob"
import Config from "../utils/Config"
import { dmapData, prefix } from "../utils/utils"

// https://regex101.com/r/mlyWIK/2
const starMobRegex = /^§6✯ (?:§.)*(.+)§r.+§c❤$|^(Shadow Assassin)$/

const espRenderer = register("renderWorld", () => {
    const color = Config().starMobEspColor
    const r = color[0] / 255
    const g = color[1] / 255
    const b = color[2] / 255

    for (let i = 0; i < starMobs.length; i++) {
        let mob = starMobs[i]
        renderBoxOutline(mob.entity.getRenderX(), mob.y - Math.ceil(mob.height), mob.entity.getRenderZ(), 0.6, mob.height, r, g, b, 1, 2, true)
    }
}).unregister()

// Radar
let starMobs = []
register("tick", () => {
    if ((!Config().radar && !Config().starMobEsp) || !Dungeon.inDungeon) {
        espRenderer.unregister()
        starMobs = []
        return
    }

    let found = []
    const entities = World.getAllEntitiesOfType(EntityArmorStand).concat(World.getAllEntitiesOfType(EntityOtherPlayerMP))

    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i]
        let match = entity.getName().match(starMobRegex)
        if (!match) continue

        
        let mob = new StarMob(entity)
        let [_, mobName, sa] = match

        let height = 1.9

        if (!sa) {
            if (/^(?:\w+ )*Fels$/.test(mobName)) {
                height = 2.8
            }
            else if (/^(?:\w+ )*Withermancer$/.test(mobName)) {
                height = 2.8
            }
        }
        else {
            mob.y += 2
        }

        mob.height = height

        found.push(mob)
    }

    starMobs = found

    if (!starMobs.length || !Config().starMobEsp) {
        espRenderer.unregister()
        return
    }

    espRenderer.register()
})

export const renderRadar = () => {
    if (!starMobs.length) {
        return
    }

    // This code is ran inside of the main map rendering function, so it's already been translated and scaled to the top left corner of the map

    let headSize = 10 * Config().radarHeadScale

    for (let i = 0; i < starMobs.length; i++) {
        let mob = starMobs[i]
        let renderX = mob.iconX
        let renderY = mob.iconY

        Renderer.translate(renderX, renderY)
        Renderer.rotate(mob.yaw)
        Renderer.translate(-headSize/2, -headSize/2)

        if (Config().radarHeads && mob.icon) {

            if (Config().radarHeadsBorder) {
                let [r, g, b, a] = Config().radarHeadsBorderColor
                Renderer.drawRect(Renderer.color(r, g, b, a), -headSize/12, -headSize/12, headSize + headSize/6, headSize + headSize/6)
            }

            Renderer.drawImage(mob.icon, 0, 0, headSize, headSize)
        }
        else {
            // Unknown mob
            let color = Config().minibossColors && this.iconColor ? this.iconColor : Renderer.color(...Config().starMobEspColor)
            Renderer.drawCircle(color, 0, 0, headSize/4, 100, 1)
            if (Config().starMobBorder) Renderer.drawCircle(Renderer.color(0, 0, 0, 255), dmapData.map.x + this.iconX, dmapData.map.y + this.iconY, headSize/3.5, 100, 0)
        }

        Renderer.translate(headSize/2, headSize/2)
        Renderer.rotate(-mob.yaw)
        Renderer.translate(-renderX, -renderY)
    }
}

Config().getConfig().registerListener("starMobEsp", (prev, curr) => {
    if (curr) {
        espRenderer.register()
    }
    else {
        espRenderer.unregister()
    }
})

register("command", () => {
    Config().getConfig().setConfigValue("Radar", "radar", !Config().radar)

    ChatLib.chat(`${prefix} ${Config().radar ? '&aRadar Enabled!' : "&cRadar Disabled"}`)
}).setName("radar")

register("command", () => {
    Config().getConfig().setConfigValue("Radar", "starMobEsp", !Config().starMobEsp)
    ChatLib.chat(`${prefix} &aStar Mob ESP ${Config().starMobEsp ? '&aEnabled!' : "&cDisabled"}`)

    if (Config().starMobEsp) {
        espRenderer.register()
    }
    else {
        espRenderer.unregister()
    }
}).setName("star")