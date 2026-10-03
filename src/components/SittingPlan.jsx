import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Grid, 
  Sliders, 
  Calendar, 
  Building2, 
  FileText, 
  CheckCircle2, 
  DoorClosed, 
  RefreshCw,
  Armchair,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';

const EXAM_TYPES = [
  'STNA',
  'SFNA',
  'PSLE',
  'FTNA',
  'CSEE',
  'ACSEE',
  'MOCK',
  'PRE MOCK',
  'MID TERM',
  'TERMINAL',
  'ANNUAL'
];

/**
 * @param {{ schoolId?: string, schoolInfo?: any, onBack?: (() => void) | null }} props
 */
export default function SittingPlan({ schoolId = 'DEMO_SCHOOL', schoolInfo = {}, onBack = undefined }) {
  const planRef = useRef(null);

  // HEADER SECTION (User inputs)
  const [examType, setExamType] = useState('CSEE');
  const [schoolName, setSchoolName] = useState(schoolInfo.name || 'KIOMONI SECONDARY SCHOOL');
  const [roomNo, setRoomNo] = useState('ROOM 01');
  const [day, setDay] = useState('Monday');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('011 CIVICS');
  const [codeNo, setCodeNo] = useState('011');

  // SETTINGS SECTION (Critical Logic)
  const [startingSeat, setStartingSeat] = useState('0001');
  const [doorEntrance, setDoorEntrance] = useState('Left Side'); // 'Left Side' | 'Right Side'
  const [numRows, setNumRows] = useState(6);
  const [numColumns, setNumColumns] = useState(4);
  const [columnSeats, setColumnSeats] = useState([6, 6, 6, 6]);
  const [fillPattern, setFillPattern] = useState('snake'); // 'snake' (anti-clockwise / clockwise) | 'topToBottom'

  // Generated Plan & UI State
  const [generatedGrid, setGeneratedGrid] = useState(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (schoolInfo.name) {
      setSchoolName(schoolInfo.name);
    }
  }, [schoolInfo.name]);

  // Adjust column seats array when number of columns changes
  const handleColumnsCountChange = (val) => {
    const cols = Math.max(1, Math.min(12, parseInt(val, 10) || 1));
    setNumColumns(cols);
    if (cols > columnSeats.length) {
      const added = Array(cols - columnSeats.length).fill(numRows);
      setColumnSeats([...columnSeats, ...added]);
    } else {
      setColumnSeats(columnSeats.slice(0, cols));
    }
  };

  // Adjust default seats per column when numRows changes
  const handleNumRowsChange = (val) => {
    const rows = Math.max(1, Math.min(25, parseInt(val, 10) || 1));
    setNumRows(rows);
    setColumnSeats(prev => prev.map(() => rows));
  };

  // Dynamic individual column seats modification
  const handleColumnSeatsChange = (colIndex, val) => {
    const parsed = Math.max(1, Math.min(30, parseInt(val, 10) || 1));
    const updated = [...columnSeats];
    updated[colIndex] = parsed;
    setColumnSeats(updated);
  };

  const handleAddColumn = () => {
    const nextColCount = numColumns + 1;
    setNumColumns(nextColCount);
    setColumnSeats([...columnSeats, numRows]);
  };

  const handleRemoveColumn = (colIndex) => {
    if (numColumns <= 1) return;
    const updated = columnSeats.filter((_, idx) => idx !== colIndex);
    setNumColumns(updated.length);
    setColumnSeats(updated);
  };

  // Total seats: sum of all column seats
  const totalSeats = useMemo(() => {
    return columnSeats.reduce((acc, curr) => acc + curr, 0);
  }, [columnSeats]);

  // Format 4-digit number helper (e.g., 0001)
  const format4Digits = (num) => {
    return String(num).padStart(4, '0');
  };

  /**
   * GENERATION LOGIC - CRITICAL NECTA SPECIFICATION:
   * 1. Total seats = sum of all column seats
   * 2. Auto fill numbers sequentially from Starting Number.
   * 3. IF DOOR IS LEFT SIDE:
   *    - Start filling from column nearest the door (Column 1 on left)
   *    - Fill whole column top to bottom
   *    - Then move to next column rotating ANTI-CLOCKWISE (snake pattern for exam security)
   *      Example: Left door -> Col1: 0001,0002,0003,0004,0005,0006 then Col2: 0007,0008...
   * 4. IF DOOR IS RIGHT SIDE:
   *    - Start filling from column nearest the door (Last column on right)
   *    - Fill whole column top to bottom
   *    - Then move to previous column rotating CLOCKWISE
   */
  const handleGeneratePlan = () => {
    setErrorMessage(null);
    const startNum = parseInt(startingSeat, 10) || 1;
    let currentNumber = startNum;

    // Find maximum rows to structure the 2D layout grid
    const maxRows = Math.max(...columnSeats);
    const grid = Array.from({ length: maxRows }, () => Array(numColumns).fill(null));

    // Determine processing column sequence according to door location
    const colOrder = [];
    if (doorEntrance === 'Left Side') {
      // Start from Column 0 (Left closest to Door) to Column N - 1
      for (let c = 0; c < numColumns; c++) colOrder.push(c);
    } else {
      // Start from Column N - 1 (Right closest to Door) to Column 0
      for (let c = numColumns - 1; c >= 0; c--) colOrder.push(c);
    }

    colOrder.forEach((colIdx, orderIdx) => {
      const seatsInThisCol = columnSeats[colIdx];
      const isEvenOrder = orderIdx % 2 === 0;

      if (fillPattern === 'snake') {
        // Snake / Rotating Anti-clockwise (Left Door) or Clockwise (Right Door)
        if (isEvenOrder) {
          // Top to bottom
          for (let r = 0; r < seatsInThisCol; r++) {
            grid[r][colIdx] = {
              seatNo: format4Digits(currentNumber),
              colIndex: colIdx,
              rowIndex: r
            };
            currentNumber++;
          }
        } else {
          // Bottom to top
          for (let r = seatsInThisCol - 1; r >= 0; r--) {
            grid[r][colIdx] = {
              seatNo: format4Digits(currentNumber),
              colIndex: colIdx,
              rowIndex: r
            };
            currentNumber++;
          }
        }
      } else {
        // Linear top to bottom
        for (let r = 0; r < seatsInThisCol; r++) {
          grid[r][colIdx] = {
            seatNo: format4Digits(currentNumber),
            colIndex: colIdx,
            rowIndex: r
          };
          currentNumber++;
        }
      }
    });

    setGeneratedGrid(grid);
    savePlanToDatabase(grid, startNum, currentNumber - 1);
  };

  const savePlanToDatabase = async (grid, start, end) => {
    try {
      await supabase.from('sitting_plans').insert({
        school_id: schoolId,
        exam_type: examType,
        room_no: roomNo,
        subject,
        code_no: codeNo,
        exam_date: examDate,
        door_entrance: doorEntrance,
        total_seats: totalSeats,
        start_seat: format4Digits(start),
        end_seat: format4Digits(end),
        columns_count: numColumns,
        rows_count: numRows,
        columns_seats: columnSeats,
        created_at: new Date().toISOString()
      });
      setSavedSuccessMsg('Mpangilio wa chumba umehifadhiwa kikamilifu!');
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (e) {
      console.warn('Could not save sitting plan to supabase:', e);
    }
  };

  // Generate on initial render
  useEffect(() => {
    handleGeneratePlan();
  }, []);

  // PRINT PDF (A4 Landscape) using react-to-print with native fallback
  const reactToPrintTrigger = useReactToPrint({
    contentRef: planRef,
    documentTitle: `NECTA_SITTING_PLAN_${roomNo.replace(/\s+/g, '_')}_${examType}`
  });

  const handlePrint = () => {
    try {
      if (reactToPrintTrigger) {
        reactToPrintTrigger();
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  // Export as high-resolution image using html2canvas
  const handleExportImage = async () => {
    if (!planRef.current) return;
    setIsExportingImage(true);
    setErrorMessage(null);
    try {
      const canvas = await html2canvas(planRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `NECTA_SITTING_PLAN_${roomNo.replace(/\s+/g, '_')}_${examType}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setSavedSuccessMsg('Picha ya mpangilio imepakuliwa kwa ufanisi!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Export image error:', err);
      setErrorMessage('Hitilafu wakati wa kutoa picha. Tafadhali jaribu tena au tumia Print PDF.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official A4 Landscape Print Styling */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-sitting-plan, #printable-sitting-plan * {
            visibility: visible !important;
          }
          #printable-sitting-plan {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            border: 2px solid #000 !important;
            background: #ffffff !important;
          }
          @page {
            size: landscape A4;
            margin: 6mm;
          }
        }
      `}</style>

      {/* Control Panel / Inputs (Hidden during print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-black tracking-wider uppercase">
                NECTA Official
              </span>
              <span className="text-xs text-slate-500 font-semibold">School ID: {schoolId}</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 mt-1">
              Official NECTA Examination Sitting Plan Generator
            </h2>
            <p className="text-xs text-slate-500">
              Unda mpangilio rasmi wa chumba cha mtihani wa NECTA (Snake pattern / Anti-clockwise &amp; Clockwise)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Rudi / Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGeneratePlan}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generate Plan</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF (A4 Landscape)</span>
            </button>

            <button
              type="button"
              onClick={handleExportImage}
              disabled={isExportingImage}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingImage ? 'Exporting...' : 'Export Image'}</span>
            </button>
          </div>
        </div>

        {savedSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* HEADER SECTION INPUTS */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Header Section Inputs
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Examination Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Type of Examination</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* School Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Name of School</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Room Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sitting Plan Room No</label>
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="e.g. ROOM 01 / HALL A"
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Day & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Day</label>
                <input
                  type="text"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="Monday"
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Subject & Code */}
            <div className="grid grid-cols-3 gap-2 lg:col-span-2">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. CIVICS / BASIC MATHEMATICS"
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Code No</label>
                <input
                  type="text"
                  value={codeNo}
                  onChange={(e) => setCodeNo(e.target.value)}
                  placeholder="011"
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Starting Seat Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Starting Seat Number (4 Digits)</label>
              <input
                type="text"
                value={startingSeat}
                maxLength={4}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9]/g, '');
                  setStartingSeat(clean);
                }}
                placeholder="0001"
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-black text-slate-900 bg-slate-50 text-center tracking-widest focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Door Entrance */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Door Entrance</label>
              <select
                value={doorEntrance}
                onChange={(e) => setDoorEntrance(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Left Side">Left Side (Anti-Clockwise)</option>
                <option value="Right Side">Right Side (Clockwise)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SETTINGS SECTION (Rows, Columns, Dynamic Column Seats) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="font-black text-slate-800 text-xs">
                Classroom Layout Settings ({numColumns} Columns, {totalSeats} Total Seats)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Pattern:</span>
              <button
                type="button"
                onClick={() => setFillPattern(fillPattern === 'snake' ? 'topToBottom' : 'snake')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {fillPattern === 'snake' ? 'Snake Pattern (NECTA Exam Security)' : 'Straight Top-to-Bottom'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Number of Rows</label>
              <input
                type="number"
                min="1"
                max="25"
                value={numRows}
                onChange={(e) => handleNumRowsChange(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Columns</label>
              <input
                type="number"
                min="1"
                max="12"
                value={numColumns}
                onChange={(e) => handleColumnsCountChange(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddColumn}
                className="w-full p-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Column Dynamically</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-600 block mb-2">
              For Each Column, Number of Seats:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {columnSeats.map((count, colIdx) => (
                <div key={colIdx} className="bg-white p-2.5 rounded-lg border border-slate-300 text-center space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-600">
                    <span>Col {colIdx + 1}</span>
                    {numColumns > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(colIdx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Ondoa safu hii"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={count}
                    onChange={(e) => handleColumnSeatsChange(colIdx, e.target.value)}
                    className="w-full py-1 text-center font-black text-sm text-slate-900 border border-slate-200 rounded-md bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 block">seats</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL PRINTABLE A4 LANDSCAPE DOCUMENT */}
      <div 
        ref={planRef}
        id="printable-sitting-plan"
        className="bg-white border-2 border-black p-6 sm:p-8 rounded-none shadow-md font-serif text-black max-w-[1200px] mx-auto space-y-6"
      >
        {/* DOCUMENT HEADER */}
        <div className="text-center space-y-1 border-b-2 border-black pb-4">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-800 font-sans">
            THE UNITED REPUBLIC OF TANZANIA
          </h3>
          <h1 className="text-base sm:text-xl font-black uppercase tracking-wider text-black">
            NATIONAL EXAMINATIONS COUNCIL OF TANZANIA (NECTA)
          </h1>
          <div className="inline-block px-4 py-1 border border-black font-black text-xs uppercase tracking-wider bg-slate-100 mt-1 font-sans">
            {examType} EXAMINATION SITTING PLAN - {new Date().getFullYear()}
          </div>
        </div>

        {/* METADATA BAR (2-Column Official Metadata Table) */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b-2 border-black pb-3">
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="font-bold w-36 uppercase">Name of School:</span>
              <span className="font-black border-b border-black flex-1 uppercase">{schoolName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-36 uppercase">Subject &amp; Code:</span>
              <span className="font-black border-b border-black flex-1 uppercase">{subject} ({codeNo})</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-36 uppercase">Sitting Plan Room No:</span>
              <span className="font-black border-b border-black flex-1 uppercase text-blue-900">{roomNo}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center">
              <span className="font-bold w-36 uppercase">Day &amp; Date:</span>
              <span className="font-black border-b border-black flex-1">{day}, {examDate}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-36 uppercase">Total Seats / Candidates:</span>
              <span className="font-black border-b border-black flex-1">{totalSeats} Candidates</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-36 uppercase">Door Entrance:</span>
              <span className="font-black border-b border-black flex-1 uppercase text-indigo-900">
                {doorEntrance} ({doorEntrance === 'Left Side' ? 'Anti-Clockwise Rotation' : 'Clockwise Rotation'})
              </span>
            </div>
          </div>
        </div>

        {/* CLASSROOM SITTING LAYOUT */}
        <div className="space-y-4 pt-2">
          {/* Top of Class Label with Desk Icon */}
          <div className="w-full py-2 bg-slate-100 border-2 border-black text-center font-sans font-black text-xs tracking-wider flex items-center justify-center gap-2 uppercase">
            <Armchair className="w-4 h-4 text-black" />
            <span>FRONT OF CLASS - INVIGILATOR SEAT &amp; BLACKBOARD</span>
            <Armchair className="w-4 h-4 text-black" />
          </div>

          {/* Show DOOR Position with Arrow (Left or Right) */}
          <div className="flex items-center justify-between text-xs font-sans font-bold px-2">
            {doorEntrance === 'Left Side' ? (
              <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50 border-2 border-blue-900 px-3 py-1 font-black">
                <DoorClosed className="w-4 h-4" />
                <ArrowRight className="w-4 h-4 text-blue-700" />
                <span>ENTRANCE DOOR (STARTING POINT 0001)</span>
              </div>
            ) : (
              <div></div>
            )}

            {doorEntrance === 'Right Side' ? (
              <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50 border-2 border-blue-900 px-3 py-1 font-black">
                <span>ENTRANCE DOOR (STARTING POINT 0001)</span>
                <ArrowLeft className="w-4 h-4 text-blue-700" />
                <DoorClosed className="w-4 h-4" />
              </div>
            ) : (
              <div></div>
            )}
          </div>

          {/* SEATS GRID DISPLAY */}
          <div className="overflow-x-auto py-2">
            <div 
              className="grid gap-3 font-sans"
              style={{
                gridTemplateColumns: `repeat(${numColumns}, minmax(100px, 1fr))`
              }}
            >
              {Array.from({ length: numColumns }).map((_, colIdx) => (
                <div key={colIdx} className="space-y-2.5">
                  {/* Column Header */}
                  <div className="text-center bg-slate-800 text-white py-1 rounded-sm text-xs font-black uppercase tracking-wider">
                    Column {colIdx + 1}
                  </div>

                  {/* Column Seat Cells */}
                  <div className="space-y-2.5">
                    {generatedGrid && generatedGrid.map((row, rowIdx) => {
                      const seat = row[colIdx];
                      if (!seat) {
                        return (
                          <div 
                            key={rowIdx} 
                            className="h-14 border border-dashed border-slate-200 bg-slate-50/40 rounded flex items-center justify-center text-[10px] text-slate-300"
                          >
                            Empty
                          </div>
                        );
                      }
                      return (
                        <div
                          key={rowIdx}
                          className="h-14 bg-blue-50/90 border-2 border-black rounded-sm flex flex-col items-center justify-center p-1 shadow-2xs hover:bg-blue-100 transition"
                        >
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                            Seat No:
                          </span>
                          <span className="text-base sm:text-lg font-black text-black font-mono tracking-widest">
                            {seat.seatNo}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rear of Examination Room Label */}
          <div className="text-center text-[11px] font-sans font-bold text-slate-500 uppercase tracking-widest pt-2">
            --- REAR / BACK OF EXAMINATION ROOM ---
          </div>
        </div>

        {/* OFFICIAL FOOTER SECTION */}
        <div className="pt-6 border-t-2 border-black space-y-6 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* Row 1: Academic / Class Invigilator */}
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-bold w-56 uppercase">Academic / Class Invigilator Name:</span>
                <span className="border-b border-black flex-1 h-5"></span>
              </div>
              <div className="flex items-center">
                <span className="font-bold w-28 uppercase">Signature:</span>
                <span className="border-b border-black flex-1 h-5 mr-4"></span>
                <span className="font-bold w-16 uppercase">Date:</span>
                <span className="border-b border-black flex-1 h-5"></span>
              </div>
            </div>

            {/* Row 2: Supervisor */}
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-bold w-40 uppercase">Supervisor Name:</span>
                <span className="border-b border-black flex-1 h-5"></span>
              </div>
              <div className="flex items-center">
                <span className="font-bold w-28 uppercase">Signature:</span>
                <span className="border-b border-black flex-1 h-5 mr-4"></span>
                <span className="font-bold w-16 uppercase">Date:</span>
                <span className="border-b border-black flex-1 h-5"></span>
              </div>
            </div>
          </div>

          {/* School Seal Placeholder */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[10px] text-slate-600 italic">
              * This sitting plan must be posted outside the examination room 30 minutes before commencement.
            </div>

            <div className="w-40 h-20 border-2 border-dashed border-black rounded-lg flex flex-col items-center justify-center text-center p-2 bg-slate-50">
              <span className="text-[10px] font-black uppercase text-slate-700">SCHOOL OFFICIAL SEAL / STAMP</span>
              <span className="text-[9px] text-slate-400 mt-0.5">(Placeholder)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
