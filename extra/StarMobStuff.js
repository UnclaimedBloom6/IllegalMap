import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { EntityArmorStand, EntityOtherPlayerMP, getEntityID } from "../../BloomCore/utils/Utils"
import StarMob from "../components/StarMob"
import Config from "../utils/Config"
import { dmapData, prefix } from "../utils/utils"

const S0FPacketSpawnMob = Java.type("net.minecraft.network.play.server.S0FPacketSpawnMob")
const S1CPacketEntityMetadata = Java.type("net.minecraft.network.play.server.S1CPacketEntityMetadata")
const JavaString = Java.type("java.lang.String")

const MCTessellator = Java.type("net.minecraft.client.renderer.Tessellator")./* getInstance */func_178181_a()
const DefaultVertexFormats = Java.type("net.minecraft.client.renderer.vertex.DefaultVertexFormats")
const WorldRenderer = MCTessellator./* getWorldRenderer */func_178180_c()

if (!dmapData.changedStarMobAlpha) {
    dmapData.changedStarMobAlpha = true
    Config().getConfig().setConfigValue("Radar", "starMobEspColor", [
        Config().starMobEspColor[0],
        Config().starMobEspColor[1],
        Config().starMobEspColor[2],
        0.2 * 255
    ])
    ChatLib.chat(`${prefix} &aUpdated star mob color`)
    dmapData.save()
}

const lerpViewEntity = (pticks) => {
    if (!pticks) pticks = Tessellator.getPartialTicks()
    const entity = Client.getMinecraft()./* getRenderViewEntity */func_175606_aa()

    return [
        entity./* lastTickPosX */field_70142_S + (entity./* posX */field_70165_t - entity./* lastTickPosX */field_70142_S) * pticks,
        entity./* lastTickPosY */field_70137_T + (entity./* posY */field_70163_u - entity./* lastTickPosY */field_70137_T) * pticks,
        entity./* lastTickPosZ */field_70136_U + (entity./* posZ */field_70161_v - entity./* lastTickPosZ */field_70136_U) * pticks
    ]
}

// https://regex101.com/r/mlyWIK/2
const starMobRegex = /^§6✯ (?:§.)*(.+)§r.+§c❤$|^(Shadow Assassin)$/
const goodEntityIds = new Map() // Map<entityID, { height, dy }

const espRenderer = register("renderWorld", (pticks) => {
    const color = Config().starMobEspColor
    const r = color[0] / 255
    const g = color[1] / 255
    const b = color[2] / 255
    const a = color[3] / 255
    
    const [ rx, ry, rz ] = lerpViewEntity(pticks)

    GlStateManager./* pushMatrix */func_179094_E()
    GlStateManager./* disableTexture2D */func_179090_x()
    // Technically not needed because it's renderWorld
    // GlStateManager.disableLighting()
    GlStateManager./* disableDepth */func_179097_i()
    GlStateManager./* enableBlend */func_179147_l()
    GlStateManager./* tryBlendFuncSeparate */func_179120_a(770, 771, 1, 0)
    GlStateManager./* translate */func_179137_b(-rx, -ry, -rz)
    GlStateManager./* color */func_179131_c(r, g, b, 1)
    GlStateManager.func_179129_p(); // disableCullFace

    GL11.glLineWidth(2)
    
    for (let i = 0; i < starMobs.length; i++) {
        let mob = starMobs[i]
        let x = mob.entity.getRenderX()
        let y = mob.y - Math.ceil(mob.height)
        let z = mob.entity.getRenderZ()
        // let w = 0.6
        let h = mob.height
        
        // ChatLib.chat(`x=${x} y=${y} z=${z} h=${h}`)
        WorldRenderer./* begin */func_181668_a(GL11.GL_LINE_STRIP, DefaultVertexFormats./* POSITION */field_181705_e)
        Tessellator.colorize(r, g, b, 1)

        WorldRenderer./* pos */func_181662_b(x-0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z+0.3)./* endVertex */func_181675_d()

        MCTessellator./* draw */func_78381_a()

        if (a == 0)  {
            continue
        }

        WorldRenderer./* begin */func_181668_a(GL11.GL_QUADS, DefaultVertexFormats./* POSITION */field_181705_e)
        GlStateManager./* color */func_179131_c(r, g, b, a)
    
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z+0.3)./* endVertex */func_181675_d()

        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z+0.3)./* endVertex */func_181675_d()

        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z+0.3)./* endVertex */func_181675_d()

        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z+0.3)./* endVertex */func_181675_d()

        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z-0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z-0.3)./* endVertex */func_181675_d()

        WorldRenderer./* pos */func_181662_b(x-0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y+h, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x+0.3, y, z+0.3)./* endVertex */func_181675_d()
        WorldRenderer./* pos */func_181662_b(x-0.3, y, z+0.3)./* endVertex */func_181675_d()

        MCTessellator./* draw */func_78381_a()
    
        // renderBoxOutline(mob.entity.getRenderX(), mob.y - Math.ceil(mob.height), mob.entity.getRenderZ(), 0.6, mob.height, r, g, b, 1, 2, true)
    }
    
    GL11.glLineWidth(1)

    GlStateManager.func_179089_o(); // enableCull
    GlStateManager./* enableTexture2D */func_179098_w()
    // Technically not needed because it's renderWorld
    // GlStateManager.enableLighting()
    GlStateManager./* enableDepth */func_179126_j()
    GlStateManager./* disableBlend */func_179084_k()
    GlStateManager./* popMatrix */func_179121_F()
}).unregister()


