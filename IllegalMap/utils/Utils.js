import PogObject from "../../PogData/index"
import request from "../../requestV2"

const prefix = "&7[&bMap&7]&r"

const BlockPos = Java.type("net.minecraft.util.BlockPos")
const Blocks = Java.type("net.minecraft.init.Blocks")
const TileEntityChest = Java.type("net.minecraft.tileentity.TileEntityChest")
const BufferedImage = Java.type("java.awt.image.BufferedImage")

const setDiamond = (x, y, z) => { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150484_ah.func_176223_P()) }
const setEmerald = (x, y, z) => { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150475_bE.func_176223_P()) }
const setGold = (x, y, z) => { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150340_R.func_176223_P()) }
const setCoal = (x, y, z) => { World.getWorld().func_175656_a(new BlockPos(x, y, z), Blocks.field_150402_ci.func_176223_P()) }

const isBetween = (a, b, c) => { return (a - b) * (a - c) <= 0 }

const blankRoom = {
    "name": "Unknown",
    "type": "normal",
    "secrets": 0,
    "cores": []
}

const isColumnAir = (x, z) => {
    for (let y = 140; y > 11; y--) {
        let block = World.getBlockAt(x, y, z)
        if (block && block.getID() !== 0) {
            return false
        }
    }
    return true
}

const isDoor = (x, z) => {
    if (isColumnAir(x+4, z) && isColumnAir(x-4, z) && !isColumnAir(x, z+4) && !isColumnAir(x, z-4)) { return true }
    if (!isColumnAir(x+4, z) && !isColumnAir(x-4, z) && isColumnAir(x, z+4) && isColumnAir(x, z-4)) { return true }
    return false
}

const getMojangInfo = (player) => {
    return player.length > 16 ? request(`https://sessionserver.mojang.com/session/minecraft/profile/${player}`) : request(`https://api.mojang.com/users/profiles/minecraft/${player}`)
}
const getSbProfiles = (uuid, apiKey) => {
    return request(`https://api.hypixel.net/skyblock/profiles?key=${apiKey}&uuid=${uuid}`)
}
const getMostRecentProfile = (uuid, profiles) => {
    // This is old. I cba to recode it since it works anyway.
    if (profiles["profiles"] == null) { return null }
    // [lastSave, profileNumber]
    let lastProfile = []
    for (profile in profiles["profiles"]) {
        let currLastSave = profiles["profiles"][profile]["members"][uuid]["last_save"]
        if (currLastSave !== undefined) {
            if (lastProfile[0] == undefined) {
                lastProfile = [currLastSave, profile]
            }
            else {
                if (currLastSave > lastProfile[0]) {
                    lastProfile = [currLastSave, profile]
                }
            }
        }
    }
    return profiles["profiles"][lastProfile[1]]
}

const getKeyInfo = (key) => {
    return request(`https://api.hypixel.net/key?key=${key}`)
}

let dataObject = new PogObject("IllegalMap", {
    "firstTime": true,
    "uuid": null,
    "apiKey": null,
    "isPaul": false
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
    if (!player) { return }
    return new Image(javax.imageio.ImageIO.read(new java.net.URL(`https://crafatar.com/avatars/${player.getUUID()}`)))
}
const chunkLoaded = (coords) => { return World.getWorld().func_175726_f(new BlockPos(coords[0], coords[1], coords[2])).func_177410_o() }

const getTrappedChests = () => {
    let locations = []
    World.getWorld().field_147482_g.forEach(entity => {
        if(entity instanceof TileEntityChest) {
            if (entity.func_145980_j() == 1) {
                const x = entity.func_174877_v().func_177958_n();
                const y = entity.func_174877_v().func_177956_o();
                const z = entity.func_174877_v().func_177952_p();
                locations.push([x, y, z])
            }
        }
    })
    return locations
}

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
    getKeyInfo
}