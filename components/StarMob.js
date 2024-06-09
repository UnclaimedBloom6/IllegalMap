import Config from "../utils/Config"
import { defaultMapSize, dmapData } from "../utils/utils"

const col = (r, g, b) => Renderer.color(r, g, b, 255)
const minibossColors = {
    "Lost Adventurer": col(0, 255, 50),
    "Frozen Adventurer": col(46, 189, 255, 255),
    "Shadow Assassin": col(255, 0, 0),
    "Angry Archeologist": col(0, 255, 170)
}

const zombieHead = new Image("Zombie.png", "../assets/mobheads/Zombie.png")
const skeletonHead = new Image("Skeleton.png", "../assets/mobheads/Skeleton.png")
const dreadlordHead = new Image("Dreadlord.png", "../assets/mobheads/Dreadlord.png")

const entityHeads = {    
    "Frozen Adventurer": new Image("FrozenAdventurer.png", "../assets/mobheads/FrozenAdventurer.png"),
    "Shadow Assassin": new Image("ShadowAssassin.png", "../assets/mobheads/ShadowAssassin.png"),
    "Lost Adventurer": new Image("LostAdventurer.png", "../assets/mobheads/LostAdventurer.png"),
    "Angry Archeologist": new Image("AngryArcheologist.png", "../assets/mobheads/AngryArcheologist.png"),
    "Withermancer": new Image("Withermancer.png", "../assets/mobheads/Withermancer.png"),
    "Fel": new Image("Enderman.png", "../assets/mobheads/Enderman.png"),
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
        this.updateHeight()

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

    updateHeight() {
        const [_, mobName, sa] = this.name.match(/^§6✯ (?:§.)*(.+)§r.+§c❤$|^(Shadow Assassin)$/)

        this.height = 1.9

        // Shadow assassins are just called "Shadow Assassin"
        if (sa) return

        if (/^(?:\w+ )*Fels$/.test(mobName)) this.height = 2.8
        else if (/^(?:\w+ )*Withermancer$/.test(mobName)) this.height = 2.8
    }

    update() {
        this.name = this.entity.getName()

        this.x = this.entity.getX()
        this.y = this.entity.getY()
        this.z = this.entity.getZ()

        this.yaw = this.entity.getYaw() - 180

        this.iconX = MathLib.map(this.x, -200, -10, 0, defaultMapSize[0])
        this.iconY = MathLib.map(this.z, -200, -10, 0, defaultMapSize[1])
    }
    render() {
        Renderer.retainTransforms(true)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        Renderer.translate(this.iconX, this.iconY)
        let headSize = 10 * Config.radarHeadScale * dmapData.map.scale
        if (Config.radarHeads && this.icon) {
            Renderer.translate(headSize/2, headSize/2)
            Renderer.rotate(this.yaw)
            Renderer.translate(-headSize/2, -headSize/2)
            if (Config.radarHeadsBorder) Renderer.drawRect(Config.radarHeadsBorderColor.hashCode(), -headSize/12, -headSize/12, headSize + headSize/6, headSize + headSize/6)
            Renderer.drawImage(this.icon, 0, 0, headSize, headSize)
        }
        else {
            let color = Config.minibossColors && this.iconColor ? this.iconColor : Config.starMobEspColor.hashCode()
            Renderer.drawCircle(color, 0, 0, headSize/4, 100, 1)
            if (Config.starMobBorder) Renderer.drawCircle(Renderer.color(0, 0, 0, 255), dmapData.map.x + this.iconX, dmapData.map.y + this.iconY, headSize/3.5, 100, 0)
        }
        Renderer.retainTransforms(false)
    }
}