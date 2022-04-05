import {
    BufferedImage, Color, dataObject
} from "./Utils"
import Config from "../data/Config"

class Map {
    constructor() {
        this.reset()
        register("worldLoad", () => {
            this.reset()
        })

        register("command", () => {
            dataObject.debugMap = !dataObject.debugMap
            dataObject.save()
        }).setName("debugmap")

        register("step", () => {
            if (!dataObject.debugMap) return
            this.makeMap()
        }).setFps(2)

        register("renderOverlay", () => {
            if (!dataObject.debugMap) return
            this.renderMap()
        })
    }
    reset() {
        this.startCorner = [5, 5]
        this.roomSize = 16
        this.calibrated = false
        this.image = null
    }
    getMap() {
        if (!Player.getPlayer()) return
        let mapItem = Player.getInventory().getStackInSlot(8)
        if (!mapItem || mapItem.getID() !== 358 || !mapItem.getName().includes("Magical Map")) return
        return mapItem
    }
    getMapData() {
        let map = this.getMap()
        if (!map) return
        return map.getItem().func_77873_a(map.getItemStack(), World.getWorld())
    }
    getMapDecorators() {
        let mapData = this.getMapData()
        if (!mapData) return
        return mapData.field_76203_h
    }
    getMapColors() {
        let mapData = this.getMapData()
        if (!mapData) return
        return mapData.field_76198_e
    }
    calibrate(dungeon) {
        
        if (dungeon.totalRooms > 29) this.startCorner = [5, 5]
        else if (dungeon.totalRooms == 29) this.startCorner = [16, 5]
        else if (dungeon.totalRooms == 24) this.startCorner = [11, 11]

        if ([1, 2, 3].includes(dungeon.floorInt) || dungeon.totalRooms == 24) this.roomSize = 18
        else this.roomSize = 16
        if (dungeon.floorInt == 1) this.startCorner = [22, 11]
        else if (dungeon.floorInt == 2 || dungeon.floorInt == 3) this.startCorner = [11, 11]
        else if (dungeon.floorInt == 4 && dungeon.totalRooms > 24) this.startCorner = [5, 16]
        
        this.calibrated = true
    }
    makeMap() {
        new Thread(() => {
            let map = new BufferedImage(128, 128, BufferedImage.TYPE_4BYTE_ABGR)
            let rgbColors = JSON.parse(FileLib.read("IllegalMap", "data/mapColors.json"))
            let mapColors = this.getMapColors()
            if (!mapColors) return

            for (let i = 0; i < 128; i++) {
                for (let j = 0; j < 128; j++) {
                    let c = mapColors[i + j * 128]
                    if (c == 0) continue
                    if (!this.startCorner) this.startCorner = [i, j]
                    let rgb = rgbColors[c]
                    map.setRGB(i, j, new Color(rgb[0]/255, rgb[1]/255, rgb[2]/255, 1).getRGB())
                }
            }
            for (let x = 0; x <= 5; x++) {
                for (let z = 0; z <= 5; z++) {
                    let mx = x*this.roomSize+this.startCorner[0]+this.roomSize/2+x*4
                    let my = z*this.roomSize+this.startCorner[1]+this.roomSize/2+z*4
                    map.setRGB(mx, my, new Color(1, 0, 1, 1).getRGB())
                    map.setRGB(mx-3, my-1, new Color(1, 0, 0, 1).getRGB())
                }
            }
            map.setRGB(this.startCorner[0], this.startCorner[1], new Color(0, 0, 1, 1).getRGB())
            this.image = map
        }).start()
    }
    renderMap() {
        if (!this.image) return
        Renderer.drawImage(new Image(this.image), 450, 10, 150, 150)
    }

}
export default new Map()