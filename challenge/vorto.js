const process = require('process');
const fs = require('fs');
const util = require('util');

// get filepath from command line
var filepath = process.argv[2];

// run the program
main()

async function main() {

    const depot = [0, 0]
    const maxShift = 12 * 60
    const data = await readAndFormatData(filepath)

    // create a copy to update as we assign loads
    var remaining = data.slice()

    // add first driver
    var drivers = [
        {
            currPosition: depot,
            totalDriveTime: 0,
            route: []
        }
    ]

    driverIndex = 0;

    // keep looping till all loads are assigned
    while (remaining.length > 0) {

        var shortestIndex = null
        var shortestDriveTime = Infinity;
        var timeToDepot = Infinity
        var driver = drivers[driverIndex]

        // find closest load
        for (var i = 0; i < remaining.length; i++) {

            const currDriveTime = calculateTime(driver.currPosition, remaining[i].pickUp) + calculateTime(remaining[i].pickUp, remaining[i].dropOff);
            var timeToDepot = calculateTime(remaining[i].dropOff, depot);


            if (currDriveTime <= shortestDriveTime && currDriveTime + timeToDepot + driver.totalDriveTime <= maxShift) {
                shortestDriveTime = currDriveTime;
                shortestIndex = i
            }
        }

        // if there is no load that fits in shift, send the driver to the depot and instantiate a new driver
        if (shortestIndex === null) {

            driver.totalDriveTime += timeToDepot
            driver.currPosition = depot;
            drivers.push({
                currPosition: depot,
                totalDriveTime: 0,
                route: []
            })
            driverIndex++

            // if there is a valid load, send the driver there and update his details
        } else {
            driver.totalDriveTime += shortestDriveTime;
            driver.currPosition = remaining[shortestIndex].dropOff
            driver.route.push(remaining[shortestIndex].id)
            remaining.splice(shortestIndex, 1);
        }
    }

    // one all loads are assigned, we print the result here
    for (var i = 0; i < drivers.length; i++) {
        console.log("[" + drivers[i].route.toString() + "]")
    }


}

// read data from file
async function readAndFormatData(filepath) {

    var loads = []

    // Read and format the data from the file
    const data = await fs.promises.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        return data;

    });

    var dataByLine = data.trim().split("\n")

    // skip the line with the headings
    for (var i = 1; i < dataByLine.length; i++) {

        var load = {};
        var line = dataByLine[i].split(" ");

        // load id
        load.id = parseInt(line[0])

        // pick up
        var pickUp = line[1].substring(1, line[1].length - 1).split(",");
        load.pickUp = [parseFloat(pickUp[0]), parseFloat(pickUp[1])]


        // drop off
        var dropOff = line[2].substring(1, line[2].length - 1).split(",");
        load.dropOff = [parseFloat(dropOff[0]), parseFloat(dropOff[1])]

        // push this load
        loads.push(load)
    }

    return loads
}


// calculate time between two locations
function calculateTime([x1, y1], [x2, y2]) {

    return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2))
}
