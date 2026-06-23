import { Buffer as BufferPolyfill } from 'buffer';

// Ensure Buffer is available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = BufferPolyfill;
}

export class ESCPOSBuilder {
  private buffer: number[];
  private encoder: TextEncoder;

  // Commandes ESC/POS standard
  private static ESC = 0x1B;
  private static GS = 0x1D;
  private static LF = 0x0A;
  private static ALIGN_CENTER = [0x1B, 0x61, 0x01];
  private static ALIGN_LEFT = [0x1B, 0x61, 0x00];
  private static BOLD_ON = [0x1B, 0x45, 0x01];
  private static BOLD_OFF = [0x1B, 0x45, 0x00];
  private static DOUBLE_HEIGHT = [0x1B, 0x21, 0x10];
  private static NORMAL_SIZE = [0x1B, 0x21, 0x00];
  private static CUT_PAPER = [0x1D, 0x56, 0x41, 0x00];
  private static INIT = [0x1B, 0x40]; // Initialize printer

  constructor() {
    this.buffer = [];
    this.encoder = new TextEncoder();
    
    // Initialize printer
    this.buffer.push(...ESCPOSBuilder.INIT);
  }

  // Méthodes d'alignement
  alignCenter(): this {
    this.buffer.push(...ESCPOSBuilder.ALIGN_CENTER);
    return this;
  }

  alignLeft(): this {
    this.buffer.push(...ESCPOSBuilder.ALIGN_LEFT);
    return this;
  }

  // Styles de texte
  bold(): this {
    this.buffer.push(...ESCPOSBuilder.BOLD_ON);
    return this;
  }

  boldOff(): this {
    this.buffer.push(...ESCPOSBuilder.BOLD_OFF);
    return this;
  }

  doubleHeight(): this {
    this.buffer.push(...ESCPOSBuilder.DOUBLE_HEIGHT);
    return this;
  }

  normalSize(): this {
    this.buffer.push(...ESCPOSBuilder.NORMAL_SIZE);
    return this;
  }

  // Texte et sauts de ligne
  text(content: string): this {
    const bytes = this.encoder.encode(content);
    this.buffer.push(...bytes);
    return this;
  }

  newLine(): this {
    this.buffer.push(ESCPOSBuilder.LF);
    return this;
  }

  // Lignes de séparation
  separator(char: string = '-'): this {
    this.alignCenter()
      .text(char.repeat(32))
      .newLine();
    return this;
  }

  // QR Code
  qrcode(data: string): this {
    const qr = [
      ESCPOSBuilder.GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // Select QR model
      ESCPOSBuilder.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06,       // Set QR size
      ESCPOSBuilder.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31,       // Set error correction
    ];

    const bytes = this.encoder.encode(data);
    const length = bytes.length + 3;
    const pL = length % 256;
    const pH = Math.floor(length / 256);

    this.buffer.push(
      ...qr,
      ESCPOSBuilder.GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30,
      ...bytes,
      ESCPOSBuilder.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30
    );

    return this;
  }

  // Coupe du papier
  cut(): this {
    this.buffer.push(...ESCPOSBuilder.CUT_PAPER);
    return this;
  }

  // Génère le buffer final
  getBuffer(): Buffer {
    return BufferPolyfill.from(this.buffer);
  }
}

export class ESCPOSPrinter {
  private builder: ESCPOSBuilder;

  constructor() {
    this.builder = new ESCPOSBuilder();
  }

  // Méthode pour imprimer un ticket
  async printTicket(data: {
    ticketNumber: string;
    eventName: string;
    playerName: string;
    purchaseDate: string;
    ticketPrice: number;
    currency: string;
    selectedNumbers: number[];
    numbersToSelect: number;
    drawDate: string;
  }): Promise<Buffer> {
    console.log('Generating ESC/POS data for ticket:', data.ticketNumber);
    
    const builder = new ESCPOSBuilder();

    // En-tête
    builder
      .alignCenter()
      .doubleHeight()
      .bold()
      .text('BetSport Lotto')
      .newLine()
      .normalSize()
      .text(data.eventName)
      .newLine()
      .separator()
      .newLine();

    // Informations du ticket
    builder
      .alignLeft()
      .bold()
      .text(`N° ${data.ticketNumber}`)
      .newLine()
      .boldOff()
      .text(`Client: ${data.playerName}`)
      .newLine()
      .text(`Date: ${new Date(data.purchaseDate).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`)
      .newLine()
      .text(`Montant: ${new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: data.currency
      }).format(data.ticketPrice)}`)
      .newLine()
      .newLine();

    // Paramètres du jeu
    builder
      .text(`Nums à sélectionner: ${data.numbersToSelect}`)
      .newLine()
      .text(`Tirage: ${new Date(data.drawDate).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`)
      .newLine()
      .newLine();

    // Numéros sélectionnés
    builder
      .alignCenter()
      .text('Numéros joués:')
      .newLine()
      .text(data.selectedNumbers.join(' - '))
      .newLine()
      .newLine();

    // QR Code
    builder
      .alignCenter()
      .qrcode(JSON.stringify({
        ticketNumber: data.ticketNumber,
        selectedNumbers: data.selectedNumbers
      }))
      .newLine();

    // Pied de ticket
    builder
      .separator()
      .alignCenter()
      .text('*** Conservez ce ticket ***')
      .newLine()
      .text('Nécessaire pour les gains')
      .newLine()
      .text('www.betsport.com')
      .newLine()
      .newLine()
      .cut();

    const buffer = builder.getBuffer();
    console.log('ESC/POS data generated, size:', buffer.length, 'bytes');
    return buffer;
  }
}