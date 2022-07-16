import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import RenderLib from "../../RenderLib"
import DmapDungeon from "../Components/DmapDungeon"
import Config from "../data/Config"

register("renderWorld", () => {
    if (!Config.enabled || !Config.witherDoorEsp || DmapDungeon.doors.length == 0 || !Dungeon.inDungeon) return
    let rgb = [Config.witherDoorEspColor.getRed()/255, Config.witherDoorEspColor.getGreen()/255, Config.witherDoorEspColor.getBlue()/255]
    for (let door of DmapDungeon.doors) {
        if (!["wither", "blood"].includes(door.type)) continue
        let x = door.x-1
        let z = door.z-1
        RenderLib.drawBaritoneEspBox(x, 69, z, 3, 4, rgb[0], rgb[1], rgb[2], 1, true)
    }
})