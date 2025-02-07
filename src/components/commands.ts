import { Keyboard, InputFile} from 'grammy';
import fs from "fs";
import path from "path";
import { bot } from './createBot.js';
import {statisticsManager} from "./statisticsManager.js";
import {replyWithoutCounting} from "./saveCurrentStatistics.js";
// Создаем клавиатуру для вызова статистики
const keyboard = new Keyboard().text('📊 Статистика').text('📤 Общая статистика').text('🗳️ Статистика по сообщениям').resized();

bot.command('start', async (ctx) => {
    await ctx.reply('Привет! Нажмите на кнопку, чтобы получить статистику.', {
        reply_markup: keyboard,
    });
});
bot.hears('📊 Статистика', async (ctx) => {
    const dateTime = new Date().toLocaleString();
    await replyWithoutCounting(ctx, `Дата и время: ${dateTime}\n- Количество входящих сообщений: ${statisticsManager.getMessageCount()}\n- Количество исходящих сообщений: ${statisticsManager.getOutgoingMessageCount()}\n- Количество групповых сообщений: ${statisticsManager.getGroupMessageCount()}`);
    return;
});

bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    if (callbackData === '📊 Статистика') {
        await ctx.answerCallbackQuery();
        return; // Игнорируем
    }
});

bot.hears('📤 Общая статистика', async (ctx) => {
    const inputFile = new InputFile('reports/statistics.csv'); // Убедитесь, что путь к файлу правильный

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
    const reportsDir = './reports'; // Путь к папке с отчетами

    try {
        const files = fs.readdirSync(reportsDir)
            .filter(file => path.extname(file) === '.csv' && file.startsWith('full')) // Фильтруем только CSV файлы, начинающиеся с 'full'
            .map(file => ({ name: file, time: fs.statSync(path.join(reportsDir, file)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time) // Сортировка по дате изменения (сначала новые)
            .slice(0, 2) // Берем последние 2 файла
            .map(file => path.join(reportsDir, file.name));

        if (files.length === 0) {
            await ctx.reply('В папке reports нет файлов для отправки.');
            return;
        }

        // Отправка каждого файла
        for (const file of files) {
            const inputFile = new InputFile(file);
            await ctx.replyWithDocument(inputFile, { caption: `Ваш файл со статистикой: ${path.basename(file)}` });
        }

    } catch (error) {
        console.error('Ошибка при отправке файлов:', error);
        await ctx.reply('Произошла ошибка при попытке отправить файлы. Пожалуйста, попробуйте позже.');
    }

    return; // Не считаем это сообщение как входящее
});
// Обработка нажатий на кнопки
