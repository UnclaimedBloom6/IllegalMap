import { Checkmark, ClearTypes, componentToRealCoords, defaultMapSize, dmapData, getCheckmarks, getCore, getHighestBlock, getRoomPosition, getRoomShape, halfRoomSize, mapCellSize, MapColorToRoomType, RoomColors, RoomNameColorKeys, roomsJson, RoomTypes, RoomTypesStrings, setPixels } from "../utils"
import Dungeon from "../../BloomCore/dungeons/Dungeon"
import Config from "../data/Config"
import { chunkLoaded, Color, colorShift, renderCenteredString } from "../../BloomCore/utils/Utils"
import { RoomMap } from "../utils"


const offsets = [[-halfRoomSize, -halfRoomSize], [halfRoomSize, -halfRoomSize], [halfRoomSize, halfRoomSize], [-halfRoomSize, halfRoomSize]]

export default class Room {
    constructor(components=[], roofHeight=null) {

        this.name = null
        this.type = RoomTypes.UNKNOWN
        this.secrets = 0
        this.cores = []
        this.roomID = null
        this.clearType = null
        this.crypts = 0

        this.shape = "1x1"
        this.rotation = null
        this.corner = null

        this.roofHeight = roofHeight

        this.highlighted = false
        
        this.checkmark = Checkmark.NONE
        this.explored = false
        this.hasMimic = false

        // Rendering stuff
        this.width = 0
        this.height = 0
        this.center = [0, 0] // RoomTypes name is drawn here
        this.checkmarkCenter = [0, 0]

        this.parent = null
        this.children = []
        this.doors = []

        this.components = []
        this.realComponents = []
        components.forEach(c => this.addComponent(c))

        this.doors = []
        this.findRotation()
    }

    scanAndLoad() {
        this.checkmark = Checkmark.NONE
        for (let c of this.realComponents) {
            let [x, z] = c
            if (!this.roofHeight) this.roofHeight = getHighestBlock(x, z)
            let core = getCore(x, z)
            if (this.loadRoomFromCore(core)) return
        }
    }

    loadFromData(roomData) {
        this.name = roomData.name
        this.type = RoomTypesStrings.get(roomData.type) ?? RoomTypes.NORMAL
        this.secrets = roomData.secrets
        this.cores = roomData.cores
        this.roomID = roomData.roomID
        this.clear = roomData.clear == "mob" ? ClearTypes.MOB : ClearTypes.MINIBOSS
        this.crypts = roomData.crypts ?? 0
    }

    loadFromRoomId(roomID) {
        const roomData = RoomMap.get(roomID)
        if (!roomData) return false
        this.loadFromData(roomData)
        return true
    }

    loadRoomFromCore(core) {
        for (let roomData of roomsJson) {
            if (!roomData.cores.includes(core)) continue
            this.loadFromData(roomData)

            return true
        }
        return false
    }

