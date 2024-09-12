import { getHead, getHypixelPlayerV2, getMojangInfo, getRecentProfile } from "../../BloomCore/utils/APIWrappers"
import { bcData, fn, getRank, sortObjectByValues } from "../../BloomCore/utils/Utils"
import Promise from "../../PromiseV2"
import Config from "../utils/Config"
import { BlueMarker, dmapData, GreenMarker, playerInfoCache, prefix, sendError } from "../utils/utils"
import Room from "./Room"

export class DungeonPlayer {
    constructor(player) {
        this.player = player
        this.rank = null
        this.formatted = player
        this.uuid = null
        this.inRender = false // In render distance

        this.iconX = null
        this.iconY = null
        this.rotation = null

        this.realX = 0
        this.realZ = 0
        this.currentRoom = null

        this.head = null

        this.visitedRooms = new Map() // [[Room, timeInMS], ...]
        this.clearedRooms = {solo: 0, stacked: 0}
        this.lastRoomCheck = null
        this.lastRoom = null
        this.deaths = 0
        this.secrets = 0

        this.init()
    }

    init() {
        // ChatLib.chat(`Initializing ${this.player}`)
        const nameLower = this.player.toLowerCase()
        if (nameLower in playerInfoCache) {
            const { name, uuid, head } = playerInfoCache[nameLower]
            this.uuid = uuid
            this.head = head ?? this.head // Request to get head image can fail

            this.initHypixelApiVars()
            if (!this.head) this.initPlayerHead()
            return
        }
        
        // If nothing's cached for this player yet
        getMojangInfo(this.player).then(mojangInfo => {
            this.uuid = mojangInfo.id

            playerInfoCache[nameLower] = {
                name: this.player,
                uuid: this.uuid,
                head: null
            }

            this.initHypixelApiVars()
            this.initPlayerHead()
        }).catch(e => sendError(e, "init"))
    }

    initHypixelApiVars() {
        if (!bcData.apiKey) return

        getHypixelPlayerV2(this.uuid).then(hypixelPlayer => {
            this.secrets = hypixelPlayer?.player?.achievements?.skyblock_treasure_hunter || 0
            this.rank = getRank(hypixelPlayer)
            this.formatted = `${this.rank} ${this.player}`.replace("&7 ", "&7")
        }).catch(e => sendError(e, "initHypixelApiVars"))
    }

    initPlayerHead() {
        getHead(this.player, true, false, this.uuid).then(image => {
            this.head = image
            playerInfoCache[this.player.toLowerCase()].head = this.head

        }).catch(e => sendError(e, "initPlayerHead"))
    }

    renderHead() {
        if (!this.iconX || !this.iconY) return

        let headSize = [7, 10]
        let imgToRender = this.player == Player.getName() ? GreenMarker : BlueMarker
        if (this.head && Config().playerHeads) {
            headSize = [10, 10]
            imgToRender = this.head
        }

        const [width, height] = headSize

        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(this.iconX, this.iconY)
        Renderer.scale(dmapData.map.headScale, dmapData.map.headScale)
        Renderer.rotate(this.rotation ?? 0)
        Renderer.translate(-width/2, -height/2)
        Renderer.drawImage(imgToRender, 0, 0, width, height)
        Renderer.retainTransforms(false)
    }

    renderName() {
        if (!this.iconX || !this.iconY) return

        const name = this.formatted && Config().showPlayerRanks ? this.formatted : this.player
        const width = Renderer.getStringWidth(name)

        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(this.iconX, this.iconY)
        Renderer.translate(0, 7)
        Renderer.scale(dmapData.map.headScale/1.75)
        Renderer.drawRect(Renderer.color(0, 0, 0, 150), -width/2-2, -2, width+4, 11)
        Renderer.drawStringWithShadow(name, -width/2, 0)
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
    printClearStats(secretsTotal=0) {

        getHypixelPlayerV2(this.uuid).then(hypixelPlayer => {
            if (hypixelPlayer) secretsTotal = hypixelPlayer.player.achievements.skyblock_treasure_hunter
            let secretsThisRun = secretsTotal - this.secrets

            let sortedTimes = this.getSortedVisitedRooms()
            let totalCleared = this.clearedRooms.solo + this.clearedRooms.stacked
    
            let clearedHover = sortedTimes.reduce((a, b) => {
                let [room, time] = b
                let seconds = Math.floor(time/10)/100
                return a + `\n  ${room.getName(true)} &e- &b${seconds}s`
            }, `${this.formatted}&e's Visited Rooms (&d${sortedTimes.length}&e)`)
    
            new Message(
                `${prefix} &r${this.formatted}`,
                ` &8| `,
                new TextComponent(`&6${this.clearedRooms.solo}-${totalCleared} &eRooms`).setHover("show_text", clearedHover),
                ` &8| `,
                new TextComponent(`&b${secretsThisRun} &3Secret${secretsThisRun==1?"":"s"}`).setHover("show_text", `&b${fn(secretsTotal)} &7Total`),
                ` &8| `,
                `${this.deaths == 0 ? "&a" : "&c"}${this.deaths} &cDeath${this.deaths==1?"":"s"}`
            ).chat()
        }).catch(e => sendError(e, "printClearStats"))
    }
}