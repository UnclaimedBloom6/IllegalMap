import Config from "./Config"
import request from "../../requestV2"
import { sendError } from "./utils"

const checkTrigger = register("worldLoad", () => {
    checkTrigger.unregister()

    if (!Config().notifyUpdates) return

    const currentVers = JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version

    request({
        url: `https://api.github.com/repos/UnclaimedBloom6/IllegalMap/releases`,
        json: true
    }).then(data => {
        // No versions found, this should never happen but it probably somehow will
        if (!data || !data.length) return
        
        const currVersionIndex = data.findIndex(a => a.tag_name == `v${currentVers}`)
        // ChatLib.chat(`Current Version Index: ${currVersionIndex}`)

        // Currently on latest version
        if (currVersionIndex == 0) return

        // Using a version which isn't present in the GitHub releases, dev build?
        if (currVersionIndex == -1) return

        // Message header
        let updateMessage = `&9&m${ChatLib.getChatBreak(" ")}\n`
        updateMessage += `&aIllegalMap Update Available! (${data[0].tag_name})\n`
        if (currVersionIndex > 1) {
            updateMessage += `&eYou are ${currVersionIndex} versions behind!\n`
        }

        // Build the changelog for each version
        for (let version of data.slice(0, currVersionIndex)) {
            updateMessage += `\n&7Version ${version.tag_name}:\n`
            for (let line of version.body.split("\n")) {
                updateMessage += `${line.trim().addColor()}\n`
            }
        }

        const msg = new Message(updateMessage)
        msg.addTextComponent(
            new TextComponent(`\n&aClick to go to the Github release page!`)
                .setClick("open_url", data[0].html_url)
        )

        msg.addTextComponent(new TextComponent(`\n&9&m${ChatLib.getChatBreak(" ")}\n`))

        msg.chat()

    }).catch(e => sendError(e, "updateChecker"))
})