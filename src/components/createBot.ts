import { Bot} from 'grammy';
import { token, tgChatId } from './config.js';

export const bot = new Bot(token as string);
async function notifyProcessStarted() {
    try {
        await bot.api.sendMessage(tgChatId as string, "Процесс мониторинга чатов запущен и выполняется.");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Ошибка при отправке сообщения: ${error.message}`);
        } else {
            console.error('Неизвестная ошибка при отправке сообщения');
        }
    }
}

// Вызов функции уведомления
(async () => {
    await notifyProcessStarted();
})();