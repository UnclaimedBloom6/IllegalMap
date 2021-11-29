import Config from "../data/Config"
import { colors } from "../utils/Utils"

const blacklisted = [5, 54]

export class Room {
    constructor(x, z, data) {
        this.name = data.name
        this.type = data.type
        this.secrets = data.secrets
        this.x = x
        this.z = z
        this.cores = data.cores
        this.core = this.getCore()
        this.size = [3, 3]
        this.checkmark = ""
        this.explored = true
        this.normallyVisible = true
        this.hasMimic = false
    }

    // From https://stackoverflow.com/a/15710692/15767968
    hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)

    getCore() {
        let blocks = []
        for (let y = 140; y > 11; y--) {
            let thisId = World.getBlockAt(this.x, y, this.z).getID()
            if (!blacklisted.includes(thisId)) {
                blocks.push(thisId)
            }
        }
        return this.hashCode(blocks.join(""))
    }
    getColor() {
        if (Config.legitMode && !this.explored) { return new java.awt.Color(65/255, 65/255, 65/255, 1) }
        if (this.hasMimic && Config.showMimic) { return new java.awt.Color(186/255, 66/255, 52/255, 1) }
        
        switch (this.type) {
            case "puzzle":
                return new java.awt.Color(117/255, 0/255, 133/255, 1)
            case "blood":
                return new java.awt.Color(255/255, 0/255, 0/255, 1)
            case "trap":
                return new java.awt.Color(216/255, 127/255, 51/255, 1)
            case "yellow":
                return new java.awt.Color(254/255, 223/255, 0/255, 1)
            case "fairy":
                return new java.awt.Color(224/255, 0/255, 255/255, 1)
            case "entrance":
                return new java.awt.Color(20/255, 133/255, 0/255, 1)
            case "rare":
                return new java.awt.Color(107/255, 58/255, 17/255, 1)
            default:
                return new java.awt.Color(107/255, 58/255, 17/255, 1)
        }
    }
    renderName() {
        Renderer.retainTransforms(true)
        let split = this.name.split(" ")
        Renderer.translate(Config.mapX, Config.mapY)
        Renderer.scale(0.1*Config.mapScale, 0.1*Config.mapScale)
        for (let i = 0; i < split.length; i++) {
            Renderer.drawStringWithShadow(colors[Config.roomNameColor] + split[i], this.x*1.25 + Config.mapScale - (Renderer.getStringWidth(split[i]) / 2), (this.z*1.25) - Math.abs(split.length-1)*3 + (i*8))
        }
        Renderer.retainTransforms(false)
    }
    renderSecrets() {
        Renderer.retainTransforms(true)
        Renderer.translate(Config.mapX, Config.mapY)
        if ([0, 1].includes(Config.showSecrets)) {
            Renderer.scale(0.1*Config.mapScale, 0.1*Config.mapScale)
            Renderer.drawStringWithShadow(`&7${this.secrets}`, this.x*1.25 - Config.mapScale*1.25, this.z*1.25 - Config.mapScale*1.25)
        }
        else if ([2, 3].includes(Config.showSecrets)) {
            Renderer.scale(0.2*Config.mapScale, 0.2*Config.mapScale)
            let color = this.checkmark == "green" ? colors[Config.greenCheckSecrets] : this.checkmark == "white" ? colors[Config.whiteCheckSecrets] : colors[Config.unexploredSecrets]
            Renderer.drawStringWithShadow(`${color}${this.secrets}`, (this.x*1.25)/2, (this.z*1.25)/2)
        }
        Renderer.retainTransforms(false)
    }
    getJson() {
        if (this.cores.length == 0) { this.cores = [this.core] }
        return {
            "name": this.name,
            "type": this.type,
            "secrets": this.secrets,
            "cores": this.cores
        }
    }
}
