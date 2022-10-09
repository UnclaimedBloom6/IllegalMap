import Config from "../data/Config"
import request from "../../requestV2"
import { prefix } from "../utils"

let checked = false
register("step", () => {
    if (checked || !Config.notifyUpdates) return
    checked = true
    request("https://raw.githubusercontent.com/UnclaimedBloom6/IllegalMap/main/IllegalMapAPI.json").then(stuff => {
        stuff = JSON.parse(stuff.replace(new RegExp("    ", "g"), ""))
        // ChatLib.chat(JSON.stringify(stuff, "", 4))
        let metadata = JSON.parse(FileLib.read("IllegalMap", "metadata.json"))

        if (metadata.version == stuff.latestVersion) return
        
        new Message(`&9&m${ChatLib.getChatBreak(" ")}\n`,
        new TextComponent(`${prefix} &aA new version of IllegalMap is available! (&c${stuff.latestVersion}&a) Click to go to the Github page! `).setClick(
            "open_url",
            "https://github.com/UnclaimedBloom6/IllegalMap"
        ).setHover(
            "show_text",
            "&aClick to open\n&7https://github.com/UnclaimedBloom6/IllegalMap"
        ),
        new TextComponent(`&7(Changelog)`).setHover(
            "show_text",
            `&6&nChangeLog for ${stuff.latestVersion}:\n &7- ` + stuff.changelog.join("\n &7- ")
        ),
        `\n&9&m${ChatLib.getChatBreak(" ")}`).chat()
    }).catch(error => {
        ChatLib.chat(`${prefix} &cError whilst checking for update: ${error}`)
    })
})