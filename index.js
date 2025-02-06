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