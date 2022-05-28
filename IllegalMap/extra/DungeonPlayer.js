import { getHead, getHypixelPlayer, getMojangInfo, getRecentProfile } from "../../BloomCore/Utils/APIWrappers"
import { bcData, getRank } from "../../BloomCore/Utils/Utils"
import Promise from "../../PromiseV2"
import Config from "../data/Config"
import { dataObject } from "../utils/Utils"

const DefaultIcon = new Image("defaultMapIcon.png", "https://i.imgur.com/GKHfOCt.png")
const cross = new Image("cross.png", "https://i.imgur.com/LWFEReQ.png")

export class DungeonPlayer {
    constructor(player) {
        this.player = player
        this.rank = null
        this.uuid = null
        this.inRender = false // Is within render distance of the player

        this.icon = null
        this.iconX = 0
        this.iconY = 0
        this.yaw = 0

        this.realX = 0
        this.realZ = 0

        this.size = [8, 8]
        
        this.isDead = false

        this.head = null
        this.headWithBackground = null

        this.bufferedHead = null
        this.bufferedHeadBackground = null

        this.hasSpirit = false

        this.visitedRooms = {} // {roomName: time spent (ms)}
        this.currentRoom = null
        this.lastRoomCheck = null

        this.initialize()
    }
    initialize() {
        // Get player head, check for spirit pet and get UUID
        getMojangInfo(this.player).then(mojangInfo => {
            this.uuid = mojangInfo.id
            getHead(this.player, null, true).then(images => {
                this.head = images[0]
                this.headWithBackground = images[1]
            }).catch(e => ChatLib.chat(e))
            if (!bcData.apiKey) return
            Promise.all([
                getRecentProfile(this.uuid, null, bcData.apiKey),
                getHypixelPlayer(this.uuid, bcData.apiKey)
            ]).then(values => {
                let [sbProfile, hypixelPlayer] = values
                let pets = sbProfile['members'][this.uuid]['pets']
                this.hasSpirit = pets ? pets.some(a => a.type == "SPIRIT" && a.tier == "LEGENDARY") : false
                this.rank = getRank(hypixelPlayer)
            }).catch(e => console.log(e.toString()))
        }).catch(e => console.log(e.toString()))
    }
    getName(rank) { return rank && this.rank ? `${this.rank} ${this.player}` : this.player }
    render() {
        let head = Config.playerIconBorder ? this.headWithBackground : this.head
        if (!head) head = DefaultIcon
        
        this.size = head !== DefaultIcon ? [Config.mapScale * (Config.headScale * 4), Config.mapScale * (Config.headScale * 4)] : [7, 10]
        let size = this.isDead && this.player !== Player.getName() ? [Config.mapScale * (Config.headScale * 3), Config.mapScale * (Config.headScale * 3)] : this.size

        let [width, height] = size
        Renderer.retainTransforms(true)
        Renderer.translate(dataObject.map.x + this.iconX, dataObject.map.y + this.iconY)
        Renderer.translate(width / 2, height / 2)
        Renderer.rotate(this.yaw)
        Renderer.translate(-width / 2, -height / 2)
        Renderer.drawImage(head, 0, 0, width, height)
        if (this.isDead && this.player !== Player.getName() && head !== DefaultIcon) {
            Renderer.drawImage(cross, 0, 0, width, height)
        }
        Renderer.retainTransforms(false)
    }
    renderName(rank) {
        Renderer.retainTransforms(true)
        Renderer.translate(dataObject.map.x + this.iconX, dataObject.map.y + this.iconY)
        Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        let str = this.getName(rank)
        let length = Renderer.getStringWidth(str)
        Renderer.translate((-length + this.size[0]*2)/2, this.size[1]*2)
        if (Config.nametagBorder) Renderer.drawRect(Renderer.color(0, 0, 0, 150), -2, -2, length+4, 11)
        Renderer.drawStringWithShadow(str, 0, 0)
        Renderer.retainTransforms(false)
    }
    toJson() {
        return {
            "player": this.player,
            "uuid": this.uuid,
            "icon": this.icon,
            "isDead": this.isDead,
            "headIcon?": !this.head ? false : true,
            "spirit": this.hasSpirit,
            "x": this.iconX,
            "z": this.iconY
        }
    }
    print() {
        ChatLib.chat(JSON.stringify(this.toJson(), "", 4))
    }
}