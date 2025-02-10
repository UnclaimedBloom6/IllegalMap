import { appendToFile, getSortedMap } from "../../BloomCore/utils/Utils"
import DmapDungeon from "../components/DmapDungeon"
import Config from "../utils/Config"
import { fn, padText, readFileLines, round } from "../../BloomCore/utils/Utils"
import { DoorTypes, RoomMap, roomsJson } from "../utils/utils"


const DUNGEON_PATH = "data/dungeons.txt"

// Grabs only the room and door parts, to be used to prevent duplicate dungeons from being saved.
let dungeonStrings = (readFileLines("IllegalMap", DUNGEON_PATH) ?? []).map(v => v.split(";").slice(2).join(";"))

DmapDungeon.onDungeonAllScanned(dung => {
    const str = dung.dungeonMap.convertToString()
    if (!str) return ChatLib.chat(`&cInvalid dungeon string!`)

        const roomsDoors = str.split(";").slice(2).join(";")
    if (dungeonStrings.length && roomsDoors == dungeonStrings[dungeonStrings.length-1]) return ChatLib.chat(`&eAlready logged this dungeon!`)

    appendToFile("IllegalMap", DUNGEON_PATH, str)
    dungeonStrings.push(roomsDoors)

    if (!Config().logDungeonChatInfo) return

    new Message(
        `&aSaved Dungeon! `,
        new TextComponent(`&6[CLICK]`).setClick("run_command", `/viewdung ${str}`),
        ` &aMap Score: &6${DmapDungeon.dungeonMap.mapScore}`
    ).chat()
})


// The stats viewing shit

const getMapSum = (map, accumulator = (a, b) => a + b[1] * b[0]) => [...map.entries()].reduce(accumulator, 0)

/**
 * Given a 2d array of strings of equal length [["a", "b", "c"], ["xd", "z", "ddd"]],
 * will pad each of the strings to make the nth index of each array the same as the nth index of every other array and join them
 * @param {String[][]} arr 
 * @returns {String[]}
 */
const makeAllSameLength = (arr) => {
    const maxLengths = arr[0].map(a => 0)
    const newArr = []
    for (let i = 0; i < arr[0].length; i++) {
        for (let j = 0; j < arr.length; j++) {
            let len = Renderer.getStringWidth(arr[j][i])
            if (len < maxLengths[i]) continue
            maxLengths[i] = len
        }
    }
    for (let i = 0; i < arr.length; i++) {
        newArr.push([])
        for (let j = 0; j < arr[i].length; j++) {
            newArr[i].push(padText(arr[i][j], " ", maxLengths[j]))
        }
    }
    return newArr.map(a => a.join(""))
}

