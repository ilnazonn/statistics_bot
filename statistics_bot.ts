import { Bot, Context, Keyboard, InputFile} from 'grammy'; // Импортируем библиотеку grammy
import fs from 'fs'; // Импортируем модуль для работы с файловой системой
import dotenv from 'dotenv';
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
    const inputFile = new InputFile('./statistics.txt'); // Убедитесь, что путь к файлу правильный

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
    const inputFile = new InputFile('./full_statistics.txt'); // Убедитесь, что путь к файлу правильный
    try {
        // Отправляем файл вместе с текстовым уведомлением
        await ctx.replyWithDocument(inputFile, { caption: 'Ваш файл со статистикой' });
    } catch (error) {
        console.error('Ошибка при отправке файла:', error);
        await ctx.reply('Произошла ошибка при попытке отправить файл. Пожалуйста, попробуйте позже.');
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
 const path = 'statistics.json'; // Используем JSON для хранения состояния
const loadState = () => {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path, 'utf-8');
        const state = JSON.parse(data);
        messageCount = state.messageCount || 0;
        outgoingMessageCount = state.outgoingMessageCount || 0;
        groupMessageCount = state.groupMessageCount || 0;
        lastDate = state.lastDate || '';
    }
};

// Сохраняем текущее состояние в файл
const saveState = () => {
    const state = {
        messageCount,
        outgoingMessageCount,
        groupMessageCount,
        lastDate
    };
    fs.writeFileSync(path, JSON.stringify(state), 'utf-8');
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

//    console.log(`Текущая дата (currentDate): ${currentDate}, Последняя дата (lastDate): ${lastDate}`);
    let foundToday = false;
    let statsContent = ''; // Содержимое для записи в файл

    // console.log(`Текущие значения счетчиков:
    // Входящие сообщения: ${messageCount},
    // Исходящие сообщения: ${outgoingMessageCount},
    // Групповые сообщения: ${groupMessageCount}`);

    // Проверяем, существует ли файл для статистики
    if (fs.existsSync('statistics.txt')) {
        const fileContent = fs.readFileSync('statistics.txt', 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // Добавляем заголовок только если файл пуст
        if (lines.length === 0) {
            statsContent += 'Дата,Количество входящих сообщений,Количество исходящих сообщений,Количество групповых сообщений\n';
        }

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(currentDate)) {
                foundToday = true;
                // Формируем обновленное содержимое
                statsContent += `${currentDate},${messageCount},${outgoingMessageCount},${groupMessageCount}\n`;

                break;
            } else {
                // Добавляем все остальные строки
                statsContent += lines[i] + '\n';
            }
        }
    }

// Если записи за сегодня не было или день изменился
    if (!foundToday || lastDate !== currentDate) {
        statsContent += `${currentDate},${messageCount},${outgoingMessageCount},${groupMessageCount}\n`;
    }



    // Записываем обновленное содержимое в файл
    fs.writeFileSync('statistics.txt', statsContent.trim(), 'utf8');

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
    const statsContent = `${messageInfo.user_id},${messageInfo.user_name},${messageInfo.group_id},${messageInfo.group_name},${messageInfo.direction}, ${messageInfo.timestamp}\n`;

    // Проверяем, существует ли файл для полной статистики
    if (fs.existsSync('full_statistics.txt')) {
        // Записываем информацию в конец файла
        fs.appendFileSync('full_statistics.txt', statsContent, 'utf8');
    } else {
        // Если файл не существует, создаем его и добавляем заголовок
        const header = 'User ID,User Name,Group ID,Group Name,Direction,Timestamp\n';
        fs.writeFileSync('full_statistics.txt', header + statsContent, 'utf8');
    }

//    console.log('Полная статистика успешно сохранена в файл full_statistics.txt');
};



// Обработка бизнес сообщений:
bot.on('business_message', async (ctx: Context) => {
    const businessMessage = ctx.update.business_message;
    const user = businessMessage ? businessMessage.from : null;

    if (businessMessage && 'text' in businessMessage) {
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
bot.on('message:text', async (ctx) => {
    if (ctx.chat && ctx.chat.id === excludedChatId) return;

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
