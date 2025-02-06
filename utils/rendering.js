import DmapDungeon from "../components/DmapDungeon"
import { editDungeonInfoGui, mapEditGui } from "./Config"
import { BlueMarker, Checkmark, defaultMapSize, dmapData, getRgb, getRoomPosition, GreenMarker, leapNames, mapCellSize, peekKey, RoomTypes } from "./utils"
import Config from "./Config"
import Dungeon from "../../BloomCore/dungeons/Dungeon"
import Room from "../components/Room"
import { DungeonPlayer } from "../components/DungeonPlayer"
import { renderCenteredString } from "../../BloomCore/utils/Utils"
import { renderRadar } from "../extra/StarMobStuff"

// If dungeon if being rendered under the map, it is extended downwards by 10px
const getExtraMapHeight = () => {
    return Config().dungeonInfo == 0 && !Config().hideInBoss || Config().dungeonInfo == 3 && !Dungeon.bossEntry ? mapCellSize*2 : 0
}

/**
 * 
 * @param {Room} room 
 * @returns 
 */
const renderCheckmark = (room) => {
    // Replace checkmark with the secret number
    if (Config().numberCheckmarks) {
        // No secrets for these rooms
        if (room.type == RoomTypes.YELLOW || room.type == RoomTypes.FAIRY || room.type == RoomTypes.BLOOD || room.type == RoomTypes.ENTRANCE) {
            return
        }

        const textColor = room.checkmark == Checkmark.GREEN ? "&a" : room.checkmark == Checkmark.WHITE ? "&f" : "&7"
        const text = `${textColor}${room.secrets}`

        Renderer.drawString(text, room.checkmarkX - Renderer.getStringWidth(text)/2, room.checkmarkY - 4)

        return
    }

    if (!room.checkmarkImage || room.checkmark == Checkmark.NONE || room.checkmark == Checkmark.UNEXPLORED) return

    Renderer.drawImage(room.checkmarkImage, -room.checkmarkWidth/2  + room.checkmarkX, -room.checkmarkHeight/2 + room.checkmarkY, room.checkmarkWidth, room.checkmarkHeight)
    Renderer.finishDraw()
}

/**
 * 
 * @param {Room} room 
 */
const renderRoomName = (room) => {
    const TEXT_HEIGHT = 9
    const nameArr = room.name ? room.name.split(" ") : ["Unknown"]
    const totalHeight = nameArr.length * TEXT_HEIGHT + (nameArr.length - 1) // Text 10 high, +1 gap between

    // Change the text color depending on the checkmark state
    // Defaults to white if run not started for better visibility
    let textColor = "&f"
    if (Dungeon.time && !peekKey.isKeyDown() && Config().showRoomNames) {
        if (room.checkmark == Checkmark.UNEXPLORED) {
            textColor = "&8"
        }
        if (room.checkmark == Checkmark.NONE) {
            textColor = "&7"
        }
        if (room.checkmark == Checkmark.WHITE) {
            textColor = "&f"
        }
        if (room.checkmark == Checkmark.GREEN) {
            textColor = "&a"
        }
        if (room.checkmark == Checkmark.FAILED) {
            textColor = "&4"
        }
    }

    // Render each line one by one so that they can be centered perfectly in both the x and y axis
    for (let i = 0; i < nameArr.length; i++) {
        let dx = - Renderer.getStringWidth(nameArr[i]) / 2
        let dy = -totalHeight / 2 + i * (TEXT_HEIGHT + 1) // 1px of gap

        Renderer.translate(room.roomNameX, room.roomNameY)
        Renderer.scale(0.55)
        Renderer.drawStringWithShadow(`${textColor}${nameArr[i]}`, dx, dy)

        // Reset transforms
        Renderer.scale(1/0.55)
        Renderer.translate(-room.roomNameX, -room.roomNameY)
    }
}

/**
 * Renders the small secret text at the top left corner of a room showing its max secrets
 * @param {Room} room 
 */
const renderRoomSecrets = (room) => {
    const firstComponent = room.components[0]

    let [x, y] = getRoomPosition(firstComponent[0], firstComponent[1])
    const renderX = x - mapCellSize * 1.3
    const renderY = y - mapCellSize * 1.3

    Renderer.translate(renderX, renderY)
    Renderer.scale(0.6)
    
    Renderer.drawString(`&7${room.secrets}`, 0, 0)

    // Reset transforms
    Renderer.scale(1/0.6)
    Renderer.translate(-renderX, -renderY)
}