const getRoomHover = (roomStrings) => {
    const gridWidth = 2
    const gridHeight = Math.ceil(roomStrings.length / gridWidth)
    let cols = []
    for (let i = 0; i < gridHeight; i++) {
        cols.push([])
        for (let j = 0; j < gridWidth; j++) {
            let ind = j * gridHeight + i
            cols[i].push(roomStrings[ind])
        }
        cols[i] = cols[i].join(" &8| ")
    }
    return cols.join("\n")
}
const doShit = (floor) => {
    const dungeons = readFileLines("IllegalMap", DUNGEON_PATH)
    if (!dungeons) return

    ChatLib.chat(`&aProcessing Dungeons...`)

    const secretCountMap = new Map(roomsJson.map(a => [a.roomID, a.secrets]))
    const roomTypeMap = new Map(roomsJson.map(a => [a.roomID, a.type]))
    const roomNameMap = new Map(roomsJson.map(a => [a.roomID, a.name]))

    const totalRoomCounts = new Map()
    const totalPuzzleCounts = new Map()
    const secretCounts = new Map()
    const witherDoorCounts = new Map()
    const floorsRan = new Map()

    const mapScores = []

    let totalDungeons = 0

    dungeons.forEach((v, i) => {
        const [dungFloor, timestamp, rooms, doors] = v.split(";")
        if (floor && dungFloor !== floor.toUpperCase()) return

        floorsRan.set(dungFloor, (floorsRan.get(dungFloor) ?? 0) + 1)


        let secrets = 0
        let witherDoors = -1
        let mapScore = 0

        const roomIDs = new Set()
        for (let i = 0; i < Math.floor(rooms.length / 3); i++) {
            let id = parseInt(rooms.slice(i*3, i*3+3))
            if (roomIDs.has(id) || id == 998 || id == 999) continue

            // Unknown room, don't wanna use this dungeon.
            if (!RoomMap.has(id)) return

            roomIDs.add(id)
            let roomSecrets = secretCountMap.get(id) ?? 0
            secrets += roomSecrets
            
            let roomType = roomTypeMap.get(id) ?? "normal"
            if (roomType == "puzzle") totalPuzzleCounts.set(id, (totalPuzzleCounts.get(id) ?? 0) + 1)
            else if (roomType == "normal" || roomType == "rare") totalRoomCounts.set(id, (totalRoomCounts.get(id) ?? 0) + 1) 

            // Room Score
            let roomData = RoomMap.get(id)
            if ("roomScore" in roomData) mapScore += roomData.roomScore
            else if ("secretScore" in roomData && "clearScore" in roomData) mapScore += roomData.secretScore/2 + roomData.clearScore/2
        }

        doors.split("").forEach(v => {
            const doorType = parseInt(v)
            if (doorType == 9) return
            if (doorType == DoorTypes.WITHER) witherDoors++
        }, [])

        totalDungeons++
        
        secretCounts.set(secrets, (secretCounts.get(secrets) ?? 0) + 1)
        witherDoorCounts.set(witherDoors, (witherDoorCounts.get(witherDoors) ?? 0) + 1)
        mapScores.push(mapScore)
    })

    // totalRoomCounts.forEach((v, k) => ChatLib.chat(`${k}: ${v}`))
    const totalSecrets = getMapSum(secretCounts)
    const avgSecrets = (totalSecrets / totalDungeons).toFixed(2)
    const avgWitherDoors = (getMapSum(witherDoorCounts) / totalDungeons).toFixed(2)
    const avgPuzzles = (getMapSum(totalPuzzleCounts, (a, b) => a + b[1]) / totalDungeons).toFixed(2)
    const avgMapScore = (mapScores.reduce((a, b) => a+b, 0) / totalDungeons).toFixed(1)

    const sortedRooms = getSortedMap(totalRoomCounts)
    const sortedPuzzles = getSortedMap(totalPuzzleCounts)
    const sortedSecrets = getSortedMap(secretCounts)
    const sortedWitherDoors = getSortedMap(witherDoorCounts, (a, b) => a[0] - b[0])
    const sortedFloors = getSortedMap(floorsRan)

    let secretHover = "&eSecrets\n"
    secretHover += `&aMinimum: &b${Math.min(...[...secretCounts.entries()].map(a => a[0]))}\n`
    secretHover += `&cMax: &b${Math.max(...[...secretCounts.entries()].map(a => a[0]))}\n`
    secretHover += `&fTotal: &b${fn(getMapSum(secretCounts))}`

    let witherDoorHover = "&8Wither Doors\n"
    witherDoorHover += `&bAverage: &7${avgWitherDoors}\n`
    sortedWitherDoors.forEach((v, k) => {
        witherDoorHover += `  &8${k}: &7${v} &8- ${round(v / totalDungeons * 100, 2)}%\n`
    })
    witherDoorHover += `\n&bTotal: &7${fn(getMapSum(witherDoorCounts))}`

    let puzzleHover = "&dPuzzles:"
    let ind = 0
    sortedPuzzles.forEach((v, k) => {
        ind++
        const puzzleName = roomNameMap.get(k)
        const percentage = round(v / totalDungeons * 100, 2)
        puzzleHover += `\n&6#${ind} - &d${puzzleName}&a: ${fn(v)} &8(${percentage}%)`
    })

    // This was fucking aids
    let roomStrings = []
    sortedRooms.forEach((v, k) => roomStrings.push([`&6#${roomStrings.length + 1}: `, `&f${roomNameMap.get(k)} `, `&b- ${fn(v)} `, `&8(${round(v / totalDungeons * 100, 2)}%)`]))
    const allSame = makeAllSameLength(roomStrings)
    const halfRoomLength = Math.floor(allSame.length/2)
    const roomCountsPage1 = allSame.slice(0, halfRoomLength)
    const roomCountsPage2 = allSame.slice(halfRoomLength)

    const floorHover = [...sortedFloors.entries()].reduce((a, [k, v], i) => {
        const textColor = k.startsWith("M") ? "&c" : "&b"
        return a + `\n&6#${i+1} &a- ${textColor}${k}&a: ${fn(v)}`
    }, "&aFloors")

    let secretClickArg = ""
    if (floor) secretClickArg += floor.toUpperCase()
    else secretClickArg += "ALL"
    secretClickArg += "|"
    getSortedMap(secretCounts, (a, b) => a[0] - b[0]).forEach((v, k) => {
        secretClickArg += `${k}:${v},`
    })
    secretClickArg = secretClickArg.replace(/,$/, "")
    
    

    // The main messages

    if (floor) ChatLib.chat(`&3------------------------- &bStats for &a${floor.toUpperCase()} &3-------------------------`)
    else ChatLib.chat(`&3--------------------- &bStats for &aAll Floors &3----------------------`)

    new TextComponent(ChatLib.getCenteredText(`&dDungeons Logged: &b${fn(totalDungeons)}`)).setHover("show_text", floorHover).chat()
    new TextComponent(ChatLib.getCenteredText(`&fAverage Secrets: &b${avgSecrets}`)).setHover("show_text", secretHover).setClick("run_command", `/viewsecretgraph ${secretClickArg}`).chat()
    new TextComponent(ChatLib.getCenteredText(`&7Average Wither Doors: &8${avgWitherDoors}`)).setHover("show_text", witherDoorHover).chat()
    new TextComponent(ChatLib.getCenteredText(`&dAverage Puzzles: &b${avgPuzzles}`)).setHover("show_text", puzzleHover).chat()
    new TextComponent(ChatLib.getCenteredText(`&eAverage Map Score: &6${avgMapScore}`)).chat()
    new TextComponent(ChatLib.getCenteredText(`&aRoom Counts &7(Page 1)`)).setHover("show_text", `&aRoom Counts:\n${getRoomHover(roomCountsPage1)}`).chat()
    new TextComponent(ChatLib.getCenteredText(`&aRoom Counts &7(Page 2)`)).setHover("show_text", `&aRoom Counts:\n${getRoomHover(roomCountsPage2)}`).chat()

    ChatLib.chat(`&3${ChatLib.getChatBreak("-")}`)
}

register("command", (floor) => {
    new Thread(() => doShit(floor)).start()
}).setName("dlogsnew")