import { borderScaleGui, editDungeonInfoGui, mapEditGui } from "./Config"
import { dmapData } from "./utils"

register("dragged", (dx, dy, x, y, btn) => {
    if (mapEditGui.isOpen()) {
        dmapData.map.x = x
        dmapData.map.y = y
        dmapData.save()
    }
    if (editDungeonInfoGui.isOpen()) {
        dmapData.dungeonInfo.x = x
        dmapData.dungeonInfo.y = y
        dmapData.save()
    }
})

// Map edit GUI
register("scrolled", (mx, my, dir) => {
    if (!mapEditGui.isOpen()) return
    if (Client.isShiftDown()) {
        if (dir == 1) dmapData.map.headScale += 0.05
        else dmapData.map.headScale -= 0.05
    }
    else if (Client.isControlDown()) {
        if (dir == 1) dmapData.map.checkScale += 0.05
        else dmapData.map.checkScale -= 0.05
    }
    else {
        if (dir == 1) dmapData.map.scale += 0.01
        else dmapData.map.scale -= 0.01
    }
    dmapData.save()
})

register("scrolled", (mx, my, dir) => {
    if (!borderScaleGui.isOpen()) return
    if (Client.isControlDown()) {
        if (dir == 1) dmapData.border.rgbSpeed += 100
        else dmapData.border.rgbSpeed -= 100
    }
    else {
        if (dir == 1) dmapData.border.scale += 0.25
        else dmapData.border.scale -= 0.25
    }
    dmapData.save()
})

register("scrolled", (mx, my, dir) => {
    if (!editDungeonInfoGui.isOpen()) return
    if (dir == 1) dmapData.dungeonInfo.scale += 0.05
    else dmapData.dungeonInfo.scale -= 0.05
    dmapData.save()
})