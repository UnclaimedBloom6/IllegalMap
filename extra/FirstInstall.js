import { dmapData } from "../utils/utils"

const gc = (text) => ChatLib.getCenteredText(text) // getCentered
const cc = (text) => ChatLib.chat(gc(text)) // centerChat

const firstReg = register("step", () => {
    firstReg.unregister()

    if (!dmapData.firstTime) {
        return
    }

    dmapData.firstTime = false 
    dmapData.save()
    
    ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
    cc(`&b&l&nIllegalMap ${JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version}`)
    cc("&a&a&b&c&d&e")
    cc("&7To configure the module, run &b/dmap")
    cc("&a&a&b&c&d&e&r")
    new TextComponent(gc("&6Click here &7to join my Discord server to report")).setClick("open_url", "https://discord.gg/pykzREcAuZ").setHover("show_text", "&9https://discord.gg/pykzREcAuZ").chat()
    cc("&7bugs or make suggestions!")
    cc("&a&a&b&c&d&d&e")
    ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
}).setFps(5)