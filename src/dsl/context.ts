
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
    const parts = key.split('.');
    if (!this.variables.has(parts[0])) {
        return undefined;
    }

    let value = this.variables.get(parts[0]);

    for (let i = 1; i < parts.length; i++) {
        if (value && typeof value === 'object') {
            value = (value as Record<string, any>)[parts[i]];
        } else {
            return undefined;
        }
    }

    return value;
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

  /**
   * Get all variables as a plain object
   */
  getAllVariables(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.variables) {
      result[key] = value;
    }
    return result;
  }
}
