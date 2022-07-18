import { getHead, getHypixelPlayer, getMojangInfo } from "../../BloomCore/Utils/APIWrappers"
import { bcData, getRank } from "../../BloomCore/Utils/Utils"
import Promise from "../../PromiseV2"
import Config from "../data/Config"
import { BlueMarker, dmapData, GreenMarker } from "../utils"

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

        this.head = null

        this.visitedRooms = {}
        this.currentRoom = null
        this.lastRoomCheck = null

        this.init()
    }
    init() {
        // ChatLib.chat(`Initializing ${this.player}`)
        getMojangInfo(this.player).then(mojangInfo => {
            this.uuid = mojangInfo.id
            getHead(this.player, true).then(image => {
                this.head = image
            }).catch(e => ChatLib.chat(e))
            if (!bcData.apiKey) return
            Promise.all([
                // getRecentProfile(this.uuid, null, bcData.apiKey),
                getHypixelPlayer(this.uuid, bcData.apiKey)
            ]).then(values => {
                let [hypixelPlayer] = values
                // let pets = sbProfile['members'][this.uuid]['pets']
                this.rank = getRank(hypixelPlayer)
                this.formatted = `${this.rank} ${this.player}`.replace(" &7", "&7")
            }).catch(e => console.log(`IllegalMap Error: ${e.toString()}`))
        }).catch(e => console.log(`IllegalMap Error: ${e.toString()}`))
    }
    getName() {
        return this.formatted ?? this.player
    }
    renderHead() {
        // ChatLib.chat(`x: ${this.iconX}, y: ${this.iconY}, rotation: ${this.rotation}, head: ${!!this.head}`)
        let size = [7, 10]
        let head = this.player == Player.getName() ? GreenMarker : BlueMarker
        if (Config.playerHeads && this.head) {
            size = [10, 10]
            head = this.head
        }
        let x = this.iconX
        let y = this.iconY
        if (!x && !y) return
        let yaw = this.rotation ?? 0

        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(x+5, y+5)
        Renderer.scale(dmapData.map.headScale, dmapData.map.headScale)
        Renderer.rotate(yaw)
        Renderer.translate(-size[0]/2, -size[1]/2)
        Renderer.drawImage(head, 0, 0, size[0], size[1])
        
        Renderer.retainTransforms(false)
    }
    renderName() {
        if (!this.iconX || !this.iconY) return
        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(this.iconX, this.iconY)
        let name = this.formatted && Config.showPlayerRanks ? this.formatted : this.player
        let width = Renderer.getStringWidth(name)
        let scale = dmapData.map.headScale/1.75
        Renderer.translate(0, 12)
        Renderer.scale(scale, scale)
        Renderer.drawRect(Renderer.color(0, 0, 0, 150), -width/2-2, -2, width+4, 11)
        Renderer.drawStringWithShadow(name, -width/2, 0)
        Renderer.retainTransforms(false)
    }
}