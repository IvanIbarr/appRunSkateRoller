// Polyfill para AsyncStorage en web usando localStorage
const storage: {[key: string]: string} = {};

export default {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item:', error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  },
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      return [];
    }
  },
};



