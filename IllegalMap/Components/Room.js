import Dungeon from "../../BloomCore/dungeons/Dungeon"
import { Color, renderCenteredString } from "../../BloomCore/utils/Utils"
import { chunkLoaded, dmapData, getCheckmarks, getCore, getRealCoords, getRoomDataFromCore, getRoomDataFromName, getRoomPosition, getRoomShape, roomSize } from "../utils"
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
     * @param {Number[][]} components - Arrays containing map coordinates ranging from 0-5 for each number.
     */
    constructor(components, roofLevel=null) {
        this.components = components
        this.realComponents = components.map(a => getRealCoords(a, false))
        this.shape = "Unknown"
        this.center = [0, 0] // Where the room name will be rendered
        this.checkmarkCenter = [0, 0] // Where the checkmark will be rendered
        
        this.corner = null

        this.isLoaded = false
        
        this.checkmark = null
        this.explored = false
        this.width = 0
        this.height = 0
        this.name = null
        this.type = null
        this.secrets = 0
        this.color = null
        this.clear = null
        this.roomFileID = null
        this.roofLevel = roofLevel
        this.rotation = 0
        this.confirmedRotation = false
        this.hasMimic = false

        this.init()
    }
    init() {
        this.update()
        this.scanRoom()
    }
    update() {
        if (!this.name) this.scanRoom()
        this.shape = getRoomShape(this.components)
        this.updateDimensions()
        this.findRoomRotation()
    }
    /**
     * 
     * @param {Number} x - The grid X of the component (0-5) 
     * @param {Number} z  - The grid Z of the component (0-5)
     */
    addComponent([x, z]) {
        if (this.type == "entrance") return
        this.components.push([x, z])
        this.realComponents.push(getRealCoords([x, z], false))
        this.components.sort((a, b) => a[1]-b[1]).sort((a, b) => a[0]-b[0]) // Sort components in the order the map scans them
        this.update()
    }
    scanRoom() {
        for (let c of this.realComponents) {
            let [x, z] = c
            if (!chunkLoaded([x, 0, z])) continue
            let roomData = getRoomDataFromCore(getCore(x, z))
            if (!roomData) return
            this.setRoom(roomData)
            return
        }
    }
    updateDimensions() {
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
    }
    setRoom(roomData) {
        if (!roomData) return
        this.name = roomData.name
        // ChatLib.chat(`${this.name} - ${JSON.stringify(this.components)}`)
        this.type = roomData.type
        this.secrets = roomData.secrets
        this.crypts = roomData.crypts ?? 0
        this.roomFileID = roomData.roomID
        if ("clear" in roomData) this.clear = roomData.clear
        this.updateDimensions()
    }
    setRoomFromName(roomName) {
        let roomData = getRoomDataFromName(roomName)
        if (!roomData) return
        this.setRoom(roomData)
    }
    /**
     * Merges this room with another one.
     * Combines the components of both rooms.
     * If both rooms are identified then this one will take priority.
     * @param {Room} room 
     */
    mergeRoom(room) {
        if ([this.name, room.name].includes("Entrance")) return
        room.components.forEach(([x, z]) => {
            if (this.hasComponent([x, z])) return
            this.addComponent([x, z])
        })
        if (!this.name && room.name) this.setRoomFromName(room.name)
        this.update()
    }
    hasComponent([x, z]) {
        return this.components.some(a => a[0]==x && a[1]==z)
    }
    getColor() {
        let color = new Color(107/255, 58/255, 17/255, 1) // Normal room color
        
        if (this.type == "unexplored") return new Color(65/255, 65/255, 65/255, 1)
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
        if (!World.getWorld()) return

        if (!this.roofLevel) return

        for (let c of this.realComponents) {
            let [x, z] = c
            if (!chunkLoaded([x, 0, z])) continue
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

        // Replace checkmark with the secret number
        if (Config.numberCheckmarks) {
            if (this.type == "puzzle" && this.secrets == 0) return Renderer.finishDraw()
            if (["yellow", "fairy", "blood", "entrance"].includes(this.type)) return Renderer.finishDraw()

            let textColor = "&7"
            if (this.checkmark == "green") textColor = "&2"
            if (this.checkmark == "white") textColor = "&f"
            const text = `${textColor}${this.secrets}`
            Renderer.translate(-Renderer.getStringWidth(text)/2, -4)
            Renderer.scale(1.2, 1.2)
            Renderer.drawString(text, 0, 0)
            return
        }

        Renderer.drawImage(check, -w/2, -h/2, w, h)
    }
    renderSecrets() {
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        let [x, y] = getRoomPosition(...this.components[0].map(a => a/2))
        Renderer.translate(x-2, y-2)
        Renderer.scale(0.6, 0.6)
        Renderer.drawString(`&7${this.secrets}`, 0, 0)
    }
    setType(type) {
        this.type = type
        return this
    }
    toString() {
        return `Room[name=${this.name}, type=${this.type}, components=${JSON.stringify(this.components)}, explored=${this.explored}]`
    }
}