import Config from "../data/Config"
import RenderLib from "../../RenderLib/index"
import {
    prefix
} from "../utils/Utils"
import Dungeon from "../dungeon/Dungeon"

register("renderEntity", (entity, pos, partialTicks, event) => {
    if (!Config.starMobEsp || Config.legitMode || !Dungeon.inDungeon) return
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