// statisticsManager.ts
import fs from 'fs';

const filePath = 'statistics.json';

class StatisticsManager {
    private messageCount: number = 0;
    private outgoingMessageCount: number = 0;
    private groupMessageCount: number = 0;
    private lastDate: string = '';

    constructor() {
        this.loadState();
    }

    // Геттеры
    public getMessageCount(): number {
        return this.messageCount;
    }

    public getOutgoingMessageCount(): number {
        return this.outgoingMessageCount;
    }

    public getGroupMessageCount(): number {
        return this.groupMessageCount;
    }

    public getLastDate(): string {
        return this.lastDate;
    }

    // Сеттеры
    public setMessageCount(count: number): void {
        this.messageCount = count;
    }

    public setOutgoingMessageCount(count: number): void {
        this.outgoingMessageCount = count;
    }

    public setGroupMessageCount(count: number): void {
        this.groupMessageCount = count;
    }

    public setLastDate(date: string): void {
        this.lastDate = date;
    }

    // Методы для увеличения счетчиков
    public incrementMessageCount(): void {
        this.messageCount++;
        this.saveState();
    }

    public incrementOutgoingMessageCount(): void {
        this.outgoingMessageCount++;
        this.saveState();
    }

    public incrementGroupMessageCount(): void {
        this.groupMessageCount++;
        this.saveState();
    }

    // Загрузка состояния из файла
    public loadState(): void {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            if (data.trim()) { // Проверяем, что файл не пустой
                const state = JSON.parse(data);
                this.messageCount = state.messageCount || 0; // Исправлено присваивание
                this.outgoingMessageCount = state.outgoingMessageCount || 0; // Исправлено присваивание
                this.groupMessageCount = state.groupMessageCount || 0; // Исправлено присваивание
                this.lastDate = state.lastDate || ''; // Исправлено присваивание
            } else {
                this.saveState(); // Если файл пустой, инициализируем его
            }
        } else {
            this.saveState(); // Если файл не существует, инициализируем его
        } // Закрывающая фигурная скобка для loadState
    }

// Сохранение состояния в файл
    public saveState(): void {
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