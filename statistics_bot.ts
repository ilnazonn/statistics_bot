import { Bot, Context, Keyboard, InputFile} from 'grammy'; // Импортируем библиотеку grammy
import fs from 'fs'; // Импортируем модуль для работы с файловой системой
import path from 'path';
import dotenv from 'dotenv';
import zlib from 'zlib';
// Загрузить переменные окружения из файла .env
dotenv.config();
const token = process.env.BOT_TOKEN;
const mainUser = process.env.YOUR_TG
if (!token) {
    throw new Error('Token is not defined. Please set the BOT_TOKEN environment variable.');
}
const bot = new Bot(token);

let messageCount = 0;
let outgoingMessageCount = 0;
let groupMessageCount = 0;
const excludedChatId = 746522064; // ID чата, сообщения в котором нужно игнорировать

interface MessageInfo {
    user_id: number | null;
    user_name: string;
    group_id: number | null; // Здесь вы изменили тип на number | null
    group_name: string;
    direction: string;
    timestamp: string;
}
// Создаем клавиатуру для вызова статистики
const keyboard = new Keyboard().text('📊 Статистика').text('📤 Общая статистика').text('🗳️ Статистика по сообщениям').resized();

bot.command('start', async (ctx) => {
    await ctx.reply('Привет! Нажмите на кнопку, чтобы получить статистику.', {
        reply_markup: keyboard,
    });
});
bot.hears('📤 Общая статистика', async (ctx) => {
    const inputFile = new InputFile('reports/statistics.csv'); // Убедитесь, что путь к файлу правильный

    try {
        // Отправляем файл вместе с текстовым уведомлением
        await ctx.replyWithDocument(inputFile, { caption: 'Ваш файл со статистикой' });
    } catch (error) {
        console.error('Ошибка при отправке файла:', error);
        await ctx.reply('Произошла ошибка при попытке отправить файл. Пожалуйста, попробуйте позже.');
    }

    return; // Не считаем это сообщение как входящее
});


