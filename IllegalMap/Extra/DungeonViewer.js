
// import { BufferedImage, Color } from "../../BloomCore/utils/Utils"
// import {
//     UIBlock,
//     CenterConstraint,
//     WindowScreen,
//     UIContainer,
//     SiblingConstraint,
//     ChildBasedMaxSizeConstraint,
//     ChildBasedSizeConstraint,
//     RelativeConstraint,
//     ScrollComponent,
//     AdditiveConstraint,
//     AspectConstraint,
//     PaddingConstraint,
//     FillConstraint,
//     MousePositionConstraint,
//     SubtractiveConstraint,
//     UIWrappedText,
//     UIText,
//     UIImage
// } from "../../Elementa/index"
// import DmapDungeon from "../Components/DmapDungeon"
// import { Room } from "../Components/Room"
// import Config from "../data/Config"
// import { getRoomsFile } from "../utils"

// const CompletableFuture = Java.type("java.util.concurrent.CompletableFuture")

// const gui = new JavaAdapter(WindowScreen, {}, true, false, false)

// let bg = new UIBlock(new Color(0, 0, 0, 0.6))
// .setX(new CenterConstraint())
// .setY(new CenterConstraint())
// .setHeight((Renderer.screen.getHeight()*4/5).pixels())
// .setWidth(new AspectConstraint(1.5))
// .setChildOf(gui.getWindow())

// const mapList = new UIBlock(new Color(0, 0, 0, 0.7))
// .setX((5).pixels())
// .setY((5).pixels())
// .setWidth(new RelativeConstraint(0.2))
// .setHeight(new SubtractiveConstraint(new RelativeConstraint(), (10).pixels()))
// .setChildOf(bg)

// const scroll = new ScrollComponent()
// .setWidth(new RelativeConstraint())
// .setHeight(new RelativeConstraint())
// .setChildOf(mapList)

// let listWidth = mapList.getWidth().pixels()
// const infoArea = new UIBlock(new Color(0, 0, 0, 0))
// .setX(new AdditiveConstraint(listWidth, (5).pixels()))
// .setWidth(new SubtractiveConstraint(new RelativeConstraint(0.8), (5).pixels()))
// .setHeight(new RelativeConstraint())
// .setChildOf(bg)

// const mapSection = new UIBlock(new Color(0, 0, 0, 0.7))
// .setX((5).pixels())
// .setY((5).pixels())
// .setWidth(new RelativeConstraint(0.5))
// .setHeight(new AspectConstraint())
// .setChildOf(infoArea)

// let map = new UIBlock(new Color(0, 1, 0, 0))
// .setX((5).pixels())
// .setY((5).pixels())
// .setWidth(new SubtractiveConstraint(new RelativeConstraint(), (10).pixels()))
// .setHeight(new AspectConstraint())
// .setChildOf(mapSection)

// new UIText("§7Map")
// .setX(new RelativeConstraint(0.05))
// .setY(new RelativeConstraint(0.05))
// .setWidth(new RelativeConstraint(0.1))
// .setChildOf(mapSection)

// const textArea = new UIBlock(new Color(0, 0, 0, 0.7))
// .setX(new AdditiveConstraint(new RelativeConstraint(0.5), (10).pixels()))
// .setY((5).pixels())
// .setWidth(new SubtractiveConstraint(new RelativeConstraint(0.5), (15).pixels()))
// .setHeight(new SubtractiveConstraint(new RelativeConstraint(), (10).pixels()))
// .setChildOf(infoArea)

// new UIText("§7Main Info")
// .setX(new RelativeConstraint(0.05))
// .setY(new RelativeConstraint(0.05))
// .setWidth(new RelativeConstraint(0.2))
// .setChildOf(textArea)

// const secondaryTextArea = new UIBlock(new Color(0, 0, 0, 0.7))
// .setX((5).pixels())
// .setY(new AdditiveConstraint(mapSection.getHeight().pixels(), (10).pixels()))
// .setWidth(new RelativeConstraint(0.5))
// .setHeight(new SubtractiveConstraint(new RelativeConstraint(), (mapSection.getHeight() + 15).pixels()))
// .setChildOf(infoArea)

// new UIText("§7Extra Text")
// .setX(new RelativeConstraint(0.05))
// .setY(new RelativeConstraint(0.05))
// // .setWidth(new RelativeConstraint(0.2))
// .setTextScale((1).pixels())
// .setChildOf(secondaryTextArea)


// let entries = []

// const addEntry = (floor) => {
//     let block = new UIBlock(new Color(0, 0, 0, 1))
//     .setX(new CenterConstraint())
//     .setWidth(new RelativeConstraint(0.95))
//     .setHeight(new AspectConstraint(0.3))
//     .onMouseClick(a => {
//         addEntry("F5")
//         ChatLib.chat("Added new entry!")
//     })
//     .setChildOf(scroll)
//     let height = block.getHeight()
//     let padding = height * 0.05
//     block.setY((padding + entries.length * (height + padding)).pixels())
    
//     let imageBox = new UIBlock(new Color(0, 1, 0, 0))
//     .setHeight(new RelativeConstraint())
//     .setWidth(new AspectConstraint())
//     .setChildOf(block)

//     let imagePlaceholder = new UIBlock(new Color(0.2, 0.2, 0.2, 1))
//     .setHeight(new RelativeConstraint(0.9))
//     .setWidth(new RelativeConstraint(0.9))
//     .setX(new CenterConstraint())
//     .setY(new CenterConstraint())
//     .setChildOf(imageBox)

