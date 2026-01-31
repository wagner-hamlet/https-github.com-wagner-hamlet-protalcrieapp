
import { User, RegistrationOptions } from "../types";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5-wVj95xj12ctLi7GSyKVqKaevSStmIPFuEBTWwBxns9OlIVgK8eoLnWVksJ6RanqEQ/exec";

export class AuthService {
  static async getOptions(): Promise<{ success: boolean; options?: RegistrationOptions; message?: string }> {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getOptions`, {
        method: "GET",
        mode: "cors",
        redirect: "follow"
      });
      if (!response.ok) throw new Error("Erro ao carregar opções.");
      return await response.json();
    } catch (error) {
      console.error("Auth Options Error:", error);
      return { success: false, message: "Erro ao carregar lista de cidades e campos." };
    }
  }

  static async login(email: string, senha: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const params = new URLSearchParams({ action: "login", email: email.trim(), senha });
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
        mode: "cors",
        redirect: "follow"
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: "Erro de conexão." };
    }
  }

  static async signup(userData: any): Promise<{ success: boolean; message?: string }> {
    try {
      const params = new URLSearchParams({ ...userData, action: "signup" });
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: "GET",
        mode: "cors",
        redirect: "follow"
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: "Erro ao cadastrar." };
    }
  }

  static saveSession(user: User) {
    localStorage.setItem("crie_user_session", JSON.stringify(user));
  }

  static getSession(): User | null {
    const session = localStorage.getItem("crie_user_session");
    try { return session ? JSON.parse(session) : null; } catch { return null; }
  }

  static logout() {
    localStorage.removeItem("crie_user_session");
    const keys = Object.keys(localStorage);
    keys.forEach(key => { if (key.startsWith('crie_')) localStorage.removeItem(key); });
    window.location.reload();
  }
}
