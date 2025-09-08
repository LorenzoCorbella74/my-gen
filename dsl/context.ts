// Execution Context
// This file will manage variables and state.

export class Context {
  private variables: Map<string, any> = new Map();

  constructor(initialVariables?: Record<string, any>) {
    if (initialVariables) {
      for (const [key, value] of Object.entries(initialVariables)) {
        this.set(key, value);
      }
    }
  }

  set(key: string, value: any) {
    this.variables.set(key, value);
  }

  get(key: string): any {
    if (!this.variables.has(key)) {
      throw new Error(`Variable "${key}" not found.`);
    }
    return this.variables.get(key);
  }

  interpolate(text: string): string {
    return text.replace(/\{(\w+)\}/g, (_, key) => {
      const value = this.get(key);
      if (value === undefined) {
        return `{${key}}`;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
  }
}
