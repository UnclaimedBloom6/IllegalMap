import Config from "../data/Config"
import { Color } from "../utils/Utils"

export class Door {
    constructor(x, z, type) {
        this.x = x
        this.z = z
        this.type = type ? type : "normal"
        this.explored = true
        this.normallyVisible = true
    }
    getColor() {
        switch (this.type) {
            case "wither":
                return Config.witherDoorColor
            case "blood":
                return new Color(231/255, 0/255, 0/255, 1)
            case "entrance":
                return new Color(20/255, 133/255, 0/255, 1)
            default:
                return new Color(92/255, 52/255, 14/255, 1)
        }
    }
    update() {
        let id = World.getBlockAt(this.x, 70, this.z).getID()
        if (id == 0 || id == 166) {
            this.type == "normal"
        }
    }
}