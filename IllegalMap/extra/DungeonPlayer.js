import Promise from "../../PromiseV2"
import Config from "../data/Config"
import Lookup from "../utils/Lookup"
import { BufferedImage, Color, getHypixelPlayer, getRank } from "../utils/Utils"
import {
    chunkLoaded,
    getMojangInfo,
    getSbProfiles,
    dataObject,
    getMostRecentProfile,
    BufferedImage
} from "../utils/Utils"

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
            mojangInfo = JSON.parse(mojangInfo)
            this.uuid = mojangInfo.id
            const setBlackBG = (image) => {
                image = image.getScaledInstance(8, 8, java.awt.Image.SCALE_SMOOTH)
                let img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_ARGB)
                let g = img.getGraphics()
                g.setPaint(new Color(0, 0, 0, 1))
                g.fillRect(0, 0, img.getWidth(), img.getHeight())
                g.drawImage(image, 1, 1, null)
                return img
            }
            try {
                let player = World.getPlayerByName(this.player).getPlayer()
                if (!player == null) throw Error
                let playerInfo = Client.getMinecraft().func_147114_u().func_175102_a(player.func_146103_bH().id)
                let skin = Client.getMinecraft().func_110434_K().func_110581_b(playerInfo.field_178865_e).field_110560_d
                let bottom = skin.getSubimage(8, 8, 8, 8)
                let top = skin.getSubimage(40, 8, 8, 8)
                let combined = new BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB)
                let g = combined.getGraphics()
                g.drawImage(bottom, 0, 0, null)
                g.drawImage(top, 0, 0, null)
                // ChatLib.chat(`${this.player} ${combined.getWidth()} ${combined.getHeight()} WORLD`)
                this.head = new Image(combined)
                this.headWithBackground = new Image(setBlackBG(combined))
            }
            catch(error) {
                let img = javax.imageio.ImageIO.read(new java.net.URL(`https://crafatar.com/avatars/${this.uuid}?overlay`)).getScaledInstance(8, 8, java.awt.Image.SCALE_SMOOTH)
                // ChatLib.chat(`${this.player} ${img.getWidth()} ${img.getHeight()} API`)
                this.headWithBackground = new Image(setBlackBG(img))
                this.head = new Image(img)
            }
            if (dataObject.apiKey) {
                Promise.all([
                    getSbProfiles(this.uuid, dataObject.apiKey),
                    getHypixelPlayer(this.uuid, dataObject.apiKey)
                ]).then(values => {
                    let sbProfile = getMostRecentProfile(this.uuid, JSON.parse(values[0]))
                    let hypixelPlayer = JSON.parse(values[1])
                    let pets = sbProfile['members'][this.uuid]['pets']
                    this.hasSpirit = pets ? pets.some(a => a.type == "SPIRIT" && a.tier == "LEGENDARY") : false
                    this.rank = getRank(hypixelPlayer)
                }).catch(e => {
                    // ChatLib.chat(e)
                })
            }
        })
    }
    getName(rank) {
        return rank && this.rank ? `${this.rank} ${this.player}` : this.player
    }
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