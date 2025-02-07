import {saveStatisticsToFile} from "./saveStatistics.js";

setInterval(async () => {
    console.log(`Функция сохранения статистики запущена в ${new Date().toISOString()}`);
    await saveStatisticsToFile();
}, 10000);