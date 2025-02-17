var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Bot } from 'grammy';
import { token, tgChatId } from './config.js';
export const bot = new Bot(token);
function notifyProcessStarted() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield bot.api.sendMessage(tgChatId, "Процесс мониторинга чатов запущен и выполняется.");
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`Ошибка при отправке сообщения: ${error.message}`);
            }
            else {
                console.error('Неизвестная ошибка при отправке сообщения');
            }
        }
    });
}
// Вызов функции уведомления
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield notifyProcessStarted();
}))();
