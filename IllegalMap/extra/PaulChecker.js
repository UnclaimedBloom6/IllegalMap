import { dataObject, prefix } from "../utils/Utils"
import request from "../../requestV2"

let lastCheck = null
register("tick", () => {
    // Checks for Paul every 10 mins
    if (new Date().getTime() - lastCheck > 360000) {
        lastCheck = new Date().getTime()
        request({
            url:"https://whoknew.sbe-stole-skytils.design/api/mayor",
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        }).then(mayorStuff => {
            mayorStuff = JSON.parse(mayorStuff)
            if (mayorStuff.name !== "Paul") {
                // ChatLib.chat(`${prefix} &aPaul disabled!`)
                dataObject.isPaul = false
            }
            for (let i = 0; i < mayorStuff.perks.length; i++) {
                if (mayorStuff.perks[i].name == "EZPZ") {
                    // ChatLib.chat(`${prefix} &aPaul enabled!`)
                    dataObject.isPaul = true
                }
            }
            dataObject.save()
        }).catch(error => {
            // ChatLib.chat(error)
        })
    }
})