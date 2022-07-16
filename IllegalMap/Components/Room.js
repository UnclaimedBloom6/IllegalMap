import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import { Color, renderCenteredString } from "../../BloomCore/Utils/Utils"
import { dmapData, getCheckmarks, getCore, getRealCoords, getRoomFromFile, getRoomPosition, getRoomShape, roomSize } from "../utils"
import Config from "../data/Config"

/**
 * Creates a room.
 * Components is an array of arrays which contain coordinates ranging from 0-10
 * Which correspond to their position in a grid-like pattern of doors and rooms on the map.
 * 6 rooms with 4 doors between.
 */
export class Room {
    /**
     * 
     * @param {Number[][]} components - Arrays containing map coordinates ranging from 0-10 for each number.
     */
    constructor(components, roofLevel) {
        this.components = components
        this.realComponents = components.map(a => getRealCoords(a))
        this.shape = "Unknown"
        this.center = [0, 0] // Where the room name will be rendered
        this.checkmarkCenter = [0, 0] // Where the checkmark will be rendered
        
        this.corner = null
        
        this.checkmark = null
        this.explored = false
        this.width = 0
        this.height = 0
        this.name = null
        this.type = null
        this.secrets = 0
        this.color = null
        this.clear = null
        this.roofLevel = roofLevel
        this.rotation = 0
        this.confirmedRotation = false
        this.hasMimic = false

        this.init()
    }
    init() {
        this.shape = getRoomShape(this.components)

        let minX = Math.min(...this.components.map(a => a[0]))
        let minZ = Math.min(...this.components.map(a => a[1]))
        this.width = Math.max(...this.components.map(a => a[0])) - minX
        this.height = Math.max(...this.components.map(a => a[1])) - minZ
        this.center = [
            minX + (this.width)/2,
            minZ + (this.height)/2
        ]
        this.checkmarkCenter = this.center
        if (this.shape == "L") {
            if (this.components.filter(a => a[1] == minZ).length == 2) this.center[1] -= this.height/2
            else this.center[1] += this.height/2
        }

        for (let c of this.realComponents) {
            let core = getCore(...c)
            let room = getRoomFromFile(core)
            if (!room) continue
            this.name = room.name
            this.type = room.type
            this.secrets = room.secrets
            if (Object.keys(room).includes("clear")) this.clear = room.clear
            break
        }
        this.color = this.getColor()
        if (this.name) this.findRoomRotation()
        // if (!this.name) ChatLib.chat(`Unknown room at ${this.realComponents[0]}`)

        if (this.type == "entrance") {
            for (let c of this.realComponents) {
                let [x, z] = c
                let core = getCore(x, z)
                // ChatLib.chat(`Core at ${x}, ${z}: ${core}`)
            }
        }
    }
    getColor() {
        let color = new Color(107/255, 58/255, 17/255, 1) // Normal room color

        if (this.hasMimic && Config.showMimic) color = new Color(186/255, 66/255, 52/255, 1) 
        else if (this.type == "puzzle") color = new Color(117/255, 0/255, 133/255, 1)
        else if (this.type == "blood") color = new Color(255/255, 0/255, 0/255, 1)
        else if (this.type == "trap") color = new Color(216/255, 127/255, 51/255, 1)
        else if (this.type == "yellow") color = new Color(254/255, 223/255, 0/255, 1)
        else if (this.type == "fairy") color = new Color(224/255, 0/255, 255/255, 1)
        else if (this.type == "entrance") color = new Color(20/255, 133/255, 0/255, 1)
        else if (this.type == "rare") color = new Color(255/255, 203/255, 89/255, 1)
        else if (!this.type) color = new Color(255/255, 176/255, 31/255)

        if (!this.explored && Dungeon.time && Config.darkenUnexplored) return color.darker().darker()
        return color
    }
    findRoomRotation() {
        // Uses the blue stained clay on the roof to find the rotation of the room. Works reliably.
        if (!this.roofLevel || !World.getWorld()) return ChatLib.chat("no! !!")
        for (let c of this.realComponents) {
            let [x, z] = c
            let offset = Math.floor(roomSize/2)
            ;[[x-offset, this.roofLevel, z-offset],
            [x-offset, this.roofLevel, z+offset],
            [x+offset, this.roofLevel, z+offset],
            [x+offset, this.roofLevel, z-offset]].forEach((v, i) => {
                let block = World.getBlockAt(...v)
                if (!block || !block.type) return
                // Must be blue stained terracotta
                if (block.type.getID() !== 159 || block.getMetadata() !== 11) return
                this.rotation = i * 90
                this.confirmedRotation = true
                this.corner = [...v]
                // ChatLib.chat(`Room: ${this.name} rot: ${this.rotation} Corner: ${this.corner}`)
                // ChatLib.chat(`Room ${this.name} is rotated ${this.rotation}`)
            })
        }
    }
    renderName() {
        let name = this.name ?? "Unknown"
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        let [x, y] = getRoomPosition(...(this.center.map(a => a/2)))
        renderCenteredString(name, x+5, y+4, 0.55, true)
    }
    renderCheckmark() {
        const check = getCheckmarks()[this.checkmark]
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        let [x, y] = getRoomPosition(...(this.components[0].map(a => a/2)))
        if (Config.centerCheckmarks) [x, y] = getRoomPosition(...(this.checkmarkCenter.map(a => a/2)))
        let [w, h] = [12*dmapData.map.checkScale, 12*dmapData.map.checkScale]
        Renderer.translate(x + (128/23)-1, y + (128/23)-1)
        Renderer.drawImage(check, -w/2, -h/2, w, h)
        // Renderer.drawRect(Renderer.GREEN, x+4.5, y+4.5, 1, 1)
    }
    renderSecrets() {
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        let [x, y] = getRoomPosition(...this.components[0].map(a => a/2))
        Renderer.translate(x-2, y-2)
        Renderer.scale(0.6, 0.6)
        Renderer.drawString(`&7${this.secrets}`, 0, 0)
    }
}