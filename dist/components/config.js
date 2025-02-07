import dotenv from 'dotenv';
dotenv.config();
export const token = process.env.BOT_TOKEN;
export const mainUser = process.env.YOUR_TG;
if (!token) {
    throw new Error('Token is not defined. Please set the BOT_TOKEN environment variable.');
}