bot.hears('🗳️ Статистика по сообщениям', async (ctx) => {
    const reportsDir = './reports'; // Путь к папке с отчетами

    try {
        const files = fs.readdirSync(reportsDir)
            .filter(file => path.extname(file) === '.csv' && file.startsWith('full')) // Фильтруем только CSV файлы, начинающиеся с 'full'
            .map(file => ({ name: file, time: fs.statSync(path.join(reportsDir, file)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time) // Сортировка по дате изменения (сначала новые)
            .slice(0, 2) // Берем последние 2 файла
            .map(file => path.join(reportsDir, file.name));

        if (files.length === 0) {
            await ctx.reply('В папке reports нет файлов для отправки.');
            return;
        }

        // Отправка каждого файла
        for (const file of files) {
            const inputFile = new InputFile(file);
            await ctx.replyWithDocument(inputFile, { caption: `Ваш файл со статистикой: ${path.basename(file)}` });
        }

    } catch (error) {
        console.error('Ошибка при отправке файлов:', error);
        await ctx.reply('Произошла ошибка при попытке отправить файлы. Пожалуйста, попробуйте позже.');
    }

    return; // Не считаем это сообщение как входящее
});
// Функция для отправки сообщения без увеличения счетчика
const replyWithoutCounting = async (ctx: Context, text: string, options?: any) => {
    await ctx.reply(text, options);
};

// Функция для сохранения статистики в файл
let lastDate = ''; // Переменная для хранения даты последнего обновления

// Загрузка состояния из файла
const filePath = 'statistics.json'; // Используем JSON для хранения состояния

const loadState = () => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const state = JSON.parse(data);
        messageCount = state.messageCount || 0;
        outgoingMessageCount = state.outgoingMessageCount || 0;
        groupMessageCount = state.groupMessageCount || 0;
        lastDate = state.lastDate || '';
    } else {
        // Если файл не существует, создаем его с начальными значениями
        const initialState = {
            messageCount: 0,
            outgoingMessageCount: 0,
            groupMessageCount: 0,
            lastDate: ''
        };
        fs.writeFileSync(filePath, JSON.stringify(initialState));
        // Устанавливаем значения переменных по умолчанию
        messageCount = initialState.messageCount;
        outgoingMessageCount = initialState.outgoingMessageCount;
        groupMessageCount = initialState.groupMessageCount;
        lastDate = initialState.lastDate;
    }
};

// Вызов функции
loadState();

// Сохраняем текущее состояние в файл
const saveState = () => {
    const state = {
        messageCount,
        outgoingMessageCount,
        groupMessageCount,
        lastDate
    };
    fs.writeFileSync(filePath, JSON.stringify(state), 'utf-8');
};

const saveStatisticsToFile = async () => {
    const currentDate = new Date().toLocaleDateString('ru-RU');

    // Если день изменился, обнуляем счетчики
    if (lastDate !== currentDate) {
        lastDate = currentDate; // Обновляем дату
        messageCount = 0; // Обнуляем счетчики
        outgoingMessageCount = 0;
        groupMessageCount = 0;
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
                statsContent += `${currentDate},${messageCount},${outgoingMessageCount},${groupMessageCount}\n`;
                foundToday = true;
            } else {
                // Добавляем остальные строки (кроме заголовка)
                statsContent += line + '\n';
            }
        }
    } else {
        // Если файл не существует, добавляем заголовок
        statsContent += 'Дата,Количество входящих сообщений,Количество исходящих сообщений,Количество групповых сообщений\n';
    }

    // Если записи за сегодня не было, добавляем новую строку
    if (!foundToday) {
        statsContent += `${currentDate},${messageCount},${outgoingMessageCount},${groupMessageCount}\n`;
    }

    // Проверка перед записью в файл
    console.log('Содержимое для записи в файл:\n' + statsContent.trim()); // Лог содержимое перед записью

    // Записываем обновленное содержимое в файл
    fs.writeFileSync('reports/statistics.csv', statsContent.trim(), 'utf8');
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
            const archiveFilePath = `statistics_${currentDate.replace(/\./g, '-')}.csv.gz`;

            const destination = fs.createWriteStream(archiveFilePath);

            // Обработка ошибок при чтении исходного файла
            source.on('error', (err) => {
                console.error('Ошибка при чтении файла:', err);
            });

            // Обработка ошибок при записи в архив
            destination.on('error', (err) => {
                console.error('Ошибка при записи архива:', err);
            });

            // Архивируем файл
            source.pipe(gzip).pipe(destination);

            // Удаляем оригинальный файл после успешного архивирования
            destination.on('finish', () => {
                console.log(`Файл успешно архивирован: ${archiveFilePath}`);
                fs.unlinkSync(statsFilePath);
                console.log(`Оригинальный файл удален: ${statsFilePath}`);
            });
        } else {
            console.log('Размер файла не превышает лимит, архивация не требуется.');
        }
    } catch (err) {
        console.error('Ошибка при обработке файла:', err);
    }

    // Сохраняем текущее состояние
    saveState();
};


// Загружаем состояние при старте приложения
loadState();

// Запуск функции раз в 10 секунд
setInterval(async () => {
//    console.log(`Функция сохранения статистики запущена в ${new Date().toISOString()}`);
    await saveStatisticsToFile();
}, 10_000);



// Сохранение полной статистики:
const saveFullStatisticsToFile = async (messageInfo: MessageInfo) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const filePath = path.join('reports', `full_statistics_${year}-${month}.csv`);

    const statsContent = `${messageInfo.user_id},${messageInfo.user_name},${messageInfo.group_id},${messageInfo.group_name},${messageInfo.direction},${messageInfo.timestamp}\n`;

    // Проверяем, существует ли файл для текущего месяца
    if (fs.existsSync(filePath)) {
        // Записываем информацию в конец файла
        fs.appendFileSync(filePath, statsContent, 'utf8');
    } else {
        // Если файл не существует, создаем его и добавляем заголовок
        const header = 'User ID,User Name,Group ID,Group Name,Direction,Timestamp\n';
        fs.writeFileSync(filePath, header + statsContent, 'utf8');
    }

    // console.log('Полная статистика успешно сохранена в файл' + filePath);
};


