import dotenv from 'dotenv';
dotenv.config();
export const token = process.env.BOT_TOKEN;
export const mainUser = process.env.YOUR_TG
export const tgChatId = process.env.TELEGRAM_CHAT_ID
if (!token) {
    throw new Error('Token is not defined. Please set the BOT_TOKEN environment variable.');
}

export interface MessageInfo {
    user_id: number | null;
    user_name: string;
    group_id: number | null; // Здесь вы изменили тип на number | null
    group_name: string;
    direction: string;
    timestamp: string;
}
