import { Context } from "grammy";
import fs from "fs";
import { statisticsManager } from './statisticsManager.js';

export const excludedChatId = 746522064; // ID чата, сообщения в котором нужно игнорировать

// Функция для отправки сообщения без увеличения счетчика
export const replyWithoutCounting = async (ctx: Context, text: string, options?: any) => {
    await ctx.reply(text, options);
};

// Загрузка состояния из файла
export const filePath = 'statistics.json'; // Используем JSON для хранения состояния

const loadState = () => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const state = JSON.parse(data);
        statisticsManager.setMessageCount(state.messageCount || 0);
        statisticsManager.setOutgoingMessageCount(state.outgoingMessageCount || 0);
        statisticsManager.setGroupMessageCount(state.groupMessageCount || 0);
        statisticsManager.setLastDate(state.lastDate || '');
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
        statisticsManager.setMessageCount(initialState.messageCount);
        statisticsManager.setOutgoingMessageCount(initialState.outgoingMessageCount);
        statisticsManager.setGroupMessageCount(initialState.groupMessageCount);
        statisticsManager.setLastDate(initialState.lastDate);
    }
};

// Вызов функции загрузки состояния
loadState();

// Сохраняем текущее состояние в файл
const saveState = () => {
    const state = {
        messageCount: statisticsManager.getMessageCount(),
        outgoingMessageCount: statisticsManager.getOutgoingMessageCount(),
        groupMessageCount: statisticsManager.getGroupMessageCount(),
        lastDate: statisticsManager.getLastDate()
    };
    fs.writeFileSync(filePath, JSON.stringify(state), 'utf-8');
};