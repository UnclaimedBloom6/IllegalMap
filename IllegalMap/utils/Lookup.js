import { Room } from "../dungeon/Room"
import {
    isBetween,
    blankRoom
} from "./Utils"

class Lookup {
    constructor() { 
        
    }
    getRoomDataFromHash(hash) {
        let rooms = JSON.parse(FileLib.read("IllegalMap", "data/rooms.json"))["rooms"]
        for (let room of rooms) {
            if (room.cores.includes(hash)) {
                return new Room(-1, -1, {
                    "name": room.name,
                    "type": room.type,
                    "secrets": room.secrets,
                    "cores": room.cores
                })
            }
        }
        
        return null
    }
    getRoomFromCoords(coords, dungeon) {
        let newCoords = this.getRoomCenterCoords(coords, dungeon)
        if (!newCoords) return ChatLib.chat("Non")
        let room = new Room(newCoords[0], newCoords[1], {
            "name": "Unknown",
            "type": "normal",
            "secrets": 0,
            "cores": []
        })
        let foundRoom = this.getRoomDataFromHash(room.core)
        if (foundRoom) {
            room.name = foundRoom.name
            room.type = foundRoom.type
            room.secrets = foundRoom.secrets
        }
        return room
    }
    getRoomCenterCoords(coords, dungeon) {
        for (let x = dungeon.startX; x <= dungeon.startX + (dungeon.roomSize+1) * 5; x+=16) {
            for (let z = dungeon.startZ; z <= dungeon.startZ + (dungeon.roomSize+1) * 5; z+=16) {
                if (x%(dungeon.roomSize+1)==15 && z%(dungeon.roomSize+1)==15) {
                    if (isBetween(coords[0], x+16, x-16) && isBetween(coords[1], z+16, z-16)) {
                        return [x, z]
                    }
                }
            }
        }
        return
    }
}
export default new Lookup()