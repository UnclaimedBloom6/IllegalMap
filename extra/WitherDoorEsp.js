import Dungeon from "../../BloomCore/dungeons/Dungeon"
import Config from "../utils/Config"
import DmapDungeon from "../components/DmapDungeon"
import { DoorTypes } from "../utils/utils"
import { registerWhen } from "../../BloomCore/utils/Utils"
import Room from "../components/Room"
import { renderBoxOutline } from "../../BloomCore/RenderUtils"

const TypesToESP = [DoorTypes.WITHER, DoorTypes.BLOOD]

let doorsToRender = [] // Door objects

/**
 * 
 * @param {Room} room 
 */
const searchForWitherDoors = (room, doorsFound=0) => {
    // True meaning that the end has been reached, no more recursion
    if (doorsFound == 2) return true

    for (let child of room.children) {
        let door = DmapDungeon.getDoorBetweenRooms(room, child)
        if (!door || !TypesToESP.includes(door.type)) continue

        doorsToRender.push(door)

        if (!searchForWitherDoors(child, doorsFound+1)) continue
        return true
    }

    return false
}


register("tick", () => {
    if (!Config().witherDoorEsp) return
    const room = DmapDungeon.getCurrentRoom()
    if (!room) return
    doorsToRender = []
    searchForWitherDoors(room)
    if (doorsToRender.every(a => a.opened)) doorsToRender = []
})

const renderDoor = (door) => {
    const color = Config().witherDoorEspColor
    const [r, g, b] = [color[0] / 255, color[1] / 255, color[2] / 255]
    let x = door.x
    let z = door.z
    renderBoxOutline(x+0.5, 69, z+0.5, 3, 4, r, g, b, 1, 2, true)
}

registerWhen(register("renderWorld", () => {
    doorsToRender.forEach(door => renderDoor(door))
}), () => doorsToRender.length)

register("worldUnload", () => {
    doorsToRender = []
})