// Обработка бизнес сообщений:
bot.on('business_message', async (ctx: Context) => {
    const businessMessage = ctx.update.business_message;
//    console.log(ctx.update.business_message);
    const user = businessMessage ? businessMessage.from : null;

    if (businessMessage && (
        ('caption' in businessMessage && ('video' in businessMessage || 'photo' in businessMessage)) // caption с video или photo
        || ('text' in businessMessage) // Или наличие текста
        || ('voice' in businessMessage) // Или наличие голосового сообщения
        || ('sticker' in businessMessage) // Или наличие голосового сообщения
        || ('video' in businessMessage || 'photo' in businessMessage) // Или наличие видео, или фото без caption
    )) {
        const username = user ? user.username || user.first_name : 'Неизвестный пользователь';
        const date = new Date();

        const datePart = date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        const timePart = date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Убираем 12-часовой формат
        });

// Объединяем дату и время с пробелом
        const timestamp = `${datePart} ${timePart}`;

//        console.log(`Получено бизнес-сообщение от ${username}: ${businessMessage.text}`);

        const chat = ctx.chat;
        if (!chat) {
            console.error('Chat is undefined');
            return;
        }

        // Определяем направление сообщения
        let direction = 'Входящие'; // По умолчанию считаем, что сообщение входящее
        if (username === mainUser) {
            outgoingMessageCount++;
    //        console.log(`Счетчик исходящих сообщений увеличен: ${outgoingMessageCount}`);
            direction = 'Исходящие'; // Если сообщение от mainUser, то оно исходящее
        } else {
            messageCount++;
        }

        // Устанавливаем group_id, если это групповое сообщение
        const groupId = (chat.type === 'group' || chat.type === 'supergroup') ? chat.id : null; // Или '' если хотите, чтобы было пустой строкой

        // Сбор информации
        const messageInfo = {
            user_id: user ? user.id : null,
            user_name: username,
            group_id: groupId,
            group_name: chat.title || 'Личное сообщение',
            direction: direction,
            timestamp: timestamp
        };
    //    console.log(messageInfo);
        await saveFullStatisticsToFile(messageInfo);
    }
});






// Обработка текстовых сообщений
bot.on('message', async (ctx) => {
    if (ctx.chat && ctx.chat.id === excludedChatId) return;
//    console.log(ctx.message);
    const user = ctx.from;
    const username = user ? user.username || user.first_name : 'Неизвестный пользователь';
    const date = new Date();

    const datePart = date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const timePart = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Убираем 12-часовой формат
    });

// Объединяем дату и время с пробелом
    const timestamp = `${datePart} ${timePart}`;

    if (ctx.message.text === '📊 Статистика') {
        const dateTime = new Date().toLocaleString();
        await replyWithoutCounting(ctx, `Дата и время: ${dateTime}\n- Количество входящих сообщений: ${messageCount}\n- Количество исходящих сообщений: ${outgoingMessageCount}\n- Количество групповых сообщений: ${groupMessageCount}`);
        return;
    }
// // Игнорируем сообщения, где текст равен undefined, но учитываем caption
//     if (ctx.message.text === undefined && !ctx.message.caption && !ctx.message.voice) {
//         console.log(`Игнорируем сообщение от ${username}: undefined и отсутствует caption`);
//         return; // Выход из функции, если текст undefined и нет caption
//     }

    // Если текст равен undefined, но есть caption, используем caption
 //   const messageText = ctx.message.text !== undefined ? ctx.message.text : ctx.message.caption;

//    console.log(`Получено текстовое сообщение от ${username}: ${ctx.message.text}`);

    const chat = ctx.chat; // Сохраняем ссылку на chat для проверки
    if (!chat) {
        console.error('Chat is undefined');
        return; // Выход из функции, если chat не определён
    }


    // Определяем направление сообщения
    let direction = 'Входящие'; // По умолчанию считаем входящие
    if (username === mainUser) {
        outgoingMessageCount++;
//        console.log(`Счетчик исходящих сообщений увеличен: ${outgoingMessageCount}`);
        direction = 'Исходящие'; // Если сообщение от mainUser, меняем направление
    } else {
        messageCount++;
        if (chat.type === 'group' || chat.type === 'supergroup') {
            groupMessageCount++;
//            console.log(`Счетчик групповых сообщений увеличен: ${groupMessageCount}`);
        }
    }

    // Сбор информации для сообщения
    const messageInfo = {
        user_id: user ? user.id : null,
        user_name: username,
        group_id: (chat.type === 'group' || chat.type === 'supergroup') ? chat.id : null, // Пустой group_id для личных сообщений
        group_name: chat.title || 'Личное сообщение',
        direction: direction, // Указываем направление
        timestamp: timestamp
    };
//    console.log(messageInfo);
    await saveFullStatisticsToFile(messageInfo);
});




// Обработка нажатий на кнопки
bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    if (callbackData === '📊 Статистика') {
        await ctx.answerCallbackQuery();
        return; // Игнорируем
    }
});


bot.start().then(()=> console.log('Бот запущен'));

bot.catch((err) => {
    console.error('Ошибка в обработке команды:', err);
});
