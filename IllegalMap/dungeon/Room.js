import Config from "../data/Config"
import { colors, getCore, dataObject, greenCheck, whiteCheck, failedRoom, questionMark, Color } from "../utils/Utils"

export class Room {
    constructor(x, z, data, isSeparator) {
        this.name = data.name
        this.type = data.type
        this.secrets = data.secrets
        this.x = x
        this.z = z
        this.cores = data.cores
        this.core = getCore(this.x, this.z)
        this.size = [3, 3]
        this.checkmark = null
        this.explored = true
        this.normallyVisible = true
        this.hasMimic = false
        this.isSeparator = isSeparator ? isSeparator : false
    }
    
    getColor() {
        if (Config.legitMode && !this.explored) return new Color(65/255, 65/255, 65/255, 1)
        if (this.hasMimic && Config.showMimic) return new Color(186/255, 66/255, 52/255, 1)
        if (this.name == "Unknown") return new Color(255/255, 176/255, 31/255)
        
        switch (this.type) {
            case "puzzle":
                return new Color(117/255, 0/255, 133/255, 1)
            case "blood":
                return new Color(255/255, 0/255, 0/255, 1)
            case "trap":
                return new Color(216/255, 127/255, 51/255, 1)
            case "yellow":
                return new Color(254/255, 223/255, 0/255, 1)
            case "fairy":
                return new Color(224/255, 0/255, 255/255, 1)
            case "entrance":
                return new Color(20/255, 133/255, 0/255, 1)
            case "rare":
                return new Color(255/255, 203/255, 89/255, 1)
            default:
                return new Color(107/255, 58/255, 17/255, 1)
        }
    }
    renderName() {
        Renderer.retainTransforms(true)
        let split = this.name.split(" ")
        Renderer.translate(dataObject.map.x, dataObject.map.y)
        Renderer.scale(0.1*Config.mapScale, 0.1*Config.mapScale)
        for (let i = 0; i < split.length; i++) {
            Renderer.drawStringWithShadow(colors[Config.roomNameColor] + split[i], (200+this.x)*1.25 + Config.mapScale - (Renderer.getStringWidth(split[i]) / 2), ((200+this.z)*1.25) - Math.abs(split.length-1)*3 + (i*8))
        }
        Renderer.retainTransforms(false)
    }
    renderSecrets() {
        Renderer.retainTransforms(true)
        Renderer.translate(dataObject.map.x, dataObject.map.y)
        if ([0, 1].includes(Config.showSecrets)) {
            Renderer.scale(0.1*Config.mapScale, 0.1*Config.mapScale)
            Renderer.drawStringWithShadow(`&7${this.secrets}`, (200+this.x)*1.25 - Config.mapScale*1.25, (200+this.z)*1.25 - Config.mapScale*1.25)
        }
        else if ([2, 3].includes(Config.showSecrets)) {
            Renderer.scale(0.2*Config.mapScale, 0.2*Config.mapScale)
            let color = this.checkmark == "green" ? colors[Config.greenCheckSecrets] : this.checkmark == "white" ? colors[Config.whiteCheckSecrets] : colors[Config.unexploredSecrets]
            Renderer.drawStringWithShadow(`${color}${this.secrets}`, ((200+this.x)*1.25)/2, ((200+this.z)*1.25)/2)
        }
        Renderer.retainTransforms(false)
    }
    renderCheckmark() {
        Renderer.translate(dataObject.map.x, dataObject.map.y)
        Renderer.scale(0.1*Config.mapScale, 0.1*Config.mapScale)

        let checkSize = Config.mapScale * 4
        let x = (200+this.x)*1.25 + Config.mapScale*1.25 - checkSize/2
        let y = (200+this.z)*1.25 - checkSize/4

        if (this.checkmark == "green") Renderer.drawImage(greenCheck, x, y, checkSize, checkSize)
        if (this.checkmark == "white") Renderer.drawImage(whiteCheck, x, y, checkSize, checkSize)
        if (this.checkmark == "failed") Renderer.drawImage(failedRoom, x, y, checkSize, checkSize)
        if (Config.legitMode && !this.explored && this.normallyVisible) Renderer.drawImage(questionMark, x, y, checkSize, checkSize)
        
    }
    getJson() {
        if (this.cores.length == 0) this.cores = [this.core]
        return {
            "name": this.name,
            "type": this.type,
            "secrets": this.secrets,
            "cores": this.cores
        }
    }
}