const renderBorder = () => {
    const width = defaultMapSize[0]
    const height = defaultMapSize[1] + getExtraMapHeight()

    const drawMode = Config().mapBorder == 3 ? 1 : 7

    let color = null
    if (Config().mapBorder == 1) {
        const [r, g, b] = getRgb()
        color = Renderer.color(r, g, b, 255)
    }
    else {
        const [r, g, b, a] = Config().borderColor
        color = Renderer.color(r, g, b, a)
    }

    Renderer.drawLine(color, 0, 0, 0, height, dmapData.border.scale, drawMode)
    Renderer.drawLine(color, 0, 0, width, 0, dmapData.border.scale, drawMode)
    Renderer.drawLine(color, width, 0, width, height, dmapData.border.scale, drawMode)
    Renderer.drawLine(color, 0, height, width, height, dmapData.border.scale, drawMode)
}

/**
 * 
 * @param {DungeonPlayer} player 
 */
const renderPlayer = (player) => {
    // Don't try to draw other dead players
    if ((Dungeon.deadPlayers.has(player.player) || !Dungeon.party.has(player.player)) && player.player !== Player.getName()) return

    if (!player.iconX || !player.iconY) return
    
    // Default for when heads are not loaded
    let imgToRender = player.player == Player.getName() ? GreenMarker : BlueMarker
    
    let headW = 7
    let headH = 10

    if (player.head && Config().playerHeads && (!Config().useVanillaOwnHead && player.player == Player.getName())) {
        headW = 10
        imgToRender = player.head
    }

    Renderer.translate(player.iconX, player.iconY)
    Renderer.scale(dmapData.map.headScale, dmapData.map.headScale)
    Renderer.rotate(player.rotation ?? 0)
    Renderer.translate(-headW/2, -headH/2)
    Renderer.drawImage(imgToRender, 0, 0, headW, headH)

    // Transform back to the center of the head with no rotation
    Renderer.translate(headW/2, headH/2)
    Renderer.rotate(-player.rotation ?? 0)
    Renderer.scale(1/dmapData.map.headScale)


    if (!Config().showOwnName && player.player == Player.getName()) {
        Renderer.translate(-player.iconX, -player.iconY)
        return
    }

    // Render the player name
    if (Config().spiritLeapNames && leapNames.includes(Player.getHeldItem()?.getName()?.removeFormatting()) || Config().showPlayerNames) {
        const name = player.formatted && Config().showPlayerRanks ? player.formatted : player.player
        const width = Renderer.getStringWidth(name)

        Renderer.translate(0, 7)
        Renderer.scale(dmapData.map.headScale/1.75)
        Renderer.drawRect(Renderer.color(0, 0, 0, 150), -width/2-2, -2, width+4, 11)
        Renderer.drawStringWithShadow(name, -width/2, 0)

        Renderer.scale(1/(dmapData.map.headScale/1.75))
        Renderer.translate(0, -7)
    }

    // Reset transforms back to the top left of the dungeon
    Renderer.translate(-player.iconX, -player.iconY)
}

const renderInfoUnderMap = () => {
    const mapWidth = defaultMapSize[0]
    const mapHeight = defaultMapSize[1]
    Renderer.translate(mapWidth / 2, mapHeight - mapCellSize / 2)
    Renderer.scale(0.6)
    
    const lineWidth1 = Renderer.getStringWidth(DmapDungeon.mapLine1)
    const lineWidth2 = Renderer.getStringWidth(DmapDungeon.mapLine2)
    
    Renderer.drawStringWithShadow(DmapDungeon.mapLine1, -lineWidth1 / 2, 0)
    Renderer.drawStringWithShadow(DmapDungeon.mapLine2, -lineWidth2 / 2, 10)

    // Reset transforms
    Renderer.scale(1/0.6)
    Renderer.translate(-mapWidth / 2, -mapHeight + mapCellSize / 2)
}

export const renderInfoSeparate = () => {
    const lines = DmapDungeon.mapLine1.split("    ").concat(DmapDungeon.mapLine2.split("    "))

    // Find the width of the longest line to be used to get the background size, with 2px padding each side
    const width = Math.max(...lines.map(a => Renderer.getStringWidth(a))) + 4
    const height = 10 * lines.length + (lines.length - 1) + 4

    let [r, g, b, a] = Config().dungeonInfoBackgroundColor

    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.dungeonInfo.x, dmapData.dungeonInfo.y)
    Renderer.scale(dmapData.dungeonInfo.scale, dmapData.dungeonInfo.scale)

    // Draw the background
    if (a !== 0) {
        Renderer.drawRect(Renderer.color(r, g, b, a), 0, 0, width, height)
    }

    for (let i = 0; i < lines.length; i++) {
        Renderer.drawStringWithShadow(lines[i], 2, 10 * i + i + 2)
    }

    Renderer.retainTransforms(false)
    Renderer.finishDraw()
}

