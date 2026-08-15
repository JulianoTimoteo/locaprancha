import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { AuthLoader } from "@/components/auth/AuthLoader";
import { autoMigrateProfile } from "@/lib/firestore/migration";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [keepConnected, setKeepConnected] = useState(true);

  // Carregar e-mail lembrado se existir
  useEffect(() => {
    const savedEmail = localStorage.getItem("locaprancha_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const normalizarNickname = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, ".")
      .replace(/\.+/g, ".")
      .replace(/(^\.|\.$)/g, "");
  };

  const resolverNicknameParaEmail = async (valor: string): Promise<string> => {
    const normalizedNickname = normalizarNickname(valor);
    const q = query(
      collection(db, "usuarios"),
      where("nickname", "==", normalizedNickname),
      limit(1),
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userData = snap.docs[0].data();
      const emailEncontrado = (userData["email"] as string) || "";
      if (emailEncontrado) {
        console.warn(
          "[LOGIN] Nickname resolvido (exato):",
          normalizedNickname,
          "->",
          emailEncontrado,
        );
        return emailEncontrado;
      }
    }

    const snapLoose = await getDocs(
      query(
        collection(db, "usuarios"),
        where("nickname", ">=", normalizedNickname),
        where("nickname", "<=", normalizedNickname + "\uf8ff"),
        limit(5),
      ),
    );

    for (const doc of snapLoose.docs) {
      const data = doc.data();
      if (normalizarNickname((data["nickname"] as string) || "") === normalizedNickname) {
        const emailEncontrado = (data["email"] as string) || "";
        if (emailEncontrado) {
          console.warn(
            "[LOGIN] Nickname resolvido (fallback):",
            normalizedNickname,
            "->",
            emailEncontrado,
          );
          return emailEncontrado;
        }
      }
    }

    console.warn("[LOGIN] Nickname não encontrado:", normalizedNickname, "valor digitado:", valor);
    return "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let targetEmail = email;

      if (!email.includes("@")) {
        targetEmail = await resolverNicknameParaEmail(email);
        if (!targetEmail) {
          toast.error("Usuário ou senha inválidos.");
          setLoading(false);
          return;
        }
      }

      // Configurar Persistência
      await setPersistence(
        auth,
        keepConnected ? browserLocalPersistence : browserSessionPersistence,
      );

      // Lembrar e-mail
      if (rememberMe) {
        localStorage.setItem("locaprancha_remembered_email", email);
      } else {
        localStorage.removeItem("locaprancha_remembered_email");
      }

      // 2. Autenticação no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      const user = userCredential.user;

      // 3. Auto-Migração / Auto-Vínculo (Instrução: Criar automaticamente)
      // Se o perfil existir com ID antigo mas mesmo email, ele é migrado para usuarios/{UID}
      try {
        await autoMigrateProfile(user);

        const userDocRef = doc(db, "usuarios", user.uid);
        await setDoc(
          userDocRef,
          {
            ultimoAcesso: serverTimestamp(),
            uid: user.uid,
            email: user.email,
          },
          { merge: true },
        );
      } catch (firestoreError) {
        console.error("Erro ao atualizar dados do usuário:", firestoreError);
      }

      toast.success("Bem-vindo ao Locaprancha!");
      setLoading(false);
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error("Usuário ou senha inválidos.");
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let targetEmail = email;

      if (!email.includes("@")) {
        targetEmail = await resolverNicknameParaEmail(email);
        if (!targetEmail) {
          toast.error("Usuário não encontrado.");
          setLoading(false);
          return;
        }
      }

      await sendPasswordResetEmail(auth, targetEmail);
      toast.success("E-mail de recuperação enviado para o endereço cadastrado!");
      setIsReset(false);
      setLoading(false);
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {loading && <AuthLoader message={isReset ? "Enviando..." : "Iniciando..."} />}

      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto text-center flex flex-col items-center animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="w-full max-w-[320px] sm:max-w-[400px] mb-6 transition-all duration-500 hover:scale-105">
            <img
              src={import.meta.env.BASE_URL + "logo-pitangueiras.png"}
              alt="Logo Usina Pitangueiras"
              className="w-full h-auto object-contain filter drop-shadow-2xl"
            />
          </div>
          <div className="space-y-4">
            <h1 className="font-black tracking-tighter select-none text-center">
              <span className="text-white text-3xl sm:text-4xl md:text-5xl">LOCA</span>
              <span className="text-[#40800c] text-3xl sm:text-4xl md:text-5xl">PRANCHA</span>
            </h1>

            <p className="text-lg sm:text-2xl text-primary-foreground/90 font-bold max-w-[320px] sm:max-w-none pt-4">
              Gestão inteligente e controle em tempo real para transporte de máquinas e
              equipamentos.
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
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-full max-w-[240px] mb-4">
              <img
                src={import.meta.env.BASE_URL + "logo-pitangueiras.png"}
                alt="Logo Usina Pitangueiras"
                className="w-full h-auto object-contain"
              />
            </div>
            <h1 className="flex flex-col items-center font-black tracking-tight leading-[0.85] select-none">
              <span className="text-black dark:text-white text-6xl">LOCA</span>
              <span className="text-[#40800c] text-6xl">PRANCHA</span>
            </h1>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">
              {isReset ? "Recuperar Senha" : "Bem-vindo de volta"}
            </h2>
            <p className="text-muted-foreground font-medium">
              {isReset
                ? "Enviaremos um link de recuperação para seu e-mail."
                : "Insira suas credenciais para gerenciar sua frota."}
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
                      <label className="text-sm font-semibold text-foreground/80">Senha</label>
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
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isReset && (
                <div className="flex flex-col gap-3 ml-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs font-bold text-foreground/70 cursor-pointer select-none"
                    >
                      Lembrar meu usuário
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keepConnected"
                      checked={keepConnected}
                      onCheckedChange={(checked) => setKeepConnected(checked as boolean)}
                      className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="keepConnected"
                      className="text-xs font-bold text-foreground/70 cursor-pointer select-none"
                    >
                      Manter-me conectado
                    </label>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
              >
                {isReset ? "Enviar Recuperação" : "Acessar Sistema"}
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
