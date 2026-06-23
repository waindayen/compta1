/**
 * Service centralisé pour gérer toutes les dates en UTC+1
 * Toutes les fonctions de date de l'application doivent utiliser ce service
 */
export class DateService {
  private static readonly UTC_OFFSET = 1;
  private static readonly MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

  /**
   * Obtient la date/heure actuelle en UTC+1
   */
  static now(): Date {
    const utcNow = new Date();
    const utc1 = new Date(utcNow.getTime() + this.UTC_OFFSET * this.MILLISECONDS_PER_HOUR);
    return utc1;
  }

  /**
   * Convertit une date en UTC+1
   */
  static toUTC1(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : date;
    const utc1 = new Date(d.getTime() + this.UTC_OFFSET * this.MILLISECONDS_PER_HOUR);
    return utc1;
  }

  /**
   * Crée une date en UTC+1 à partir de composants
   */
  static create(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): Date {
    const d = new Date(Date.UTC(year, month, day, hours - this.UTC_OFFSET, minutes, seconds));
    return d;
  }

  /**
   * Parse une chaîne de date en UTC+1
   */
  static parse(dateString: string): Date {
    const d = new Date(dateString);
    return d;
  }

  /**
   * Convertit une date en ISO string (stockage dans Firebase)
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Obtient l'heure actuelle en ISO string pour Firebase
   */
  static nowISO(): string {
    return this.now().toISOString();
  }

  /**
   * Formate une date pour les inputs datetime-local (UTC+1)
   */
  static toInputFormat(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Parse une date depuis un input datetime-local (UTC+1)
   */
  static fromInputFormat(inputValue: string): Date {
    const [datePart, timePart] = inputValue.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    return this.create(year, month - 1, day, hours, minutes);
  }

  /**
   * Ajoute des jours à une date (UTC+1)
   */
  static addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getTime() + days * 24 * this.MILLISECONDS_PER_HOUR);
  }

  /**
   * Ajoute des heures à une date (UTC+1)
   */
  static addHours(date: Date | string, hours: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getTime() + hours * this.MILLISECONDS_PER_HOUR);
  }

  /**
   * Ajoute des minutes à une date (UTC+1)
   */
  static addMinutes(date: Date | string, minutes: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    return new Date(d.getTime() + minutes * 60 * 1000);
  }

  /**
   * Ajoute des semaines à une date (UTC+1)
   */
  static addWeeks(date: Date | string, weeks: number): Date {
    return this.addDays(date, weeks * 7);
  }

  /**
   * Ajoute des mois à une date (UTC+1)
   */
  static addMonths(date: Date | string, months: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    const result = new Date(d);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Ajoute des années à une date (UTC+1)
   */
  static addYears(date: Date | string, years: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    const result = new Date(d);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  /**
   * Vérifie si une date est dans le futur
   */
  static isInFuture(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > this.now();
  }

  /**
   * Vérifie si une date est dans le passé
   */
  static isInPast(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < this.now();
  }

  /**
   * Vérifie si deux dates sont le même jour
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Formate une date pour l'affichage (UTC+1)
   */
  static format(date: Date | string, format: 'short' | 'long' | 'time' | 'datetime' = 'datetime'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Paris',
    };

    switch (format) {
      case 'short':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        break;
      case 'long':
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }

    return new Intl.DateTimeFormat('fr-FR', options).format(d);
  }

  /**
   * Calcule la différence en millisecondes entre deux dates
   */
  static diff(date1: Date | string, date2: Date | string): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return d1.getTime() - d2.getTime();
  }

  /**
   * Calcule la différence en minutes entre deux dates
   */
  static diffInMinutes(date1: Date | string, date2: Date | string): number {
    return Math.floor(this.diff(date1, date2) / (1000 * 60));
  }

  /**
   * Calcule la différence en heures entre deux dates
   */
  static diffInHours(date1: Date | string, date2: Date | string): number {
    return Math.floor(this.diff(date1, date2) / (1000 * 60 * 60));
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  static diffInDays(date1: Date | string, date2: Date | string): number {
    return Math.floor(this.diff(date1, date2) / (1000 * 60 * 60 * 24));
  }

  /**
   * Début de la journée en UTC+1
   */
  static startOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Fin de la journée en UTC+1
   */
  static endOfDay(date: Date | string): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
