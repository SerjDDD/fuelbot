const axios = require('axios');
const notifier = require('node-notifier');
const logToFile = require('log-to-file');

const UPG_STATIONS = [101];
const WOG_STATIONS = [1145];

const INTERVAL = 10 * 60 * 1000;
const DELAY = 1000;

const wait = ms => new Promise((r) => setTimeout(r, ms));

const checkUPG = async() => {
    await wait(DELAY);

    const { data } = await axios.get('https://upg.ua/merezha_azs');
    const upgDataString = data?.split('var objmap = ')?.[1]?.split('var map;')?.[0]?.trim()?.slice(0, -1);
    const upgData = JSON.parse(upgDataString);

    for (station of UPG_STATIONS) {
        const { FuelsAsArray } = upgData?.data?.find(({ id }) => id === station);

        logToFile(JSON.stringify(FuelsAsArray, null, 2));

        FuelsAsArray.forEach(
            fuel => {
                if (fuel.Price !== '0.00') {
                    const notification = `UPG (${station}): ${fuel.Title} - ${fuel.Price}`;

                    notifier.notify(notification);
                    console.info(notification);
                }
            }
        );
    }

    console.log('Next UPG check scheduled in 10 minutes');
    setTimeout(checkUPG, INTERVAL);
};

const checkOKKO = async() => {
    await wait(DELAY);

    const { data } = await axios.get('https://www.okko.ua/en/fuel-map');
    console.log(data);

    // const okkoDataString = data
        // ?.split('bE.title=ab;bE.keywords=ab;bE.description=ap;bE.content=ap;bE.vintageDesign=c;bE.lightTheme=aX;bE.footer_text=a;return')?.[1]
        // ?.split('var map;')?.[0]
        // ?.trim()
        // ?.slice(0, -1);

    // console.log(okkoDataString);

    // const okkoData = JSON.parse(okkoDataString);
    // console.log(okkoData);
};

const checkWOG = async() => {
    for (const station of WOG_STATIONS) {
        await wait(DELAY);

        const { data } = await axios.get(`https://api.wog.ua/fuel_stations/${station}`);
        logToFile(JSON.stringify(data, null, 2));

        const parseString = data?.data?.workDescription;
        const monitoredStrings = parseString?.split("\n").filter(
            str => str.startsWith('М95') || str.startsWith('А95')
        );

        monitoredStrings?.forEach(
            str => {
                const data = str.split(' - ');
                if (data[1] !== 'Пальне відсутнє.' && data[1] !== 'тільки спецтранспорт.') {
                    const notification = `WOG (${station}): ${data[0]} - ${data[1]}`;

                    notifier.notify(notification);
                    console.info(notification);
                }
            }
        );
    }

    console.log('Next WOG check scheduled in 10 minutes');
    setTimeout(checkWOG, INTERVAL);
};

notifier.notify('Monitoring started!');
checkUPG();
checkWOG();
// checkOKKO();
