import RenderLib from "../../RenderLib"
import Config from "../data/Config"
import Dungeon from "../dungeon/Dungeon"

register("renderWorld", () => {
    if (!Config.witherDoorEsp || Dungeon.doors.length == 0 || !Dungeon.inDungeon) return
    let rgb = [Config.witherDoorEspColor.getRed()/255, Config.witherDoorEspColor.getGreen()/255, Config.witherDoorEspColor.getBlue()/255]
    for (let door of Dungeon.doors) {
        if (["wither", "blood"].includes(door.type)) {
            let x = door.x-1
            let z = door.z-1
            RenderLib.drawBaritoneEspBox(x, 69, z, 3, 4, rgb[0], rgb[1], rgb[2], 1, true)
        }
    }
})