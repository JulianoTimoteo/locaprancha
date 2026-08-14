import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";

export type TransportStatus = "Pendente" | "Em Trânsito" | "Concluído" | "Cancelado";
export type Priority = "Baixa" | "Média" | "Alta" | "Urgente";

export interface TransportRequest {
  id?: string;
  equipment: string;
  origin: string;
  destination: string;
  trailerType: string;
  priority: Priority;
  requester: string;
  status: TransportStatus;
  createdAt: any;
  updatedAt: any;
}

export function useTransportRequests() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe;

    try {
      const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as TransportRequest[];
          setRequests(data);
          setLoading(false);
          setIsOffline(false);
          // Sync to localStorage
          localStorage.setItem("locaprancha_requests", JSON.stringify(data));
        },
        (error) => {
          console.error("Firestore error:", error);
          setIsOffline(true);
          loadFromLocal();
        },
      );
    } catch (e) {
      console.error("Connection error:", e);
      setIsOffline(true);
      loadFromLocal();
    }

    return () => unsubscribe?.();
  }, []);

  const loadFromLocal = () => {
    const saved = localStorage.getItem("locaprancha_requests");
    if (saved) {
      setRequests(JSON.parse(saved));
    }
    setLoading(false);
  };

  const addRequest = async (
    request: Omit<TransportRequest, "id" | "createdAt" | "updatedAt" | "status">,
  ) => {
    const newRequest = {
      ...request,
      status: "Pendente" as TransportStatus,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    if (isOffline) {
      const offlineRequests = [...requests, { ...newRequest, id: Date.now().toString() }];
      setRequests(offlineRequests as TransportRequest[]);
      localStorage.setItem("locaprancha_requests", JSON.stringify(offlineRequests));
      return;
    }

    await addDoc(collection(db, "requests"), newRequest);
  };

  const updateStatus = async (requestId: string, status: TransportStatus) => {
    if (isOffline) {
      const updated = requests.map((r) =>
        r.id === requestId ? { ...r, status, updatedAt: new Date() } : r,
      );
      setRequests(updated);
      localStorage.setItem("locaprancha_requests", JSON.stringify(updated));
      return;
    }

    const requestRef = doc(db, "requests", requestId);
    await updateDoc(requestRef, { status, updatedAt: Timestamp.now() });
  };

  return { requests, isOffline, loading, addRequest, updateStatus };
}
