import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Check, Delete, ArrowRight } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
  storedPin: string;
}

export default function PinLockScreen({ onUnlock, storedPin }: PinLockScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Handle keyboard entry for physical keyboard users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin === storedPin) {
        // Correct PIN entered! Wait a tiny bit for a delightful transition
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else if (newPin.length === 4) {
        // Wrong 4-digit PIN
        setTimeout(() => {
          setError(true);
          setShake(true);
          // Vibrate if mobile device support is present
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          setTimeout(() => setShake(false), 500);
          setPin(''); // Clear PIN
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white p-6 select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className={`w-full max-w-sm flex flex-col items-center space-y-8 relative z-10 ${shake ? 'animate-shake' : ''}`}>
        {/* Animated Icon & Greeting */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-lg shadow-indigo-500/10 animate-bounce-slow">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-2xl tracking-tight text-white">
              Aplicativo Bloqueado
            </h2>
            <p className="text-sm text-slate-400">
              Digite seu PIN de 4 dígitos para acessar o ParcelaCard.
            </p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isActive = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 border-rose-500 scale-110 shadow-lg shadow-rose-500/20'
                    : isActive
                    ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-lg shadow-indigo-500/30'
                    : 'bg-transparent border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        <div className="h-4 text-center">
          {error && (
            <span className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1 animate-fade-in">
              <ShieldAlert className="w-3.5 h-3.5" />
              PIN incorreto. Tente novamente!
            </span>
          )}
        </div>

        {/* Virtual Keypad Grid */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitPress(digit)}
              className="aspect-square flex items-center justify-center text-2xl font-bold bg-slate-900 hover:bg-slate-800 active:bg-indigo-950/40 active:text-indigo-400 border border-slate-800 hover:border-slate-700 rounded-full transition-all duration-150 transform active:scale-95 shadow-md cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            onClick={handleDelete}
            className="aspect-square flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-full transition-all cursor-pointer"
            title="Apagar"
          >
            <Delete className="w-6 h-6" />
          </button>

          {/* 0 Button */}
          <button
            onClick={() => handleDigitPress('0')}
            className="aspect-square flex items-center justify-center text-2xl font-bold bg-slate-900 hover:bg-slate-800 active:bg-indigo-950/40 active:text-indigo-400 border border-slate-800 hover:border-slate-700 rounded-full transition-all duration-150 transform active:scale-95 shadow-md cursor-pointer"
          >
            0
          </button>

          {/* Clear helper */}
          <button
            onClick={() => {
              setPin('');
              setError(false);
            }}
            className="aspect-square flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white rounded-full transition-all cursor-pointer"
          >
            Limpar
          </button>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Suas finanças protegidas localmente.
        </p>
      </div>
    </div>
  );
}
