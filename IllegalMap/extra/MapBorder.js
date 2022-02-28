import Config from "../data/Config"
import Dungeon from "../dungeon/Dungeon"
import { dataObject } from "../utils/Utils"

let red = 1.0
let green = 0.0
let blue = 0.0

function rgb() {
    if (red >= 1.0) {
        if (blue > 0.0) {
            blue = blue - 0.05
        } else {
            green = green + 0.05
        }
        if (green >= 1) {
            green = 1
            red = red - 0.05
        }
    } else if (green >= 1.0) {
        if (red > 0.0) {
            red = red - 0.05
        } else {
            blue = blue + 0.05
        }
        if (blue >= 1) {
            blue = 1
            green = green - 0.05
        }
    } else if (blue >= 1.0) {
        if (green > 0.0) {
            green = green - 0.05
        } else {
            red = red + 0.05
        }
        if (red >= 1) {
            red = 1
            blue = blue - 0.05
        }
    }
}

let rgbColor = 0
let lastRGB = null

register("step", () => {
    if (Config.mapBorder !== 1 || new Date().getTime() - lastRGB < 100/Config.rgbSpeed) return
    rgb()
    rgbColor = Renderer.color(red*255, green*255, blue*255, 255)
    lastRGB = new Date().getTime()
})

register("renderOverlay", () => {
    if (Config.mapBorder !== 0) {
        const drawBorder = (color) => {
            let width = Dungeon.mapSize[0] * Config.mapScale
            let height = Dungeon.mapSize[1] * Config.mapScale
            let x = dataObject.map.x
            let y = dataObject.map.y
            let thick = Config.mapScale/5
            Renderer.drawLine(color, x, y, x+width, y, thick, 7)
            Renderer.drawLine(color, x, y, x, y+height, thick, 7)
            Renderer.drawLine(color, x+width, y, x+width, y+height, thick, 7)
            Renderer.drawLine(color, x, y+height, x+width, y+height, thick, 7)
        }
        drawBorder([rgbColor, Config.borderColor.hashCode()][Config.mapBorder-1])
    }
})