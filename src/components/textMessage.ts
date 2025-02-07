import {bot} from "./createBot.js";
import {excludedChatId, replyWithoutCounting} from "./saveCurrentStatistics.js";
import {statisticsManager} from "./statisticsManager.js";
import {mainUser} from "./config.js";
import {saveFullStatisticsToFile} from "./saveFullStatistics.js";

bot.on('message', async (ctx) => {
    if (ctx.chat && ctx.chat.id === excludedChatId) return;
//     console.log(ctx.message);

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
        await replyWithoutCounting(ctx, `Дата и время: ${dateTime}\n- Количество входящих сообщений: ${statisticsManager.getMessageCount()}\n- Количество исходящих сообщений: ${statisticsManager.getOutgoingMessageCount()}\n- Количество групповых сообщений: ${statisticsManager.getGroupMessageCount()}`);
        return;
    }

    const chat = ctx.chat; // Сохраняем ссылку на chat для проверки
    if (!chat) {
        console.error('Chat is undefined');
        return; // Выход из функции, если chat не определён
    }

    // Определяем направление сообщения
    let direction = 'Входящие'; // По умолчанию считаем входящие
    if (username === mainUser) {
        statisticsManager.incrementOutgoingMessageCount(); // Увеличиваем счетчик исходящих сообщений
        // console.log(`Счетчик исходящих сообщений увеличен: ${statisticsManager.getOutgoingMessageCount()}`);
        direction = 'Исходящие'; // Если сообщение от mainUser, меняем направление
    } else {
        statisticsManager.incrementMessageCount(); // Увеличиваем счетчик входящих сообщений
        if (chat.type === 'group' || chat.type === 'supergroup') {
            statisticsManager.incrementGroupMessageCount(); // Увеличиваем счетчик групповых сообщений
            // console.log(`Счетчик групповых сообщений увеличен: ${statisticsManager.getGroupMessageCount()}`);
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
    // console.log(messageInfo);
    await saveFullStatisticsToFile(messageInfo);
});