import PogObject from "../../PogData/index"
import request from "../../requestV2"

const prefix = "&7[&bMap&7]&r"

const BlockPoss = Java.type("net.minecraft.util.BlockPos")
const Blocks = Java.type("net.minecraft.init.Blocks")
const TileEntityChest = Java.type("net.minecraft.tileentity.TileEntityChest")
const BufferedImage = Java.type("java.awt.image.BufferedImage")

const setDiamond = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150484_ah.func_176223_P())
const setEmerald = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150475_bE.func_176223_P())
const setGold = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150340_R.func_176223_P())
const setCoal = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150402_ci.func_176223_P())
const setAir = (x, y, z) => World.getWorld().func_175698_g(new BlockPoss(x, y, z))

const isBetween = (a, b, c) => (a - b) * (a - c) <= 0

const blankRoom = {
    "name": "Unknown",
    "type": "normal",
    "secrets": 0,
    "cores": []
}

const isColumnAir = (x, z) => {
    for (let y = 140; y > 11; y--) {
        let block = World.getBlockAt(x, y, z)
        if (block.type && block.type.getID() !== 0) {
            return false
        }
    }
    return true
}

const isDoor = (x, z) => {
    if (isColumnAir(x+4, z) && isColumnAir(x-4, z) && !isColumnAir(x, z+4) && !isColumnAir(x, z-4)) return true
    if (!isColumnAir(x+4, z) && !isColumnAir(x-4, z) && isColumnAir(x, z+4) && isColumnAir(x, z-4)) return true
    return false
}

const getMojangInfo = (player) => player.length > 16 ? request(`https://sessionserver.mojang.com/session/minecraft/profile/${player}`) : request(`https://api.mojang.com/users/profiles/minecraft/${player}`)
const getSbProfiles = (uuid, apiKey) => request(`https://api.hypixel.net/skyblock/profiles?key=${apiKey}&uuid=${uuid}`)
const getMostRecentProfile = (uuid, profiles) => profiles.profiles.map(a => [a.members[uuid].last_save, a]).sort((a, b) => a[0] - b[0]).reverse()[0][1]
const getKeyInfo = (key) => request(`https://api.hypixel.net/key?key=${key}`)
const fn = (num) => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') // short for formatNumber because lazy

let dataObject = new PogObject("IllegalMap", {
    "firstTime": true,
    "uuid": null,
    "apiKey": null,
    "isPaul": false,
    "lastLogServer": null,
    "map": {
        "x": 0,
        "y": 0
    },
    "scoreCalc": {
        "x": 0,
        "y": 0
    }
}, "data/data.json")

const colors = [
    "&a",
    "&b",
    "&c",
    "&d",
    "&e",
    "&f",
    "&0",
    "&1",
    "&2",
    "&3",
    "&4",
    "&5",
    "&6",
    "&7",
    "&8",
    "&9"
]

const getPlayerHead = (playername) => {
    let player = World.getPlayerByName(playername)
    if (!player) return
    return new Image(javax.imageio.ImageIO.read(new java.net.URL(`https://crafatar.com/avatars/${player.getUUID()}`)))
}
const chunkLoaded = (coords) => World.getWorld().func_175726_f(new BlockPoss(coords[0], coords[1], coords[2])).func_177410_o()

// const getTrappedChests = () => {
//     let locations = []
//     World.getWorld().field_147482_g.forEach(entity => {
//         if(entity instanceof TileEntityChest) {
//             if (entity.func_145980_j() == 1) {
//                 const x = entity.func_174877_v().func_177958_n();
//                 const y = entity.func_174877_v().func_177956_o();
//                 const z = entity.func_174877_v().func_177952_p();
//                 locations.push([x, y, z])
//             }
//         }
//     })
//     return locations
// }
// I love array methods
const getTrappedChests = () => World.getWorld().field_147482_g.filter(e => e instanceof TileEntityChest && e.func_145980_j() == 1).map(e => [e.func_174877_v().func_177958_n(), e.func_174877_v().func_177956_o(), e.func_174877_v().func_177952_p()])

const blacklisted = [5, 54]
// const getCore = (x, z) => {
//     let blocks = []
//     for (let y = 140; y > 11; y--) {
//         let thisId = World.getBlockAt(x, y, z).type.getID()
//         if (!blacklisted.includes(thisId)) {
//             blocks.push(thisId)
//         }
//     }
//     return hashCode(blocks.join(""))
// }
// I thought it would be fun to make this so I made it and it works lol
const getCore = (x, z) => hashCode(Array.from(Array(129).keys()).reverse().map(y => World.getBlockAt(x, y+12, z).type.getID()).filter(a => !blacklisted.includes(a)).join(""))

// From https://stackoverflow.com/a/15710692/15767968
const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)

const getVersion = () => JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version

const greenCheck = new Image("BloomMapGreenCheck.png", "https://i.imgur.com/GQfTfmp.png")
const whiteCheck = new Image("BloomMapWhiteCheck.png", "https://i.imgur.com/9cZ28bJ.png")
const failedRoom = new Image("BloomMapFailedRoom.png", "https://i.imgur.com/qAb4O9H.png")
const questionMark = new Image("BloomMapQuestionMark.png", "https://i.imgur.com/kp92Inw.png")

export {
    prefix,
    setDiamond,
    setEmerald,
    setGold,
    setCoal,
    isColumnAir,
    isDoor,
    isBetween,
    blankRoom,
    getPlayerHead,
    chunkLoaded,
    getTrappedChests,
    BufferedImage,
    colors,
    getMojangInfo,
    getSbProfiles,
    getMostRecentProfile,
    dataObject,
    getKeyInfo,
    fn,
    hashCode,
    getCore,
    setAir,
    TileEntityChest,
    getVersion,
    greenCheck,
    whiteCheck,
    failedRoom,
    questionMark
}