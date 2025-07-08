
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Eye, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  trade_date: string;
  symbol: string;
  entry_price: number;
  exit_price: number;
  lot_size: number;
  pnl: number;
  strategy_tag?: string;
  notes?: string;
  screenshot_url?: string;
  trade_type?: string;
}

const TradeJournal = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, filterStrategy, filterResult]);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: false });

      if (error) throw error;

      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTrades = () => {
    let filtered = trades;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.strategy_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Strategy filter
    if (filterStrategy !== 'all') {
      filtered = filtered.filter(trade => trade.strategy_tag === filterStrategy);
    }

    // Result filter
    if (filterResult !== 'all') {
      if (filterResult === 'win') {
        filtered = filtered.filter(trade => trade.pnl > 0);
      } else if (filterResult === 'loss') {
        filtered = filtered.filter(trade => trade.pnl < 0);
      }
    }

    setFilteredTrades(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Lot Size', 'P&L', 'Strategy', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredTrades.map(trade =>
        [
          trade.trade_date,
          trade.symbol,
          trade.trade_type || '',
          trade.entry_price,
          trade.exit_price,
          trade.lot_size,
          trade.pnl,
          trade.strategy_tag || '',
          `"${trade.notes?.replace(/"/g, '""') || ''}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Trades exported to CSV successfully"
    });
  };

  const formatPrice = (price: number) => price.toFixed(5);
  const formatPnL = (pnl: number) => `$${pnl.toFixed(2)}`;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trade Journal</h1>
          <p className="text-slate-400">Review and analyze your trading history</p>
        </div>
        <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by symbol, strategy, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Select onValueChange={setFilterStrategy} defaultValue="all">
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="scalping">Scalping</SelectItem>
                <SelectItem value="breakout">Breakout</SelectItem>
                <SelectItem value="reversal">Reversal</SelectItem>
                <SelectItem value="trend-following">Trend Following</SelectItem>
                <SelectItem value="range-trading">Range Trading</SelectItem>
                <SelectItem value="news-trading">News Trading</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setFilterResult} defaultValue="all">
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="win">Wins Only</SelectItem>
                <SelectItem value="loss">Losses Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Trades ({filteredTrades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Date</TableHead>
                  <TableHead className="text-slate-300">Symbol</TableHead>
                  <TableHead className="text-slate-300">Entry</TableHead>
                  <TableHead className="text-slate-300">Exit</TableHead>
                  <TableHead className="text-slate-300">Lot Size</TableHead>
                  <TableHead className="text-slate-300">P&L</TableHead>
                  <TableHead className="text-slate-300">Strategy</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow key={trade.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-slate-300">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        {new Date(trade.trade_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      <div className="flex items-center space-x-2">
                        <span>{trade.symbol}</span>
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
                    </TableCell>
                    <TableCell className="text-slate-300">{formatPrice(trade.entry_price)}</TableCell>
                    <TableCell className="text-slate-300">{formatPrice(trade.exit_price)}</TableCell>
                    <TableCell className="text-slate-300">{trade.lot_size}</TableCell>
                    <TableCell>
                      <div className={`flex items-center font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {formatPnL(trade.pnl)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {trade.strategy_tag && (
                        <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                          {trade.strategy_tag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTrade(trade)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Trade Details - {selectedTrade?.symbol}</DialogTitle>
                          </DialogHeader>
                          {selectedTrade && (
                            <div className={`grid ${selectedTrade.screenshot_url ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm text-slate-400">Date</label>
                                    <p className="text-white">{new Date(selectedTrade.trade_date).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-400">Symbol</label>
                                    <div className="flex items-center space-x-2">
                                      <p className="text-white font-semibold">{selectedTrade.symbol}</p>
                                      {selectedTrade.trade_type && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            selectedTrade.trade_type.toLowerCase() === 'buy' 
                                              ? 'border-green-400 text-green-400' 
                                              : 'border-red-400 text-red-400'
                                          }`}
                                        >
                                          {selectedTrade.trade_type.toUpperCase()}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-400">Entry Price</label>
                                    <p className="text-white">{formatPrice(selectedTrade.entry_price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-400">Exit Price</label>
                                    <p className="text-white">{formatPrice(selectedTrade.exit_price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-400">Lot Size</label>
                                    <p className="text-white">{selectedTrade.lot_size}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm text-slate-400">P&L</label>
                                    <p className={`font-semibold ${selectedTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {formatPnL(selectedTrade.pnl)}
                                    </p>
                                  </div>
                                </div>
                                
                                {selectedTrade.strategy_tag && (
                                  <div>
                                    <label className="text-sm text-slate-400">Strategy</label>
                                    <p className="text-white">{selectedTrade.strategy_tag}</p>
                                  </div>
                                )}
                                
                                {selectedTrade.notes && (
                                  <div>
                                    <label className="text-sm text-slate-400">Notes</label>
                                    <p className="text-slate-300 whitespace-pre-wrap">{selectedTrade.notes}</p>
                                  </div>
                                )}
                              </div>

                              {selectedTrade.screenshot_url && (
                                <div>
                                  <label className="text-sm text-slate-400 mb-2 block">Screenshot</label>
                                  <div className="overflow-auto max-h-[60vh]">
                                    <img
                                      src={selectedTrade.screenshot_url}
                                      alt="Trade screenshot"
                                      className="w-full h-auto rounded-lg border border-slate-600"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredTrades.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No trades found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeJournal;
