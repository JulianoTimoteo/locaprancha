import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { AuthLoader } from '@/components/auth/AuthLoader';
import { autoMigrateProfile } from '@/lib/firestore/migration';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let targetEmail = email;

      // 1. Resolver Nickname para E-mail (Mecanismo de Conveniência)
      if (!email.includes('@')) {
        const q = query(collection(db, 'usuarios'), where('nickname', '==', email.toLowerCase()), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          toast.error('Usuário ou senha inválidos.');
          setLoading(false);
          return;
        }
        
        const firstDoc = snap.docs[0];
        const userData = firstDoc ? firstDoc.data() : null;
        targetEmail = userData ? userData['email'] as string : '';
      }

      // 2. Autenticação no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      const user = userCredential.user;
      
      // 3. Auto-Migração / Auto-Vínculo (Instrução: Criar automaticamente)
      // Se o perfil existir com ID antigo mas mesmo email, ele é migrado para usuarios/{UID}
      await autoMigrateProfile(user);
      
      // 4. Registro de Último Acesso (Respeitando a Regra de Identidade usuarios/{UID})
      const userDocRef = doc(db, 'usuarios', user.uid);
      await setDoc(userDocRef, { 
        ultimoAcesso: serverTimestamp(),
        uid: user.uid,
        email: user.email
      }, { merge: true });
      
      toast.success('Bem-vindo ao Locaprancha!');
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error('Usuário ou senha inválidos.');
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let targetEmail = email;

      if (!email.includes('@')) {
        const q = query(collection(db, 'usuarios'), where('nickname', '==', email.toLowerCase()), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          toast.error('Usuário não encontrado.');
          setLoading(false);
          return;
        }
        
        const firstDocReset = snap.docs[0];
        const userDataReset = firstDocReset ? firstDocReset.data() : null;
        targetEmail = userDataReset ? userDataReset['email'] as string : '';
      }

      await sendPasswordResetEmail(auth, targetEmail);
      toast.success('E-mail de recuperação enviado para o endereço cadastrado!');
      setIsReset(false);
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {loading && <AuthLoader message={isReset ? 'Enviando...' : 'Iniciando...'} />}
      
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-lg text-center space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-4 overflow-hidden transition-all duration-500 hover:scale-105">
            <img 
              src="https://usinapitangueiras.com.br/wp-content/uploads/2020/04/usina-pitangueiras-logo.png" 
              alt="Logo Usina Pitangueiras"
              className="w-full h-full object-contain p-2"
            />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter sm:text-7xl">
              <span className="text-white">LOCA</span>
              <span className="text-[#40800c]">PRANCHA</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 font-medium">
              Gestão inteligente e controle em tempo real para transporte de máquinas e equipamentos.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold">
              Eficiência Total
            </div>
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold">
              Controle Real
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="lg:hidden absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:hidden flex flex-col items-center space-y-4 mb-8">
            <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-lg p-3 overflow-hidden border border-primary/10">
              <img 
                src="https://usinapitangueiras.com.br/wp-content/uploads/2020/04/usina-pitangueiras-logo.png" 
                alt="Logo Usina Pitangueiras"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-4xl font-black tracking-tight">
              <span className="text-black dark:text-white">LOCA</span>
              <span className="text-[#40800c]">PRANCHA</span>
            </h2>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">
              {isReset ? 'Recuperar Senha' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-muted-foreground font-medium">
              {isReset 
                ? 'Enviaremos um link de recuperação para seu e-mail.' 
                : 'Insira suas credenciais para gerenciar sua frota.'}
            </p>
          </div>

          <form onSubmit={isReset ? handleReset : handleLogin} className="space-y-6">
            <fieldset disabled={loading} className="space-y-6 border-none p-0 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">
                    E-mail corporativo
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail size={18} />
                    </div>
                    <Input 
                      type="text" 
                      placeholder="E-mail ou Nickname" 
                      className="pl-10 h-12 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all"
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {!isReset && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-semibold text-foreground/80">
                        Senha
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setIsReset(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-3 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all"
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all" 
              >
                {isReset ? 'Enviar Recuperação' : 'Acessar Sistema'}
              </Button>

              {isReset && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full h-12 font-bold" 
                  onClick={() => setIsReset(false)}
                >
                  Voltar para o login
                </Button>
              )}
            </fieldset>
          </form>

          <div className="pt-8 text-center border-t border-muted">
            <p className="text-xs text-muted-foreground">
              © 2026 Locaprancha. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
