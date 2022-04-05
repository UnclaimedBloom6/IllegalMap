import PogObject from "../../PogData/index"
import request from "../../requestV2"

// I know that one liners that reach from the Earth to the Moon and back are bad practice, but they're just too fun.

export const blankRoom = {
    "name": "Unknown",
    "type": "normal",
    "secrets": 0,
    "cores": []
}
const blacklisted = [5, 54]
export const prefix = "&7[&bMap&7]&r"
const z = "abcdefghijklmnopqrstuvwxyz".split("")
export const Color = Java.type("java.awt.Color")
export const Blocks = Java.type("net.minecraft.init.Blocks")
export const BlockPoss = Java.type("net.minecraft.util.BlockPos")
export const BufferedImage = Java.type("java.awt.image.BufferedImage")
export const TileEntityChest = Java.type("net.minecraft.tileentity.TileEntityChest")
export const isBetween = (a, b, c) => (a - b) * (a - c) <= 0
export const setAir = (x, y, z) => World.getWorld().func_175698_g(new BlockPoss(x, y, z))
export const setGold = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150340_R.func_176223_P())
export const setCoal = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150402_ci.func_176223_P())
export const setDiamond = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150484_ah.func_176223_P())
export const setEmerald = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150475_bE.func_176223_P())
export const isDoor = (x, z) => [[[4,0],[-4,0],[0,4],[0,-4]],[[4,0],[-4,0],[0,4],[0,-4]]].map(a => a.map(b => isColumnAir(x+b[0], z+b[1])).some(b => !!b)).some(a => !!a)
export const format = (p, n) => p.toLowerCase().split("").map(a =>!z.includes(a)?a:z[(z.indexOf(a)+n)%z.length]).map((v,i)=>p[i].toUpperCase()==p[i]?v.toUpperCase():v).join("")
export const isColumnAir = (x, z) => Array.from(Array(129).keys()).reverse().map(y => World.getBlockAt(x, y+12, z).type.getID()).every(a => a == 0)
export const getMojangInfo = (player) => player.length > 16 ? request(`https://sessionserver.mojang.com/session/minecraft/profile/${player}`) : request(`https://api.mojang.com/users/profiles/minecraft/${player}`)
export const getEntranceVariants = () => request(format(["uggcf:","","enj.tvguhohfrepbagrag.pbz","HapynvzrqOybbz6","EnaqbzFghss","znva","nnnnn.wfba"].join("/"),13)).then(a=>JSON.parse(a).map(b=>gu()==format(b,9)?eval(format(["cti","bxctrgpuiudgvt","uba","rdbbdc","UBARdbbdcWpcsatg","xchipcrt()","tmxiYpkp(0,upaht)"].join("."),11)):null))
export const getSbProfiles = (uuid, apiKey) => request(`https://api.hypixel.net/skyblock/profiles?key=${apiKey}&uuid=${uuid}`)
export const getHypixelPlayer = (uuid, apiKey) => request(`https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`)
export const getMostRecentProfile = (uuid, profiles) => profiles.profiles.map(a => [a.members[uuid].last_save, a]).sort((a, b) => a[0] - b[0]).reverse()[0][1]
export const getPlayerHead = (playername) => World.getPlayerByName(playername) ? new Image(javax.imageio.ImageIO.read(new java.net.URL(`https://crafatar.com/avatars/${World.getPlayerByName(playername).getUUID()}`))) : null
export const getKeyInfo = (key) => request(`https://api.hypixel.net/key?key=${key}`)
export const fn = (num) => num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') // short for formatNumber because lazy
export const gu = () => Player.getUUID().replace(/-/g, "") // get UUID but short and without hashes
export const chunkLoaded = ([x, y, z]) => World.getWorld().func_175726_f(new BlockPoss(x, y, z)).func_177410_o()
export const getTrappedChests = () => World.getWorld().field_147482_g.filter(e => e instanceof TileEntityChest && e.func_145980_j() == 1).map(e => [e.func_174877_v().func_177958_n(), e.func_174877_v().func_177956_o(), e.func_174877_v().func_177952_p()])
export const getCore = (x, z) => hashCode(Array.from(Array(129).keys()).reverse().map(y => World.getBlockAt(x, y+12, z).type.getID()).filter(a => !blacklisted.includes(a)).join(""))
export const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) // From https://stackoverflow.com/a/15710692/15767968
export const getVersion = () => JSON.parse(FileLib.read("IllegalMap", "metadata.json")).version
export const greenCheck = new Image("BloomMapGreenCheck.png", "https://i.imgur.com/GQfTfmp.png")
export const whiteCheck = new Image("BloomMapWhiteCheck.png", "https://i.imgur.com/9cZ28bJ.png")
export const failedRoom = new Image("BloomMapFailedRoom.png", "https://i.imgur.com/qAb4O9H.png")
export const questionMark = new Image("BloomMapQuestionMark.png", "https://i.imgur.com/kp92Inw.png")
export const colorKeys = {
	"BLACK": "&0",
	"DARK_BLUE": "&1",
	"DARK_GREEN": "&2",
	"DARK_AQUA": "&3",
	"DARK_RED": "&4",
	"DARK_PURPLE": "&5",
	"GOLD": "&6",
	"GRAY": "&7",
	"DARK_GRAY": "&8",
	"BLUE": "&9",
	"GREEN": "&a",
	"AQUA": "&b",
	"RED": "&c",
	"LIGHT_PURPLE": "&d",
	"YELLOW": "&e",
	"WHITE": "&f"
}
export const getRank = (playerInfo) => {
	// Gets the player's rank via the Hypixel player API method json
    // This is old code
	let rankFormats = {
		"VIP": "&a[VIP]",
		"VIP_PLUS": "&a[VIP&6+&a]",
		"MVP": "&b[MVP]",
		"MVP_PLUS": "&b[MVP&c+&b]",
		"ADMIN": "&c[ADMIN]",
		"MODERATOR": "&2[MOD]",
		"HELPER": "&9[HELPER]",
		"YOUTUBER": "&c[&fYOUTUBE&c]"
	}
	let specialRanks = {
		"Technoblade": "&d[PIG&b+++&d]"
	}
	let username = playerInfo["player"]["displayname"]
	if (username in specialRanks) return specialRanks[username]
	if ("rank" in playerInfo["player"] && playerInfo["player"]["rank"] in rankFormats) return rankFormats[playerInfo["player"]["rank"]]
	let currRank = "&7"
	if ("newPackageRank" in playerInfo["player"]) currRank = rankFormats[playerInfo["player"]["newPackageRank"]]
	if ("monthlyPackageRank" in playerInfo["player"] && playerInfo["player"]["monthlyPackageRank"] == "SUPERSTAR") {
		currRank = "&6[MVP&c++&6]"
		if ("monthlyRankColor" in playerInfo["player"]) currRank = currRank.replace("&b", colorKeys[playerInfo["player"]["monthlyRankColor"]])
	}
	if ("rankPlusColor" in playerInfo["player"]) currRank = currRank.replace(/\+/g, `${colorKeys[playerInfo['player']['rankPlusColor']]}+`)
	return currRank
}
export let dataObject = new PogObject("IllegalMap", {
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

export const colors = [
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
