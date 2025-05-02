import { getHead, getHypixelPlayerV2, getMojangInfo, getRecentProfile } from "../../BloomCore/utils/APIWrappers"
import { getHypixelPlayer, requestPlayerUUID } from "../../BloomCore/utils/ApiWrappers2"
import { bcData, fn, getRank, sortObjectByValues, sortObjectByValues2 } from "../../BloomCore/utils/Utils"
import Promise from "../../PromiseV2"
import Config from "../utils/Config"
import { BlueMarker, dmapData, GreenMarker, playerInfoCache, prefix, sendError } from "../utils/utils"
import DungeonMap from "./DungeonMap"
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

        this.visitedComponents = new Array(36).fill(0) // One entry for each of the 6x6 cells which make up a dungeon. Each index is the time spent there in ms
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
        requestPlayerUUID(this.player, resp => {
            const { success, uuid, username, reason } = resp

            if (!success) {
                ChatLib.chat(`&cCouldn't get UUID for ${this.player}: ${reason}`)
                return
            }
    
            this.uuid = uuid
    
            playerInfoCache[nameLower] = {
                name: this.player,
                uuid: this.uuid,
                head: null
            }
    
            this.initHypixelApiVars()
            this.initPlayerHead()
        })
    }

    initHypixelApiVars() {
        if (!bcData.apiKey) return

        getHypixelPlayer(this.uuid, resp => {
            const { success, data, reason } = resp

            if (!success) {
                ChatLib.chat(`&cCouldn't get player info for ${this.player}: ${reason}`)
                return
            }
            
            this.secrets = data?.player?.achievements?.skyblock_treasure_hunter || 0
            this.rank = getRank(data)
            this.formatted = `${this.rank} ${this.player}`.replace("&7 ", "&7")
        })
    }

    initPlayerHead() {
        getHead(this.player, true, false, this.uuid).then(image => {
            this.head = image
            playerInfoCache[this.player.toLowerCase()].head = this.head

        }).catch(e => {
            ChatLib.chat(`&cCouldn't get head for "${this.uuid}": ${JSON.stringify(e)}`)
        })
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

    /**
     * 
     * @param {DungeonMap} dungeonMap 
     * @returns 
     */
    getSortedVisitedRooms(dungeonMap) {
        const roomTimes = new Map()

        for (let i = 0; i < this.visitedComponents.length; i++) {
            let room = dungeonMap.componentMap[i]
    
            if (!room || this.visitedComponents[i] == 0) {
                continue
            }

            roomTimes.set(room, (roomTimes.get(room) ?? 0) + this.visitedComponents[i])
        }

        return Array.from(roomTimes.entries()).sort((a, b) => b[1] - a[1])
    }

    /**
     * Prints the player's secrets found, rooms cleared and time spent in those rooms.
     */
    printClearStats(dungeonMap, secretsTotal=0) {

        const printStats = (secrets) => {
            const sortedTimes = this.getSortedVisitedRooms(dungeonMap)
            const totalCleared = this.clearedRooms.solo + this.clearedRooms.stacked
    
            const clearedHover = sortedTimes.reduce((a, b) => {
                let [room, time] = b
                let seconds = Math.floor(time/10)/100
                return a + `\n  ${room.getName(true)} &e- &b${seconds}s`
            }, `${this.formatted}&e's Visited Rooms (&d${sortedTimes.length}&e)`)
    
            new Message(
                `${prefix} &r${this.formatted}`,
                ` &8| `,
                new TextComponent(`&6${this.clearedRooms.solo}-${totalCleared} &eRooms`).setHover("show_text", clearedHover),
                ` &8| `,
                new TextComponent(`&b${secrets} &3Secret${secrets==1?"":"s"}`).setHover("show_text", `&b${fn(secretsTotal)} &7Total`),
                ` &8| `,
                `${this.deaths == 0 ? "&a" : "&c"}${this.deaths} &cDeath${this.deaths==1?"":"s"}`
            ).chat()
        }

        if (!bcData.apiKey || !this.uuid) {
            printStats("UNKNOWN")
            return
        }

        getHypixelPlayer(this.uuid, resp => {
            const { success, data, reason } = resp

            if (!success) {
                printStats("UNKNOWN")
                return
            }


            const total = secretsTotal = data.player.achievements.skyblock_treasure_hunter
            
            let secretsThisRun = total - this.secrets

            printStats(secretsThisRun)

        })
    }
}