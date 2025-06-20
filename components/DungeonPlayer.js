import PartyV2 from "../../BloomCore/PartyV2"
import { getHypixelPlayer, requestPlayerUUID } from "../../BloomCore/utils/ApiWrappers2"
import { bcData, fn } from "../../BloomCore/utils/Utils"
import Config from "../utils/Config"
import { BlueMarker, DefaultVertexFormats, dmapData, GreenMarker, MCTessellator, prefix } from "../utils/utils"
import DungeonMap from "./DungeonMap"

export class DungeonPlayer {
    constructor(player) {
        this.player = player
        this.rank = null
        this.uuid = null
        this.inRender = false // In render distance

        this.iconX = null
        this.iconY = null
        this.rotation = null

        this.realX = 0
        this.realZ = 0
        this.currentRoom = null

        this.head = null
        this.skinTexture = null

        this.visitedComponents = new Array(36).fill(0) // One entry for each of the 6x6 cells which make up a dungeon. Each index is the time spent there in ms
        this.clearedRooms = { solo: 0, stacked: 0 }
        this.lastRoomCheck = null
        this.lastRoom = null
        this.deaths = 0
        this.secrets = null

        this.init()
    }

    init() {
        requestPlayerUUID(this.player, resp => {
            const { success, uuid, username, reason } = resp

            if (!success) {
                ChatLib.chat(`&cCouldn't get UUID for ${this.player}: ${reason}`)
                return
            }
    
            this.uuid = uuid
            
            if (bcData.apiKey) {
                this.grabSecrets()
            }
        })
    }

    grabSecrets() {

        getHypixelPlayer(this.uuid, resp => {
            const { success, data, reason } = resp

            if (!success) {
                ChatLib.chat(`&cCouldn't get player info for ${this.player}: ${reason}`)
                return
            }
            
            this.secrets = data?.player?.achievements?.skyblock_treasure_hunter || 0
        })
    }

    renderHead(holdingLeaps=false) {
        if (!this.iconX || !this.iconY) {
            return
        }

        let width = 7
        let height = 10

        const isSelf = this.player == Player.getName()
        const useVanillaIcon = this.skinTexture == null || !Config().playerHeads || isSelf && Config().useVanillaOwnHead

        if (!useVanillaIcon) {
            width = 10
        }

        const rotation = isSelf ? Player.getYaw() + 180 : this.rotation

        Renderer.translate(this.iconX, this.iconY)
        Renderer.rotate(rotation)

        if (useVanillaIcon) {
            let image = isSelf ? GreenMarker : BlueMarker

            Renderer.drawImage(image, -width/2, -height/2, width, height)
            Renderer.rotate(-rotation)
            Renderer.translate(-this.iconX, -this.iconY)
            return
        }

        Renderer.drawRect(Renderer.BLACK, -width/2, -height/2, width, height)

        width -= width / 8
        height -= height / 8
        
        Client.getMinecraft().func_110434_K().func_110577_a(this.skinTexture)

        const tessellator = MCTessellator.func_178181_a() // .getInstance()
        const worldRenderer = tessellator.func_178180_c() // .getWorldRenderer()

        worldRenderer.func_181668_a(7, DefaultVertexFormats.field_181707_g) // .begin() ... .POSITION_TEX
        worldRenderer.func_181662_b(-width / 2, height / 2, 0).func_181673_a(8 / 64, 16 / 64).func_181675_d()
        worldRenderer.func_181662_b(width / 2, height / 2, 0).func_181673_a(16 / 64, 16 / 64).func_181675_d()
        worldRenderer.func_181662_b(width / 2, -height / 2, 0).func_181673_a(16 / 64, 8 / 64).func_181675_d()
        worldRenderer.func_181662_b(-width / 2, -height / 2, 0).func_181673_a(8 / 64, 8 / 64).func_181675_d()
        tessellator.func_78381_a() // .draw()
        
        worldRenderer.func_181668_a(7, DefaultVertexFormats.field_181707_g) // .begin() ... .POSITION_TEX
        worldRenderer.func_181662_b(-width / 2, height / 2, 0).func_181673_a(40 / 64, 16 / 64).func_181675_d()
        worldRenderer.func_181662_b(width / 2, height / 2, 0).func_181673_a(48 / 64, 16 / 64).func_181675_d()
        worldRenderer.func_181662_b(width / 2, -height / 2, 0).func_181673_a(48 / 64, 8 / 64).func_181675_d()
        worldRenderer.func_181662_b(-width / 2, -height / 2, 0).func_181673_a(40 / 64, 8 / 64).func_181675_d()
        tessellator.func_78381_a() // .draw()

        Renderer.rotate(-rotation)

        // Don't render own name, nothing more to do
        if (!Config().showOwnName && this.player == Player.getName()) {
            Renderer.translate(-this.iconX, -this.iconY)
            return
        }

        
        // Render the player name under their icon
        if (Config().spiritLeapNames && holdingLeaps || Config().showPlayerNames) {
            const nameToShow = PartyV2.getFormattedName(this.player)
            const width = Renderer.getStringWidth(nameToShow)
    
            Renderer.translate(0, 7)
            Renderer.scale(dmapData.map.headScale/1.75)
            Renderer.drawRect(Renderer.color(0, 0, 0, 150), -width/2-2, -2, width+4, 11)
            Renderer.drawStringWithShadow(nameToShow, -width/2, 0)
    
            Renderer.scale(1/(dmapData.map.headScale/1.75))
            Renderer.translate(0, -7)
        }

        Renderer.translate(-this.iconX, -this.iconY)
    }

    getName(formatted) {
        if (formatted) {
            return PartyV2.getFormattedName(this.player)
        }

        return this.player
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
    printClearStats(dungeonMap) {

        const printStats = (secrets, totalSecrets) => {
            const sortedTimes = this.getSortedVisitedRooms(dungeonMap)
            const totalCleared = this.clearedRooms.solo + this.clearedRooms.stacked
            const name = PartyV2.getFormattedName(this.player)
    
            const clearedHover = sortedTimes.reduce((a, b) => {
                let [room, time] = b
                let seconds = Math.floor(time/10)/100
                return a + `\n  ${room.getName(true)} &e- &b${seconds}s`
            }, `${name}&e's Visited Rooms (&d${sortedTimes.length}&e)`)
    
            new Message(
                `${prefix} &r${name}`,
                ` &8| `,
                new TextComponent(`&6${this.clearedRooms.solo}-${totalCleared} &eRooms`).setHover("show_text", clearedHover),
                ` &8| `,
                new TextComponent(`&b${secrets} &3Secret${secrets==1?"":"s"}`).setHover("show_text", `&b${fn(totalSecrets)} &7Total`),
                ` &8| `,
                `${this.deaths == 0 ? "&a" : "&c"}${this.deaths} &cDeath${this.deaths==1?"":"s"}`
            ).chat()
        }

        if (!bcData.apiKey || !this.uuid || this.secrets == null) {
            printStats("UNKNOWN")
            return
        }

        getHypixelPlayer(this.uuid, resp => {
            const { success, data, reason } = resp

            if (!success) {
                printStats("UNKNOWN", "UNKNOWN")
                return
            }


            const total = data.player.achievements.skyblock_treasure_hunter
            
            let secretsThisRun = total - this.secrets

            printStats(secretsThisRun, total)

        })
    }
}