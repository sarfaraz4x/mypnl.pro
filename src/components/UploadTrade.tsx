import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image, Loader2, CheckCircle, AlertCircle, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TradeData {
  symbol: string;
  entry_price: string;
  exit_price: string;
  lot_size: string;
  pnl: string;
  trade_date: string;
  strategy_tag: string;
  notes: string;
  trade_type: string;
}

interface ExtractedTrade {
  id: string;
  symbol: string;
  trade_type: string;
  lot_size: string;
  entry_price: string;
  exit_price: string;
  pnl: string;
  trade_date: string;
  strategy: string;
  notes: string;
}

interface UploadTradeProps {
  onTradeAdded?: () => void;
}

interface AccountSummary {
  Profit?: number;
  Deposit?: number;
  Swap?: number;
  Commission?: number;
  Balance?: number;
}

const UploadTrade = ({ onTradeAdded }: UploadTradeProps = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [tradeData, setTradeData] = useState<TradeData>({
    symbol: '',
    entry_price: '',
    exit_price: '',
    lot_size: '',
    pnl: '',
    trade_date: new Date().toISOString().split('T')[0],
    strategy_tag: '',
    notes: '',
    trade_type: ''
  });
  const [extractedTrades, setExtractedTrades] = useState<ExtractedTrade[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [rawGeminiOutput, setRawGeminiOutput] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const processImageWithOCR = async (file: File) => {
    setOcrProcessing(true);
    try {
      // Hide intermediate toasts: toast({ title: "Extracting text with OCR…", description: "Contacting OCR.space API…" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("apikey", import.meta.env.VITE_FREE_OCR_API_KEY!);
      formData.append("language", "eng");

      // Call OCR.space API
      const response = await fetch(`https://api.ocr.space/parse/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({ title: "OCR failed.", description: errorText, variant: "destructive" });
        throw new Error(`OCR.space API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        toast({ title: "OCR processing error.", description: result.ErrorMessage.join(', '), variant: "destructive" });
        throw new Error(`OCR.space error: ${result.ErrorMessage.join(', ')}`);
      }
      
      const extractedText = result.ParsedResults?.[0]?.ParsedText;
      if (!extractedText) {
        toast({ title: "OCR failed. Please check image clarity.", description: "No text found in image.", variant: "destructive" });
        setExtractedTrades([]);
        setAccountSummary(null);
        return;
      }
      console.log('Extracted OCR text:', extractedText);

      // Hide intermediate toasts: toast({ title: "Sending to Gemini…", description: "Analyzing extracted text…" });
      // Use Gemini API to extract trade data
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract all trading data and account summary details in a single JSON object. The JSON object should have two keys: 'summary' and 'trades'.\n\nThe 'summary' object should include:\n- Profit\n- Deposit\n- Swap\n- Commission\n- Balance\n\nEach object in the 'trades' array should include:\n- Symbol\n- Direction (Buy/Sell)\n- LotSize\n- Entry\n- Exit\n- PnL\n- TradeDate (in YYYY-MM-DD format)\n\nDo not include a 'Balance (D-trial)' field.\n\nScreenshot text:\n${extractedText}`
            }]
          }]
        })
      });
      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        toast({ title: "Gemini API error", description: errorText, variant: "destructive" });
        throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
      }
      const geminiResult = await geminiResponse.json();
      const geminiText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

      if (geminiText) {
        const cleanedText = geminiText.replace(/```json|```/g, '').trim();
        try {
          const parsedData = JSON.parse(cleanedText);

          if (parsedData.trades && Array.isArray(parsedData.trades)) {
            const newExtractedTrades: ExtractedTrade[] = parsedData.trades.map((trade: any, index: number) => ({
              id: `extracted-${Date.now()}-${index}`,
              symbol: trade.symbol || trade.Symbol || '',
              trade_type: (trade.direction || trade.Direction || '').toLowerCase() === 'sell' ? 'sell' : 'buy',
              lot_size: trade.lot_size || trade.LotSize || '',
              entry_price: trade.entry || trade.Entry || '',
              exit_price: trade.exit || trade.Exit || '',
              pnl: trade.pnl || trade.PnL || '',
              trade_date: trade.TradeDate || new Date().toISOString().split('T')[0],
              strategy: '',
              notes: ''
            }));
            setExtractedTrades(newExtractedTrades);
            toast({ title: "Success!", description: `Extracted ${newExtractedTrades.length} trade(s).` });
          } else {
            setExtractedTrades([]);
          }

          if (parsedData.summary) {
            setAccountSummary(parsedData.summary);
          } else {
            setAccountSummary(null);
          }

        } catch (error) {
          toast({ title: "Analysis failed", description: "Could not parse data from text.", variant: "destructive" });
          setExtractedTrades([]);
          setAccountSummary(null);
          setRawGeminiOutput(cleanedText);
        }
        return; // Only show success or error toast, so return here if successful
      }
      setExtractedTrades([]);
      setAccountSummary(null);
      toast({ title: "Unable to extract valid trades from Gemini output.", description: "Showing raw Gemini output below.", variant: "destructive" });
      setRawGeminiOutput(geminiText || '');
      console.log('Raw Gemini output:', geminiText);
    } catch (error) {
      console.error('OCR/Gemini Error:', error);
      toast({ title: "Extraction failed", description: String(error), variant: "destructive" });
      setExtractedTrades([]);
      setAccountSummary(null);
    } finally {
      setOcrProcessing(false);
    }
  };

  const updateExtractedTrade = (id: string, field: keyof ExtractedTrade, value: string) => {
    setExtractedTrades(prev => 
      prev.map(trade => 
        trade.id === id ? { ...trade, [field]: value } : trade
      )
    );
  };

  const removeExtractedTrade = (id: string) => {
    setExtractedTrades(prev => prev.filter(trade => trade.id !== id));
  };

  const addNewExtractedTrade = () => {
    const newTrade: ExtractedTrade = {
      id: `manual-${Date.now()}`,
      symbol: '',
      trade_type: 'buy',
      lot_size: '',
      entry_price: '',
      exit_price: '',
      pnl: '',
      trade_date: new Date().toISOString().split('T')[0],
      strategy: '',
      notes: ''
    };
    setExtractedTrades(prev => [...prev, newTrade]);
  };

  const uploadScreenshot = async (file: File) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('trade-screenshots')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      let screenshotUrl = '';
      
      // Upload screenshot if provided
      if (files.length > 0) {
        setUploading(true);
        screenshotUrl = await uploadScreenshot(files[0]);
        setUploading(false);
      }

      // Insert trade data
      const { error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol: tradeData.symbol,
          entry_price: parseFloat(tradeData.entry_price),
          exit_price: parseFloat(tradeData.exit_price),
          lot_size: parseFloat(tradeData.lot_size),
          pnl: parseFloat(tradeData.pnl),
          trade_date: tradeData.trade_date,
          strategy_tag: tradeData.strategy_tag || null,
          notes: tradeData.notes || null,
          screenshot_url: screenshotUrl || null,
          trade_type: tradeData.trade_type || null
        });

      if (error) throw error;

      toast({
        title: "Trade Added!",
        description: "Your trade has been successfully recorded.",
      });

      // Refresh usage count
      if (onTradeAdded) {
        onTradeAdded();
      }

      // Reset form
      setTradeData({
        symbol: '',
        entry_price: '',
        exit_price: '',
        lot_size: '',
        pnl: '',
        trade_date: new Date().toISOString().split('T')[0],
        strategy_tag: '',
        notes: '',
        trade_type: ''
      });
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSaveAllTrades = async () => {
    if (extractedTrades.length === 0) return;

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      let screenshotUrl = '';
      
      // Upload screenshot if provided
      if (files.length > 0) {
        setUploading(true);
        screenshotUrl = await uploadScreenshot(files[0]);
        setUploading(false);
      }

      // Prepare trades for insertion
      const tradesToInsert = extractedTrades.map(trade => ({
        user_id: user.id,
        symbol: trade.symbol,
        entry_price: parseFloat(trade.entry_price) || 0,
        exit_price: parseFloat(trade.exit_price) || 0,
        lot_size: parseFloat(trade.lot_size) || 0,
        pnl: parseFloat(trade.pnl) || 0,
        trade_date: trade.trade_date,
        strategy_tag: trade.strategy || null,
        notes: trade.notes || null,
        screenshot_url: screenshotUrl || null,
        trade_type: trade.trade_type
      }));

      const { error } = await supabase
        .from('trades')
        .insert(tradesToInsert);

      if (error) throw error;

      toast({
        title: "All Trades Added!",
        description: `Successfully saved ${extractedTrades.length} trades.`,
      });

      // Refresh usage count
      if (onTradeAdded) {
        onTradeAdded();
      }

      // Reset extracted trades
      setExtractedTrades([]);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Trade</h1>
        <p className="text-slate-400">Add a new trade to your journal with screenshot analysis</p>
      </div>

      {/* Screenshot Upload */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Screenshot Upload (Optional)
          </CardTitle>
          <CardDescription className="text-slate-400">
            Upload your P&L screenshot for automatic data extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
            />
            
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>{files[0].name}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => processImageWithOCR(files[0])}
                    disabled={ocrProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {ocrProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {ocrProcessing ? 'Processing...' : 'Extract Data from Screenshot'}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      // Test with sample data
                      const sampleTrades: ExtractedTrade[] = [
                        {
                          id: `test-${Date.now()}`,
                          symbol: 'EURUSD',
                          trade_type: 'buy',
                          lot_size: '0.10',
                          entry_price: '1.12345',
                          exit_price: '1.12445',
                          pnl: '10.00',
                          trade_date: new Date().toISOString().split('T')[0],
                          strategy: 'Test Strategy',
                          notes: 'This is a test note.'
                        },
                        {
                          id: `test-${Date.now()}-2`,
                          symbol: 'GBPJPY',
                          trade_type: 'sell',
                          lot_size: '0.05',
                          entry_price: '185.123',
                          exit_price: '185.098',
                          pnl: '-12.50',
                          trade_date: new Date().toISOString().split('T')[0],
                          strategy: '',
                          notes: ''
                        }
                      ];
                      setExtractedTrades(sampleTrades);
                      toast({
                        title: "Test Data Loaded",
                        description: "Loaded 2 sample trades for testing.",
                      });
                    }}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Test with Sample Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Summary Section */}
      {accountSummary && (
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Account Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(accountSummary).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Trades Section */}
      {extractedTrades.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Extracted Trades ({extractedTrades.length})</CardTitle>
              <div className="space-x-2">
                <Button
                  type="button"
                  onClick={addNewExtractedTrade}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Trade
                </Button>
                <Button
                  onClick={handleSaveAllTrades}
                  disabled={loading || uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {(loading || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save All Trades
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedTrades.map((trade, index) => (
              <div key={trade.id} className="border border-slate-600 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Trade {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeExtractedTrade(trade.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-300">Symbol</Label>
                    <Input
                      value={trade.symbol}
                      onChange={(e) => updateExtractedTrade(trade.id, 'symbol', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Trade Type</Label>
                    <Select onValueChange={(value) => updateExtractedTrade(trade.id, 'trade_type', value)} defaultValue={trade.trade_type}>
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
                    <Label className="text-slate-300">Lot Size</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={trade.lot_size}
                      onChange={(e) => updateExtractedTrade(trade.id, 'lot_size', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Entry Price</Label>
                    <Input
                      type="number"
                      step="0.00001"
                      value={trade.entry_price}
                      onChange={(e) => updateExtractedTrade(trade.id, 'entry_price', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">Exit Price</Label>
                    <Input
                      type="number"
                      step="0.00001"
                      value={trade.exit_price}
                      onChange={(e) => updateExtractedTrade(trade.id, 'exit_price', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-300">P&L ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={trade.pnl}
                      onChange={(e) => updateExtractedTrade(trade.id, 'pnl', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Trade Date</Label>
                  <Input
                    type="date"
                    value={trade.trade_date}
                    onChange={(e) => updateExtractedTrade(trade.id, 'trade_date', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                  <div>
                    <Label className="text-slate-300">Strategy (Optional)</Label>
                    <Input
                      value={trade.strategy}
                      onChange={(e) => updateExtractedTrade(trade.id, 'strategy', e.target.value)}
                      placeholder="e.g. News Fade"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Notes (Optional)</Label>
                    <Textarea
                      value={trade.notes}
                      onChange={(e) => updateExtractedTrade(trade.id, 'notes', e.target.value)}
                      placeholder="e.g. High volume confirmation"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Show raw Gemini output if parsing failed */}
      {rawGeminiOutput && extractedTrades.length === 0 && (
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Raw Gemini Output</CardTitle>
            <CardDescription className="text-slate-400">Could not parse valid trades. Please review the output below and copy manually if needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-x-auto">{rawGeminiOutput}</pre>
          </CardContent>
        </Card>
      )}

      {/* Manual Trade Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Manual Trade Entry</CardTitle>
            <CardDescription className="text-slate-400">
              Enter trade information manually or use extracted data above
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol" className="text-slate-300">Symbol</Label>
                <Input
                  id="symbol"
                  value={tradeData.symbol}
                  onChange={(e) => setTradeData(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="EURUSD, GBPJPY, etc."
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="trade_type" className="text-slate-300">Trade Type</Label>
                <Select onValueChange={(value) => setTradeData(prev => ({ ...prev, trade_type: value }))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Buy or Sell" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trade_date" className="text-slate-300">Trade Date</Label>
                <Input
                  id="trade_date"
                  type="date"
                  value={tradeData.trade_date}
                  onChange={(e) => setTradeData(prev => ({ ...prev, trade_date: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lot_size" className="text-slate-300">Lot Size</Label>
                <Input
                  id="lot_size"
                  type="number"
                  step="0.01"
                  value={tradeData.lot_size}
                  onChange={(e) => setTradeData(prev => ({ ...prev, lot_size: e.target.value }))}
                  placeholder="0.10"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="entry_price" className="text-slate-300">Entry Price</Label>
                <Input
                  id="entry_price"
                  type="number"
                  step="0.00001"
                  value={tradeData.entry_price}
                  onChange={(e) => setTradeData(prev => ({ ...prev, entry_price: e.target.value }))}
                  placeholder="1.12345"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="exit_price" className="text-slate-300">Exit Price</Label>
                <Input
                  id="exit_price"
                  type="number"
                  step="0.00001"
                  value={tradeData.exit_price}
                  onChange={(e) => setTradeData(prev => ({ ...prev, exit_price: e.target.value }))}
                  placeholder="1.12545"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pnl" className="text-slate-300">P&L ($)</Label>
                <Input
                  id="pnl"
                  type="number"
                  step="0.01"
                  value={tradeData.pnl}
                  onChange={(e) => setTradeData(prev => ({ ...prev, pnl: e.target.value }))}
                  placeholder="15.50 or -12.30"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="strategy_tag" className="text-slate-300">Strategy Tag (Optional)</Label>
              <Select onValueChange={(value) => setTradeData(prev => ({ ...prev, strategy_tag: value }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="scalping">Scalping</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                  <SelectItem value="reversal">Reversal</SelectItem>
                  <SelectItem value="trend-following">Trend Following</SelectItem>
                  <SelectItem value="range-trading">Range Trading</SelectItem>
                  <SelectItem value="news-trading">News Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={tradeData.notes}
                onChange={(e) => setTradeData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="What went well? What could be improved?"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={loading || uploading || ocrProcessing}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
        >
          {(loading || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {uploading ? 'Uploading Screenshot...' : loading ? 'Adding Trade...' : 'Add Single Trade'}
        </Button>
      </form>
    </div>
  );
};

export default UploadTrade;
