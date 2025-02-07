// statisticsManager.ts
import fs from 'fs';
const filePath = 'statistics.json';
class StatisticsManager {
    constructor() {
        this.messageCount = 0;
        this.outgoingMessageCount = 0;
        this.groupMessageCount = 0;
        this.lastDate = '';
        this.loadState();
    }
    // Геттеры
    getMessageCount() {
        return this.messageCount;
    }
    getOutgoingMessageCount() {
        return this.outgoingMessageCount;
    }
    getGroupMessageCount() {
        return this.groupMessageCount;
    }
    getLastDate() {
        return this.lastDate;
    }
    // Сеттеры
    setMessageCount(count) {
        this.messageCount = count;
    }
    setOutgoingMessageCount(count) {
        this.outgoingMessageCount = count;
    }
    setGroupMessageCount(count) {
        this.groupMessageCount = count;
    }
    setLastDate(date) {
        this.lastDate = date;
    }
    // Методы для увеличения счетчиков
    incrementMessageCount() {
        this.messageCount++;
        this.saveState();
    }
    incrementOutgoingMessageCount() {
        this.outgoingMessageCount++;
        this.saveState();
    }
    incrementGroupMessageCount() {
        this.groupMessageCount++;
        this.saveState();
    }
    // Загрузка состояния из файла
    loadState() {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            const state = JSON.parse(data);
            this.messageCount = state.messageCount || 0;
            this.outgoingMessageCount = state.outgoingMessageCount || 0;
            this.groupMessageCount = state.groupMessageCount || 0;
            this.lastDate = state.lastDate || '';
        }
        else {
            this.saveState();
        }
    }
    // Сохранение состояния в файл
    saveState() {
        const state = {
            messageCount: this.messageCount,
            outgoingMessageCount: this.outgoingMessageCount,
            groupMessageCount: this.groupMessageCount,
            lastDate: this.lastDate
        };
        fs.writeFileSync(filePath, JSON.stringify(state), 'utf-8');
    }
}
export const statisticsManager = new StatisticsManager();
