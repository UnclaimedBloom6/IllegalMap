import Config from "../data/Config"
import Dungeon from "../dungeon/Dungeon"

const DiscordRPC = Java.type("net.arikia.dev.drpc.DiscordRPC")
const DiscordEventHandlers = Java.type("net.arikia.dev.drpc.DiscordEventHandlers")
const DiscordRichPresence = Java.type("net.arikia.dev.drpc.DiscordRichPresence")

class Discord {
    constructor() {
        this.initialize()
        this.reset()

        register("gameUnload", () => { DiscordRPC.discordShutdown() })

        register("tick", () => {
            if (!Dungeon.inDungeon || !Config.discordRPC) return this.reset()

            this.details = Dungeon.floor && Config.discordFloor ? `Playing ${Dungeon.floor}` : null
            this.details += this.details && Dungeon.time && Config.discordFloor ? ` - ${Dungeon.time}` : ""

            this.state = this.currentRoom && Config.discordRoom ? this.currentRoom : null
            this.state += this.currentSecrets && Config.discordRoom ? ` (${this.currentSecrets})` : ""
            this.state = !Dungeon.runStarted ? "Pre-Run" : this.state
            this.state = Dungeon.bossEntry ? "In Boss" : this.state
            this.state = Dungeon.runEnded ? "Run Ended" : this.state

            if (Dungeon.floorInt == 0) this.bigImage = "watcher"
            else if (Dungeon.floorInt == 1) this.bigImage = "bonzo"
            else if (Dungeon.floorInt == 2) this.bigImage = "scarf"
            else if (Dungeon.floorInt == 3) this.bigImage = "professor"
            else if (Dungeon.floorInt == 4) this.bigImage = "thorn"
            else if (Dungeon.floorInt == 5) this.bigImage = "livid"
            else if (Dungeon.floorInt == 6) this.bigImage = "sadan"
            else if (Dungeon.floorInt == 7) this.bigImage = "necron"
            else this.bigImage = null
                
            this.update()
        })

        // Current Room
        register("step", () => {
            if (!Dungeon.inDungeon) return
            let room = Dungeon.getRoomAt([Player.getX(), Player.getZ()])
            this.currentRoom = room ? room.name : null

        }).setFps(5)

        // Current Secrets
        register("actionBar", (message) => {
            message = message.removeFormatting()
            let match = message.match(/.+(\d+\/\d+) Secrets/)
            this.currentSecrets = match ? match[1] : null
        }).setCriteria("${message}")

        register("worldLoad", () => {
            this.reset()
        })

    }
    reset() {
        DiscordRPC.discordClearPresence()
        this.state = null
        this.details = null
        this.startTimeStamp = null
        this.endTimeStamp = null
        this.bigImage = null
        this.bigImageText = null
        this.smallImage = null

        this.heldItem = null
        this.currentRoom = null
        this.currentSecrets = null
    }
    initialize() {
        const handler = new DiscordEventHandlers.Builder().build()
        DiscordRPC.discordInitialize("914385160546430987", handler, true)
    }
    update() {
        // ChatLib.chat("Updating!")
        let presence = new DiscordRichPresence.Builder(this.state)

        if (this.details) presence.setDetails(this.details)
        if (this.startTimeStamp) presence.setStartTimestamps(this.startTimeStamp)
        if (this.endTimeStamp) presence.setEndTimestamp(this.endTimeStamp)
        if (this.bigImage) presence.setBigImage(this.bigImage, this.bigImageText)
        if (this.smallImage) presence.setSmallImage(this.smallImage)

        DiscordRPC.discordUpdatePresence(presence.build())
    }

    shutDown() {
        DiscordRPC.discordShutdown()
    }

    setState(state) { this.state = state }
    setDetails(details) { this.details = details }
    setStart(timestamp) { this.startTimeStamp = timestamp }
    setEnd(timestamp) { this.endTimeStamp = timestamp }
    setBigImage(image) { this.bigImage = image }
    setBigImageText(text) { this.bigImageText = text }
    setSmallImage(image) { this.smallImage = image }
}
export default new Discord()