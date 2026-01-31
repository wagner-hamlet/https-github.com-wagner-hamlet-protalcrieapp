
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import EventCard from './components/EventCard.tsx';
import PartnerDirectory from './components/PartnerDirectory.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import { WorkshopEvent, ViewMode, CourseType, Partner, User } from './types.ts';
import { MOCK_EVENTS } from './constants.ts';
import { notificationService } from './services/notificationService.ts';
import { SheetService } from './services/sheetService.ts';
import { AuthService } from './services/authService.ts';

const COURSE_HEADER_INFO: Record<string, { title: string, subtitle: string }> = {
  SCHOOL: {
    title: "CRIE SCHOOL",
    subtitle: "Cristãos Empreendedores"
  },
  JUMPSTART: {
    title: "CRIE JUMP START",
    subtitle: "Seu caminho começa aqui"
  },
  EXPERIENCE: {
    title: "CRIE EXPERIENCE",
    subtitle: "O conhecimento te transforma"
  },
  PARTNERS: {
    title: "CRIE ECOSYSTEM",
    subtitle: "Empresas & Serviços"
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [events, setEvents] = useState<WorkshopEvent[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.HOME);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const session = AuthService.getSession();
    if (session) {
      setCurrentUser(session);
    }
    setIsInitialized(true);
    notificationService.requestPermission();
  }, []);

  const courseSubtitles = useMemo(() => {
    const getSub = (id: string, fallback: string) => {
      const cached = SheetService.getFromCache(`events_${id}`);
      return (cached && cached[0]?.subInicial) || fallback;
    };
    return {
      SCHOOL: getSub('SCHOOL', 'Um chamado para cristãos'),
      JUMPSTART: getSub('JUMPSTART', 'Aceleração de Negócios'),
      EXPERIENCE: getSub('EXPERIENCE', 'Imersão e Networking'),
      PARTNERS: 'Conectando Membros e Negócios'
    };
  }, [viewMode]);

  const selectCourse = (courseId: CourseType) => {
    setSelectedCourse(courseId);
    if (courseId === 'PARTNERS') {
      const cached = SheetService.getFromCache('partners');
      setPartners(cached || []);
      setViewMode(ViewMode.DIRECTORY);
    } else {
      const cached = SheetService.getFromCache(`events_${courseId}`);
      setEvents(cached || MOCK_EVENTS);
      setViewMode(ViewMode.DASHBOARD);
    }
    syncWithCloud(courseId);
  };

  const syncWithCloud = async (courseId: CourseType) => {
    setIsSyncing(true);
    try {
      if (courseId === 'PARTNERS') {
        const fresh = await SheetService.fetchPartners();
        setPartners(fresh);
        SheetService.saveToCache('partners', fresh);
      } else {
        const fresh = await SheetService.fetchEvents(courseId);
        if (fresh.length > 0) {
          setEvents(fresh);
          SheetService.saveToCache(`events_${courseId}`, fresh);
          notificationService.scheduleNotifications(fresh);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isInitialized) return null;
  if (!currentUser) return <AuthScreen onLoginSuccess={setCurrentUser} />;

  if (viewMode === ViewMode.HOME) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-700">
        <div className="text-center space-y-2">
          <div className="w-24 h-24 rounded-full border-2 border-gold flex items-center justify-center bg-black mx-auto mb-6 shadow-2xl relative">
            <span className="text-gold font-bold text-4xl font-brand">C*</span>
          </div>
          <h1 className="text-white font-brand text-4xl font-bold tracking-tight">CRIE Portal</h1>
          <p className="text-gold/80 text-[10px] uppercase tracking-[0.4em] font-bold">Bem-vindo, {currentUser.nome}</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          {[
            { id: 'SCHOOL', name: 'CRIE School', sub: courseSubtitles.SCHOOL, icon: '🚀', color: 'from-orange-500/20' },
            { id: 'JUMPSTART', name: 'CRIE Jump Start', sub: courseSubtitles.JUMPSTART, icon: '⚡', color: 'from-blue-500/20' },
            { id: 'EXPERIENCE', name: 'CRIE Experience', sub: courseSubtitles.EXPERIENCE, icon: '🌟', color: 'from-purple-500/20' },
            { id: 'PARTNERS', name: 'Empresas & Serviços', sub: courseSubtitles.PARTNERS, icon: '🤝', color: 'from-emerald-500/20' }
          ].map((c) => (
            <button key={c.id} onClick={() => selectCourse(c.id as CourseType)} className="w-full relative overflow-hidden bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-gold p-5 rounded-[1.8rem] transition-all text-left shadow-xl active:scale-95 group">
               <div className={`absolute inset-0 bg-gradient-to-r ${c.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
               <div className="flex items-center space-x-4 relative z-10">
                 <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-2xl">{c.icon}</div>
                 <div className="flex-1">
                   <h3 className="text-white font-brand font-bold text-lg">{c.name}</h3>
                   <p className="text-zinc-500 text-[9px] uppercase tracking-wider font-bold">{c.sub}</p>
                 </div>
               </div>
            </button>
          ))}
        </div>
        <button onClick={AuthService.logout} className="text-zinc-700 text-[9px] uppercase tracking-widest font-black">Sair da Conta</button>
      </div>
    );
  }

  const header = selectedCourse ? COURSE_HEADER_INFO[selectedCourse] : COURSE_HEADER_INFO.SCHOOL;

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col max-w-md mx-auto relative shadow-2xl">
      <Header title={header.title} subtitle={header.subtitle} />
      <main className="flex-1 overflow-y-auto px-6 pt-6">
        {viewMode === ViewMode.DIRECTORY ? (
          <PartnerDirectory partners={partners} onBack={() => setViewMode(ViewMode.HOME)} />
        ) : viewMode === ViewMode.DASHBOARD ? (
          <Dashboard events={events} onViewAll={() => setViewMode(ViewMode.SCHEDULE)} courseName={header.title} />
        ) : viewMode === ViewMode.SCHEDULE ? (
          <div className="space-y-6 pb-24">
            <h2 className="text-2xl font-brand font-bold text-white">Agenda • {header.title}</h2>
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-20">Página em construção</div>
        )}
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-800/50 p-6 pb-10 flex justify-around items-center z-50">
        <button onClick={() => setViewMode(selectedCourse === 'PARTNERS' ? ViewMode.DIRECTORY : ViewMode.DASHBOARD)} className="text-zinc-500 hover:text-gold"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></button>
        <button onClick={() => setViewMode(ViewMode.HOME)} className="text-zinc-500 hover:text-gold"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      </nav>
      {isSyncing && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div></div>}
    </div>
  );
};

export default App;
