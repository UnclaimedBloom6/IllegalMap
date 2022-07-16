import { Color } from "../../BloomCore/Utils/Utils"
import { getGridCoords } from "../utils"
import Config from "../data/Config"
import Dungeon from "../../BloomCore/Dungeons/Dungeon"

/**
 * Creates a door.
 * x, z are real coordinates in the world.
 */
export class Door {
    /**
     * 
     * @param {Number} x - Real world x coordinate of where the door is.
     * @param {Number} z - z coordinate
     * @param {String} type - The door type. Eg "entrance", "blood" etc. All lower-case. 
     */
    constructor(x, z, type=null) {
        this.x = x
        this.z = z
        this.type = type || "normal"
        this.explored = false
        this.gX = null
        this.gZ = null
        this.color = null
        this.init()
    }
    init() {
        [this.gX, this.gZ] = getGridCoords([this.x, this.z], true)
        this.updateDoorType()
        this.color = this.getColor()
    }
    updateDoorType() {
        let id = World.getBlockAt(this.x, 69, this.z)?.type?.getID() || 0
        if (id == 159) this.type = "blood"
        else if (id == 97) this.type = "entrance"
        else if (id == 173) this.type = "wither"
        else this.type = "normal"

        this.color = this.getColor()
    }
    getColor() {
        let color = new Color(92/255, 52/255, 14/255, 1)
        if (this.type == "wither") color = Config.witherDoorColor
        if (this.type == "blood") color = new Color(231/255, 0/255, 0/255, 1)
        if (this.type == "entrance") color = new Color(20/255, 133/255, 0/255, 1)

        if (!this.explored && Dungeon.time && Config.darkenUnexplored) return color.darker().darker()
        return color
    }
}