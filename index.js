/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Dungeon from "../BloomCore/dungeons/Dungeon"
import Config, { borderScaleGui, editDungeonInfoGui, mapEditGui } from "./utils/Config"

import "./extra/ScoreMilestones"
import "./extra/Mimic"
import "./extra/StarMobStuff"
import "./extra/WitherDoorEsp"
import "./utils/UpdateChecker"
import "./extra/FirstInstall"
import "./extra/VisitedCommand"
import "./extra/DungeonLoggerNew"
import "./extra/DungeonViewer"
import "./extra/NewRoomCommand"

import "./utils/guiStuff"

import DmapDungeon from "./components/DmapDungeon"
import { renderInfoSeparate, renderMap, renderMapEditGui } from "./utils/rendering"
import { RoomColors, RoomTypes } from "./utils/utils"
import { Color } from "../BloomCore/utils/Utils"

register("command", (...args) => {
    if (!args || !args.length || !args[0]) return Config().getConfig().openGui()

    // Used for debugging
    if (args[0] == "reset") DmapDungeon.reset()
}).setName("dmap")

// Rendering
register("renderOverlay", () => {
    // Lets the separate info continue to render even when the toggle for the main map rendering is set to false
    if (editDungeonInfoGui.isOpen() || (Config().dungeonInfo == 1 || Config().dungeonInfo == 3) && !Config().enabled) {
        renderInfoSeparate()
    }

    if (mapEditGui.isOpen() || borderScaleGui.isOpen()) {
        renderMap()
        renderMapEditGui()
        return
    }

    if (!Config().enabled || !Dungeon.inDungeon) return
    if (Config().hideInBoss && Dungeon.bossEntry) return

    renderMap()
})

// Set this up here due to circular imports inside of `Config`
Config().getConfig().registerListener("trapRoomColor", (_, nvalue) => {
    RoomColors.set(RoomTypes.TRAP, new Color(
        nvalue[0] / 255,
        nvalue[1] / 255,
        nvalue[2] / 255,
        nvalue[3] / 255))
})

RoomColors.set(RoomTypes.TRAP, new Color(
    Config().trapRoomColor[0] / 255,
    Config().trapRoomColor[1] / 255,
    Config().trapRoomColor[2] / 255,
    Config().trapRoomColor[3] / 255))