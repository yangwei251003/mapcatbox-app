'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cloudEnabled } from '@/lib/runtime-config';
import { CAT_BREEDS, CAT_EYES } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

const steps = [
  { id: 'breed', title: '选择品种', subtitle: '你的猫咪是什么品种？' },
  { id: 'color', title: '选择毛色', subtitle: '选一个喜欢的颜色吧' },
  { id: 'eyes', title: '选择眼睛', subtitle: '给它一双独特的眼睛' },
  { id: 'name', title: '起个名字', subtitle: '给你的猫取个好听的名字' },
];

export default function AuthPage() {
  const router = useRouter();
  const { signUp, signIn, isGuest, user } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'register' | 'create-cat'>('login');
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [catName, setCatName] = useState('');
  const [selectedBreed, setSelectedBreed] = useState(CAT_BREEDS[0]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedEye, setSelectedEye] = useState(CAT_EYES[0].id);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cloudEnabled && user && !isGuest) {
      router.push('/map');
    }
  }, [user, isGuest, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/map');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('请输入用户名'); return; }
    setLoading(true);
    setMode('create-cat');
    setStep(0);
    setLoading(false);
  };

  const completeRegistration = async () => {
    setError('');
    setLoading(true);
    const result = await signUp(email, password, username, {
      cat_name: catName || '小咪',
      cat_breed: selectedBreed.name,
      cat_color: selectedBreed.colors[selectedColor].id,
      cat_eyes: selectedEye,
      cat_accessory: null,
      bio: '',
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push('/map');
  };

  // Login form
  if (!cloudEnabled) return <section className="min-h-[70dvh] flex flex-col items-center justify-center px-6 gap-4 text-center"><span className="text-6xl">🐱</span><h1 className="text-2xl font-bold">离线合成用户</h1><p>公开演示不接收邮箱、账号或密码。猫咪与个人介绍均为合成样例，保存在此浏览器的新演示存储键。</p><button className="bg-orange-400 text-white rounded-xl px-6 py-3" onClick={()=>router.push('/map')}>进入合成地图</button></section>;
  if (mode === 'login') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="text-6xl mb-4 animate-cat-bounce">🐱</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">地图猫箱</h1>
          <p className="text-sm text-[var(--color-text-sub)] mb-8">在地图上发现猫咪，开启温暖社交</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] 
                         bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] 
                         bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium
                         hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50
                         shadow-sm text-sm"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setMode('register')}
              className="w-full py-3 rounded-xl border border-[var(--color-border)] bg-white
                         text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors text-sm"
            >
              没有账号？注册
            </button>
            <button
              onClick={() => router.push('/map')}
              className="w-full py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-sub)]"
            >
              先逛逛，不登录
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Register form (step 1: account info)
  if (mode === 'register') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="text-5xl mb-4">✍️</div>
          <h1 className="text-xl font-bold text-[var(--color-text)] mb-1">创建账号</h1>
          <p className="text-sm text-[var(--color-text-sub)] mb-8">然后领养你的第一只猫咪</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] 
                         bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] 
                         bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
            <input
              type="password"
              placeholder="密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] 
                         bg-white text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium
                         hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50
                         shadow-sm text-sm flex items-center justify-center gap-2"
            >
              下一步：创建猫咪 <ArrowRight size={16} />
            </button>
          </form>

          <button
            onClick={() => setMode('login')}
            className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-sub)]"
          >
            已有账号？登录
          </button>
        </motion.div>
      </div>
    );
  }

  // Create cat flow
  const currentStep = steps[step];
  const breedColors = selectedBreed.colors;
  const color = breedColors[selectedColor];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-bg)]">
      {/* Step indicator */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="p-2 rounded-xl hover:bg-white/50">
              <ChevronLeft size={20} className="text-[var(--color-text)]" />
            </button>
          )}
          <div className="flex-1" />
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-[var(--color-primary)] w-8' : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text)]">{currentStep.title}</h2>
        <p className="text-sm text-[var(--color-text-sub)] mt-1">{currentStep.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="breed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-2 gap-3">
              {CAT_BREEDS.map((breed) => (
                <button
                  key={breed.id}
                  onClick={() => { setSelectedBreed(breed); setSelectedColor(0); }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedBreed.id === breed.id
                      ? 'border-[var(--color-primary)] bg-orange-50/50'
                      : 'border-[var(--color-border)] bg-white hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  <span className="text-2xl">{breed.emoji}</span>
                  <p className="text-sm font-medium text-[var(--color-text)] mt-1">{breed.name}</p>
                  <p className="text-[10px] text-[var(--color-text-sub)] mt-0.5">{breed.description}</p>
                </button>
              ))}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="color" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Preview */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-sm border-2 border-[var(--color-border)]"
                  style={{ background: `linear-gradient(135deg, ${color.hex} 0%, ${color.secondary_hex} 100%)` }}
                >
                  🐱
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {breedColors.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(i)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedColor === i
                        ? 'border-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-white hover:border-[var(--color-text-muted)]'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-1 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${c.hex} 0%, ${c.secondary_hex} 100%)` }}
                    />
                    <p className="text-xs font-medium text-[var(--color-text)]">{c.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="eyes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              {CAT_EYES.map((eye) => (
                <button
                  key={eye.id}
                  onClick={() => setSelectedEye(eye.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    selectedEye === eye.id
                      ? 'border-[var(--color-primary)] bg-orange-50/50'
                      : 'border-[var(--color-border)] bg-white hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    eye.id === 'heterochromia' ? 'bg-gradient-to-r from-yellow-300 to-blue-400' : 
                    eye.id.includes('yellow') ? 'bg-yellow-300' : 
                    eye.id.includes('green') ? 'bg-green-300' : 
                    eye.id.includes('blue') ? 'bg-blue-300' : 'bg-amber-200'
                  }`}>
                    👁️
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{eye.name}</p>
                    <p className="text-[10px] text-[var(--color-text-sub)]">{eye.description}</p>
                  </div>
                  <Sparkles size={14} className={`ml-auto ${selectedEye === eye.id ? 'text-[var(--color-primary)]' : 'text-transparent'}`} />
                </button>
              ))}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <div className="text-7xl mb-6 animate-cat-bounce">🐱</div>
              <input
                type="text"
                placeholder="给你的猫起个名字吧"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                maxLength={10}
                autoFocus
                className="w-full px-4 py-4 rounded-xl border-2 border-[var(--color-border)]
                           bg-white text-center text-lg text-[var(--color-text)]
                           placeholder:text-[var(--color-text-muted)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                           focus:border-[var(--color-primary)]"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">不填就叫「小咪」哦</p>
              
              {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
              
              <button
                onClick={completeRegistration}
                disabled={loading}
                className="w-full mt-6 py-4 rounded-xl bg-[var(--color-primary)] text-white font-medium
                           hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50
                           shadow-sm text-base flex items-center justify-center gap-2"
              >
                {loading ? '创建中...' : '完成创建 🎉'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom buttons */}
      {step < steps.length - 1 && (
        <div className="p-6">
          <button
            onClick={() => setStep(step + 1)}
            className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium
                       hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm text-sm
                       flex items-center justify-center gap-2"
          >
            继续 <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
