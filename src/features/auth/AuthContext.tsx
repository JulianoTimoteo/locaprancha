import { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  query,
  collection,
  where,
  limit,
  getDocs,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { UserProfile } from "@/types";
import { normalizeUserProfile } from "@/lib/firestore/normalizers";
import { persistence } from "@/lib/firestore/persistence";

// Tentar habilitar persistência nativa do Firestore
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("[FIRESTORE] Persistência falhou: multiplas abas abertas.");
    } else if (err.code === "unimplemented") {
      console.warn("[FIRESTORE] Persistência não suportada pelo navegador.");
    }
  });
} catch (e) {
  // ignore
}

export type AuthStatus =
  | "LOADING"
  | "AUTH_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "PROFILE_BLOCKED"
  | "PROFILE_INACTIVE"
  | "PROFILE_OK";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  authLoading: boolean;
  profileLoading: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  status: "LOADING",
  authLoading: true,
  profileLoading: false,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("LOADING");

  // Recuperar perfil do cache IMEDIATAMENTE no render inicial se existir
  useState(() => {
    const cachedProfile = persistence.get<UserProfile>("profile");
    if (cachedProfile) {
      setProfile(cachedProfile);
    }
  });

  // Sincronizar status quando o profile for carregado do cache ou da rede
  useEffect(() => {
    if (profile) {
      if (profile.status === "BLOQUEADO") {
        setStatus("PROFILE_BLOCKED");
      } else if (profile.status === "INATIVO") {
        setStatus("PROFILE_INACTIVE");
      } else {
        setStatus("PROFILE_OK");
      }
    }
  }, [profile]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setAuthLoading(false);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (user) {
        setProfileLoading(true);
        setStatus("LOADING");

        // REGRA ABSOLUTA DE IDENTIDADE (Instrução 1)
        // O documento deve ter como ID o Firebase Auth UID.
        const userDocRef = doc(db, "usuarios", user.uid);

        unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const profileData = normalizeUserProfile(docSnapshot.id, docSnapshot.data());
              setProfile(profileData);

              // Persistir perfil localmente
              persistence.save("profile", profileData);

              if (profileData.status === "BLOQUEADO") {
                setStatus("PROFILE_BLOCKED");
              } else if (profileData.status === "INATIVO") {
                setStatus("PROFILE_INACTIVE");
              } else {
                setStatus("PROFILE_OK");
              }

              setProfileLoading(false);
            } else {
              // Perfil não encontrado: Não fazemos busca por e-mail aqui.
              // A busca por e-mail (auto-migração) deve ocorrer apenas no LoginPage.
              console.warn(`[AUTH] Perfil operacional usuarios/${user.uid} não encontrado.`);
              setProfile(null);
              setStatus("PROFILE_NOT_FOUND");
              setProfileLoading(false);
            }
          },
          (error) => {
            console.error("[AUTH] Erro ao carregar perfil:", error);
            setStatus("PROFILE_NOT_FOUND");
            setProfileLoading(false);
          },
        );
      } else {
        setProfile(null);
        setStatus("AUTH_NOT_FOUND");
        setProfileLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const loading = authLoading || (profileLoading && status === "LOADING");

  return (
    <AuthContext.Provider value={{ user, profile, status, authLoading, profileLoading, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
