import { useMemo, useState } from 'react';
import { useAuditLogs, AuditLogEntry } from '@/hooks/useAuditLog';
import { format, parseISO, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import {
  Bike,
  Ticket,
  ClipboardList,
  User,
  Camera,
  Wrench,
  DollarSign,
  Ruler,
  TrendingUp,
  Activity,
  Package,
  Loader2,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ENTITY_COLORS: Record<string, string> = {
  booking: 'hsl(var(--primary))',
  bike: 'hsl(var(--success))',
  coupon: 'hsl(var(--warning))',
  user: 'hsl(var(--accent))',
  pricing: 'hsl(var(--secondary))',
  height_ranges: 'hsl(280, 70%, 60%)',
  maintenance_log: 'hsl(200, 70%, 50%)',
  return_photo: 'hsl(160, 70%, 45%)',
  parts_inventory: 'hsl(320, 70%, 55%)',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'hsl(var(--success))',
  edit: 'hsl(var(--warning))',
  update: 'hsl(var(--warning))',
  delete: 'hsl(var(--destructive))',
  status_change: 'hsl(var(--primary))',
  use: 'hsl(var(--accent))',
  upload: 'hsl(200, 70%, 50%)',
};

const SIZE_COLORS: Record<string, string> = {
  'XS': 'hsl(280, 70%, 60%)',
  'S': 'hsl(160, 70%, 45%)',
  'M': 'hsl(var(--primary))',
  'L': 'hsl(var(--warning))',
  'XL': 'hsl(var(--destructive))',
};

const getEntityLabel = (entityType: string): string => {
  switch (entityType) {
    case 'bike': return 'אופניים';
    case 'coupon': return 'קופון';
    case 'booking': return 'הזמנה';
    case 'user': return 'משתמש';
    case 'return_photo': return 'תמונת החזרה';
    case 'maintenance_log': return 'יומן תחזוקה';
    case 'pricing': return 'מחירון';
    case 'height_ranges': return 'טווחי גובה';
    case 'parts_inventory': return 'מלאי חלקים';
    default: return entityType;
  }
};

const getActionLabel = (action: string): string => {
  switch (action) {
    case 'create': return 'יצירה';
    case 'edit': return 'עריכה';
    case 'update': return 'עדכון';
    case 'delete': return 'מחיקה';
    case 'status_change': return 'שינוי סטטוס';
    case 'role_change': return 'שינוי תפקיד';
    case 'upload': return 'העלאה';
    case 'use': return 'שימוש';
    default: return action;
  }
};

const getEntityIcon = (entityType: string, className = "w-4 h-4") => {
  switch (entityType) {
    case 'bike': return <Bike className={className} />;
    case 'coupon': return <Ticket className={className} />;
    case 'booking': return <ClipboardList className={className} />;
    case 'user': return <User className={className} />;
    case 'return_photo': return <Camera className={className} />;
    case 'maintenance_log': return <Wrench className={className} />;
    case 'pricing': return <DollarSign className={className} />;
    case 'height_ranges': return <Ruler className={className} />;
    case 'parts_inventory': return <Package className={className} />;
    default: return <Activity className={className} />;
  }
};

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  color?: string;
}

const StatsCard = ({ title, value, icon, change, color }: StatsCardProps) => (
  <div className="glass-card rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
            <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
            <span>{change >= 0 ? '+' : ''}{change}% מאתמול</span>
          </div>
        )}
      </div>
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color || 'hsl(var(--primary))'}20` }}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default function AuditLogDashboard() {
  const { data: logs = [], isLoading } = useAuditLogs();
  const [trendView, setTrendView] = useState<'week' | 'month'>('week');

  // Fetch bookings for statistics (size + revenue)
  const { data: bookingsData = [] } = useQuery({
    queryKey: ['bookings-for-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('riders, total_price, created_at')
        .in('status', ['confirmed', 'completed', 'checked_in', 'out_riding', 'returned']);
      return data || [];
    }
  });

  // Calculate monthly revenue
  const monthlyRevenueData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map(monthStart => {
      const monthBookings = bookingsData.filter((booking: any) => {
        const bookingDate = parseISO(booking.created_at);
        return startOfMonth(bookingDate).getTime() === monthStart.getTime();
      });
      
      const revenue = monthBookings.reduce((sum: number, booking: any) => {
        return sum + (parseFloat(booking.total_price) || 0);
      }, 0);
      
      return {
        label: format(monthStart, 'MMM yy', { locale: he }),
        revenue: Math.round(revenue),
        bookingsCount: monthBookings.length,
      };
    });
  }, [bookingsData]);

  const totalRevenue = useMemo(() => 
    monthlyRevenueData.reduce((sum, m) => sum + m.revenue, 0),
  [monthlyRevenueData]);

  // Calculate bike size statistics
  const bikeSizeData = useMemo(() => {
    const sizeCounts: Record<string, number> = {};
    bookingsData.forEach((booking: any) => {
      const riders = booking.riders || [];
      riders.forEach((rider: any) => {
        if (rider.assignedSize) {
          sizeCounts[rider.assignedSize] = (sizeCounts[rider.assignedSize] || 0) + 1;
        }
      });
    });
    
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL'];
    return sizeOrder
      .filter(size => sizeCounts[size])
      .map(size => ({
        name: size,
        value: sizeCounts[size],
        color: SIZE_COLORS[size]
      }));
  }, [bookingsData]);

  const popularSize = bikeSizeData.length > 0 
    ? bikeSizeData.reduce((a, b) => a.value > b.value ? a : b).name 
    : '-';

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    
    const todayLogs = logs.filter(log => startOfDay(parseISO(log.created_at)) >= today);
    const yesterdayLogs = logs.filter(log => {
      const date = startOfDay(parseISO(log.created_at));
      return date >= yesterday && date < today;
    });

    // Entity type counts
    const entityCounts: Record<string, number> = {};
    logs.forEach(log => {
      entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1;
    });

    // Action counts
    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    // Daily activity (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    const dailyActivity = last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = logs.filter(log => 
        format(parseISO(log.created_at), 'yyyy-MM-dd') === dayStr
      );
      return {
        date: format(day, 'EEE', { locale: he }),
        fullDate: format(day, 'd/M'),
        count: dayLogs.length,
        bookings: dayLogs.filter(l => l.entity_type === 'booking').length,
        bikes: dayLogs.filter(l => l.entity_type === 'bike').length,
      };
    });

    // Calculate percentage change
    const calcChange = (today: number, yesterday: number) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return Math.round(((today - yesterday) / yesterday) * 100);
    };

    return {
      total: logs.length,
      todayCount: todayLogs.length,
      yesterdayCount: yesterdayLogs.length,
      change: calcChange(todayLogs.length, yesterdayLogs.length),
      entityCounts,
      actionCounts,
      dailyActivity,
      bookingsToday: todayLogs.filter(l => l.entity_type === 'booking' && l.action === 'create').length,
      statusChangesToday: todayLogs.filter(l => l.action === 'status_change').length,
    };
  }, [logs]);

  // Trend data (weekly or monthly)
  const trendData = useMemo(() => {
    if (trendView === 'week') {
      // Last 8 weeks
      const weeks = eachWeekOfInterval({
        start: subWeeks(new Date(), 7),
        end: new Date(),
      }, { weekStartsOn: 0 });

      return weeks.map(weekStart => {
        const weekEnd = subDays(startOfWeek(subDays(weekStart, -7), { weekStartsOn: 0 }), 1);
        const weekLogs = logs.filter(log => {
          const logDate = parseISO(log.created_at);
          return logDate >= weekStart && logDate <= weekEnd;
        });
        
        return {
          label: format(weekStart, 'd/M'),
          total: weekLogs.length,
          bookings: weekLogs.filter(l => l.entity_type === 'booking' && l.action === 'create').length,
          statusChanges: weekLogs.filter(l => l.action === 'status_change').length,
        };
      });
    } else {
      // Last 6 months
      const months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date(),
      });

      return months.map(monthStart => {
        const monthLogs = logs.filter(log => {
          const logDate = parseISO(log.created_at);
          return startOfMonth(logDate).getTime() === monthStart.getTime();
        });
        
        return {
          label: format(monthStart, 'MMM', { locale: he }),
          total: monthLogs.length,
          bookings: monthLogs.filter(l => l.entity_type === 'booking' && l.action === 'create').length,
          statusChanges: monthLogs.filter(l => l.action === 'status_change').length,
        };
      });
    }
  }, [logs, trendView]);

  const pieData = useMemo(() => {
    return Object.entries(stats.entityCounts)
      .map(([name, value]) => ({
        name: getEntityLabel(name),
        value,
        color: ENTITY_COLORS[name] || 'hsl(var(--muted))',
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats.entityCounts]);

  const actionPieData = useMemo(() => {
    return Object.entries(stats.actionCounts)
      .map(([name, value]) => ({
        name: getActionLabel(name),
        value,
        color: ACTION_COLORS[name] || 'hsl(var(--muted))',
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats.actionCounts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">דשבורד סטטיסטיקות</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard
          title="סה״כ פעולות"
          value={stats.total}
          icon={<Activity className="w-5 h-5 text-primary" />}
          color="hsl(var(--primary))"
        />
        <StatsCard
          title="פעולות היום"
          value={stats.todayCount}
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          change={stats.change}
          color="hsl(var(--success))"
        />
        <StatsCard
          title="הזמנות חדשות היום"
          value={stats.bookingsToday}
          icon={<ClipboardList className="w-5 h-5 text-warning" />}
          color="hsl(var(--warning))"
        />
        <StatsCard
          title="שינויי סטטוס היום"
          value={stats.statusChangesToday}
          icon={<Bike className="w-5 h-5 text-accent" />}
          color="hsl(var(--accent))"
        />
        <StatsCard
          title="סה״כ הכנסות"
          value={`₪${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-success" />}
          color="hsl(var(--success))"
        />
      </div>

      {/* Trends Chart - Weekly/Monthly */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            מגמות לאורך זמן
          </h3>
          <div className="flex gap-2">
            <Button
              variant={trendView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendView('week')}
            >
              שבועי
            </Button>
            <Button
              variant={trendView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendView('month')}
            >
              חודשי
            </Button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    total: 'סה״כ פעולות',
                    bookings: 'הזמנות חדשות',
                    statusChanges: 'שינויי סטטוס',
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend 
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    total: 'סה״כ',
                    bookings: 'הזמנות',
                    statusChanges: 'שינויי סטטוס',
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="statusChanges" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-medium mb-4">פעילות ב-7 ימים אחרונים</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyActivity}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                  formatter={(value: number) => [value, 'פעולות']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Entity Type Breakdown */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-medium mb-4">התפלגות לפי סוג</h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value, 'פעולות']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {pieData.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium mr-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          הכנסות חודשיות (6 חודשים אחרונים)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `₪${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`₪${value.toLocaleString()}`, 'הכנסות'];
                  return [value, 'הזמנות'];
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--success))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Action Type Breakdown */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-medium mb-4">התפלגות לפי פעולה</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionPieData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'פעולות']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {actionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bike Size Popularity Chart */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Bike className="w-4 h-4" />
            מידות אופניים פופולריות
          </h3>
          <div className="h-48 flex items-center">
            {bikeSizeData.length > 0 ? (
              <>
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={bikeSizeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {bikeSizeData.map((entry, index) => (
                          <Cell key={`size-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [value, 'השכרות']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {bikeSizeData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold">{item.name}</span>
                      <span className="font-medium mr-auto">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-muted-foreground">מידה פופולרית:</p>
                    <p className="text-lg font-bold">{popularSize}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-muted-foreground">
                אין נתוני השכרות עדיין
              </div>
            )}
          </div>
        </div>

        {/* Top Entities */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-medium mb-4">פעילות אחרונה לפי סוג</h3>
          <div className="space-y-3">
            {Object.entries(stats.entityCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([entityType, count]) => (
                <div key={entityType} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${ENTITY_COLORS[entityType] || 'hsl(var(--muted))'}20` }}
                  >
                    {getEntityIcon(entityType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{getEntityLabel(entityType)}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div 
                        className="h-1.5 rounded-full transition-all"
                        style={{ 
                          width: `${(count / stats.total) * 100}%`,
                          backgroundColor: ENTITY_COLORS[entityType] || 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
