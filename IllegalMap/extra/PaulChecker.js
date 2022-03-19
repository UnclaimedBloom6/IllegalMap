import { dataObject } from "../utils/Utils"
import request from "../../requestV2"

export const getPaul = () => request("https://api.hypixel.net/resources/skyblock/election").then(mayorStuff => {
    mayorStuff = JSON.parse(mayorStuff)
    dataObject.isPaul = mayorStuff.mayor.name == "Paul" && mayorStuff.mayor.perks.some(a => a.name == "EZPZ")
    dataObject.save()
})