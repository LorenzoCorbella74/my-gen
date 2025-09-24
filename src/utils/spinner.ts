import chalk from "chalk";

export class SimpleSpinner {
  private interval?: NodeJS.Timeout;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  start(): SimpleSpinner {
    process.stdout.write('\x1B[?25l'); // Hide cursor
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.text}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
    return this;
  }

  succeed(text?: string): void {
    this.stop();
    process.stdout.write(`\r${chalk.green('✓')} ${text || this.text}\n`);
  }

  fail(text?: string): void {
    this.stop();
    process.stdout.write(`\r${chalk.red('✗')} ${text || this.text}\n`);
  }

  private stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    process.stdout.write('\x1B[?25h'); // Show cursor
    process.stdout.write('\r\x1B[K'); // Clear line
  }
}