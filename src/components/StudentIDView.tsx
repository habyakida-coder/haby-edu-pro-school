import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  CreditCard, 
  User, 
  QrCode, 
  ShieldCheck, 
  Calendar, 
  BookOpen, 
  Sparkles, 
  Download, 
  Filter 
} from 'lucide-react';
import { Student, SchoolInfo } from '../types';
import { 
  NURSERY_CLASSES, 
  PRIMARY_CLASSES, 
  SECONDARY_CLASSES 
} from '../constants/defaults';
import { HabyEduProLogo } from './common/HabyEduProLogo';

interface StudentIDViewProps {
  students: Student[];
  schoolInfo: SchoolInfo;
}

export const StudentIDView: React.FC<StudentIDViewProps> = ({
  students,
  schoolInfo
}) => {
  const [searchReg, setSearchReg] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[0] || null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('All');
  const [batchPrintMode, setBatchPrintMode] = useState<boolean>(false);

  // Dynamic streams collected from all registered students
  const availableStreams = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.stream && s.stream.trim()) {
        const clean = s.stream.trim().replace(/^STREAM\s+/i, '');
        if (clean) set.add(clean.toUpperCase());
      }
    });
    ['A', 'B', 'C', 'D', 'E'].forEach(st => set.add(st));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !searchReg.trim() ||
        s.name.toLowerCase().includes(searchReg.trim().toLowerCase()) ||
        s.regNo.toLowerCase().includes(searchReg.trim().toLowerCase());
      const matchClass = selectedClassFilter === 'All' || s.className.toLowerCase() === selectedClassFilter.toLowerCase();
      const matchStream = selectedStreamFilter === 'All' ||
        (s.stream ? (
          s.stream.toUpperCase().replace(/^STREAM\s+/i, '') === selectedStreamFilter.toUpperCase() ||
          s.stream.toUpperCase().includes(selectedStreamFilter.toUpperCase())
        ) : true);
      return matchSearch && matchClass && matchStream;
    });
  }, [students, searchReg, selectedClassFilter, selectedStreamFilter]);

  // Keep selected student synced with filtered results
  useEffect(() => {
    if (filteredStudents.length > 0 && (!selectedStudent || !filteredStudents.some(s => s.id === selectedStudent.id))) {
      setSelectedStudent(filteredStudents[0]);
    }
  }, [filteredStudents, selectedStudent]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchReg.trim()) {
      return;
    }
    const found = students.find(s => 
      s.regNo.toLowerCase().includes(searchReg.trim().toLowerCase()) ||
      s.name.toLowerCase().includes(searchReg.trim().toLowerCase())
    );
    if (found) {
      setSelectedStudent(found);
    } else {
      alert(`No student found with registration number or name containing "${searchReg.trim()}".`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar (Matching Screenshot H.png) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1f4d8b] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Student Identity Card</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search student by registration number, generate official verified identity badges, or batch print school IDs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Form matching Screenshot H */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Reg Number"
                value={searchReg}
                onChange={e => setSearchReg(e.target.value)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg w-48 sm:w-56 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => setBatchPrintMode(!batchPrintMode)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              batchPrintMode 
                ? 'bg-emerald-600 text-white border-emerald-600' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {batchPrintMode ? 'Single Card View' : 'Batch All Cards'}
          </button>
        </div>
      </div>

      {/* Class Quick Selection & Student Picker (Matching Registration Filtering) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Class:</span>
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-700"
            >
              <option value="All">All Classes</option>
              <optgroup label="Pre-Primary / Nursery">
                {NURSERY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Primary School (Std 1 - 7)">
                {PRIMARY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Secondary School (Form 1 - 6)">
                {SECONDARY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Stream:</span>
            <select
              value={selectedStreamFilter}
              onChange={e => setSelectedStreamFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-700"
            >
              <option value="All">All Streams</option>
              {availableStreams.map(str => (
                <option key={str} value={str}>Stream {str}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
            Candidate ({filteredStudents.length}):
          </span>
          <select
            value={selectedStudent?.regNo || ''}
            onChange={e => {
              const st = students.find(s => s.regNo === e.target.value);
              if (st) setSelectedStudent(st);
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 max-w-[260px]"
          >
            {filteredStudents.length === 0 ? (
              <option value="">No matching candidates</option>
            ) : (
              filteredStudents.map(s => (
                <option key={s.id} value={s.regNo}>{s.regNo} - {s.name} ({s.className})</option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Printable ID Area */}
      <div id="student-id-printable-area">
        {!batchPrintMode && selectedStudent ? (
          <div className="flex flex-col items-center justify-center py-6">
            {/* Single Official ID Card Badge Container */}
            <div className="w-full max-w-[420px] bg-white rounded-2xl border-2 border-blue-900 shadow-xl overflow-hidden relative">
              {/* Top School Header */}
              <div className="bg-[#1f4d8b] text-white p-3.5 text-center border-b-2 border-amber-400">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-1 rounded-lg bg-white/10 shrink-0">
                    {schoolInfo.logo ? (
                      <img src={schoolInfo.logo} alt="School Logo" className="w-9 h-9 object-contain rounded" />
                    ) : (
                      <HabyEduProLogo theme="dark" size="sm" variant="icon" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-sm tracking-wide uppercase leading-tight">
                      {schoolInfo.name || 'HABY EDU PRO SCHOOL'}
                    </h3>
                    <p className="text-[10px] text-blue-200 font-medium">
                      {schoolInfo.address || 'P.O. Box 1234, Tanga, Tanzania'} • {schoolInfo.phone || '+255 754 000 111'}
                    </p>
                  </div>
                </div>
                <div className="inline-block mt-2 bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  OFFICIAL STUDENT IDENTITY CARD
                </div>
              </div>

              {/* ID Body */}
              <div className="p-5 bg-gradient-to-b from-white via-slate-50/50 to-blue-50/30">
                <div className="flex gap-4">
                  {/* Photo Avatar */}
                  <div className="w-28 flex flex-col items-center">
                    <div className="w-24 h-28 bg-slate-100 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center overflow-hidden shadow-inner relative">
                      {selectedStudent.passportPhoto ? (
                        <img
                          src={selectedStudent.passportPhoto}
                          alt={selectedStudent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <User className="w-12 h-12 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Photo</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md font-mono font-bold text-[10px] border border-blue-200">
                        {selectedStudent.regNo}
                      </span>
                    </div>
                  </div>

                  {/* Student Attributes */}
                  <div className="flex-1 space-y-1.5 text-xs">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Student Full Name</div>
                      <div className="font-black text-slate-900 text-sm leading-tight">{selectedStudent.name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Class & Stream</div>
                        <div className="font-bold text-slate-800">{selectedStudent.className} {selectedStudent.stream || 'A'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Level</div>
                        <div className="font-bold text-blue-700">{selectedStudent.level}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Gender</div>
                        <div className="font-bold text-slate-800">{selectedStudent.gender || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Date of Birth</div>
                        <div className="font-mono text-slate-700 font-semibold">{selectedStudent.dob || '2010-01-01'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Parent Phone</div>
                        <div className="font-mono text-blue-900 font-bold text-[11px] truncate">
                          {selectedStudent.parentPhone || selectedStudent.phone || '0754 000 111'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Valid Until</div>
                        <div className="font-bold text-red-600">31 Dec 2027</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Barcode & Signatures */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  {/* Simulated Barcode */}
                  <div>
                    <div className="flex items-center gap-0.5 h-6">
                      {[4, 2, 6, 1, 3, 5, 2, 7, 3, 1, 4, 6, 2, 5, 1, 3, 4].map((h, i) => (
                        <div key={i} className="bg-slate-900 w-1 rounded-xs" style={{ height: `${h * 3.5}px` }} />
                      ))}
                    </div>
                    <div className="text-[8px] font-mono text-slate-500 mt-0.5 tracking-wider">
                      *{selectedStudent.regNo}*
                    </div>
                  </div>

                  {/* Stamp / Signature */}
                  <div className="text-right">
                    <div className="text-[9px] text-slate-400 font-serif italic mb-0.5">
                      {schoolInfo.principal || 'Dr. H. Akida'}
                    </div>
                    <div className="text-[8px] font-bold text-slate-600 uppercase border-t border-slate-400 pt-0.5 tracking-tighter">
                      Head of School Stamp
                    </div>
                  </div>
                </div>
              </div>

              {/* ID Bottom Strip */}
              <div className="bg-slate-900 text-white px-4 py-1.5 text-center text-[9px] font-medium tracking-wide">
                This card is the property of the school. If found, please return to school office.
              </div>
            </div>
          </div>
        ) : (
          /* Batch Grid of Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {filteredStudents.map(st => (
              <div key={st.id} className="bg-white rounded-2xl border-2 border-blue-900 shadow-md overflow-hidden relative">
                {/* School Header */}
                <div className="bg-[#1f4d8b] text-white p-3 text-center border-b-2 border-amber-400">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="p-0.5 rounded bg-white/10 shrink-0">
                      {schoolInfo.logo ? (
                        <img src={schoolInfo.logo} alt="Logo" className="w-6 h-6 object-contain rounded" />
                      ) : (
                        <HabyEduProLogo theme="dark" size="sm" variant="icon" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-xs uppercase tracking-wide leading-tight">
                        {schoolInfo.name || 'HABY EDU PRO SCHOOL'}
                      </h3>
                      <p className="text-[9px] text-blue-200">
                        {schoolInfo.phone || '+255 754 000 111'}
                      </p>
                    </div>
                  </div>
                  <div className="inline-block mt-1 bg-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                    OFFICIAL STUDENT IDENTITY CARD
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 bg-slate-50/50 flex gap-3 text-xs">
                  <div className="w-20 h-24 bg-slate-200 border border-slate-300 rounded-lg flex flex-col items-center justify-center overflow-hidden shrink-0">
                    {st.passportPhoto ? (
                      <img
                        src={st.passportPhoto}
                        alt={st.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <User className="w-8 h-8 text-slate-400" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Photo</span>
                      </>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="font-black text-slate-900 text-sm leading-tight">{st.name}</div>
                    <div className="text-xs font-mono font-bold text-blue-700">{st.regNo}</div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Class:</strong> {st.className} {st.stream || 'A'} • <strong>Sex:</strong> {st.gender || '-'}
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Parent Phone:</strong> <span className="font-mono font-bold text-blue-900">{st.parentPhone || st.phone || '0754 000 111'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      <strong>DOB:</strong> {st.dob || '2010-01-01'} • <strong>Valid:</strong> 2026/2027
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white px-3 py-1 text-center text-[8px]">
                  Property of {schoolInfo.name}. Return if found.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
