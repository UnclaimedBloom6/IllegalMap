import { getHead, getHypixelPlayer, getMojangInfo, getRecentProfile } from "../../BloomCore/utils/APIWrappers"
import { bcData, fn, getRank, sortObjectByValues } from "../../BloomCore/utils/Utils"
import Promise from "../../PromiseV2"
import Config from "../data/Config"
import { BlueMarker, dmapData, GreenMarker, prefix } from "../utils"
import Room from "./Room"

export class DungeonPlayer {
    constructor(player) {
        this.player = player
        this.rank = null
        this.formatted = null
        this.uuid = null
        this.inRender = false // In render distance

        this.iconX = null
        this.iconY = null
        this.rotation = null

        this.realX = 0
        this.realZ = 0

        this.head = null

        this.visitedRooms = new Map() // [[Room, timeInMS], ...]
        this.clearedRooms = {solo: 0, stacked: 0}
        this.lastRoomCheck = null
        this.lastRoom = null
        this.deaths = 0

        this.init()
        this.updateRenderVariables()
    }

    updateRenderVariables() {
        // Head shit
        this.headSize = this.head && Config.playerHeads ? [10, 10] : [7, 10]
        this.headImage = this.head
        if (!this.head) {
            if (this.player !== Player.getName()) this.headImage = BlueMarker
            else this.headImage = GreenMarker
        }
    
        // Name Shit
        this.renderNameString = this.formatted && Config.showPlayerRanks ? this.formatted : this.player
        this.renderNameWidth = Renderer.getStringWidth(this.renderNameString)

    }

    init() {
        // ChatLib.chat(`Initializing ${this.player}`)
        getMojangInfo(this.player).then(mojangInfo => {
            this.uuid = mojangInfo.id
            getHead(this.player, true).then(image => {
                this.head = image
                this.updateRenderVariables()
            }).catch(e => ChatLib.chat(e))
            if (!bcData.apiKey) return

            getHypixelPlayer(this.uuid, bcData.apiKey).then(hypixelPlayer => {
                this.secrets = hypixelPlayer.player.achievements.skyblock_treasure_hunter
                this.rank = getRank(hypixelPlayer)
                this.formatted = `${this.rank} ${this.player}`.replace("&7 ", "&7")
                this.updateRenderVariables()
            }).catch(e => console.log(`IllegalMap Error: ${e.toString()}`))
        }).catch(e => console.log(`IllegalMap Error: ${e.toString()}`))
    }
    renderHead() {
        if (!this.iconX || !this.iconY || !this.headImage) return

        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(this.iconX, this.iconY)
        Renderer.scale(dmapData.map.headScale, dmapData.map.headScale)
        Renderer.rotate(this.rotation ?? 0)
        Renderer.translate(-this.headSize[0]/2, -this.headSize[1]/2)
        Renderer.drawImage(this.headImage, 0, 0, this.headSize[0], this.headSize[1])
        Renderer.retainTransforms(false)
    }

    renderName() {
        if (!this.iconX || !this.iconY) return
        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(this.iconX, this.iconY)
        Renderer.translate(0, 7)
        Renderer.scale(dmapData.map.headScale/1.75)
        Renderer.drawRect(Renderer.color(0, 0, 0, 150), -this.renderNameWidth/2-2, -2, this.renderNameWidth+4, 11)
        Renderer.drawStringWithShadow(this.renderNameString, -this.renderNameWidth/2, 0)
        Renderer.retainTransforms(false)
    }

    getName(formatted) {
        if (!formatted) return this.player
        return this.formatted
    }

    getSortedVisitedRooms() {
        return Array.from(this.visitedRooms.entries()).sort((a, b) => b[1] - a[1])
    }

    /**
     * Prints the player's secrets found, rooms cleared and time spent in those rooms.
     */
    printClearStats() {

        getHypixelPlayer(this.uuid, bcData.apiKey).then(hypixelPlayer => {
            let secretsTotal = hypixelPlayer.player.achievements.skyblock_treasure_hunter
            let secretsThisRun = secretsTotal - this.secrets

            let sortedTimes = this.getSortedVisitedRooms()
            let totalCleared = this.clearedRooms.solo + this.clearedRooms.stacked
    
            let clearedHover = sortedTimes.reduce((a, b) => {
                let [room, time] = b
                let seconds = Math.floor(time/10)/100
                return a + `\n  ${room.getName(true)} &e- &b${seconds}s`
            }, `${this.formatted}&e's Visited Rooms (&d${sortedTimes.length}&e)`)
    
            new Message(
                `${prefix} ${this.formatted}`,
                ` &8| `,
                new TextComponent(`&6${this.clearedRooms.solo}-${totalCleared} &eRooms`).setHover("show_text", clearedHover),
                ` &8| `,
                new TextComponent(`&b${secretsThisRun} &3Secret${secretsThisRun==1?"":"s"}`).setHover("show_text", `&b${fn(secretsTotal)} &7Total`),
                ` &8| `,
                `${this.deaths == 0 ? "&a" : "&c"}${this.deaths} &cDeath${this.deaths==1?"":"s"}`
            ).chat()
        }).catch(e => ChatLib.chat(`&cError: ${e}`))
    }
}