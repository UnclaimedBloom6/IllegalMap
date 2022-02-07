import Config from "../data/Config"
import Lookup from "../utils/Lookup"
import { BufferedImage } from "../utils/Utils"
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

        this.visitedRooms = []
        this.currentRoom = null

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
                g.setPaint(new java.awt.Color(0, 0, 0, 1))
                g.fillRect(0, 0, img.getWidth(), img.getHeight())
                g.drawImage(image, 1, 1, null)
                return img
            }
            try {
                let player = World.getPlayerByName(this.player).getPlayer()
                if (player == null) {
                    throw Error
                }
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
                let img = javax.imageio.ImageIO.read(new java.net.URL(`https://crafatar.com/avatars/${this.uuid}`)).getScaledInstance(8, 8, java.awt.Image.SCALE_SMOOTH)
                // ChatLib.chat(`${this.player} ${img.getWidth()} ${img.getHeight()} API`)
                this.headWithBackground = new Image(setBlackBG(img))
                this.head = new Image(img)
            }
            if (dataObject.apiKey) {
                getSbProfiles(this.uuid, dataObject.apiKey).then(sbProfiles => {
                    sbProfiles = JSON.parse(sbProfiles)
                    let profile = getMostRecentProfile(this.uuid, sbProfiles)
                    let pets = profile["members"][this.uuid]["pets"]
                    for (let i = 0; i < pets.length; i++) {
                        if (pets[i].type == "SPIRIT" && pets[i].tier == "LEGENDARY") {
                            this.hasSpirit = true
                        }
                    }
                }).catch(error => {
                    // ChatLib.chat(error)
                })
            }
            // getSbProfiles(uuid, )
        })
    }
    render() {
        let head = Config.playerIconBorder ? this.headWithBackground : this.head
        if (!head) head = DefaultIcon
        // if (this.isDead && this.player !== Player.getName()) {
        //     // head = cross
        // }
        
        this.size = head !== DefaultIcon ? [Config.mapScale * (Config.headScale * 4), Config.mapScale * (Config.headScale * 4)] : [7, 10]
        let size = this.isDead && this.player !== Player.getName() ? [Config.mapScale * (Config.headScale * 3), Config.mapScale * (Config.headScale * 3)] : this.size

        // Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        Renderer.retainTransforms(true)
        Renderer.translate(dataObject.map.x + this.iconX, dataObject.map.y + this.iconY)
        // Renderer.drawRect(Renderer.color(255, 0, 0, 255), this.iconX, this.iconY, 5, 5)
        Renderer.translate(size[0] / 2, size[1] / 2)
        Renderer.rotate(this.yaw)
        Renderer.translate(-size[0] / 2, -size[1] / 2)
        Renderer.drawImage(head, 0, 0, size[0], size[1])
        if (this.isDead && this.player !== Player.getName() && head !== DefaultIcon) {
            Renderer.drawImage(cross, 0, 0, size[0], size[1])
            // head = cross
        }
        Renderer.retainTransforms(false)
    }
    renderName() {
        Renderer.translate(dataObject.map.x + this.iconX, dataObject.map.y + this.iconY)
        Renderer.scale(0.1 * Config.mapScale, 0.1 * Config.mapScale)
        Renderer.drawStringWithShadow(this.player, (-Renderer.getStringWidth(this.player) + this.size[0]*2)/2, + this.size[1]*2)
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