/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import Config from "../data/Config"
import Dungeon from "../dungeon/Dungeon"
import { dataObject, prefix } from "../utils/Utils"

class ScoreCalculator {
    constructor() {
        this.score = 0

        this.skill = 0
        this.speed = 0
        this.explore = 0
        this.bonus = 0

        let firstDeathSpirit = false
        let deathPenalty = 0

        let isPaul = false
        let totalRooms = 0
        let completed = 0

        this.row1 = ""
        this.row2 = ""

        register("step", () => {
            if (!Dungeon.inDungeon || Config.scoreCalc == 2) return
            totalRooms = Math.floor(100 / Dungeon.percentCleared * Dungeon.completedRooms + 0.4)
            // Calculate the score as if blood and boss are already done
            // completed = Dungeon.completedRooms + (!Dungeon.bloodDone ? 2 : !Dungeon.bossEntry ? 1 : 0)
            completed = Dungeon.completedRooms
            completed += !Dungeon.bloodDone && Dungeon.bloodOpen ? 1 : 0
            completed += !Dungeon.bossEntry ? 1 : 0
            
            isPaul = Config.paul == 0 || (Config.paul == 2 && dataObject.isPaul)

            // I dont wanna calc this. If you can't get 100 speed score then please stop using my mod.
            this.speed = 100

            deathPenalty = (firstDeathSpirit || Config.spiritPet == 0) && Dungeon.deaths > 0 ? Dungeon.deaths * 2 - 1 : Dungeon.deaths * 2

            // Skill Score
            this.skill = 20 + (completed / totalRooms) * 80 - (10 * Dungeon.puzzlesDone[0]) + (10 * Dungeon.puzzlesDone[1]) - deathPenalty
            this.skill = this.skill < 20 || isNaN(this.skill) ? 20 : this.skill
            
            // Explore Score
            this.explore = 60 * completed / totalRooms + 40 * (Dungeon.secretsFound - Dungeon.overflowSecrets) / Dungeon.secretsForMax
            this.explore = isNaN(this.explore) ? 0 : this.explore
            
            // Bonus Score
            this.bonus = 0 + (isPaul ? 10 : 0) + (Dungeon.crypts > 5 ? 5 : Dungeon.crypts) + (Dungeon.mimicDead ? 2 : 0)

            // Final Score
            this.score = Math.floor(this.skill) + this.speed + Math.floor(this.explore) + this.bonus

            if (!isFinite(this.score)) this.score = 0

            // The stuff to be displayed

            // Row 1 stuff
            let scSecrets = `&7Secrets: &b${Dungeon.secretsFound}`
            let scSecretsExtra = Dungeon.calculatedTotalSecrets == 0 && Config.legitMode ? "" : `&8-&e${Dungeon.totalSecrets - Dungeon.secretsFound}&8-&c${Dungeon.totalSecrets}`
            let scCrypts = `&7Crypts: ${(Dungeon.crypts >= 5 ? "&a" : Dungeon.crypts == 0 ? "&c" : "&e") + Dungeon.crypts}`
            let scMimic = Dungeon.floorInt < 6 ? "" : `&7Mimic: ` + (Dungeon.mimicDead ? "&a✔" : "&c✘")
            
            this.row1 = `${scSecrets}${scSecretsExtra}     ${scCrypts}     ${scMimic}`.trim()

            // Row 2 stuff
            let remainingSecretScore = 40 - (Dungeon.isPaul ? 10 : 0) - (Dungeon.crypts > 5 ? 5 : Dungeon.crypts) + deathPenalty
            remainingSecretScore = remainingSecretScore > 40 ? 40 : remainingSecretScore < 0 ? 0 : remainingSecretScore
            let minSecrets = Math.floor((remainingSecretScore*Dungeon.secretsForMax)/40+0.5)
            let scMinSecrets = `&7Min Secrets: ` + (Config.legitMode && Dungeon.secretsFound == 0 ? "&b0" : Dungeon.secretsFound < minSecrets ? `&e${minSecrets}` : `&a${minSecrets}`)
            let scDeaths = Dungeon.deaths == 0 ? `&7Deaths: &a0` : `&7Deaths: &c-${deathPenalty}`
            let scScore = `&7Score: ${(this.score < 270 ? "&c" : this.score < 300 ? "&e" : "&a") + this.score}` + (dataObject.isPaul ? " &b★" : "")

            this.row2 = `${scMinSecrets}     ${scDeaths}     ${scScore}`.trim()

        }).setFps(2)

        register("dragged", (mx, my, x, y, btn) => {
            if (Config.scoreCalcMoveGui.isOpen()) {
                dataObject.scoreCalc.x = x
                dataObject.scoreCalc.y = y
            }
        })

        // Death Message
        register("chat", (message) => {
            if (Config.spiritPet == 1 || Dungeon.deaths > 0) return
            if (Config.spiritPet == 0) return firstDeathSpirit = true
            
            let player = message.removeFormatting().split(" ")[0]
            player = player == "You" ? Player.getName() : player
            let noob = Dungeon.getPlayer(player)
            if (noob && Dungeon.time && noob.hasSpirit) {
                ChatLib.chat(`${prefix} &a${player} has a Spirit Pet!`)
                firstDeathSpirit = true
            }
        }).setCriteria(" ☠ ${message}")

        register("command", () => {
            dataObject.debugCalc = !dataObject.debugCalc
            dataObject.save()
        }).setName("debugcalc")

        // Debug Stuff
        register("renderOverlay", () => {
            if (!dataObject.debugCalc) return
            let msg = `
                &6&lNEW

                Score: ${this.score}
                Skill: ${this.skill}
                Explore: ${this.explore}
                Speed: ${this.speed}
                Bonus: ${this.bonus}

                Paul: ${isPaul}
                Cleared: ${Dungeon.percentCleared}%
                Total Rooms: ${totalRooms}

                Completed: ${Dungeon.completedRooms}
                Adjusted: ${completed}

                Overflow secrets: ${Dungeon.overflowSecrets}
                For Max: ${Dungeon.secretsForMax}

                Puz: ${JSON.stringify(Dungeon.puzzlesDone)}
            `
            Renderer.drawString(msg, Renderer.screen.getWidth()/2, 10)
        })

        register("worldLoad", () => this.reset())
    }
    reset() {
        this.score = 0
        this.skill = 0
        this.explore = 0
        // this.speed = 0
        this.bonus = 0
    }
}
export default new ScoreCalculator()