    findRotation() {
        if (!this.roofHeight) return

        if (this.type == RoomTypes.FAIRY) {
            this.rotation = 0
            let [x, z] = this.realComponents[0]
            this.corner = [x-halfRoomSize+0.5, this.roofHeight, z-halfRoomSize+0.5]
            return
        }

        for (let c of this.realComponents) {
            let [x, z] = c
            for (let i = 0; i < offsets.length; i++) {
                let [dx, dz] = offsets[i]
                let [nx, nz] = [x+dx, z+dz]
                if (!chunkLoaded(nx, this.roofHeight, nz)) return
                
                let block = World.getBlockAt(nx, this.roofHeight, nz)
                if (block.type.getID() !== 159 || block.getMetadata() !== 11) continue
                this.rotation = i*90
                this.corner = [nx+0.5, this.roofHeight, nz+0.5]
                return
            }
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

    /**
     * 
     * @param {[Number, Number]} component 
     */
    hasComponent([x, z]) {
        for (let c of this.components) {
            if (c[0] == x && c[1] == z) return true
        }
        return false
    }

    addComponent([x, z]) {
        if (this.hasComponent([x, z])) return this
        this.components.push([x, z])

        // Sort components so the top left on the map is always first
        this.components.sort((a, b) => a[1]-b[1]).sort((a, b) => a[0]-b[0])
        this.realComponents = this.components.map(a => componentToRealCoords(a, false))
        this.shape = getRoomShape(this.components)
        this.updateDimensions()

        this.corner = null
        this.rotation = null

        this.findRotation()

        return this
    }
    
    addComponents(components) {
        components.forEach(c => this.addComponent(c))
        return this
    }

    merge(room) {
        
        room.components.forEach(c => this.addComponent(c))

        // If the merging room is already loaded then load it
        for (let core of room.cores) {
            if (this.loadRoomFromCore(core)) break
        }

        // If not loaded
        if (this.type == RoomTypes.UNKNOWN) this.scanAndLoad()

    }

    loadFromRoomMapColor(color) {
        this.type = MapColorToRoomType.get(color) ?? RoomTypes.NORMAL

        if (this.type == RoomTypes.BLOOD) this.loadFromData(roomsJson.find(a => a.name == "Blood"))
        if (this.type == RoomTypes.ENTRANCE) this.loadFromData(roomsJson.find(a => a.name == "Entrance"))
    }

    getColor() {
        let color = RoomColors.get(this.type)
        // Gray room on the map.
        if (this.type == RoomTypes.UNKNOWN && !this.roofHeight) return new Color(65/255, 65/255, 65/255, 1)

        if (this.highlighted) color = colorShift(color, Color.YELLOW, 0.2)
        if (!this.explored && Dungeon.time && Config.darkenUnexplored) color = color.darker().darker()
        // Give the room a red tint if it has the mimic
        if (this.hasMimic) color = colorShift(color, Color.RED, 0.2)
        return color
    }

    draw(bufferedImage) {
        let color = this.getColor()
        // Main components and connectors
        this.components.forEach(a => {
            let [x, y] = a
            setPixels(bufferedImage, 4*x, 4*y, 3, 3, color)
            if (this.components.some(b => b[0] == x && b[1] == y+1)) setPixels(bufferedImage, 4*x, 4*y+3, 3, 1, color)
            if (this.components.some(b => b[0] == x+1 && b[1] == y)) setPixels(bufferedImage, 4*x+3, 4*y, 1, 3, color)
        })
        // Hole in the middle of 2x2's
        if (this.shape == "2x2") {
            let minX = Math.min(...this.components.map(a => a[0]))*4
            let minY = Math.min(...this.components.map(a => a[1]))*4
            setPixels(bufferedImage, minX + 3, minY + 3, 1, 1, color)
        }
    }

    renderName() {
        let name = this.name ?? "Unknown"
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        let [x, y] = getRoomPosition(...(this.center))
        renderCenteredString(name, x, y-1, 0.55, true)
    }

    renderCheckmark() {
        const check = getCheckmarks().get(this.checkmark)
        Renderer.translate(dmapData.map.x, dmapData.map.y)
        Renderer.scale(dmapData.map.scale, dmapData.map.scale)
        const firstComponent = this.components[0]
        let [x, y] = getRoomPosition(...firstComponent)
        if (Config.centerCheckmarks) [x, y] = getRoomPosition(...this.checkmarkCenter)
        let [w, h] = [12*dmapData.map.checkScale, 12*dmapData.map.checkScale]
        Renderer.translate(x, y)

        // Replace checkmark with the secret number
        if (Config.numberCheckmarks) {
            if (this.type == RoomTypes.PUZZLE && this.secrets == 0) return Renderer.finishDraw()
            if ([RoomTypes.YELLOW, RoomTypes.FAIRY, RoomTypes.BLOOD, RoomTypes.ENTRANCE].includes(this.type)) return Renderer.finishDraw()

            let textColor = "&7"
            if (this.checkmark == Checkmark.GREEN) textColor = "&2"
            if (this.checkmark == Checkmark.WHITE) textColor = "&f"
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
        const firstComponent = this.components[0]
        let [x, y] = getRoomPosition(...firstComponent)
        Renderer.translate(x-mapCellSize*1.3, y-mapCellSize*1.3)
        Renderer.scale(0.6, 0.6)
        Renderer.drawString(`&7${this.secrets}`, 0, 0)
    }

    /**
     * 
     * @returns {Room[]}
     */
    getAdjacentRooms() {
        let adjacent = []
        for (let door of this.doors) {
            if (door.childRoom == this) adjacent.push(door.parentRoom)
            else if (door.parentRoom == this) adjacent.push(door.childRoom)
        }
        return adjacent
    }
    /**
     * Checks whether the entire room is within render distance
     * @returns {Boolean}
     */
    isWithinRender() {
        for (let c of this.realComponents) {
            let [x, z] = c
            for (let i = 0; i < offsets.length; i++) {
                let [dx, dz] = offsets[i]
                let [nx, nz] = [x+dx, z+dz]
                if (!chunkLoaded(nx, this.roofHeight, nz)) return false
            }
        }
        return true
    }

    /**
     * Gets the name of this room with formatting codes.
     * @param {Boolean} formatted 
     */
    getName(formatted=true) {
        let color = formatted ? (RoomNameColorKeys.get(this.type) ?? "&f") : "&f"
        return `${color}${this.name}`
    }

    getRoomScore() {
        if (this.roomID == null) return Infinity
        const roomData = RoomMap.get(this.roomID)
        if ("roomScore" in roomData) return roomData.roomScore
        if ("secretScore" in roomData && "clearScore" in roomData) return roomData.secretScore/2 + roomData.clearScore/2
    }

    toString() {
        return `Room[&ename=&6${this.getName(true)}&f, &7components=${JSON.stringify(this.components)}&f, &2explored=${this.explored}&f]`
    }
}