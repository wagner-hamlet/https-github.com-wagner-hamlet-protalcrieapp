
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
  const [regOptions, setRegOptions] = useState<RegistrationOptions | null>(null);
  
  const [formData, setFormData] = useState({
    nome: "", sobrenome: "", email: "", senha: "",
    ddd: "", celular: "", cidade: "", estado: "",
    crie_participa: "", como_participa: "",
    empresa: "", segmento: "", porte: "", estagio: "",
    colaboradores: "", tempo: "", interesses: "", temas: "", preferencia: ""
  });

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const validateStep = () => {
    if (step === 1) {
      // Campos obrigatórios: nome, sobrenome, email, senha, ddd, celular, cidade, estado
      return formData.nome && formData.sobrenome && formData.email && formData.senha && 
             formData.ddd && formData.celular.length >= 9 && 
             formData.cidade && formData.estado;
    }
    if (step === 2) {
      // Campos obrigatórios: crie_participa, como_participa, porte, tempo
      return formData.crie_participa && formData.como_participa && 
             formData.porte && formData.tempo;
    }
    if (step === 3) {
      // Campos obrigatórios: temas
      return formData.temas;
    }
    return true;
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
        setError("Erro na conexão com o servidor.");
      } finally {
        setLoading(false);
      }
    } else {
      if (step < 3) {
        handleNext();
      } else {
        setLoading(true);
        setError("");
        try {
          const res = await AuthService.signup(formData);
          if (res.success) {
            setIsLogin(true);
            setStep(1);
            setError("Sucesso! Faça seu login para acessar.");
            // Limpa form após sucesso
            setFormData({
              nome: "", sobrenome: "", email: "", senha: "",
              ddd: "", celular: "", cidade: "", estado: "",
              crie_participa: "", como_participa: "",
              empresa: "", segmento: "", porte: "", estagio: "",
              colaboradores: "", tempo: "", interesses: "", temas: "", preferencia: ""
            });
          } else {
            setError(res.message || "Erro ao realizar cadastro.");
          }
        } catch (err) {
          setError("Falha na comunicação com a planilha.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const inputStyle = "w-full bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-gold transition-all appearance-none";
  const labelStyle = "text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1 mb-1 block";

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-4">
        <div className="w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center bg-black mx-auto shadow-[0_0_30px_rgba(197,160,115,0.2)]">
          <span className="text-gold font-bold text-3xl font-brand">C*</span>
        </div>
        <div>
          <h1 className="text-white font-brand text-3xl font-bold tracking-tight">CRIE Portal</h1>
          <p className="text-gold/80 text-[10px] uppercase tracking-[0.4em] font-bold">
            {isLogin ? "Área do Membro" : `Cadastro • Etapa ${step} de 3`}
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-lg bg-zinc-900/40 border border-zinc-800 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isLogin ? (
            /* LOGIN VIEW */
            <div className="space-y-5 animate-in fade-in duration-500">
              <div>
                <label className={labelStyle}>E-mail de Acesso</label>
                <input required type="email" placeholder="seu@email.com" className={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className={labelStyle}>Senha</label>
                <input required type="password" placeholder="••••••••" className={inputStyle} value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            </div>
          ) : (
            /* SIGNUP VIEW (MULTI-STEP) */
            <div className="animate-in slide-in-from-right duration-300">
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-1">
                    <label className={labelStyle}>Nome *</label>
                    <input required className={inputStyle} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelStyle}>Sobrenome *</label>
                    <input required className={inputStyle} value={formData.sobrenome} onChange={e => setFormData({...formData, sobrenome: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>E-mail *</label>
                    <input required type="email" className={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelStyle}>Senha *</label>
                    <input required type="password" className={inputStyle} value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <div>
                      <label className={labelStyle}>DDD *</label>
                      <input required maxLength={2} placeholder="11" className={inputStyle} value={formData.ddd} onChange={e => setFormData({...formData, ddd: e.target.value.replace(/\D/g, '')})} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelStyle}>Celular *</label>
                      <input required maxLength={9} placeholder="999999999" className={inputStyle} value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value.replace(/\D/g, '')})} />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Cidade *</label>
                    <select required className={inputStyle} value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})}>
                      <option value="">Selecione...</option>
                      {regOptions?.cidades.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Estado *</label>
                    <select required className={inputStyle} value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}>
                      <option value="">Selecione...</option>
                      {regOptions?.estados.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Participação no CRIE *</label>
                    <select required className={inputStyle} value={formData.crie_participa} onChange={e => setFormData({...formData, crie_participa: e.target.value})}>
                      <option value="">Em qual você participa?</option>
                      {regOptions?.series.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Vínculo com o ecossistema *</label>
                    <select required className={inputStyle} value={formData.como_participa} onChange={e => setFormData({...formData, como_participa: e.target.value})}>
                      <option value="">Você participa como?</option>
                      {regOptions?.perfis.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Nome da Empresa / Organização</label>
                    <input className={inputStyle} value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelStyle}>Segmento de Atuação</label>
                    <input className={inputStyle} value={formData.segmento} onChange={e => setFormData({...formData, segmento: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Porte *</label>
                      <select required className={inputStyle} value={formData.porte} onChange={e => setFormData({...formData, porte: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.portes.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Tempo (anos) *</label>
                      <select required className={inputStyle} value={formData.tempo} onChange={e => setFormData({...formData, tempo: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.tempos.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Estágio Atual</label>
                      <select className={inputStyle} value={formData.estagio} onChange={e => setFormData({...formData, estagio: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.estagios.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Colaboradores</label>
                      <select className={inputStyle} value={formData.colaboradores} onChange={e => setFormData({...formData, colaboradores: e.target.value})}>
                        <option value="">Selecione...</option>
                        {regOptions?.colaboradores.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Temas de Interesse *</label>
                    <select required className={inputStyle} value={formData.temas} onChange={e => setFormData({...formData, temas: e.target.value})}>
                      <option value="">Quais conteúdos deseja receber?</option>
                      {regOptions?.temas.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Preferência de Comunicação</label>
                    <select className={inputStyle} value={formData.preferencia} onChange={e => setFormData({...formData, preferencia: e.target.value})}>
                      <option value="">Como prefere ser contatado?</option>
                      {regOptions?.preferencias.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Interesses no CRIE (Opcional)</label>
                    <textarea 
                      placeholder="Networking, mentorias, parcerias..." 
                      className={`${inputStyle} h-32 resize-none pt-4`} 
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
              <p className="text-[10px] text-center font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            {!isLogin && step > 1 && (
              <button 
                type="button" 
                onClick={handleBack} 
                className="flex-1 bg-zinc-800 text-white font-bold py-5 rounded-2xl border border-zinc-700 uppercase text-[10px] tracking-widest active:scale-95 transition-all"
              >
                Voltar
              </button>
            )}
            
            <button
              disabled={loading || (!isLogin && !validateStep())}
              type="submit"
              className={`flex-[2] ${validateStep() || isLogin ? 'bg-gold' : 'bg-zinc-800 text-zinc-500'} text-black font-bold py-5 rounded-2xl transition-all shadow-lg shadow-gold/10 active:scale-95 flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <span className="text-[10px] uppercase tracking-widest">
                  {isLogin ? "Entrar na Conta" : (step < 3 ? "Próximo Passo" : "Concluir Cadastro")}
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setStep(1); setError(""); }}
            className="text-[11px] text-zinc-500 uppercase tracking-widest hover:text-gold transition-colors font-bold"
          >
            {isLogin ? "Não é membro? Cadastre-se aqui" : "Já é membro? Voltar ao Login"}
          </button>
        </div>
      </div>

      <p className="mt-8 text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-black">CRIE Portal • V4.3</p>
    </div>
  );
};

export default AuthScreen;
