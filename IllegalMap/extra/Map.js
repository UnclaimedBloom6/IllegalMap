import Dungeon from "../../BloomCore/Dungeons/Dungeon"
import { BufferedImage, Color } from "../../BloomCore/Utils/Utils"
import IMDungeon from "../dungeon/IMDungeon"
import Config from "../data/Config"
import { dataObject } from "../utils/Utils"

export default new class Map {
    constructor() {
        this.size = [25, 27]
        this.map = new BufferedImage(25, 25, BufferedImage.TYPE_4BYTE_ABGR)

        register("step", () => {
            if (!Config.mapEnabled || !Dungeon.inDungeon) return
            this.makeMap()
        }).setFps(2)

        register("tick", () => {
            let totalSecrets = Dungeon.totalSecrets || IMDungeon.totalSecrets
            let secretsForMax = Math.ceil(totalSecrets*Dungeon.secretsPercentNeeded)
            // Row 1 stuff
            let scSecrets = `&7Secrets: &b${Dungeon.secretsFound}`
            let scSecretsExtra = !Dungeon.totalSecrets && Config.legitMode ? "" : `&8-&e${totalSecrets - Dungeon.secretsFound}&8-&c${totalSecrets}`
            let scCrypts = `&7Crypts: ${(Dungeon.crypts >= 5 ? "&a" : Dungeon.crypts == 0 ? "&c" : "&e") + Dungeon.crypts}`
            let scMimic = Dungeon.floorNumber < 6 ? "" : `&7Mimic: ` + (Dungeon.mimicKilled ? "&a✔" : "&c✘")
            
            this.row1 = `${scSecrets}${scSecretsExtra}     ${scCrypts}     ${scMimic}`.trim()

            // Row 2 stuff
            let remainingSecretScore = 40 - (Dungeon.isPaul ? 10 : 0) - (Dungeon.crypts > 5 ? 5 : Dungeon.crypts) + Dungeon.deathPenalty
            remainingSecretScore = remainingSecretScore > 40 ? 40 : remainingSecretScore < 0 ? 0 : remainingSecretScore
            
            let minSecrets = Math.ceil(secretsForMax*((40 - (Dungeon.isPaul ? 10 : 0) - (Dungeon.crypts > 5 ? 5 : Dungeon.crypts))/40))
            let scMinSecrets = `&7Min Secrets: ` + (Config.legitMode && !Dungeon.secretsFound ? "&b0" : Dungeon.secretsFound < minSecrets ? `&e${minSecrets}` : `&a${minSecrets}`)
            let scDeaths = Dungeon.deaths == 0 ? `&7Deaths: &a0` : `&7Deaths: &c${Dungeon.deathPenalty}`
            let scScore = `&7Score: ${(Dungeon.score < 270 ? "&c" : Dungeon.score < 300 ? "&e" : "&a") + Dungeon.score}` + (Dungeon.isPaul ? " &b★" : "")

            this.row2 = `${scMinSecrets}     ${scDeaths}     ${scScore}`.trim()
        })
    }
    reset() {
        this.row1 = "&cDungeon hasn't been"
        this.row2 = "&cfully scanned."
    }
    makeMap() {
        const setPixels = (x1, y1, width, height, color) => {
            for (let x = x1; x < x1 + width; x++) {
                for (let y = y1; y < y1 + height; y++) {
                    this.map.setRGB(x, y, color.getRGB())
                }
            }
        }
        setPixels(0, 0, this.map.getWidth(), this.map.getHeight(), new Color(1, 1, 1, 0))
        for (let room of IMDungeon.rooms) {
            if (!room.normallyVisible && Config.legitMode) continue
            let color = !Config.legitMode && !room.explored && Config.darkenUnexplored ? room.getColor().darker().darker() : room.getColor()
            setPixels(Math.floor((200 + room.x)/8), Math.floor((200 + room.z)/8), 3, 3, color)
        }
        for (let door of IMDungeon.doors) {
            if (!door.normallyVisible && Config.legitMode) continue
            let color = !Config.legitMode && !door.explored && Config.darkenUnexplored ? door.getColor().darker().darker() : door.getColor()
            setPixels(Math.floor((200 + door.x)/8)+1, Math.floor((200 + door.z)/8)+1, 1, 1, color)
        }
    }
    drawBackground() {
        this.size = Config.dungeonInfo == 0 || (Config.dungeonInfo == 3 && !Dungeon.bossEntry) ? [25, 27] : [25, 25]
        Renderer.drawRect(Config.backgroundColor.hashCode(), dataObject.map.x, dataObject.map.y, this.size[0] * Config.mapScale, this.size[1] * Config.mapScale)
    }
    renderMap() {
        Renderer.drawImage(new Image(this.map), dataObject.map.x, dataObject.map.y, 25*Config.mapScale, 25*Config.mapScale)
    }
    renderCheckmarks() {
        let names = []
        for (let i = 0; i < IMDungeon.rooms.length; i++) {
            let room = IMDungeon.rooms[i]
            if ((Config.legitMode && !room.normallyVisible) || names.includes(room.name)) continue
            if (Config.legitMode && !room.explored && room.normallyVisible) room.renderCheckmark()
            if (Config.showSecrets == 3) {
                if (["entrance", "fairy"].includes(room.type)) continue
                room.renderSecrets()
            }
            else if (room.checkmark) room.renderCheckmark()
            names.push(room.name)
        }
    }

    
}