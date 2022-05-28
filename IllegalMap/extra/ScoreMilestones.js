import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import Config from "../data/Config"
import { prefix } from "../utils/Utils"

let said270 = false
let said300 = false

register("tick", () => {
    if (!Dungeon.inDungeon || (!Config.scoreMilestones && !Config.announce270 && !Config.announce300)) return
    if (Dungeon.score >= 270 && !said270) {
        if (Config.announce270) ChatLib.command(`pc ${Config.announce270Message}`)
        if (Config.scoreMilestones) ChatLib.chat(`${prefix} &b270 Score Reached! &e(&a${Dungeon.time}&e)`)
        said270 = true
    }
    if (Dungeon.score >= 300 && !said300) {
        if (Config.announce300) ChatLib.command(`pc ${Config.announce300Message}`)
        if (Config.scoreMilestones) ChatLib.chat(`${prefix} &b300 Score Reached! &e(&a${Dungeon.time}&e)`)
        said300 = true
    }
})
register("worldLoad", () => {
    said270 = false
    said300 = false
})