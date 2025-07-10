
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
  strategy_chart_url?: string | null;
}

const TradeJournal = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [strategyChartFile, setStrategyChartFile] = useState<File | null>(null);
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

  const handleEditClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setEditForm({ ...trade });
    setEditMode(true);
    setStrategyChartFile(null);
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleStrategyChartFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStrategyChartFile(e.target.files[0]);
    }
  };

  const handleEditSave = async () => {
    try {
      let strategyChartUrl = editForm.strategy_chart_url || null;
      if (strategyChartFile) {
        // Upload to Supabase Storage
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('User not authenticated');
        const fileExt = strategyChartFile.name.split('.').pop();
        const fileName = `${user.id}/strategy-chart-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, strategyChartFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName);
        strategyChartUrl = urlData.publicUrl;
      }
      const { error } = await supabase
        .from('trades')
        .update({
          trade_date: editForm.trade_date,
          symbol: editForm.symbol,
          entry_price: parseFloat(editForm.entry_price),
          exit_price: parseFloat(editForm.exit_price),
          lot_size: parseFloat(editForm.lot_size),
          pnl: parseFloat(editForm.pnl),
          strategy_tag: editForm.strategy_tag || null,
          notes: editForm.notes || null,
          trade_type: editForm.trade_type || null,
          strategy_chart_url: strategyChartUrl,
        })
        .eq('id', editForm.id);
      if (error) throw error;
      toast({ title: 'Trade updated', description: 'Trade updated successfully.' });
      setEditMode(false);
      setSelectedTrade(null);
      fetchTrades();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    try {
      const { error } = await supabase.from('trades').delete().eq('id', tradeId);
      if (error) throw error;
      toast({ title: 'Trade deleted', description: 'Trade deleted successfully.' });
      setSelectedTrade(null);
      fetchTrades();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

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
                      <Dialog open={selectedTrade?.id === trade.id} onOpenChange={(open) => { if (!open) { setSelectedTrade(null); setEditMode(false); } }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(trade)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl overflow-y-auto max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Trade Details - {editForm?.symbol || selectedTrade?.symbol}</DialogTitle>
                          </DialogHeader>
                          {editMode && editForm ? (
                            <>
                              <div className="flex flex-col md:flex-row gap-6 py-4">
                                {/* Left: Editable fields */}
                                <div className="w-full md:w-1/2 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm text-slate-400">Date</label>
                                      <Input type="date" value={editForm.trade_date} onChange={e => handleEditChange('trade_date', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Symbol</label>
                                      <Input value={editForm.symbol} onChange={e => handleEditChange('symbol', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Entry Price</label>
                                      <Input type="number" step="0.00001" value={editForm.entry_price} onChange={e => handleEditChange('entry_price', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Exit Price</label>
                                      <Input type="number" step="0.00001" value={editForm.exit_price} onChange={e => handleEditChange('exit_price', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Lot Size</label>
                                      <Input type="number" step="0.01" value={editForm.lot_size} onChange={e => handleEditChange('lot_size', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">P&L</label>
                                      <Input type="number" step="0.01" value={editForm.pnl} onChange={e => handleEditChange('pnl', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Trade Type</label>
                                      <Select onValueChange={value => handleEditChange('trade_type', value)} defaultValue={editForm.trade_type}>
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-700 border-slate-600">
                                          <SelectItem value="buy">Buy</SelectItem>
                                          <SelectItem value="sell">Sell</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Strategy</label>
                                      <Input value={editForm.strategy_tag || ''} onChange={e => handleEditChange('strategy_tag', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-slate-400">Notes</label>
                                      <Input value={editForm.notes || ''} onChange={e => handleEditChange('notes', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                                    </div>
                                  </div>
                                </div>
                                {/* Right: Screenshot */}
                                {editForm.screenshot_url && (
                                  <div className="w-full md:w-1/2 flex flex-col items-center md:sticky md:top-0">
                                    <label className="text-sm text-slate-400 mb-2 block">Screenshot</label>
                                    <div className="overflow-x-auto w-full flex justify-center">
                                      <img
                                        src={editForm.screenshot_url}
                                        alt="Trade screenshot"
                                        className="w-full max-w-md max-h-96 rounded-lg border border-slate-600 object-contain"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Strategy Chart Upload at Bottom (always visible) */}
                              <div className="mt-6 w-full flex flex-col items-center">
                                <label className="text-sm text-slate-400">Strategy Chart Image</label>
                                <div className="w-full max-w-md">
                                  <Input type="file" accept="image/*" onChange={handleStrategyChartFile} className="bg-slate-700 border-slate-600 text-white" />
                                  {editForm?.strategy_chart_url && (
                                    <div className="mt-2 flex justify-center overflow-x-auto">
                                      <img src={editForm.strategy_chart_url} alt="Strategy Chart" className="w-full max-w-md max-h-96 rounded border border-slate-600 object-contain" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Save and Delete Buttons at Bottom */}
                              <div className="flex flex-col md:flex-row gap-4 justify-between pt-6 w-full">
                                <Button onClick={handleEditSave} className="bg-green-600 hover:bg-green-700 w-full md:w-auto">Save Changes</Button>
                                <Button onClick={() => handleDeleteTrade(editForm.id)} className="bg-red-600 hover:bg-red-700 w-full md:w-auto">Delete Trade</Button>
                              </div>
                            </>
                          ) : selectedTrade && (
                            <>
                              <div className="flex flex-col md:flex-row gap-6 py-4">
                                {/* Left: Details */}
                                <div className="w-full md:w-1/2 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                      <p className={`font-semibold ${selectedTrade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatPnL(selectedTrade.pnl)}</p>
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
                                {/* Right: Screenshot */}
                              {selectedTrade.screenshot_url && (
                                <div className="w-full md:w-1/2 flex flex-col items-center md:sticky md:top-0">
                                  <label className="text-sm text-slate-400 mb-2 block">Screenshot</label>
                                  <div className="overflow-x-auto w-full flex justify-center">
                                    <img
                                      src={selectedTrade.screenshot_url}
                                      alt="Trade screenshot"
                                      className="w-full max-w-md max-h-96 rounded-lg border border-slate-600 object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                              {/* Strategy Chart at Bottom (always visible) */}
                              {selectedTrade?.strategy_chart_url && (
                                <div className="mt-6 w-full flex flex-col items-center">
                                  <label className="text-sm text-slate-400">Strategy Chart Image</label>
                                  <div className="mt-2 flex justify-center w-full max-w-md overflow-x-auto">
                                    <img src={selectedTrade.strategy_chart_url} alt="Strategy Chart" className="w-full max-w-md max-h-96 rounded border border-slate-600 object-contain" />
                                  </div>
                                </div>
                              )}
                              {/* Edit button at bottom right if not in edit mode */}
                              <div className="flex justify-end pt-4 w-full">
                                <Button onClick={() => setEditMode(true)} className="bg-blue-600 hover:bg-blue-700">Edit</Button>
                            </div>
                            </>
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
