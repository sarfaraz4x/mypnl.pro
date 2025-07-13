
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Award } from 'lucide-react';
import StreakCalendar from './StreakCalendar';

interface Trade {
  id: string;
  trade_date: string;
  symbol: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  pnl: number;
  strategy_tag?: string;
  trade_type?: string;
}

interface DashboardStats {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  profitableDays: number;
}

const Dashboard = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    totalPnL: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    profitableDays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Dashboard loading timeout, forcing load');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: false });

      if (error) throw error;

      setTrades(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tradesData: Trade[]) => {
    if (tradesData.length === 0) return;

    const totalTrades = tradesData.length;
    const totalPnL = tradesData.reduce((sum, trade) => sum + trade.pnl, 0);
    const winningTrades = tradesData.filter(trade => trade.pnl > 0);
    const losingTrades = tradesData.filter(trade => trade.pnl < 0);
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length : 0;
    const bestTrade = Math.max(...tradesData.map(trade => trade.pnl));
    const worstTrade = Math.min(...tradesData.map(trade => trade.pnl));

    // Calculate profitable days
    const dailyPnL = new Map();
    tradesData.forEach(trade => {
      const date = trade.trade_date;
      dailyPnL.set(date, (dailyPnL.get(date) || 0) + trade.pnl);
    });
    const profitableDays = Array.from(dailyPnL.values()).filter(pnl => pnl > 0).length;

    setStats({
      totalTrades,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
      profitableDays
    });
  };

  // Prepare data for charts
  const dailyPnLData = trades.reduce((acc, trade) => {
    const date = new Date(trade.trade_date).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.pnl += trade.pnl;
    } else {
      acc.push({ 
        date, 
        pnl: trade.pnl,
        fill: trade.pnl >= 0 ? '#10B981' : '#EF4444'
      });
    }
    return acc;
  }, [] as Array<{ date: string; pnl: number; fill: string }>)
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weeklyPnLData = trades.reduce((acc, trade) => {
    const tradeDate = new Date(trade.trade_date);
    const day = tradeDate.getDay();
    const diff = tradeDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const weekStart = new Date(tradeDate.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekLabel = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

    const existing = acc.find(item => item.date === weekLabel);
    if (existing) {
      existing.pnl += trade.pnl;
    } else {
      acc.push({ 
        date: weekLabel, 
        pnl: trade.pnl,
        startDate: weekStart
      });
    }
    return acc;
  }, [] as Array<{ date: string; pnl: number; startDate: Date }>)
  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const monthlyPnLData = trades.reduce((acc, trade) => {
    const date = new Date(trade.trade_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.pnl += trade.pnl;
    } else {
      acc.push({ 
        date, 
        pnl: trade.pnl,
      });
    }
    return acc;
  }, [] as Array<{ date: string; pnl: number }>)
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const cumulativePnLData = trades
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
    .reduce((acc, trade, index) => {
      const cumulative = index === 0 ? trade.pnl : acc[index - 1].cumulative + trade.pnl;
      acc.push({
        date: new Date(trade.trade_date).toLocaleDateString(),
        cumulative,
        trade: trade.pnl
      });
      return acc;
    }, [] as Array<{ date: string; cumulative: number; trade: number }>);

  const strategyData = trades.reduce((acc, trade) => {
    const strategy = trade.strategy_tag || 'No Strategy';
    const existing = acc.find(item => item.name === strategy);
    if (existing) {
      existing.value += Math.abs(trade.pnl);
      existing.count += 1;
    } else {
      acc.push({ 
        name: strategy, 
        value: Math.abs(trade.pnl), 
        count: 1,
        pnl: trade.pnl
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; count: number; pnl: number }>);

  const symbolData = trades.reduce((acc, trade) => {
    const existing = acc.find(item => item.symbol === trade.symbol);
    if (existing) {
      existing.pnl += trade.pnl;
      existing.trades += 1;
    } else {
      acc.push({ 
        symbol: trade.symbol, 
        pnl: trade.pnl, 
        trades: 1 
      });
    }
    return acc;
  }, [] as Array<{ symbol: string; pnl: number; trades: number }>)
  .sort((a, b) => b.pnl - a.pnl)
  .slice(0, 5);

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label, profitColor, lossColor }: any) => {
    if (active && payload && payload.length) {
      const pnl = payload[0].value;
      const color = pnl >= 0 ? profitColor : lossColor;
      return (
        <div className="p-2 bg-slate-800 border border-slate-700 rounded-md shadow-lg">
          <p className="label text-slate-400">{`${label}`}</p>
          <p className="intro font-bold" style={{ color }}>{`P&L: $${pnl.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total lots
  const totalLots = trades.reduce((sum, trade) => sum + (Number(trade.lot_size) || 0), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with proper spacing */}
      <div className="pl-6 lg:pl-0">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's your trading overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total P&L</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">
              {stats.totalPnL >= 0 ? '+' : ''}{((stats.totalPnL / Math.max(trades.length, 1)) * 100).toFixed(1)}% avg per trade
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">
              {trades.filter(t => t.pnl > 0).length} wins of {stats.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Best Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">${stats.bestTrade.toFixed(2)}</div>
            <p className="text-xs text-slate-400">
              Avg win: ${stats.avgWin.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Worst Trade</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">${stats.worstTrade.toFixed(2)}</div>
            <p className="text-xs text-slate-400">
              Avg loss: ${stats.avgLoss.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Total Lots Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Lots</CardTitle>
            <Award className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{totalLots.toFixed(2)}</div>
            <p className="text-xs text-slate-400">Sum of all traded lots</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak Calendar */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Streak Calendar</CardTitle>
            <CardDescription className="text-slate-400">Visualize your P&L for the entire year.</CardDescription>
          </CardHeader>
          <CardContent>
            <StreakCalendar trades={trades} />
          </CardContent>
        </Card>

        {/* Daily P&L Chart */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Daily P&L</CardTitle>
            <CardDescription className="text-slate-400">
              Your daily profit and loss over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyPnLData.slice(-30)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} content={<CustomTooltip profitColor="#10B981" lossColor="#EF4444" />} />
                <Bar dataKey="pnl">
                  {dailyPnLData.slice(-30).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly P&L Chart */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Weekly P&L</CardTitle>
            <CardDescription className="text-slate-400">
              Your weekly profit and loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyPnLData.slice(-12)} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={0} angle={-45} textAnchor="end"
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} content={<CustomTooltip profitColor="#3B82F6" lossColor="#F97316" />} />
                <Bar dataKey="pnl">
                  {weeklyPnLData.slice(-12).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#3B82F6' : '#F97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly P&L Chart */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Monthly P&L</CardTitle>
            <CardDescription className="text-slate-400">
              Your monthly profit and loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPnLData.slice(-12)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} content={<CustomTooltip profitColor="#A855F7" lossColor="#EAB308" />} />
                <Bar dataKey="pnl">
                  {monthlyPnLData.slice(-12).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#A855F7' : '#EAB308'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cumulative P&L Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cumulative P&L</CardTitle>
            <CardDescription className="text-slate-400">
              Your account growth over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativePnLData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Breakdown */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Strategy Performance</CardTitle>
            <CardDescription className="text-slate-400">
              Performance breakdown by strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={strategyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {strategyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Symbols */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Symbols</CardTitle>
            <CardDescription className="text-slate-400">
              Your most profitable currency pairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {symbolData.map((symbol, index) => (
                <div key={symbol.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-700 rounded-full">
                      <span className="text-sm font-medium text-white">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{symbol.symbol}</p>
                      <p className="text-sm text-slate-400">{symbol.trades} trades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${symbol.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${symbol.pnl.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {symbolData.length === 0 && (
                <p className="text-center text-slate-400 py-8">No trades yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Trades</CardTitle>
              <CardDescription className="text-slate-400">
                Your latest trading activity
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {trades.length} total trades
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trades.slice(0, 5).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${trade.pnl >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-white">{trade.symbol}</p>
                      {trade.trade_type && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            trade.trade_type.toLowerCase() === 'buy' 
                              ? 'border-green-400 text-green-400' 
                              : 'border-red-400 text-red-400'
                          }`}
                        >
                          {trade.trade_type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {new Date(trade.trade_date).toLocaleDateString()} • Lot: {trade.lot_size}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${trade.pnl.toFixed(2)}
                  </p>
                  {trade.strategy_tag && (
                    <Badge variant="secondary" className="text-xs bg-slate-600 text-slate-300 mt-1">
                      {trade.strategy_tag}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {trades.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                <p>No trades yet. Upload your first trade to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