const processWatcher = (entityId, watcher) => {
    if (!watcher) {
        return
    }

    for (let watchableObject of watcher) {
        let type = watchableObject.func_75674_c()
        let object = watchableObject.func_75669_b()
    
        if (type !== 4 || !(object instanceof JavaString) || object.trim() == "") {
            continue
        }

        let match = object.match(starMobRegex)
        if (!match) {
            continue
        }

        let [_, mobName, sa] = match

        let height = 1.8
        let dy = 0

        if (!sa) {
            if (/^(?:\w+ )*Fels$/.test(mobName)) {
                height = 2.8
            }
            else if (/^(?:\w+ )*Withermancer$/.test(mobName)) {
                height = 2.8
            }
        }
        else {
            dy = 2
        }

        goodEntityIds.set(entityId, { height, dy })
    }
}

const metaChecker = register("packetReceived", (packet) => {
    const entityId = packet.func_149024_d()
    const watcher = packet.func_149027_c()
    
    processWatcher(entityId, watcher)
}).setFilteredClass(S0FPacketSpawnMob).unregister()

const spawnChecker = register("packetReceived", (packet) => {
    const entityId = packet.func_149375_d()
    const watcher = packet.func_149376_c()

    processWatcher(entityId, watcher)
}).setFilteredClass(S1CPacketEntityMetadata).unregister()

// Radar
let starMobs = []
const tickChecker = register("tick", () => {
    if (!Dungeon.inDungeon) {
        espRenderer.unregister()
        return
    }

    let found = []
    const entities = World.getAllEntitiesOfType(EntityArmorStand).concat(World.getAllEntitiesOfType(EntityOtherPlayerMP))

    for (let i = 0; i < entities.length; i++) {
        let entity = entities[i]
        let entityId = getEntityID(entity)

        let height = 1.8
        let dy = 0

        let entry = goodEntityIds.get(entityId)

        if (entry) {
            height = entry.height
            dy = entry.dy
        }
        else if (entity.getName() == "Shadow Assassin") {
            height = 1.8
            dy = 2
        }
        else {
            continue
        }

        // let { height, dy } = entry
        let mob = new StarMob(entity)
        mob.height = height
        mob.y += dy

        found.push(mob)
    }

    starMobs = found

    if (!starMobs.length) {
        espRenderer.unregister()
        return
    }

    espRenderer.register()
}).unregister()

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

if (Config().starMobEsp) {
    spawnChecker.register()
    metaChecker.register()
    tickChecker.register()
}

Config().getConfig().registerListener("starMobEsp", (prev, curr) => {
    if (curr) {
        tickChecker.register()
        spawnChecker.register()
        metaChecker.register()
        // badEntityIds.clear()
    }
    else {
        tickChecker.unregister()
        spawnChecker.unregister()
        metaChecker.unregister()
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
        // badEntityIds.clear()
    }
    else {
        espRenderer.unregister()
    }
}).setName("star")

register("worldUnload", () => {
    // badEntityIds.clear()
    goodEntityIds.clear()
})