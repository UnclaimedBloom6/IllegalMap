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
        if (!newCoords) return
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
        for (let rx = 0; rx <= 10; rx++) {
            for (let rz = 0; rz <= 10; rz++) {
                let x = rx*(dungeon.roomSize+1)/2-185
                let z = rz*(dungeon.roomSize+1)/2-185
                if (!(rx%2) && !(rz%2) && isBetween(coords[0], x+16, x-16) && isBetween(coords[1], z+16, z-16)) return [x, z]
            }
        }
        return null
    }
}
export default new Lookup()