//     let textArea = new UIBlock(new Color(0, 0, 0, 1))
//     .setX(imageBox.getWidth().pixels())
//     .setWidth(new SubtractiveConstraint(new RelativeConstraint(), imageBox.getWidth().pixels()))
//     .setHeight(new RelativeConstraint())
//     .setChildOf(block)
    
//     const setLine = (index, text) => {
//         new UIText(text)
//         .setX(new RelativeConstraint(0.05))
//         .setY(new AdditiveConstraint(new RelativeConstraint(0.05), new RelativeConstraint(0.2 * index + 0.05)))
//         .setHeight(new RelativeConstraint(0.2))
//         .setTextScale((0.5).pixels())
//         .setChildOf(textArea)
//     }

//     setLine(0, `§7${floor}`)
//     setLine(1, "§7302")
//     setLine(2, "§75:34")
//     setLine(3, "§715:03")

    

//     entries.push(block)
// }

// addEntry("F1")
// addEntry("F2")
// addEntry("F3")
// addEntry("F4")
// addEntry("F5")
// addEntry("F6")
// addEntry("F7")

// const showDungeonInfo = (string) => {
//     let [dungeon, rest] = string.split(";")
//     // ChatLib.chat(dungeon)
//     let img = makeImageFromString(dungeon)
//     map.hide()
//     map = new UIImage(new CompletableFuture().completedFuture(img))
//     .setX((5).pixels())
//     .setY((5).pixels())
//     .setWidth(new SubtractiveConstraint(new RelativeConstraint(), (10).pixels()))
//     .setHeight(new AspectConstraint())
//     .setChildOf(mapSection)
// }

// // const addEntry = 

// register("command", () => {
//     GuiHandler.openGui(gui)
// }).setName("gui")

// let madeImg = false
// register("tick", () => {
//     if (!DmapDungeon.stringRep || madeImg) return
//     showDungeonInfo(DmapDungeon.stringRep)
//     // makeImageFromString(DmapDungeon.stringRep)
//     madeImg = true
// })

// register("worldUnload", () => {
//     madeImg = false
// })

// const makeImageFromString = (str) => {

//     // Convert whole function elsewhere

//     let img = new BufferedImage(23, 23, BufferedImage.TYPE_4BYTE_ABGR)

//     const setPixels = (x1, y1, width, height, color) => {
//         if (!color) return
//         for (let x = x1; x < x1 + width; x++) for (let y = y1; y < y1 + height; y++) {
//             if (x < 0 || x > 22 || y < 0 || y > 22) continue
//             img.setRGB(x, y, color.getRGB())
//         }
//     }

//     let [floor, rooms, doors] = str.split(",")

//     // The rooms
//     rooms = rooms.match(/.{3}/g).map(a => parseInt(a))
//     const roomFile = getRoomsFile().rooms
//     const getRoomFromID = (id) => roomFile.find(a => a.roomID == id)
//     for (let i = 0; i < rooms.length; i++) {
//         let id = rooms[i]
//         let room = getRoomFromID(id)
//         if (id == null || !room) continue
//         let components = rooms.map((v, i) => v == id ? i : null).filter(a => a !== null).map(a => [a%6, Math.floor(a/6)])
//         rooms = rooms.map(a => a == id ? null : a) // remove room from ids
//         // ChatLib.chat(`${room.name} - ${JSON.stringify(components)}`)
//         let r = new Room(components, null)
//         r.explored = true
//         r.type = room.type
//         r.components.forEach(a => {
//             let [x, y] = a
//             setPixels(4*x, 4*y, 3, 3, r.getColor())
//             if (r.components.some(b => b[0] == x && b[1] == y+1)) setPixels(4*x, 4*y+3, 3, 1, r.getColor())
//             if (r.components.some(b => b[0] == x+1 && b[1] == y)) setPixels(4*x+3, 4*y, 1, 3, r.getColor())
//         })
        
//         if (r.shape == "2x2") {
//             let minX = Math.min(...r.components.map(a => a[0]))*4
//             let minY = Math.min(...r.components.map(a => a[1]))*4
//             setPixels(minX + 3, minY + 3, 1, 1, r.getColor())
//         }
//     }

//     // The Doors
//     let doorLines = new Array(11).fill(null).map((v, i) => {
//         let num = i%2 ? 6 : 5
//         let temp = doors.slice(0, num)
//         doors = doors.slice(num)
//         return temp
//     })
//     for (let i = 0; i < doorLines.length; i++) {
//         let arr = doorLines[i].split("")
//         for (let j = 0; j < arr.length; j++) {
//             let d = parseInt(arr[j])
//             if (!d) continue
//             let doorColor = new Color(92/255, 52/255, 14/255, 1)
//             if (d == 3) doorColor = Config.witherDoorColor
//             if (i%2) setPixels(4*j+1, 2*i+1, 1, 1, doorColor)
//             else setPixels(4*j+3, 2*i+1, 1, 1, doorColor)
//         }
//     }
//     return img

//     // Debug Rendering
//     register("renderOverlay", () => {
//         Renderer.retainTransforms(true)
//         Renderer.translate(200, 10)
//         Renderer.drawRect(Renderer.color(0, 0, 0, 175), 0, 0, 160, 160)
//         Renderer.drawImage(new Image(img), 5, 5, 150, 150)
//         Renderer.retainTransforms(false)
//     })
// }