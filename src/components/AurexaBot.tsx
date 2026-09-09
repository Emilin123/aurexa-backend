import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  HelpCircle, 
  Gift, 
  CreditCard, 
  Clock, 
  Pickaxe, 
  Trophy, 
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { AurexaLogo } from './AurexaLogo';
import { soundFx } from '../utils/audio';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const INITIAL_GREETING: Message = {
  id: 'msg-welcome',
  sender: 'bot',
  text: '🏰 **¡Bienvenido a AurexaBot!**\nSoy el guía inteligente del Reino. Estoy aquí para resolver todas tus dudas sobre:\n\n• **Regalo de bienvenida:** 10 Diamantes gratis (valor 50 CUP) al registrarte por primera vez.\n• **Pagos y compras:** Pagos por Transfermóvil y EnZona en CUP (1 Diamante = 5 CUP).\n• **Pedidos y entregas:** Plazos de 30 min a 5 horas dentro del horario oficial (8 AM a 10 PM).\n• **Empezar a Minar:** Cómo cosechar diamantes a tu billetera.\n• **Carta Ganadora del Día:** Sorteo de 1,000 CUP a las 5:00 PM.\n• **Retiros a tarjeta:** Mínimo 10 diamantes directo a CUP.\n\n¿En qué te puedo ayudar hoy?',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTED_TOPICS = [
  {
    icon: Gift,
    label: 'Regalo de 50 CUP por Registro',
    query: '¿Cómo obtengo mi regalo de 50 CUP / diamantes gratis por registrarme por primera vez?',
  },
  {
    icon: CreditCard,
    label: 'Pagos y Compras en CUP',
    query: '¿Cómo funcionan los pagos y compras de diamantes por Transfermóvil y EnZona?',
  },
  {
    icon: Clock,
    label: 'Tiempos de Pedidos y Horarios',
    query: '¿Cuánto tardan los pedidos y cuáles son los horarios de atención?',
  },
  {
    icon: Pickaxe,
    label: 'Cómo Empezar a Minar',
    query: '¿Cómo empiezo a minar y dónde se acumulan mis diamantes?',
  },
  {
    icon: Trophy,
    label: 'Carta Ganadora del Día (1,000 CUP)',
    query: '¿Cómo participo en el sorteo de la Carta Ganadora del Día?',
  },
  {
    icon: Wallet,
    label: 'Retiros a Tarjeta Bancaria',
    query: '¿Cómo retiro mis ganancias a mi tarjeta en CUP y cuáles son las comisiones?',
  },
];

interface AurexaBotProps {
  onNavigate?: (view: any) => void;
}

export const AurexaBot: React.FC<AurexaBotProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('aurexa_bot_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [INITIAL_GREETING];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('aurexa_bot_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    soundFx.playGemDing();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con el asistente.');
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'He recibido tu consulta. Por favor indícame si deseas más detalles.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      soundFx.playPortalChime();
    } catch (err: any) {
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: '⚠️ No se pudo procesar tu consulta en este instante. Recuerda que los pagos se realizan por Transfermóvil/EnZona (8 AM a 10 PM), el regalo de registro es de 10 Diamantes (50 CUP) y el sorteo de la Carta Ganadora es a las 5:00 PM.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_GREETING]);
    localStorage.removeItem('aurexa_bot_history');
    soundFx.playGemDing();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Guía y Ayuda Oficial</span>
          </div>
          <h1 className="font-gothic text-3xl sm:text-4xl font-bold text-white tracking-wide flex items-center gap-3">
            <span>AurexaBot</span>
            <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
              En Línea 24/7
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400">
            Tu asistente interno para aclarar pagos, pedidos, regalos por registro, minería y la carta ganadora.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="self-start sm:self-auto py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Reiniciar conversación"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reiniciar Chat</span>
        </button>
      </header>

      {/* Suggested Quick Question Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Preguntas frecuentes con respuesta inmediata:</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SUGGESTED_TOPICS.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <button
                key={i}
                onClick={() => sendMessage(topic.query)}
                disabled={loading}
                className="p-2.5 text-left rounded-xl bg-[#120f18] hover:bg-[#1c1626] border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-200 text-xs transition-all flex items-center justify-between gap-2 group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-medium truncate">{topic.label}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-stone-500 group-hover:text-amber-400 shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-[#0b0912] border border-stone-800/90 rounded-2xl p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4 shadow-xl flex flex-col">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
              msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
            }`}
          >
            {msg.sender === 'bot' ? (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-purple-800 p-0.5 shrink-0 flex items-center justify-center shadow-md">
                <AurexaLogo size="xs" withGlow={false} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 shrink-0 flex items-center justify-center text-xs font-bold font-mono">
                TÚ
              </div>
            )}

            <div
              className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-1 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 font-medium rounded-tr-none'
                  : 'bg-[#15111f] border border-stone-800 text-stone-200 rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 mb-1">
                <span className="font-bold uppercase tracking-wider">
                  {msg.sender === 'user' ? 'Tú' : 'AurexaBot'}
                </span>
                <span>{msg.time}</span>
              </div>
              <div className="leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-stone-800 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="rounded-2xl p-3 bg-[#15111f] border border-stone-800 text-amber-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>AurexaBot está formulando la respuesta...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputQuery);
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-[#100d17] border border-stone-800 focus-within:border-amber-500/60 shadow-lg"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Escribe tu consulta sobre pagos, pedidos, minería o regalos..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>Preguntar</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
