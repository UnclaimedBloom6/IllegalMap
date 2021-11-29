/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Config from "./data/Config";
import Dungeon from "./dungeon/Dungeon";
import PaulChecker from "./extra/PaulChecker";
import StarMobEsp from "./extra/StarMobEsp";
import WitherDoorEsp from "./extra/WitherDoorEsp";
import Discord from "./utils/Discord";
import NewRoomCommand from "./utils/NewRoomCommand";
import UpdateChecker from "./utils/UpdateChecker";

import {
    prefix,
    dataObject,
    getKeyInfo
} from "./utils/Utils";

register("command", (...args) => {
    if (!args || !args[0]) { return Config.openGUI() }
    else if (["setkey", "key"].includes(args[0])) {
        new Message(`${prefix} &aChecking API key...`).setChatLineId(46574).chat()
        getKeyInfo(args[1]).then(keyInfo => {
            dataObject.apiKey = args[1]
            dataObject.save()
            ChatLib.editChat(46574, new Message(`${prefix} &aAPI Key set successfully!`))
        }).catch(error => {
            ChatLib.editChat(46574, new Message(`${prefix} &cError: API Key invalid!`))
        })
    }
}).setName("dmap")

// Moving the map/score calc
register("dragged", (dx, dy, x, y) => {
    if (Config.moveMapGui.isOpen()) {
        Config.mapX = x
        Config.mapY = y
    }
    if (Config.scoreCalcMoveGui.isOpen()) {
        Config.scoreCalcSeperateX = x
        Config.scoreCalcSeperateY = y
    }
})
// Render the map/score calc background when the player is moving them
register("renderOverlay", () => {
    if (Config.moveMapGui.isOpen()) {
        Dungeon.drawBackground()
    }
    if (Config.scoreCalcMoveGui.isOpen()) {
        Dungeon.drawScoreCalcBackground()
    }
})

// Spirits command, shows which players do or don't have a spirit pet
register("command", () => {
    if (Dungeon.players.length == 0) {
        return ChatLib.chat(`${prefix} &cDungeon party is empty!`)
    }
    let str = `${prefix} &aSpirit Pets\n`
    for (let i = 0; i < Dungeon.players.length; i++) {
        let p = Dungeon.players[i]
        str += ` &a- &b${p.player}&a: `
        str += p.hasSpirit ? "&a✔\n" : "&c✘\n"
    }
    ChatLib.chat(str)
}).setName("spirits")

// Check if it's the first time the player is using the mod

const myDc = new TextComponent("&bUnclaimed#6151").setHover("show_text", "&aClick to copy!").setClick("run_command", "/ct copy Unclaimed#6151")
let firstTimeMessage = new Message(
	`&b&m${ChatLib.getChatBreak(" ")}\n` +
	`&aThank you for installing IllegalMap 2.0!\n` +
	`&aLegit mode is enabled by default. If you have any suggestions or find bugs, please DM me (`, myDc, `&a).` +
	`\n&cThis module is NOT a hacked client. Please do not ask for me to add things unrelated to the map.\n` +
    `\n&c&lDO NOT USE THIS AS A MEANS TO DRAG DOWN YOUR TEAM BY DODGING ROOMS YOU DON'T WANT TO DO.` +
`\n&b&m${ChatLib.getChatBreak(" ")}`
)

let installMsg = [
    "&b&l&nIllegalMap 2.0",
    "",
    "&aThank for for installing IllegalMap!",
    "&7Legit mode is enabled by default. Use the &b/dmap",
    "&7command to open the settings gui.",
    "",
    "&cNOTE: This module is NOT a hacked client.",
    "&c&lDO NOT USE THIS MODULE AS A MEANS TO DODGE ROOMS",
    "",
    "&aIf you have suggestions or find a bug, DM &bUnclaimed#6151"
]

let checked = false
register("step", () => {
    checked = true
    if (dataObject.firstTime || dataObject.uuid !== Player.getUUID()) {
        dataObject.firstTime = false
        dataObject.uuid = Player.getUUID()
        dataObject.save()
        ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)
        for (let msg of installMsg) {
            ChatLib.chat(ChatLib.getCenteredText(msg))
        }
        ChatLib.chat(`&b&m${ChatLib.getChatBreak(" ")}`)

    }
}).setFps(5)
