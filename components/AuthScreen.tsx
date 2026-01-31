
import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { User, RegistrationOptions } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [regOptions, setRegOptions] = useState<RegistrationOptions | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "", sobrenome: "", email: "", senha: "",
    ddd: "", celular: "", cidade: "", estado: "",
    crie_participa: "", como_participa: "",
    empresa: "", segmento: "", porte: "", estagio: "",
    colaboradores: "", tempo: "", interesses: "", preferencia: ""
  });

  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  useEffect(() => {
    if (!isLogin && !regOptions) {
      loadOptions();
    }
  }, [isLogin]);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const res = await AuthService.getOptions();
      if (res.success && res.options) {
        setRegOptions(res.options);
      }
    } catch (e) {
      console.error("Erro ao carregar opções:", e);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      const rawCel = formData.celular.replace(/\D/g, '');
      return (
        formData.nome.trim() !== "" && 
        formData.sobrenome.trim() !== "" && 
        formData.email.trim() !== "" && 
        formData.senha.trim() !== "" && 
        formData.ddd.trim() !== "" && 
        rawCel.length >= 9 && 
        formData.cidade.trim() !== "" && 
        formData.estado.trim() !== ""
      );
    }
    if (step === 2) {
      return (
        formData.crie_participa.trim() !== "" && 
        formData.como_participa.trim() !== "" && 
        formData.empresa.trim() !== "" &&
        formData.segmento.trim() !== "" && 
        formData.porte.trim() !== "" && 
        formData.tempo.trim() !== "" &&
        formData.estagio.trim() !== "" && 
        formData.colaboradores.trim() !== ""
      );
    }
    if (step === 3) {
      return lgpdAccepted;
    }
    return true;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedNext(true);
    
    const rawCel = formData.celular.replace(/\D/g, '');
    if (step === 1 && rawCel.length > 0 && rawCel.length < 9) {
      setError("O número do celular deve ter no mínimo 9 dígitos.");
      return;
    }

    if (validateStep()) {
      if (step < 3) {
        setStep(s => s + 1);
        setAttemptedNext(false);
        setError("");
      } else {
        handleSignup();
      }
    } else {
      setError("Por favor, preencha todos os campos obrigatórios em vermelho.");
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...formData, preferencia: lgpdAccepted ? "Aceito" : "Não Aceito" };
      const res = await AuthService.signup(payload);
      if (res.success) {
        setIsLogin(true);
        setStep(1);
        setError("Sucesso! Cadastro realizado. Faça o login.");
      } else {
        setError(res.message || "Erro ao realizar cadastro.");
      }
    } catch (err) {
      setError("Erro na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      setLoading(true);
      setError("");
      try {
        const res = await AuthService.login(formData.email, formData.senha);
        if (res.success && res.user) {
          AuthService.saveSession(res.user);
          onLoginSuccess(res.user);
        } else {
          setError(res.message || "E-mail ou senha incorretos.");
        }
      } catch (err) {
        setError("Erro na conexão.");
      } finally {
        setLoading(false);
      }
    } else {
      handleNext(e);
    }
  };

  const getFieldClass = (value: string, minLength = 1) => {
    const rawValue = typeof value === 'string' ? value.trim() : "";
    let isInvalid = attemptedNext && rawValue.length < minLength;
    
    if (attemptedNext && value === formData.celular) {
      const rawCel = value.replace(/\D/g, '');
      if (rawCel.length < 9) isInvalid = true;
    }

    const base = "w-full bg-black border rounded-2xl py-4 px-6 text-sm text-white focus:outline-none transition-all appearance-none";
    if (isInvalid) {
      return `${base} border-rose-500 ring-1 ring-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]`;
    }
    return `${base} border-zinc-800 focus:border-gold`;
  };

  const labelStyle = "text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1 mb-1 block";

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 sm:p-8">
      <div className="text-center mb-8 space-y-4">
        <div className="w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center bg-black mx-auto shadow-2xl">
          <span className="text-gold font-bold text-3xl font-brand">C*</span>
        </div>
        <div>
          <h1 className="text-white font-brand text-3xl font-bold tracking-tight">CRIE Portal</h1>
          <p className="text-gold/80 text-[10px] uppercase tracking-[0.4em] font-bold">
            {isLogin ? "Acesso ao Portal" : `Novo Membro • Etapa ${step} de 3`}
          </p>
        </div>
      </div>

      <div className="w-full max-w-lg bg-zinc-900/40 border border-zinc-800 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isLogin ? (
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>E-mail</label>
                <input required type="email" className={getFieldClass(formData.email)} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Senha</label>
                <input required type="password" className={getFieldClass(formData.senha)} value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right duration-300">
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Nome *</label>
                    <input className={getFieldClass(formData.nome)} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelStyle}>Sobrenome *</label>
                    <input className={getFieldClass(formData.sobrenome)} value={formData.sobrenome} onChange={e => setFormData({...formData, sobrenome: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>E-mail *</label>
                    <input type="email" className={getFieldClass(formData.email)} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>Crie uma Senha *</label>
                    <input type="password" className={getFieldClass(formData.senha)} value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div>
                      <label className={labelStyle}>DDD *</label>
                      <input maxLength={2} className={getFieldClass(formData.ddd)} value={formData.ddd} onChange={e => setFormData({...formData, ddd: e.target.value.replace(/\D/g, '')})} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelStyle}>Celular (Mín 9 dgt) *</label>
                      <input maxLength={11} className={getFieldClass(formData.celular)} value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value.replace(/\D/g, '')})} />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Cidade *</label>
                    <select className={getFieldClass(formData.cidade)} value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})}>
                      <option value="">Selecione...</option>
                      {regOptions?.cidades.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Estado *</label>
                    <select className={getFieldClass(formData.estado)} value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                      <option value="">Selecione...</option>
                      {regOptions?.estados.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Em qual CRIE você está participando? *</label>
                    <select className={getFieldClass(formData.crie_participa)} value={formData.crie_participa} onChange={e => setFormData({...formData, crie_participa: e.target.value})}>
                      <option value="">Selecione a série...</option>
                      {regOptions?.series.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Perfil de Membro *</label>
                    <select className={getFieldClass(formData.como_participa)} value={formData.como_participa} onChange={e => setFormData({...formData, como_participa: e.target.value})}>
                      <option value="">Selecione...</option>
                      {regOptions?.perfis.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className={labelStyle}>Nome da Empresa / Organização *</label>
                    <input className={getFieldClass(formData.empresa)} value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                  </div>

                  <div>
                    <label className={labelStyle}>Segmento de Atuação *</label>
                    <select className={getFieldClass(formData.segmento)} value={formData.segmento} onChange={e => setFormData({...formData, segmento: e.target.value})}>
                      <option value="">Selecione...</option>
                      {loading ? (
                        <option disabled>Sincronizando com a planilha...</option>
                      ) : regOptions?.segmentos && regOptions.segmentos.length > 0 ? (
                        regOptions.segmentos.map(o => <option key={o} value={o}>{o}</option>)
                      ) : (
                        <option disabled>Nenhum segmento encontrado na planilha</option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Porte da Empresa *</label>
                      <select className={getFieldClass(formData.porte)} value={formData.porte} onChange={e => setFormData({...formData, porte: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.portes.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Tempo de Atuação *</label>
                      <select className={getFieldClass(formData.tempo)} value={formData.tempo} onChange={e => setFormData({...formData, tempo: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.tempos.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Estágio Atual *</label>
                      <select className={getFieldClass(formData.estagio)} value={formData.estagio} onChange={e => setFormData({...formData, estagio: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.estagios?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Colaboradores *</label>
                      <select className={getFieldClass(formData.colaboradores)} value={formData.colaboradores} onChange={e => setFormData({...formData, colaboradores: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.colaboradores?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                   <div className={`p-6 rounded-2xl border transition-all ${attemptedNext && !lgpdAccepted ? 'border-rose-500 bg-rose-500/5' : 'border-zinc-800 bg-black/40'}`}>
                    <label className="flex items-start space-x-4 cursor-pointer">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          checked={lgpdAccepted} 
                          onChange={e => setLgpdAccepted(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-gold focus:ring-gold"
                        />
                      </div>
                      <span className="text-[11px] text-zinc-400 leading-relaxed">
                        Autorizo o <strong>CRIE</strong> a armazenar e utilizar meus dados para envio de conteúdos, convites, notícias e comunicações institucionais, conforme a Lei Geral de Proteção de Dados (LGPD).
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className={labelStyle}>Objetivos no ecossistema (Opcional)</label>
                    <textarea 
                      placeholder="Fale um pouco sobre seus interesses..." 
                      className={`${getFieldClass(formData.interesses)} h-32 resize-none pt-4`} 
                      value={formData.interesses} 
                      onChange={e => setFormData({...formData, interesses: e.target.value})} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-2xl border ${error.includes('Sucesso') ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
              <p className="text-[10px] text-center font-bold uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            {!isLogin && step > 1 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setAttemptedNext(false); setError(""); }} className="flex-1 bg-zinc-800 text-white font-bold py-5 rounded-2xl border border-zinc-700 uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                Voltar
              </button>
            )}
            <button
              disabled={loading}
              type="submit"
              className="flex-[2] bg-gold text-black font-bold py-5 rounded-2xl shadow-lg active:scale-95 flex items-center justify-center transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <span className="text-[10px] uppercase tracking-widest font-black">
                  {isLogin ? "Acessar Portal" : (step < 3 ? "Avançar" : "Concluir Cadastro")}
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setStep(1); setAttemptedNext(false); setError(""); }} className="text-[11px] text-zinc-500 uppercase tracking-widest hover:text-gold transition-colors font-bold">
            {isLogin ? "Ainda não é membro? Crie sua conta" : "Já possui conta? Faça o Login"}
          </button>
        </div>
      </div>
      <p className="mt-8 text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-black">CRIE Portal • V5.7 • LGPD COMPLIANT</p>
    </div>
  );
};

export default AuthScreen;
