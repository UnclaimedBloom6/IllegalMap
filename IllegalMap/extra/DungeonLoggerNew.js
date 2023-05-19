import { appendToFile, getServerID } from "../../BloomCore/utils/Utils"
import DmapDungeon from "../components/DmapDungeon"
import { dmapData } from "../utils"
import Config from "../data/Config"

let logged = false
DmapDungeon.onDungeonAllScanned(dung => {
    const serverID = getServerID()
    if (logged || serverID == dmapData.lastLogServerNew) return
    dmapData.lastLogServerNew = serverID
    dmapData.save()

    const str = dung.dungeonMap.convertToString()
    if (!str) return ChatLib.chat(`&cInvalid dungeon string!`)

    appendToFile("IllegalMap", "data/dungeons.txt", str)

    if (!Config.logDungeonChatInfo) return

    new Message(
        `&aSaved Dungeon! `,
        new TextComponent(`&6[CLICK]`).setClick("run_command", `/viewdung ${str}`),
        ` &aMap Score: &6${DmapDungeon.dungeonMap.mapScore}`
    ).chat()
})