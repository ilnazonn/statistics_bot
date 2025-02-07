import {bot} from "./createBot.js";
import {Context} from "grammy";
import {mainUser} from "./config.js";
import {statisticsManager} from "./statisticsManager.js";
import {saveFullStatisticsToFile} from "./saveFullStatistics.js";

bot.on('business_message', async (ctx: Context) => {
    const businessMessage = ctx.update.business_message;
//     console.log(ctx.update.business_message);
    const user = businessMessage ? businessMessage.from : null;

    if (businessMessage && (
        ('caption' in businessMessage && ('video' in businessMessage || 'photo' in businessMessage)) // caption с video или photo
        || ('text' in businessMessage) // Или наличие текста
        || ('voice' in businessMessage) // Или наличие голосового сообщения
        || ('sticker' in businessMessage) // Или наличие голосового сообщения
        || ('document' in businessMessage) // Или наличие документа в сообщении
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

        // console.log(`Получено бизнес-сообщение от ${username}: ${businessMessage.text}`);

        const chat = ctx.chat;
        if (!chat) {
            console.error('Chat is undefined');
            return;
        }

        // Определяем направление сообщения
        let direction = 'Входящие'; // По умолчанию считаем, что сообщение входящее
        if (username === mainUser) {
            statisticsManager.incrementOutgoingMessageCount(); // Увеличиваем счетчик исходящих сообщений
            // console.log(`Счетчик исходящих сообщений увеличен: ${statisticsManager.getOutgoingMessageCount()}`);
            direction = 'Исходящие'; // Если сообщение от mainUser, то оно исходящее
        } else {
            statisticsManager.incrementMessageCount(); // Увеличиваем счетчик входящих сообщений
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
        // console.log(messageInfo);
        await saveFullStatisticsToFile(messageInfo);
    }
});