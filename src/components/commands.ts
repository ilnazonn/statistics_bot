import { Keyboard, InputFile, Context, } from 'grammy';
import fs from "fs";
import path from "path";
import { dirname } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import { bot } from './createBot.js';
import {statisticsManager} from "./statisticsManager.js";
import {replyWithoutCounting} from "./saveCurrentStatistics.js";
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
// Создаем клавиатуру для вызова статистики
const keyboard = new Keyboard().text('📊 Статистика').text('📤 Общая статистика').text('🗳️ Статистика по сообщениям').resized();

// Получите разрешенные ID пользователей из переменных окружения
const allowedUsers = process.env.ALLOWED_USERS ? process.env.ALLOWED_USERS.split(',').map(id => parseInt(id.trim())) : [];

bot.command('start', async (ctx) => {
    const userId = ctx.from?.id;

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        if (ctx.chat?.type !== 'private') {
            return; // Игнорируем команду, если это не личный чат
        }
        await ctx.reply('Привет! Нажмите на кнопку, чтобы получить статистику.', {
            reply_markup: keyboard, // Убедитесь, что keyboard определен
        });
        console.log('Сообщение успешно отправлено разрешенному пользователю');
    } else {
        await ctx.reply('У вас нет доступа к этому боту.');
        console.log('Попытка доступа от неразрешенного пользователя');
    }
});
bot.hears('📊 Статистика', async (ctx) => {
    const userId = ctx.from?.id;

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        const dateTime = new Date().toLocaleString();
        await replyWithoutCounting(ctx, `Дата и время: ${dateTime}\n- Количество входящих сообщений: ${statisticsManager.getMessageCount()}\n- Количество исходящих сообщений: ${statisticsManager.getOutgoingMessageCount()}\n- Количество групповых сообщений: ${statisticsManager.getGroupMessageCount()}`);
        console.log('Сообщение статистики успешно отправлено разрешенному пользователю');
    } else {
        await ctx.reply('У вас нет доступа к этому боту.');
        console.log('Попытка доступа к статистике от неразрешенного пользователя');
    }
});

bot.on('callback_query', async (ctx) => {
    const userId = ctx.from?.id;
    const callbackData = ctx.callbackQuery.data;

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        if (callbackData === '📊 Статистика') {
            await ctx.answerCallbackQuery();
            // Обработка запроса на статистику может быть размещена здесь
            console.log('Обработка статистики для разрешенного пользователя');
            return;
        }
    } else {
        await ctx.answerCallbackQuery('У вас нет доступа к этому боту.');
        console.log('Попытка доступа к статистике от неразрешенного пользователя через callback');
    }
});

bot.hears('📤 Общая статистика', async (ctx) => {
    const userId = ctx.from?.id;
    const inputFile = new InputFile('reports/statistics.csv'); // Убедитесь, что путь к файлу правильный

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        try {
            // Отправляем файл вместе с текстовым уведомлением
            await ctx.replyWithDocument(inputFile, { caption: 'Ваш файл со статистикой' });
        } catch (error) {
            console.error('Ошибка при отправке файла:', error);
            await ctx.reply('Произошла ошибка при попытке отправить файл. Пожалуйста, попробуйте позже.');
        }
    } else {
        await ctx.reply('У вас нет доступа к этому боту.');
        console.log('Попытка доступа к общей статистике от неразрешенного пользователя');
    }

    return; // Не считаем это сообщение как входящее
});
bot.hears('/restart', async (ctx) => {
    const userId = ctx.from?.id;

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        exec('pm2 restart statistics_bot', (error: Error | null, _stdout: string, stderr: string) => {
            if (error) {
                ctx.reply(`Ошибка при перезапуске: ${stderr}`);
                console.error(`Ошибка при перезапуске: ${error.message}`);
            } else {
                ctx.reply('Процесс статистики успешно перезапущен.');
                console.log('Процесс статистики успешно перезапущен разрешенному пользователю');
            }
        });
    } else {
        await ctx.reply('У вас нет доступа к этому боту.');
        console.log('Попытка перезапуска от неразрешенного пользователя');
    }
});

