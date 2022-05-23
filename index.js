const axios = require('axios');
const notifier = require('node-notifier');

const UPG_STATIONS = [101];
const WOG_STATIONS = [1145];

const INTERVAL = 10 * 60 * 1000;
const DELAY = 1000;

const wait = ms => new Promise((r) => setTimeout(r, ms));

const checkWOG = async() => {
    for (const station of WOG_STATIONS) {
        await wait(DELAY);

        const { data } = await axios.get(`https://api.wog.ua/fuel_stations/${station}`);

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

    console.log('Next check scheduled in 10 minutes');
    setTimeout(checkWOG, INTERVAL);
}

checkWOG();
