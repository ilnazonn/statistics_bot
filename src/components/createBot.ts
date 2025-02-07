import { Bot} from 'grammy';
import { token } from './config.js';
export const bot = new Bot(token as string);
