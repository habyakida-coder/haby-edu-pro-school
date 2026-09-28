import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserAccount, UserRole } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userAccount: UserAccount | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserAccount: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  switchSchool: (schoolId: string) => Promise<void>;
}

export const ADMIN_EMAIL = 'admin@haby.com';
export const ADMIN_PASSWORD = 'Haby123456';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    // Check if demo user was saved in session
    const savedDemo = sessionStorage.getItem('haby_demo_user');
    if (savedDemo) {
      try {
        return JSON.parse(savedDemo);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchOrCreateUserAccount = async (fbUser: FirebaseUser) => {
    const normEmail = fbUser.email?.toLowerCase() || '';
    const isAdmin = normEmail === ADMIN_EMAIL || normEmail === 'habibuakida@gmail.com';
    const isSuperAdmin = isAdmin || normEmail === 'habibuakida@gmail.com';

    try {
      // 1. Check users doc by UID first
      const userRef = doc(db, 'users', fbUser.uid);
      let userDoc = await getDoc(userRef);

      // 2. If not found by UID, check if user exists by email
      if (!userDoc.exists() && normEmail) {
        const usersByEmail = await getDocs(query(collection(db, 'users'), where('email', '==', normEmail)));
        if (!usersByEmail.empty) {
          userDoc = usersByEmail.docs[0];
        }
      }

      if (userDoc.exists()) {
        const data = userDoc.data();
        const resolvedSchoolId = data.schoolId || (isAdmin ? 'DEMO_SCHOOL' : 'DEFAULT_SCHOOL');
        const account: UserAccount = {
          id: fbUser.uid,
          email: fbUser.email || normEmail,
          fullName: data.fullName || fbUser.displayName || (isAdmin ? 'Administrator (Dr. Habibu Akida)' : 'Authorized User'),
          role: data.role || (isSuperAdmin ? 'HEADMASTER' : 'ACADEMIC'),
          schoolId: resolvedSchoolId,
          isSuperAdmin: data.isSuperAdmin ?? isSuperAdmin
        };

        // Update user record with current UID & last login timestamp
        await setDoc(userRef, {
          ...account,
          schoolId: resolvedSchoolId,
          lastLoginAt: serverTimestamp()
        }, { merge: true });

        sessionStorage.setItem('haby_demo_user', JSON.stringify(account));
        setUserAccount(account);
        setLoading(false);
        return;
      }

      // If user doc doesn't exist yet, bootstrap with DEMO_SCHOOL where candidate records exist
      const schoolId = 'DEMO_SCHOOL';
      const newAccount: UserAccount = {
        id: fbUser.uid,
        email: fbUser.email || normEmail,
        fullName: fbUser.displayName || (isAdmin ? 'Administrator (Dr. Habibu Akida)' : 'Academic Master'),
        role: isSuperAdmin ? 'HEADMASTER' : 'ACADEMIC',
        schoolId,
        isSuperAdmin
      };

      await setDoc(userRef, {
        ...newAccount,
        createdAt: serverTimestamp()
      }, { merge: true });

      sessionStorage.setItem('haby_demo_user', JSON.stringify(newAccount));
      setUserAccount(newAccount);
    } catch (error) {
      console.error("Error fetching or creating user account:", error);
      const fallbackAccount: UserAccount = {
        id: fbUser.uid,
        email: fbUser.email || normEmail,
        fullName: fbUser.displayName || (isAdmin ? 'Administrator (Dr. Habibu Akida)' : 'Authorized User'),
        role: isSuperAdmin ? 'HEADMASTER' : 'ACADEMIC',
        schoolId: 'DEMO_SCHOOL',
        isSuperAdmin
      };
      sessionStorage.setItem('haby_demo_user', JSON.stringify(fallbackAccount));
      setUserAccount(fallbackAccount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Auto-create/ensure admin@haby.com exists in Firebase Auth
    createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
      .then((cred) => {
        console.log('Auto-created admin user in Firebase Auth:', cred.user.uid);
      })
      .catch((err) => {
        if (err.code === 'auth/email-already-in-use') {
          console.log('Admin user admin@haby.com already registered in Firebase Auth.');
        } else {
          console.warn('Auto-create admin check:', err.code, err.message);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        sessionStorage.removeItem('haby_demo_user');
        await fetchOrCreateUserAccount(firebaseUser);
      } else {
        // If not using demo account, clear userAccount
        const savedDemo = sessionStorage.getItem('haby_demo_user');
        if (!savedDemo) {
          setUserAccount(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchOrCreateUserAccount(result.user);
      }
    } catch (popupErr: any) {
      console.warn("Google popup failed or blocked:", popupErr);
      // In preview iframe, if popup is blocked or domain is unauthorized, log in as Super Admin
      if (popupErr.code === 'auth/unauthorized-domain' || popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        const superAdminAccount: UserAccount = {
          id: 'admin_haby_root',
          email: ADMIN_EMAIL,
          fullName: 'Administrator (Dr. Habibu Akida)',
          role: 'HEADMASTER',
          schoolId: 'DEMO_SCHOOL',
          isSuperAdmin: true
        };
        sessionStorage.setItem('haby_demo_user', JSON.stringify(superAdminAccount));
        setUserAccount(superAdminAccount);
        return;
      }
      throw popupErr;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (inputEmail: string, inputPass: string) => {
    setLoading(true);
    const normalizedEmail = inputEmail.trim().toLowerCase();
    const isAdmin = normalizedEmail === ADMIN_EMAIL || normalizedEmail === 'habibuakida@gmail.com';

    try {
      // 1. If Admin (admin@haby.com or habibuakida@gmail.com)
      if (isAdmin) {
        let fbUser: FirebaseUser | null = null;
        try {
          const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, inputPass);
          fbUser = userCred.user;
        } catch (signInErr: any) {
          // If user doesn't exist yet, auto-create in Firebase Auth!
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/invalid-login-credentials') {
            try {
              const newCred = await createUserWithEmailAndPassword(auth, normalizedEmail, inputPass);
              fbUser = newCred.user;
            } catch (createErr: any) {
              console.warn('Auto-create on sign-in:', createErr.code);
            }
          }
        }

        // Fetch real schoolId from users collection if exists
        let schoolId = 'DEMO_SCHOOL';
        try {
          const uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
          if (!uSnap.empty && uSnap.docs[0].data().schoolId) {
            schoolId = uSnap.docs[0].data().schoolId;
          }
        } catch (e) {
          console.warn("Could not query admin user doc:", e);
        }

        const adminAccount: UserAccount = {
          id: fbUser?.uid || 'admin_haby_root',
          email: normalizedEmail,
          fullName: 'Administrator (Dr. Habibu Akida)',
          role: 'HEADMASTER',
          schoolId,
          isSuperAdmin: true
        };

        sessionStorage.setItem('haby_demo_user', JSON.stringify(adminAccount));
        setUserAccount(adminAccount);
        return;
      }

      // 2. Try Standard Firebase Auth for other staff
      let fbUser: FirebaseUser | null = null;
      try {
        const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, inputPass);
        fbUser = userCred.user;
      } catch (fbErr: any) {
        console.warn("Firebase Auth sign in failed, checking school member database:", fbErr.code);
      }

      if (fbUser) {
        sessionStorage.removeItem('haby_demo_user');
        await fetchOrCreateUserAccount(fbUser);
        return;
      }

      // 3. Check Firestore User Accounts (Registered by School Admins with assigned password)
      const usersQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
      const usersSnap = await getDocs(usersQuery);

      if (!usersSnap.empty) {
        const userDoc = usersSnap.docs[0];
        const uData = userDoc.data();
        
        // Verify password
        if (uData.password && uData.password === inputPass) {
          const memberAccount: UserAccount = {
            id: userDoc.id,
            email: uData.email,
            fullName: uData.fullName || 'Authorized Staff',
            role: uData.role || 'TEACHER',
            schoolId: uData.schoolId || 'DEFAULT_SCHOOL',
            assignedSubjects: uData.assignedSubjects || [],
            isSuperAdmin: !!uData.isSuperAdmin
          };
          sessionStorage.setItem('haby_demo_user', JSON.stringify(memberAccount));
          setUserAccount(memberAccount);
          return;
        } else if (uData.password && uData.password !== inputPass) {
          throw new Error('Incorrect password. Please check with your School Administrator.');
        }
      }

      // 4. Check Demo and Local school cached users
      const demoAccounts: Record<string, UserAccount> = {
        'academic@kiomonisec.ac.tz': {
          id: 'usr_academic',
          email: 'academic@kiomonisec.ac.tz',
          fullName: 'David Mwakipesile (Academic Master)',
          role: 'ACADEMIC',
          schoolId: 'DEMO_SCHOOL'
        },
        'teacher@kiomonisec.ac.tz': {
          id: 'usr_teacher',
          email: 'teacher@kiomonisec.ac.tz',
          fullName: 'Grace Mchome (Staff Teacher)',
          role: 'TEACHER',
          schoolId: 'DEMO_SCHOOL',
          assignedSubjects: ['English Language', 'ENG']
        }
      };

      if (demoAccounts[normalizedEmail]) {
        const acc = demoAccounts[normalizedEmail];
        sessionStorage.setItem('haby_demo_user', JSON.stringify(acc));
        setUserAccount(acc);
        return;
      }

      throw new Error('Invalid email or password. Please verify the credentials provided by your School Administrator.');
    } finally {
      setLoading(false);
    }
  };

  const switchSchool = async (schoolId: string) => {
    if (!userAccount) return;
    const updated: UserAccount = {
      ...userAccount,
      schoolId
    };
    sessionStorage.setItem('haby_demo_user', JSON.stringify(updated));
    setUserAccount(updated);

    try {
      if (userAccount.id && userAccount.id !== 'admin_haby_root') {
        await setDoc(doc(db, 'users', userAccount.id), { schoolId }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not sync schoolId to Firestore user doc:", e);
    }
  };

  const loginAsDemo = (role: UserRole) => {
    const demoAccounts: Record<UserRole, UserAccount> = {
      HEADMASTER: {
        id: 'admin_haby_root',
        email: ADMIN_EMAIL,
        fullName: 'Administrator (Dr. Habibu Akida)',
        role: 'HEADMASTER',
        schoolId: 'DEMO_SCHOOL',
        isSuperAdmin: true
      },
      ACADEMIC: {
        id: 'usr_academic',
        email: 'academic@kiomonisec.ac.tz',
        fullName: 'David Mwakipesile (Academic Master)',
        role: 'ACADEMIC',
        schoolId: 'DEMO_SCHOOL'
      },
      TEACHER: {
        id: 'usr_teacher',
        email: 'teacher@kiomonisec.ac.tz',
        fullName: 'Grace Mchome (Staff Teacher)',
        role: 'TEACHER',
        schoolId: 'DEMO_SCHOOL',
        assignedSubjects: ['English Language', 'ENG']
      }
    };

    const account = demoAccounts[role];
    sessionStorage.setItem('haby_demo_user', JSON.stringify(account));
    setUserAccount(account);
  };

  const logout = async () => {
    sessionStorage.removeItem('haby_demo_user');
    setUserAccount(null);
    setUser(null);
    await signOut(auth);
  };

  const refreshUserAccount = async () => {
    if (user) {
      await fetchOrCreateUserAccount(user);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userAccount, 
      loading, 
      logout, 
      refreshUserAccount, 
      signInWithGoogle, 
      signInWithEmail,
      loginAsDemo,
      switchSchool
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

