
import { User, RegistrationOptions } from "../types";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5-wVj95xj12ctLi7GSyKVqKaevSStmIPFuEBTWwBxns9OlIVgK8eoLnWVksJ6RanqEQ/exec";
// GID 445119039 confirmado via print do usuário
const OPTIONS_SHEET_URL = "https://docs.google.com/spreadsheets/d/12T-SOGYQ7CVTpo6RRwDeXEgifwT7Xk3fz7dFxyd0HHc/export?format=csv&gid=445119039";

export class AuthService {
  static async getOptions(): Promise<{ success: boolean; options?: RegistrationOptions; message?: string }> {
    try {
      // 1. Busca opções estáticas do Apps Script
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getOptions`);
      const data = await response.json();
      
      // 2. Sincronização Dinâmica com a Planilha (Página 2)
      const csvResponse = await fetch(`${OPTIONS_SHEET_URL}&t=${Date.now()}`);
      const csvText = await csvResponse.text();
      const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
      
      if (lines.length < 2) throw new Error("Planilha vazia ou inacessível.");

      const segmentos: string[] = [];
      const estagios: string[] = [];
      const colaboradores: string[] = [];

      // Identificação dinâmica das colunas pelo cabeçalho (Linha 0)
      const headerCols = this.splitCSVLine(lines[0]);
      
      // Procuramos os índices baseados no texto do cabeçalho
      const findIdx = (texts: string[]) => 
        headerCols.findIndex(col => texts.some(t => col.toLowerCase().includes(t.toLowerCase())));

      const idxSeg = findIdx(["segmento de atuação", "segmento de atuacao", "segmento"]);
      const idxEst = findIdx(["estagio", "estágio"]);
      const idxCol = findIdx(["colaboradores"]);

      // Processamento das linhas de dados
      lines.slice(1).forEach(line => {
        const cols = this.splitCSVLine(line);
        
        // Captura Segmento (Coluna M ou similar)
        if (idxSeg !== -1 && cols[idxSeg]) {
          const val = cols[idxSeg].trim();
          // Evita capturar apenas números (caso da coluna L do print)
          if (val && isNaN(Number(val))) {
            segmentos.push(val);
          } else if (val && idxSeg + 1 < cols.length && isNaN(Number(cols[idxSeg + 1]))) {
            // Backup: se a coluna detectada for número, tenta a próxima (provável M)
            segmentos.push(cols[idxSeg + 1].trim());
          }
        }
        
        // Captura Estágio (Coluna F ou similar)
        if (idxEst !== -1 && cols[idxEst]) {
          const val = cols[idxEst].trim();
          if (val) estagios.push(val);
        }

        // Captura Colaboradores (Coluna G ou similar)
        if (idxCol !== -1 && cols[idxCol]) {
          const val = cols[idxCol].trim();
          if (val) colaboradores.push(val);
        }
      });

      if (data.success && data.options) {
        return {
          success: true,
          options: {
            ...data.options,
            // Limpeza e ordenação dos dados capturados
            segmentos: Array.from(new Set(segmentos)).filter(s => s.length > 1).sort(),
            estagios: estagios.length > 0 ? Array.from(new Set(estagios)).sort() : data.options.estagios,
            colaboradores: colaboradores.length > 0 ? Array.from(new Set(colaboradores)).sort() : data.options.colaboradores
          }
        };
      }
      return data;
    } catch (error) {
      console.error("Auth Options Sync Error:", error);
      return { success: false, message: "Erro de sincronização com a planilha." };
    }
  }

  private static splitCSVLine(line: string): string[] {
    // Detecta delimitador brasileiro (;) ou americano (,)
    const semicolonCount = (line.match(/;/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    const delimiter = semicolonCount >= commaCount ? ';' : ',';

    const result: string[] = [];
    let curVal = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(curVal.trim().replace(/^"|"$/g, ''));
        curVal = "";
      } else {
        curVal += char;
      }
    }
    result.push(curVal.trim().replace(/^"|"$/g, ''));
    return result;
  }

  static async login(email: string, senha: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const params = new URLSearchParams({ action: "login", email: email.trim(), senha });
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
      return await response.json();
    } catch (error) {
      return { success: false, message: "Erro de conexão." };
    }
  }

  static async signup(userData: any): Promise<{ success: boolean; message?: string }> {
    try {
      const params = new URLSearchParams({ ...userData, action: "signup" });
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
      return await response.json();
    } catch (error) {
      return { success: false, message: "Erro ao realizar cadastro." };
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
