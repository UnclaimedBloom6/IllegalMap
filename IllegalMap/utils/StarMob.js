import Config from "../data/Config"
import { dataObject } from "./Utils"

const col = (r, g, b) => Renderer.color(r, g, b, 255)
const minibossColors = {
    "Lost Adventurer": col(0, 255, 50),
    "Frozen Adventurer": col(46, 189, 255, 255),
    "Shadow Assassin": col(255, 0, 0),
    "Angry Archeologist": col(0, 255, 170)
}

const zombieHead = new Image("MapZombie.png", "https://i.imgur.com/qFwfHuh.png")
const skeletonHead = new Image("MapSkeleton.png", "https://i.imgur.com/JFymWq7.png")
const dreadlordHead = new Image("MapDreadlord.png", "https://i.imgur.com/MNZExTj.png")

const entityHeads = {    
    "Frozen Adventurer": new Image("MapFrozenAdventurer.png", "https://i.imgur.com/zZy2GNk.png"),
    "Shadow Assassin": new Image("MapShadowAssassin.png", "https://i.imgur.com/tDd6IDm.png"),
    "Lost Adventurer": new Image("MapLostAdventurer.png", "https://i.imgur.com/E2goB9Y.png"),
    "Angry Archeologist": new Image("MapAngryArcheologist.png", "https://i.imgur.com/aKkaQUC.png"),
    "Withermancer": new Image("MapWithermancer.png", "https://i.imgur.com/TiKb0gN.png"),
    "Fel": new Image("MapEnderman.png", "https://i.imgur.com/ylIITEM.png"),
    "Crypt Dreadlord": dreadlordHead,
    "Crypt Souleater": dreadlordHead,
    "Skeleton Grunt": skeletonHead,
    "Skeleton Lord": skeletonHead,
    "Skeleton Master": skeletonHead,
    "Skeleton Soldier": skeletonHead,
    "Sniper": skeletonHead,
    "Crypt Lurker": zombieHead,
    "Tank Zombie": zombieHead,
    "Zombie Commander": zombieHead,
    "Zombie Grunt": zombieHead,
    "Zombie Lord": zombieHead,
    "Zombie Soldier": zombieHead,
    "Zombie Knight": zombieHead
}

export default class StarMob {
    constructor(entity) {
        this.entity = entity
        this.id = entity.getUUID()
        this.name = entity.getName()
        this.icon = null
        for (let i of Object.keys(entityHeads)) {
            if (this.name.includes(i)) {
                this.icon = entityHeads[i]
            }
        }

        for (let i of Object.keys(minibossColors)) {
            if (this.name.includes(i)) {
                this.iconColor = minibossColors[i]
                break
            }
        }

        this.update()
    }
    update() {
        this.name = this.entity.getName()

        this.x = this.entity.getX()
        this.y = this.entity.getY()
        this.z = this.entity.getZ()

        this.yaw = this.entity.getYaw() - 180

        this.iconX = MathLib.map(this.x, -200, -8, 0, 25*Config.mapScale)
        this.iconY = MathLib.map(this.z, -200, -8, 0, 25*Config.mapScale)
    }
    render() {
        if (Config.radarHeads && this.icon) {
            let headSize = 2 * Config.radarHeadScale * Config.mapScale
            Renderer.retainTransforms(true)
            Renderer.translate(dataObject.map.x + this.iconX, dataObject.map.y + this.iconY)
            Renderer.translate(headSize/2, headSize/2)
            Renderer.rotate(this.yaw)
            Renderer.translate(-headSize/2, -headSize/2)
            if (Config.radarHeadsBorder) Renderer.drawRect(Config.radarHeadsBorderColor.hashCode(), -0.5, -0.5, headSize+1, headSize+1)
            Renderer.drawImage(this.icon, 0, 0, headSize, headSize)
            Renderer.retainTransforms(false)
            return
        }
        let color = Config.minibossColors && this.iconColor ? this.iconColor : Config.starMobEspColor.hashCode()
        Renderer.drawCircle(color, dataObject.map.x + this.iconX, dataObject.map.y + this.iconY, 0.2*Config.mapScale, 100, 1)
        if (Config.starMobBorder) Renderer.drawCircle(Renderer.color(0, 0, 0, 255), dataObject.map.x + this.iconX, dataObject.map.y + this.iconY, 0.3*Config.mapScale, 100, 0)
    }
}