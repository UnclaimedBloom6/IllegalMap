import Dungeon from "../dungeon/Dungeon"
import { Room } from "../dungeon/Room"
import Lookup from "./Lookup"
import { blankRoom, prefix } from "./Utils"

register("command", (roomName, type, secrets) => {
    if (!roomName) return ChatLib.chat(`${prefix} &c/nr <name> <type> <secrets>`)
    let playerCoords = [Player.getX(), Player.getZ()]
    let roomCoords = Lookup.getRoomCenterCoords(playerCoords, Dungeon)
    let x = roomCoords[0]
    let z = roomCoords[1]

    roomName = roomName.replace(/_/g, " ")
    let room = new Room(x, z, blankRoom)
    room.name = roomName
    room.type = type == "n" ? "normal" : type
    room.secrets = secrets == "" ? 0 : parseInt(secrets)
    let roomFile = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))
    let found = false
    roomFile["rooms"].forEach(a => {
        if (a.name == room.name) {
            if (a.cores.includes(room.core)) {
                found = true
                return ChatLib.chat(`${prefix} &c${roomName} already has that hash!`)
            }
            a.cores.push(room.core)
            FileLib.write("IllegalMap", "data/rooms.json", JSON.stringify(roomFile))
            ChatLib.chat(`${prefix} &aAdded extra hash to '${a.name}'!`)
            found = true
        }
    })
    if (!found) {
        if (!type || !secrets) return ChatLib.chat(`${prefix} &cRoom not in rooms.json. All args required.\n&c/nr <name> <type> <secrets>`)
        roomFile["rooms"].push(room.getJson())
        FileLib.write("IllegalMap", "data/rooms.json", JSON.stringify(roomFile))
        ChatLib.chat(`${prefix} &aAdded ${room.name} to file!`)
    }
    ChatLib.command("s", true)
}).setName("nr")