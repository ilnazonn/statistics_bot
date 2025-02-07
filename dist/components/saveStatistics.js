var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { statisticsManager } from "./statisticsManager.js";
import fs from "fs";
import zlib from "zlib";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const saveStatisticsToFile = () => __awaiter(void 0, void 0, void 0, function* () {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    // Если день изменился, обнуляем счетчики
    if (statisticsManager.getLastDate() !== currentDate) {
        statisticsManager.setLastDate(currentDate); // Обновляем дату
        statisticsManager.setMessageCount(0); // Обнуляем счетчики
        statisticsManager.setOutgoingMessageCount(0);
        statisticsManager.setGroupMessageCount(0);
    }
    let statsContent = ''; // Содержимое для записи в файл
    let foundToday = false;
    // Проверяем, существует ли файл для статистики
    if (fs.existsSync('reports/statistics.csv')) {
        const fileContent = fs.readFileSync('reports/statistics.csv', 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        // Проверяем, есть ли заголовок в первой строке файла
        if (lines.length === 0 || lines[0] !== 'Дата,Количество входящих сообщений,Количество исходящих сообщений,Количество групповых сообщений') {
            // Добавляем заголовок, если файл пуст или заголовок отсутствует
            statsContent += 'Дата,Количество входящих сообщений,Количество исходящих сообщений,Количество групповых сообщений\n';
        }
        // Обрабатываем строки файла
        for (const line of lines) {
            if (line.includes(currentDate)) {
                // Обновляем строку с текущей датой
                statsContent += `${currentDate},${statisticsManager.getMessageCount()},${statisticsManager.getOutgoingMessageCount()},${statisticsManager.getGroupMessageCount()}\n`;
                foundToday = true;
            }
            else {
                // Добавляем остальные строки (кроме заголовка)
                statsContent += line + '\n';
            }
        }
    }
    else {
        // Если файл не существует, добавляем заголовок
        statsContent += 'Дата,Количество входящих сообщений,Количество исходящих сообщений,Количество групповых сообщений\n';
    }
    // Если записи за сегодня не было, добавляем новую строку
    if (!foundToday) {
        statsContent += `${currentDate},${statisticsManager.getMessageCount()},${statisticsManager.getOutgoingMessageCount()},${statisticsManager.getGroupMessageCount()}\n`;
    }
    // Записываем обновленное содержимое в файл
    fs.writeFileSync('reports/statistics.csv', statsContent.trim(), 'utf8');
    // Запуск функции раз в 10 секунд
    // Архивация файла statistic
    const MAX_FILE_SIZE = 500 * 1024; // 5 КБ в байтах
    const statsFilePath = 'reports/statistics.csv';
    // Проверяем, существует ли файл
    if (!fs.existsSync(statsFilePath)) {
        console.error(`Файл ${statsFilePath} не существует.`);
        process.exit(1);
    }
    try {
        const fileStats = fs.statSync(statsFilePath);
        if (fileStats.size > MAX_FILE_SIZE) {
            const gzip = zlib.createGzip();
            const source = fs.createReadStream(statsFilePath);
            // Архивируем с добавлением текущей даты в имя архива
            const archiveDir = path.join(__dirname, '../../reports');
            const archiveFilePath = path.join(archiveDir, `statistics_${currentDate.replace(/\./g, '-')}.csv.gz`);
            const destination = fs.createWriteStream(archiveFilePath);
            // Архивируем файл
            source.pipe(gzip).pipe(destination);
            // Удаляем оригинальный файл после успешного архивирования
            destination.on('finish', () => {
                console.log(`Файл успешно архивирован: ${archiveFilePath}`);
                fs.unlinkSync(statsFilePath);
                console.log(`Оригинальный файл удален: ${statsFilePath}`);
            });
        }
    }
    catch (err) {
        console.error('Ошибка при обработке файла:', err);
    }
    // Сохраняем текущее состояние
    statisticsManager.saveState();
});
export { saveStatisticsToFile };
