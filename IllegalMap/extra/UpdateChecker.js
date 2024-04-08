import config from "../data/Config"
import request from "../../requestV2"
import { prefix } from "../utils"

const currentVersion = JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version

let checked = false
let shouldUpdate = false

const File = Java.type("java.io.File")
const URL = Java.type("java.net.URL")
const PrintStream = Java.type("java.io.PrintStream")
const Byte = Java.type("java.lang.Byte")
const destination = `${Config.modulesFolder}/IllegalMap/IllegalMap.zip`

const update = (url) => {
    // https://github.com/Soopyboo32/SoopyV2UpdateButtonPatcher/blob/master/index.js#L143
    try {
        const dir = new File(destination)
        dir.getParentFile().mkdirs()

        const connection = new URL(url).openConnection()

        connection.setDoOutput(true)
        connection.setConnectTimeout(10000)
        connection.setReadTimeout(10000)
        connection.setRequestMethod("GET")
        connection.connect()

        if (connection.getResponseCode() !== 200) {
            ChatLib.chat(`${prefix} &cThe connection was not successful`)
            connection.disconnect()

            return
        }

        const IS = connection.getInputStream()
        const FilePS = new PrintStream(dir)

        let buf = new Packages.java.lang.reflect.Array.newInstance(Byte.TYPE, 65536)
        let len;

        while ((len = IS.read(buf)) > 0) {
            FilePS.write(buf, 0, len)
        }

        IS.close()
        FilePS.close()
        connection.disconnect()

        if (!dir.exists()) return

        shouldUpdate = true

    } catch (error) {
        print(`${prefix}: ${error}`)
        ChatLib.chat(`${prefix} &cError while attempting to update: ${error}`)
    }
}

register("step", () => {
    if (!World.isLoaded()) return

    if (checked && shouldUpdate) {
        shouldUpdate = false
        
        FileLib.unzip(destination, Config.modulesFolder)
        FileLib.deleteDirectory(destination)
        ChatLib.command("ct load", true)

        return
    }

    if (checked || !config.notifyUpdates) return

    checked = true

    request({
        url: "https://api.github.com/repos/UnclaimedBloom6/IllegalMap/releases/latest",
        json: true
    })
    .then(data => {
        const newVersion = data.tag_name?.replace("v", "")

        if (newVersion === currentVersion) return

        const changelogs = data.body.split("\r\n")

        new Message(`&9&m${ChatLib.getChatBreak(" ")}\n`,
        new TextComponent(`${prefix} &aA new version of IllegalMap is available! (&b${newVersion}&a) Click to go to the Github page! `).setClick(
            "run_command",
            "/dmapupdate"
        ).setHover(
            "show_text",
            "&aClick to run\n&7/dmapupdate"
        ),
        new TextComponent(`&7(Changelog)`).setHover(
            "show_text",
            `&6&nChangeLog for ${newVersion}:\n &7${changelogs.join("\n &7")}`
        ),
        `\n&9&m${ChatLib.getChatBreak(" ")}`).chat()
    })
    .catch(error => ChatLib.chat(`${prefix} &cError whilst checking for update: ${error}`))
}).setFps(1)

register("command", () => {
    request({
        url: "https://api.github.com/repos/UnclaimedBloom6/IllegalMap/releases/latest",
        json: true
    })
    .then(data => {
        const newVersion = data.tag_name?.replace("v", "")

        if (newVersion === currentVersion) return ChatLib.chat(`${prefix} &aAlready up to date`)

        update(data.assets[0].browser_download_url)
    })
    .catch(error => ChatLib.chat(`${prefix} &cError whilst checking for update: ${error}`))
}).setName("dmapupdate")