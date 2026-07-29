import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Layout, Sticker, LogOut, BarChart3, Users, Clock, CreditCard, RefreshCw, Calendar, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

interface SessionWithPrice {
  id: string;
  package_id: number;
  status: string;
  payment_proof_url?: string;
  user_name?: string;
  created_at: string;
  package_name: string;
  price: number;
}

const AdminLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Pembayaran', path: '/admin/sessions', icon: CreditCard },
    { name: 'Paket', path: '/admin/packages', icon: Package },
    { name: 'Frame', path: '/admin/frames', icon: Layout },
    { name: 'Stiker', path: '/admin/stickers', icon: Sticker },
    { name: 'Laporan', path: '/admin', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-white font-sans selection:bg-primary/30">
      {/* Top Bar */}
      <header className="px-4 sm:px-8 lg:px-12 py-4 sm:py-8 flex justify-between items-center border-b border-white/5 gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight font-serif">Admin <span className="text-primary italic">Dashboard</span></h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">Selamat datang, Admin CIES</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs sm:text-sm font-bold shrink-0"
        >
          <LogOut size={16} />
          <span className="hidden xs:inline">Logout</span>
          <span className="xs:hidden">Keluar</span>
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-8 lg:px-12 py-4 sm:py-8 overflow-x-auto scrollbar-none">
        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-max min-w-full sm:w-fit gap-1 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-8 lg:px-12 pb-6 sm:pb-12">
        <div className="bg-white/5 rounded-2xl sm:rounded-[2.5rem] border border-white/5 p-4 sm:p-8 lg:p-12" style={{ minHeight: '500px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatIndoDate = (dateStr: string) => {
  try {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const dayNum = parseInt(parts[2], 10);

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${dayNum} ${months[monthNum - 1] || ''} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

interface CustomDatePickerProps {
  selectedDate: string;
  onChange: (dateStr: string) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseYMD = (ymd: string) => {
    if (!ymd) return new Date();
    const parts = ymd.split('-').map(Number);
    if (parts.length !== 3) return new Date();
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const currentDateObj = parseYMD(selectedDate);
  const [viewYear, setViewYear] = useState(currentDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentDateObj.getMonth());

  useEffect(() => {
    const d = parseYMD(selectedDate);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'July', 'August', 'September', 'October', 'November', 'December',
    'January', 'February', 'March', 'April', 'May', 'June'
  ];
  const monthDisplayNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const firstDayOfViewMonth = new Date(viewYear, viewMonth, 1);
  const startDayOfWeek = firstDayOfViewMonth.getDay(); // 0 = Minggu
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const gridCells = [];

  // Hari tersisa dari bulan sebelumnya
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    gridCells.push({
      day: dayNum,
      month: prevM,
      year: prevY,
      isCurrentMonth: false,
    });
  }

  // Hari dalam bulan saat ini
  for (let d = 1; d <= daysInViewMonth; d++) {
    gridCells.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Hari awal untuk bulan berikutnya
  const totalSlots = gridCells.length <= 35 ? 35 : 42;
  const remaining = totalSlots - gridCells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    gridCells.push({
      day: d,
      month: nextM,
      year: nextY,
      isCurrentMonth: false,
    });
  }

  const handleSelectDay = (cell: { day: number; month: number; year: number }) => {
    const yStr = cell.year;
    const mStr = String(cell.month + 1).padStart(2, '0');
    const dStr = String(cell.day).padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={containerRef}>
      {/* Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all cursor-pointer w-full sm:w-auto font-bold text-xs ${
          isOpen
            ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary/50'
            : 'bg-[#131a26]/80 border border-white/5 hover:border-primary/40 text-slate-200 hover:bg-[#1b2536]'
        }`}
      >
        <Calendar size={16} className={isOpen ? 'text-white' : 'text-slate-400'} />
        <span>{formatIndoDate(selectedDate)}</span>
      </button>

      {/* Custom Popover Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 p-5 rounded-2xl bg-[#151924] border border-white/10 shadow-2xl text-white">
          {/* Header with Nav */}
          <div className="flex items-center justify-between mb-5 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-serif font-bold text-sm sm:text-base tracking-wide">
              {monthDisplayNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center mb-3 text-xs font-serif font-bold text-slate-400">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {gridCells.map((cell, idx) => {
              const cellYMD = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const isSelected = cellYMD === selectedDate;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(cell)}
                  className={`h-9 w-full rounded-md font-serif font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/50'
                      : cell.isCurrentMonth
                      ? 'text-white hover:bg-white/10'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatIndoDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return [];
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return [];
    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const dayNum = parseInt(parts[2], 10);

    const targetDate = new Date(year, monthNum - 1, dayNum);
    const startOfDay = new Date(year, monthNum - 1, dayNum, 0, 0, 0, 0);
    const endOfDay = new Date(year, monthNum - 1, dayNum, 23, 59, 59, 999);

    const paidSessions = sessions.filter(s => 
      s.status === 'completed' || 
      s.status === 'active' || 
      (s.status === 'pending' && s.payment_proof_url)
    );

    if (timeframe === 'harian') {
      return paidSessions.filter(s => {
        const d = new Date(s.created_at);
        return d >= startOfDay && d <= endOfDay;
      });
    } else if (timeframe === 'mingguan') {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return paidSessions.filter(s => {
        const d = new Date(s.created_at);
        return d >= startOfWeek && d <= endOfWeek;
      });
    } else { // bulanan
      const startOfMonth = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

      return paidSessions.filter(s => {
        const d = new Date(s.created_at);
        return d >= startOfMonth && d <= endOfMonth;
      });
    }
  }, [sessions, selectedDate, timeframe]);

  const stats = useMemo(() => {
    const totalIncome = filteredSessions.reduce((acc, s) => acc + (s.price || 0), 0);
    const count = filteredSessions.length;
    const average = count > 0 ? Math.round(totalIncome / count) : 0;
    return { totalIncome, count, average };
  }, [filteredSessions]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `Rp ${formatted}`;
  };

  return (
    <AdminLayout title="Laporan Transaksi">
      <div className="flex flex-col gap-8">
        {/* Title and Refresh Button */}
        <div className="flex justify-between items-center gap-2">
          <div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight font-serif">Laporan <span className="text-primary italic">Transaksi</span></h2>
          </div>
          <button 
            onClick={fetchSessions}
            className="p-2.5 sm:p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-primary shrink-0"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          {/* Timeframe selector (Harian, Mingguan, Bulanan) */}
          <div className="flex bg-[#131a26]/80 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
            {[
              { id: 'harian', label: 'Harian' },
              { id: 'mingguan', label: 'Mingguan' },
              { id: 'bulanan', label: 'Bulanan' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                  timeframe === t.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date Picker Pill */}
          <CustomDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />

          {/* Shortcuts */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedDate(getTodayLocalDate())}
              className="flex-1 sm:flex-initial bg-[#131a26]/80 border border-white/5 hover:border-white/10 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
            >
              Hari Ini
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setSelectedDate(`${year}-${month}-${day}`);
              }}
              className="flex-1 sm:flex-initial bg-[#131a26]/80 border border-white/5 hover:border-white/10 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer text-center"
            >
              7 Hari Lalu
            </button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Total Income */}
          <div className="bg-[#131a26]/30 border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="text-emerald-400" size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">Total Pendapatan</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">{formatCurrency(stats.totalIncome)}</p>
            </div>
          </div>

          {/* Card 2: Count */}
          <div className="bg-[#131a26]/30 border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <BarChart3 className="text-blue-400" size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">Jumlah Transaksi</p>
              <p className="text-xl sm:text-2xl font-black text-blue-400">{stats.count}</p>
            </div>
          </div>

          {/* Card 3: Average */}
          <div className="bg-[#131a26]/30 border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex items-center gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="text-purple-400" size={18} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5">Rata-rata Transaksi</p>
              <p className="text-xl sm:text-2xl font-black text-purple-400">{formatCurrency(stats.average)}</p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Detail Transaksi</h3>
          <div className="space-y-3">
            {filteredSessions.map(session => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-2 bg-[#131a26]/30 border border-white/5 rounded-2xl hover:bg-[#131a26]/50 transition-all">
                <div>
                  <p className="text-sm font-bold text-white">{session.user_name || 'Anonim'}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {session.package_name} • {formatIndoDateTime(session.created_at)}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(session.price)}</span>
                </div>
              </div>
            ))}
            {filteredSessions.length === 0 && !loading && (
              <div className="text-center py-16 text-slate-500 font-medium italic bg-[#131a26]/10 rounded-3xl border border-dashed border-white/5">
                Tidak ada transaksi pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export { AdminLayout };
export default Dashboard;
