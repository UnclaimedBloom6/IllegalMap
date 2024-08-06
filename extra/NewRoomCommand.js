import { title } from "../../BloomCore/utils/Utils"
import DmapDungeon from "../components/DmapDungeon"
import { RoomMap, RoomTypesStrings, getCore, roomsJson } from "../utils/utils"

// Returns an array of the core hashes for each component in the room.
const scanRoomCores = (room) => room.realComponents.map(([x, z]) => getCore(x, z))

// Doesn't do anything except show an alert in chat.
const checkForCoreDuplicates = (cores) => {
    roomsJson.forEach(roomData => {
        for (let core of cores) {
            if (!roomData.cores.includes(core)) continue

            ChatLib.chat(`&cCore Conflict! Core ${core} is already present in ${roomData.name}!`)
        }
    })
}

// Generates a new room id by finding the current max in the rooms.json file and incrementing by one.
const generateNewRoomID = () => {
    const max = Math.max(...roomsJson.map(a => a.roomID))
    return max + 1
}


const validRoomTypes = new Set([...RoomTypesStrings.keys()])
const validClearTypes = new Set(["mob", "miniboss"])

const validateArgs = (args) => {
    ChatLib.chat(JSON.stringify(args))
    let [name, type, secrets, clearType] = args

    if (!name || !type || !secrets || !clearType) {
        ChatLib.chat(`&c/newroom <room_name> <roomType> <secrets> <clearType>`)
        return false
    }

    if (!validRoomTypes.has(type)) {
        ChatLib.chat(`&cInvalid room type! Must be any of ${JSON.stringify([...validRoomTypes])}.`)
        return false
    }

    if (!validClearTypes.has(clearType)) {
        ChatLib.chat(`&cInvalid clear type! Must be any of ${JSON.stringify([...validClearTypes])}.`)
        return false
    }

    if (roomsJson.some(a => title(name.replace(/_/g, " ")) == a.name)) {
        ChatLib.chat(`&cRoom name already taken! Use /deleteroom <room_name> to delete the existing one!`)
        return false
    }

    return true
}

register("command", (...args) => {
    if (!validateArgs(args)) return

    let [name, type, secrets, clearType] = args

    const currentRoom = DmapDungeon.getCurrentRoom(true)
    if (!currentRoom) return ChatLib.chat(`&cCurrent room is not fully scanned!`)

    const cores = scanRoomCores(currentRoom)
    checkForCoreDuplicates(cores)

    const data = {
        name: title(name.replace(/_/g, " ")),
        type: type,
        secrets: parseInt(secrets),
        cores: cores,
        roomID: generateNewRoomID(),
        clear: clearType.toLowerCase(),
        crypts: 0,
        clearScore: 0,
        secretScore: 0,
        shape: currentRoom.shape
    }

    roomsJson.push(data)
    RoomMap.set(data.roomID, data)
    currentRoom.loadFromData(data)
    DmapDungeon.redrawMap()

    FileLib.write("IllegalMap", "utils/rooms.json", JSON.stringify(roomsJson, null, 4), true)
    
    ChatLib.chat(`&aAdded new room: ${data.name}. JSON data:\n${JSON.stringify(data, null, 4)}\nUpdate the crypts, clear score and secret score manually as they are not essential.`)
}).setName("/newroom")

register("command", (name) => {
    const newName = title(name.replace(/_/g, " "))

    const existingInd = roomsJson.findIndex(a => a.name == newName)

    if (existingInd == -1) return ChatLib.chat(`&cRoom does not exist!`)
    roomsJson.splice(existingInd, 1)

    FileLib.write("IllegalMap", "utils/rooms.json", JSON.stringify(roomsJson, null, 4), true)

    ChatLib.chat(`&aDeleted room ${newName}.`)
}).setName("/deleteroom")

register("command", (roomName) => {
    roomName = title(roomName.replace(/_/g, " "))
    const currRoom = DmapDungeon.getCurrentRoom()
    if (!currRoom) return ChatLib.chat(`Not in a room!`)

    let cores = scanRoomCores(currRoom)
    let roomData = roomsJson.find(a => a.name == roomName)
    if (!roomData) return ChatLib.chat(`Could not find room data for ${roomName}!`)

    for (let newCore of cores) {
        if (roomData.cores.includes(newCore)) continue
        roomData.cores.push(newCore)
        ChatLib.chat(`Added core ${newCore} to ${roomName}`)
    }

    RoomMap.set(roomData.roomID, roomData)
    currRoom.loadFromData(roomData)
    DmapDungeon.redrawMap()

    FileLib.write("IllegalMap", "utils/rooms.json", JSON.stringify(roomsJson, null, 4), true)
    ChatLib.chat(`Finished adding cores to ${roomName}!`)
}).setName("/newcore")