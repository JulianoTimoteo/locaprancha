import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  updateDoc, 
  doc, 
  setDoc,
  deleteDoc,
  serverTimestamp,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { logAction } from '@/lib/audit';
import { normalizeUserProfile } from '@/lib/firestore/normalizers';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { auth as firebaseAuth, secondaryAuth } from '@/lib/firebase';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'usuarios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => normalizeUserProfile(doc.id, doc.data()));
      setUsuarios(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao assinar usuários:", error);
      setLoading(false);
    });
    return () => unsubscribe();
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

  const checkNicknameExists = async (nickname: string) => {
    const q = query(collection(db, 'usuarios'), where('nickname', '==', nickname.toLowerCase()));
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const createUsuario = async (data: { nome: string, nickname: string, email?: string, password?: string, perfil: UserRole, permissions?: string[] }) => {
    try {
      if (!profile) return null;

      const nickname = normalizarNickname(data.nickname);
      const nicknameExists = await checkNicknameExists(nickname);
      if (nicknameExists) {
        toast.error("Este nickname já está em uso.");
        return null;
      }

      const email = data.email?.trim() || `${nickname}@locaprancha.local`;
      const password = data.password || 'mudar123';
      
      // 1. Criar no Firebase Auth usando instância secundária (Instrução 12/13)
      // Isso permite criar o usuário sem deslogar o administrador atual.
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const authUser = userCredential.user;
      const uid = authUser.uid;

      // Desloga da instância secundária imediatamente
      await signOut(secondaryAuth);

      // 2. Criar Perfil no Firestore (ID = UID)
      const userDocRef = doc(db, 'usuarios', uid);
      const emailTipo = data.email?.trim() ? 'REAL' : 'FAKE';

      const newUser = {
        uid: uid,
        name: data.nome,
        nome: data.nome,
        nickname: nickname,
        email: email,
        emailTipo: emailTipo,
        role: data.perfil,
        status: 'ATIVO',
        permissions: data.permissions || [],
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        ultimoAcesso: null,
        perfil: data.perfil,
        access_level: data.perfil,
        nivelAcesso: data.perfil
      };

      await setDoc(userDocRef, newUser);
      await logAction(profile.uid, profile.nickname || profile.name, 'CREATE_USER', 'USUARIO', nickname, null, newUser);
      
      toast.success('Usuário criado com sucesso no Auth e Firestore.');
      return uid;
    } catch (e: any) {
      console.error(e);
      
      // Tratamento específico para e-mail já em uso (Instrução do Plano)
      if (e.code === 'auth/email-already-in-use') {
        toast.error('Este e-mail já está vinculado a uma conta no Firebase Auth. Use o mecanismo de Auto-Migração realizando o login com este e-mail.');
        
        // Log de erro de segurança/duplicação
        if (profile) {
          logAction(profile.uid, profile.nickname || profile.name, 'CREATE_USER_FAILED', 'USUARIO', data.email || data.nickname, null, { error: 'email-already-in-use' });
        }
      } else {
        toast.error('Erro ao criar usuário: ' + (e.message || 'Erro desconhecido'));
      }
      return null;
    }
  };

  const updateUsuario = async (uid: string, data: Partial<UserProfile>) => {
    try {
      if (!profile) return;
      const old = usuarios.find(u => u.uid === uid);
      if (!old) return;

      if (old.role === 'GOD' && profile.role !== 'GOD') {
        toast.error('Operação não permitida para este perfil.');
        return;
      }

      const updates: any = {
        ...data,
        atualizadoEm: serverTimestamp(),
        // Manter campos legados em sincronia
        perfil: data.role || data.perfil,
        access_level: data.role || data.access_level,
        nivelAcesso: data.role || data.nivelAcesso
      };

      // Se mudar nickname, normalizar e validar
      if (data.nickname && data.nickname !== old.nickname) {
        updates.nickname = normalizarNickname(data.nickname);
        const exists = await checkNicknameExists(updates.nickname);
        if (exists) {
          toast.error("Este nickname já está em uso.");
          return;
        }
      }

      await updateDoc(doc(db, 'usuarios', uid), updates);
      await logAction(profile.uid, profile.nickname || profile.name, 'UPDATE_USER', 'USUARIO', old.nickname, old, updates);
      toast.success('Usuário atualizado');
    } catch (e) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const updateRole = async (uid: string, role: UserRole) => {
    return updateUsuario(uid, { role } as any);
  };

  const updateStatus = async (uid: string, status: 'ATIVO' | 'BLOQUEADO') => {
    const action = status === 'ATIVO' ? 'UNBLOCK_USER' : 'BLOCK_USER';
    try {
      if (!profile) return;
      const old = usuarios.find(u => u.uid === uid);
      if (!old) return;

      if (old.role === 'GOD') {
        toast.error('Não é possível bloquear o perfil GOD.');
        return;
      }

      await updateDoc(doc(db, 'usuarios', uid), { status, atualizadoEm: serverTimestamp() });
      await logAction(profile.uid, profile.nickname || profile.name, action, 'USUARIO', old.nickname, old.status, status);
      toast.success(`Usuário ${status === 'ATIVO' ? 'desbloqueado' : 'bloqueado'}`);
    } catch (e) {
      toast.error('Erro ao alterar status');
    }
  };

  const deleteUsuario = async (uid: string) => {
    try {
      if (!profile) return;
      const old = usuarios.find(u => u.uid === uid);
      if (!old) return;

      if (old.role === 'GOD') {
        toast.error('Não é possível excluir o perfil GOD.');
        return;
      }

      // Verifica se tem histórico na agenda (simulação simplificada)
      const q = query(collection(db, 'agenda'), where('userId', '==', uid));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Exclusão lógica se houver histórico
        await updateStatus(uid, 'BLOQUEADO');
        toast.info('Usuário possui histórico e foi bloqueado permanentemente.');
      } else {
        await deleteDoc(doc(db, 'usuarios', uid));
        await logAction(profile.uid, profile.nickname || profile.name, 'DELETE_USER', 'USUARIO', old.nickname, old, null);
        toast.success('Usuário removido');
      }
    } catch (e) {
      toast.error('Erro ao remover usuário');
    }
  };

  return { usuarios, loading, createUsuario, updateUsuario, updateRole, updateStatus, deleteUsuario };
}