bot.hears('🗳️ Статистика по сообщениям', async (ctx) => {
    const userId = ctx.from?.id;
    const reportsDir = './reports'; // Путь к папке с отчетами

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
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
    } else {
        await ctx.reply('У вас нет доступа к этому боту.');
        console.log('Попытка доступа к статистике по сообщениям от неразрешенного пользователя');
    }

    return; // Не считаем это сообщение как входящее
});
//Загрузка всех архивов:
bot.hears('/downloadallarchive', async (ctx) => {
    const userId = ctx.from?.id;
    const dirPath = 'reports'; // Путь к директории с файлами
    const files = fs.readdirSync(dirPath); // Читаем файлы из директории
    const gzFiles = files.filter(file => path.extname(file) === '.gz'); // Фильтруем файлы с расширением .gz

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        if (gzFiles.length === 0) {
            await ctx.reply('Нет доступных файлов с расширением .gz.');
            return;
        }

        try {
            for (const file of gzFiles) {
                const inputFile = new InputFile(path.join(dirPath, file)); // Путь к файлу
                await ctx.replyWithDocument(inputFile, { caption: `Ваш файл: ${file}` }); // Отправка файла
            }
        } catch (error) {
            console.error('Ошибка при отправке файла:', error);
            await ctx.reply('Произошла ошибка при попытке отправить файл. Пожалуйста, попробуйте позже.');
        }
    } else {
        await ctx.reply('У вас нет доступа к этому боту.');
        console.log('Попытка доступа к архивам от неразрешенного пользователя');
    }

    return; // Не считаем это сообщение как входящее
});
//Обновление env для добавления новых пользователей по команде.

// Определяем __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Переменная для хранения состояния ожидания ID пользователя и chatId
let waitingForUserId: boolean = false;
let targetChatId: number | null = null; // Идентификатор чата, где начался диалог
let timeoutId: NodeJS.Timeout | null = null; // Идентификатор таймера
// Функция для обработки команды "/add_user"
bot.hears('/add_user', async (ctx: Context) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    // Проверка, что userId определен и разрешен
    if (userId !== undefined && allowedUsers.includes(userId)) {
        waitingForUserId = true; // Устанавливаем флаг ожидания
        targetChatId = chatId ?? null; // Если chatId undefined, присваиваем null

        // Устанавливаем таймаут на 60 секунд
        if (timeoutId) {
            clearTimeout(timeoutId); // Сбрасываем предыдущий таймаут, если он был
        }

        timeoutId = setTimeout(async () => {
            if (waitingForUserId) {
                waitingForUserId = false;
                targetChatId = null;
                console.log('Таймаут: диалог сброшен.');
                await ctx.reply('Время ввода ID истекло. Пожалуйста, повторите команду /add_user.');
            }
        }, 60000); // 60 секунд

        await ctx.reply('Введите ID пользователя для добавления в env:');
    } else {
        await ctx.reply('У вас нет доступа к этой команде.');
        console.log('Попытка доступа к /add_user от неразрешенного пользователя');
    }
});


// Обработка текстовых сообщений
bot.on('message:text', async (ctx: Context, next) => {
    const messageText = ctx.message?.text;
    const chatId = ctx.chat?.id;

    // Проверяем, что сообщение пришло из того же чата, где начался диалог
    if (waitingForUserId && chatId !== undefined && chatId === targetChatId) {
        if (messageText && /^\d+$/.test(messageText)) {
            const userId = messageText;
            addUserToEnv(userId);
            await ctx.reply(`Пользователь с ID ${userId} добавлен в ALLOWED_USERS.`);

            // Сбрасываем состояние и таймаут
            waitingForUserId = false;
            targetChatId = null;
            if (timeoutId) {
                clearTimeout(timeoutId); // Отменяем таймаут
                timeoutId = null;
            }
        } else if (waitingForUserId) {
            await ctx.reply('Пожалуйста, введите корректный ID пользователя (только числа).');
        }
    }

    // Передаем управление следующему middleware
    await next();
});

// Функция для добавления пользователя в ALLOWED_USERS
function addUserToEnv(userId: string) {
    const envPath = path.join(__dirname, '../../.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    const updatedLines = lines.map(line => {
        if (line.startsWith('ALLOWED_USERS=')) {
            const currentUsers = line.split('=')[1].split(',');
            if (!currentUsers.includes(userId)) {
                currentUsers.push(userId);
            }
            return `ALLOWED_USERS=${currentUsers.join(',')}`; // Исправлена интерполяция
        }
        return line;
    });

    writeFileSync(envPath, updatedLines.join('\n'), 'utf-8');
}

