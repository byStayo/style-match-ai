import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export interface UserData {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: string;
  isAnonymous?: boolean;
  preferences: Record<string, any>;
  uploads: string[];
  favorites: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch additional user data from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
};