export const renderMapEditGui = () => {
    renderCenteredString([
        "Scroll to change the map scale.",
        "Shift + Scroll to change player head scale.",
        "Control + Scroll to change checkmark scale."
    ], Renderer.screen.getWidth() / 2, Renderer.screen.getHeight() / 3, 1, false)
    if (Dungeon.inDungeon && Config().enabled) return

    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale)

    const headW = 10 * dmapData.map.headScale
    const headH = 10 * dmapData.map.headScale

    Renderer.drawRect(Renderer.WHITE, 0, 0, headW, headH)
    Renderer.finishDraw()
}

export const renderMap = () => {

    Renderer.retainTransforms(true)
    Renderer.translate(dmapData.map.x, dmapData.map.y)
    Renderer.scale(dmapData.map.scale, dmapData.map.scale)

    const borderW = defaultMapSize[0]
    const borderH = defaultMapSize[1]

    // Check if the background color alpha is not 0
    if (Config().backgroundColor[3] > 0) {
        const [r, g, b, a] = Config().backgroundColor

        // If the map is rendering the extra info under the map, extend the background down to house that info.
        const extraHeight = getExtraMapHeight()

        Renderer.drawRect(Renderer.color(r, g, b, a), 0, 0, borderW, borderH + extraHeight) 
    }

    // 5px of padding between the map and the background
    const mapWidth = borderW - mapCellSize * 2
    const mapHeight = borderH - mapCellSize * 2

    // And draw the actual map, offset 5px from the top left corner to separate it from the edge of the background
    Renderer.drawImage(DmapDungeon.map, mapCellSize, mapCellSize, mapWidth, mapHeight)

    // Render the room decorators
    DmapDungeon.dungeonMap.rooms.forEach(room => {
        // The Checkmarks if enabled
        if (Config().checkmarkStyle !== 2) {
            renderCheckmark(room)
        }

        // Render room names if always on, except Blood, Fairy and Entrance
        if ((Config().showRoomNames || peekKey.isKeyDown()) && room.type !== RoomTypes.BLOOD && room.type !== RoomTypes.FAIRY && room.type !== RoomTypes.ENTRANCE) {
            renderRoomName(room)
        }

        // Render puzzle/trap names if not already rendered
        if (!Config().showRoomNames && Config().showPuzzleNames && (room.type == RoomTypes.PUZZLE || room.type == RoomTypes.TRAP)) {
            renderRoomName(room)
        }

        // Render secret count in top left corner of room
        if ((Config().showSecrets || peekKey.isKeyDown()) && (room.type == RoomTypes.NORMAL || room.type == RoomTypes.RARE)) {
            renderRoomSecrets(room)
        }
    })

    // Render the border
    if (Config().mapBorder !== 0) {
        renderBorder()
    }

    // Render map info
    if (Config().dungeonInfo == 0 || Config().dungeonInfo == 3 && !Dungeon.bossEntry) {
        renderInfoUnderMap()
    }

    // Render the players. The user is rendered last so that they are always ontop of everyone else
    let myPlayer = null
    for (let i = 0; i < DmapDungeon.players.length; i++) {
        // Store the player to be rendered last
        if (DmapDungeon.players[i].player == Player.getName) {
            myPlayer = DmapDungeon.players[i]
            continue
        }

        renderPlayer(DmapDungeon.players[i])
    }

    // Render the user last
    if (myPlayer) {
        renderPlayer(myPlayer)
    }

    // Star mob radar, rendered above the player as the radar icons are usually smaller and thus could be obscured by the player's own icon
    if (Config().radar) {
        renderRadar()
    }

    // Done rendering the main map stuff
    Renderer.retainTransforms(false)
    Renderer.finishDraw()

    // The separate info is not related to the map at all so it's rendered separately
    if (Config().dungeonInfo == 1 || Config().dungeonInfo == 3 && Dungeon.bossEntry || editDungeonInfoGui.isOpen()) {
        renderInfoSeparate()
    }
}