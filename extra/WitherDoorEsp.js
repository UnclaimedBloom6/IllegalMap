import { renderBoxOutline } from "../../BloomCore/RenderUtils"
import DmapDungeon from "../components/DmapDungeon"
import Config from "../utils/Config"
import { DoorTypes } from "../utils/utils"

let doorsToRender = []
let r = Config().witherDoorEspColor[0] / 255
let g = Config().witherDoorEspColor[1] / 255
let b = Config().witherDoorEspColor[2] / 255

const searchForDoors = () => {
    const playerRoom = DmapDungeon.getCurrentRoom()

    let reachedPlayer = false
    doorsToRender = []
    let foundClosed = false // If all wither doors are opened, then don't render any

    // Start at 1 to skip the entrance door
    for (let i = 1; i < DmapDungeon.dungeonMap.witherDoors.length; i++) {
        let door = DmapDungeon.dungeonMap.witherDoors[i]
        let parent = door.parentRoom

        // Reached the player's current room, start adding doors to the list
        if (parent == playerRoom) {
            reachedPlayer = true
        }

        // If the player is less than 5 blocks away then don't render the door
        if (reachedPlayer && (Player.getX() - door.x)**2 + (Player.getZ() - door.z)**2 > 5**2 && doorsToRender.length < Config().witherDoorsAhead) {
            doorsToRender.push(door)
        }

        if (!door.opened) {
            foundClosed = true
        }
    }

    // All doors opened, don't render anything
    if (!foundClosed) {
        doorsToRender = []
    }
}

const doorRenderer = register("renderWorld", () => {
    for (let i = 0; i < doorsToRender.length; i++) {
        let x = doorsToRender[i].x
        let z = doorsToRender[i].z

        renderBoxOutline(x+0.5, 69, z+0.5, 3, 4, r, g, b, 1, 2, true)
    }
}).unregister()

const tickChecker = register("tick", () => {
    if (!Config().witherDoorEsp) {
        doorRenderer.unregister()
        return
    }

    searchForDoors()

    if (doorsToRender.length > 0) {
        doorRenderer.register()
        // Color has no listener ):
        r = Config().witherDoorEspColor[0] / 255
        g = Config().witherDoorEspColor[1] / 255
        b = Config().witherDoorEspColor[2] / 255
    }
    else {
        doorRenderer.unregister()
    }
}).unregister()

if (Config().witherDoorEsp) {
    tickChecker.register()
}

Config().getConfig().registerListener("&8Wither Door Esp", (state) => {
    if (state) {
        tickChecker.register()
    }
    else {
        tickChecker.unregister()
    }
})