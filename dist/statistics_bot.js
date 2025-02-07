import { bot } from './components/createBot.js';
import './components/commands.js';
import { statisticsManager } from './components/statisticsManager.js';
import './components/textMessage.js';
import './components/businessMessage.js';
import './components/runSaveInterval.js';
// Загружаем состояние при старте приложения
statisticsManager.loadState();
bot.start().then(() => console.log('Бот запущен'));
bot.catch((err) => {
    console.error('Ошибка в обработке команды:', err);
});
