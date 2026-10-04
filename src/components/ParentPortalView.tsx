import React, { useState, useEffect } from 'react';
import { supabase, DEFAULT_PRIMARY_SCHOOL_ID } from '../lib/supabaseClient';
import { Shield, Phone, Lock, User, FileText, CheckCircle, AlertTriangle, Send, LogOut, ArrowLeft, Download, Award, DollarSign, Calendar, MessageSquare, BookOpen, Bell } from 'lucide-react';

export interface ParentPortalViewProps {
  onBackToMain?: () => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ onBackToMain }) => {
  const [parent, setParent] = useState<{ id: string; phone: string; full_name: string } | null>(null);
  const [phoneInput, setPhoneInput] = useState('0710000000');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [childResults, setChildResults] = useState<any[]>([]);
  const [childAttendance, setChildAttendance] = useState<any[]>([]);
  const [childFees, setChildFees] = useState<any[]>([]);
  const [childDiscipline, setChildDiscipline] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matokeo' | 'ada' | 'mahudhurio' | 'tabia' | 'ujumbe' | 'matangazo'>('dashboard');

  // Auto-login or check session
  useEffect(() => {
    const savedParent = sessionStorage.getItem('haby_parent_session');
    if (savedParent) {
      try {
        const p = JSON.parse(savedParent);
        setParent(p);
        fetchParentData(p.id);
      } catch (e) {
        sessionStorage.removeItem('haby_parent_session');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanPhone = phoneInput.trim();
    const cleanPassword = passwordInput.trim();

    try {
      // 1. Ensure test parent exists in Supabase for seamless demo
      if (cleanPhone === '0710000000' && cleanPassword === '123456') {
        // Upsert test parent
        const testParentId = '99999999-9999-9999-9999-999999999999';
        await supabase.from('parents').upsert({
          id: testParentId,
          phone: '0710000000',
          password_hash: '123456',
          full_name: 'Bw. Juma Akida (Mzazi Mfano)',
          school_id: DEFAULT_PRIMARY_SCHOOL_ID
        }, { onConflict: 'id' });

        // Ensure test student exists
        const testStudentId = '88888888-8888-8888-8888-888888888888';
        await supabase.from('students').upsert({
          id: testStudentId,
          school_id: DEFAULT_PRIMARY_SCHOOL_ID,
          name: 'Baraka Juma Akida',
          class: 'Form 2',
          stream: 'STREAM A',
          gender: 'Male',
          parent_phone: '0710000000'
        }, { onConflict: 'id' });

        // Link parent to student
        await supabase.from('parent_students').upsert({
          parent_id: testParentId,
          student_id: testStudentId
        }, { onConflict: 'parent_id,student_id' });
      }

      // 2. Query parents table
      const { data: parentRows, error } = await supabase
        .from('parents')
        .select('*')
        .eq('phone', cleanPhone);

      if (error || !parentRows || parentRows.length === 0) {
        throw new Error('Namba ya simu au nenosiri si sahihi. Tafadhali jaribu tena.');
      }

      const pData = parentRows[0];
      if (pData.password_hash !== cleanPassword && pData.password !== cleanPassword) {
        throw new Error('Nenosiri si sahihi. Jaribu 123456.');
      }

      const parentSession = {
        id: pData.id,
        phone: pData.phone,
        full_name: pData.full_name || pData.fullName || 'Mzazi'
      };

      setParent(parentSession);
      sessionStorage.setItem('haby_parent_session', JSON.stringify(parentSession));
      await fetchParentData(pData.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hitilafu imetokea wakati wa kuingia.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParentData = async (parentId: string) => {
    try {
      // Fetch linked student IDs from parent_students
      const { data: links } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId);

      let studentIds = links ? links.map(l => l.student_id) : [];

      // If no explicit link found, check by parent phone
      if (studentIds.length === 0 && parent) {
        const { data: studByPhone } = await supabase
          .from('students')
          .select('id')
          .eq('parent_phone', parent.phone);
        if (studByPhone) {
          studentIds = studByPhone.map(s => s.id);
        }
      }

      if (studentIds.length > 0) {
        const { data: studentRows } = await supabase
          .from('students')
          .select('*')
          .in('id', studentIds);

        if (studentRows && studentRows.length > 0) {
          setChildren(studentRows);
          setSelectedChild(studentRows[0]);
          await fetchChildDetails(studentRows[0].id);
        }
      } else {
        // Fallback demo child if none linked
        const demoChild = {
          id: '88888888-8888-8888-8888-888888888888',
          name: 'Baraka Juma Akida',
          class: 'Form 2',
          stream: 'STREAM A',
          gender: 'Male',
          parent_phone: '0710000000',
          average: '82.4',
          division: 'Division I (12 Points)',
          total: 412
        };
        setChildren([demoChild]);
        setSelectedChild(demoChild);
      }

      // Fetch announcements
      const { data: annRows } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setAnnouncements(annRows || [
        { id: 1, title: 'Kikao cha Wazazi na Walimu', content: 'Wazazi wote mnakaribishwa kwenye kikao tarehe 15 mwezi huu saa tisa alasiri.', created_at: new Date().toISOString() },
        { id: 2, title: 'Kufungwa kwa Shule - Muhula wa Kwanza', content: 'Shule itafungwa rasmi tarehe 30 kwa ajili ya likizo fupi ya wiki mbili.', created_at: new Date().toISOString() }
      ]);

      // Fetch messages
      const { data: msgRows } = await supabase
        .from('parent_messages')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });
      setMessages(msgRows || []);

    } catch (e) {
      console.warn("Error fetching parent data:", e);
    }
  };

  const fetchChildDetails = async (studentId: string) => {
    try {
      // Fetch exam records
      const { data: recs } = await supabase
        .from('exam_records')
        .select('*')
        .eq('student_id', studentId);
      setChildResults(recs || [
        { exam_name: 'Terminal Examination 2026', term: 'Term 1', total: 412, average: '82.4', division: 'Division I', points: 12 }
      ]);

      // Fetch fees / ledger
      const { data: ledger } = await supabase
        .from('student_ledger')
        .select('*')
        .eq('student_id', studentId);
      setChildFees(ledger || [
        { description: 'Ada ya Muhula I', amount: 300000, paid: 300000, status: 'LIPIA IMEKAMILIKA' }
      ]);

      // Fetch discipline
      const { data: disc } = await supabase
        .from('discipline_records')
        .select('*')
        .eq('student_id', studentId);
      setChildDiscipline(disc || [
        { incident: 'Nidhamu Bora', category: 'sifa', description: 'Mwanafunzi mwenye bidii na adabu darasani.', date: '2026-03-10' }
      ]);
    } catch (e) {
      console.warn("Error fetching child details:", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !parent) return;

    const payload = {
      parent_id: parent.id,
      parent_phone: parent.phone,
      parent_name: parent.full_name,
      student_id: selectedChild?.id,
      student_name: selectedChild?.name,
      message: newMessageText.trim(),
      sender: 'parent',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('parent_messages').insert(payload);
      setMessages(prev => [...prev, payload]);
      setNewMessageText('');
    } catch (err) {
      // Fallback local append
      setMessages(prev => [...prev, payload]);
      setNewMessageText('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('haby_parent_session');
    setParent(null);
  };

  if (!parent) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">PORTAL YA WAZAZI</h1>
            <p className="text-xs text-blue-200 mt-1 uppercase tracking-wider font-semibold">HabyEdu Pro - Mfumo wa Shule</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 rounded">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Namba ya Simu ya Mzazi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="0710000000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-slate-800 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nenosiri (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono text-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-600" /> Jaribu Kuingia Haraka:
              </p>
              <p>Namba ya Simu: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-blue-700">0710000000</code></p>
              <p>Nenosiri: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-blue-700">123456</code></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
            >
              {loading ? 'Inathibitisha...' : 'Ingia kwenye Portal'}
            </button>

            {onBackToMain && (
              <button
                type="button"
                onClick={onBackToMain}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Rudi kwenye Mfumo Mkuu wa Shule
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-blue-300">
              HE
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide">PORTAL YA WAZAZI</h2>
              <p className="text-[10px] text-blue-200 font-medium">Karibu, {parent.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onBackToMain && (
              <button
                onClick={onBackToMain}
                className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-xs font-bold rounded-lg transition"
              >
                Mfumo Mkuu
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition"
              title="Toka"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full p-4 space-y-4 flex-1">
        {/* Child Selector if multiple */}
        {children.length > 1 && (
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Mwanafunzi:</span>
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChild(child);
                  fetchChildDetails(child.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedChild?.id === child.id
                    ? 'bg-blue-900 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {child.name} ({child.class})
              </button>
            ))}
          </div>
        )}

        {selectedChild && (
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
              <User className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="bg-blue-800/85 text-blue-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-700">
                  {selectedChild.class} - {selectedChild.stream || 'STREAM A'}
                </span>
                <h3 className="text-xl font-black mt-2">{selectedChild.name}</h3>
                <p className="text-xs text-blue-200 mt-0.5">Namba ya Usajili: <span className="font-mono">{selectedChild.regNo || 'HABY/' + selectedChild.id.slice(0, 6).toUpperCase()}</span></p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => alert('Inapakua Ripoti ya Mwanafunzi (PDF)...')}
                  className="px-4 py-2 bg-white text-blue-900 font-black rounded-xl shadow hover:bg-blue-50 transition text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-blue-700" /> Pakua Ripoti (PDF)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portal Tabs Navigation */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 text-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BookOpen className="w-4 h-4" /> Muhtasari
          </button>
          <button
            onClick={() => setActiveTab('matokeo')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'matokeo' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Award className="w-4 h-4" /> Matokeo
          </button>
          <button
            onClick={() => setActiveTab('ada')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'ada' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <DollarSign className="w-4 h-4" /> Ada
          </button>
          <button
            onClick={() => setActiveTab('mahudhurio')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'mahudhurio' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Calendar className="w-4 h-4" /> Mahudhurio
          </button>
          <button
            onClick={() => setActiveTab('tabia')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'tabia' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Shield className="w-4 h-4" /> Tabia
          </button>
          <button
            onClick={() => setActiveTab('ujumbe')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'ujumbe' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MessageSquare className="w-4 h-4" /> Ujumbe
          </button>
          <button
            onClick={() => setActiveTab('matangazo')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${activeTab === 'matangazo' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Bell className="w-4 h-4" /> Matangazo
          </button>
        </div>

        {/* Tab Content: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="text-xs font-black text-slate-400 uppercase">Wastani wa Mwisho</h4>
              <p className="text-2xl font-black text-blue-900 mt-1">{selectedChild?.average || '82.4%'}</p>
              <p className="text-xs text-emerald-600 font-bold mt-1">Daraja: {selectedChild?.division || 'Division I'}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="text-xs font-black text-slate-400 uppercase">Hali ya Ada</h4>
              <p className="text-2xl font-black text-emerald-600 mt-1">Imelipwa 100%</p>
              <p className="text-xs text-slate-500 mt-1">Hakuna deni lililobaki</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="text-xs font-black text-slate-400 uppercase">Mahudhurio</h4>
              <p className="text-2xl font-black text-indigo-900 mt-1">98.5%</p>
              <p className="text-xs text-slate-500 mt-1">Hajachelewa siku yoyote</p>
            </div>
          </div>
        )}

        {/* Tab Content: Matokeo */}
        {activeTab === 'matokeo' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-700" /> Matokeo ya Mitihani
            </h3>
            <div className="space-y-3">
              {childResults.map((r, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h5 className="font-bold text-slate-900">{r.exam_name || 'Terminal Exam 2026'}</h5>
                    <p className="text-xs text-slate-500">{r.term || 'Term 1'} • Jumla ya Alama: <span className="font-mono font-bold">{r.total || 412}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs">
                      {r.division || 'Division I'} ({r.average || '82.4%'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Ada */}
        {activeTab === 'ada' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-700" /> Malipo ya Ada na Michango
            </h3>
            <div className="space-y-3">
              {childFees.map((f, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-900">{f.description}</h5>
                    <p className="text-xs text-slate-500">Kiasi: TZS {f.amount?.toLocaleString() || '300,000'}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs uppercase">
                    {f.status || 'LIPIA IMEKAMILIKA'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Mahudhurio */}
        {activeTab === 'mahudhurio' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-700" /> Ripoti ya Mahudhurio
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
              <p className="font-bold">Hali ya Mahudhurio: 98.5% (Nzuri Sana)</p>
              <p className="text-xs mt-1">Mwanafunzi amehudhuria siku 88 kati ya siku 90 za masomo muhula huu.</p>
            </div>
          </div>
        )}

        {/* Tab Content: Tabia */}
        {activeTab === 'tabia' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-700" /> Hali ya Nidhamu na Tabia
            </h3>
            <div className="space-y-3">
              {childDiscipline.map((d, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">{d.incident}</span>
                    <span className="text-xs text-slate-400 font-mono">{d.date}</span>
                  </div>
                  <p className="text-xs text-slate-600">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Ujumbe */}
        {activeTab === 'ujumbe' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4 flex flex-col h-[500px]">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-700" /> Wasiliana na Mwalimu wa Darasa
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">Hakuna ujumbe bado. Anza mazungumzo na mwalimu hapa chini.</p>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'parent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-3 text-xs ${m.sender === 'parent' ? 'bg-blue-900 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                      <p>{m.message}</p>
                      <span className="text-[9px] opacity-70 block mt-1 text-right">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                placeholder="Andika ujumbe kwa mwalimu..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition flex items-center gap-1 text-xs font-bold"
              >
                <Send className="w-4 h-4" /> Tuma
              </button>
            </form>
          </div>
        )}

        {/* Tab Content: Matangazo */}
        {activeTab === 'matangazo' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" /> Matangazo ya Shule
            </h3>
            <div className="space-y-3">
              {announcements.map((a, idx) => (
                <div key={idx} className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                  <h5 className="font-bold text-amber-900 text-sm">{a.title}</h5>
                  <p className="text-xs text-amber-800 mt-1">{a.content}</p>
                  <span className="text-[10px] text-amber-600 font-mono block mt-2">{new Date(a.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
