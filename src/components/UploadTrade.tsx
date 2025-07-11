import { useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image, Loader2, CheckCircle, AlertCircle, X, Plus, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimit } from '@/hooks/useUsageLimit';

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
}

interface AccountSummary {
  Profit?: number;
  Deposit?: number;
  Swap?: number;
  Commission?: number;
  Balance?: number;
}

const UploadTrade = ({}: UploadTradeProps = {}) => {
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
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { hasReachedLimit, loading: isUsageLoading } = useUsageLimit();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Check if user has reached the upload limit
    if (hasReachedLimit && !isUsageLoading) {
      toast({
        title: "Upload Limit Reached",
        description: "You've reached the free trial limit of 10 uploads. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setFiles(selectedFiles);
  }, [hasReachedLimit, isUsageLoading, toast]);

  const processImageWithOCR = useCallback(async (file: File) => {
    // Check if user has reached the upload limit before processing
    if (hasReachedLimit && !isUsageLoading) {
      toast({
        title: "Upload Limit Reached",
        description: "You've reached the free trial limit of 10 uploads. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }

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
  }, [hasReachedLimit, isUsageLoading, toast]);

  const updateExtractedTrade = useCallback((id: string, field: keyof ExtractedTrade, value: string) => {
    setExtractedTrades(prev => 
      prev.map(trade => 
        trade.id === id ? { ...trade, [field]: value } : trade
      )
    );
  }, []);

  const removeExtractedTrade = useCallback((id: string) => {
    setExtractedTrades(prev => prev.filter(trade => trade.id !== id));
  }, []);

  const addNewExtractedTrade = useCallback(() => {
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
  }, []);

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has reached the upload limit
    if (hasReachedLimit && !isUsageLoading) {
      toast({
        title: "Upload Limit Reached",
        description: "You've reached the free trial limit of 10 uploads. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }
    
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
  }, [hasReachedLimit, isUsageLoading, files, tradeData, uploadScreenshot, toast]);

  const handleSaveAllTrades = async () => {
    if (extractedTrades.length === 0) return;

    // Check if user has reached the upload limit
    if (hasReachedLimit && !isUsageLoading) {
      toast({
        title: "Upload Limit Reached",
        description: "You've reached the free trial limit of 10 uploads. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }

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
    <div className="p-6 w-full max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Trade</h1>
        <p className="text-slate-400">Add trades to your journal with AI-powered screenshot analysis or manual entry</p>
      </div>

      {/* Screenshot Upload Card */}
      <div className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Image className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Screenshot Analysis</CardTitle>
                <CardDescription className="text-slate-400">
                  Upload P&L screenshots for automatic data extraction
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Limit Warning */}
            {hasReachedLimit && !isUsageLoading && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-red-400 font-semibold">Upload Limit Reached</p>
                    <p className="text-red-300 text-sm">You've used all 10 free uploads. Upgrade to continue adding trades.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300 mb-2">Drop your screenshot here or click to browse</p>
              <p className="text-sm text-slate-500">Supports JPG, PNG, GIF up to 10MB</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={hasReachedLimit || isUsageLoading}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {hasReachedLimit ? 'Limit Reached' : 'Choose File'}
              </Button>
            </div>
            {files.length > 0 && (
              <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="font-medium">{files[0].name}</span>
                </div>
                <Button
                  type="button"
                  onClick={() => processImageWithOCR(files[0])}
                  disabled={ocrProcessing || hasReachedLimit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  {ocrProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {ocrProcessing ? 'Processing...' : hasReachedLimit ? 'Limit Reached' : 'Extract Trade Data'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Summary Section */}
        {accountSummary && (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(accountSummary).map(([key, value]) => (
                  <div key={key} className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Trade Entry Button and Collapsible Card */}
        <div>
          <Button
            variant="outline"
            className="mb-2 bg-blue-600 text-slate-50 hover:bg-blue-700/90 disabled:bg-slate-600 disabled:cursor-not-allowed"
            onClick={() => setShowManualEntry((prev) => !prev)}
            disabled={hasReachedLimit}
          >
            {showManualEntry ? 'Hide Manual Trade Entry' : hasReachedLimit ? 'Limit Reached' : 'Manual Trade Entry'}
          </Button>
          {showManualEntry && (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mt-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Manual Trade Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="symbol" className="text-slate-300 text-sm font-medium">Symbol</Label>
                      <Input
                        id="symbol"
                        value={tradeData.symbol}
                        onChange={(e) => setTradeData(prev => ({ ...prev, symbol: e.target.value }))}
                        placeholder="EURUSD, GBPJPY, etc."
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="trade_type" className="text-slate-300 text-sm font-medium">Trade Type</Label>
                      <Select onValueChange={(value) => setTradeData(prev => ({ ...prev, trade_type: value }))}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                          <SelectValue placeholder="Buy or Sell" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="trade_date" className="text-slate-300 text-sm font-medium">Trade Date</Label>
                      <Input
                        id="trade_date"
                        type="date"
                        value={tradeData.trade_date}
                        onChange={(e) => setTradeData(prev => ({ ...prev, trade_date: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lot_size" className="text-slate-300 text-sm font-medium">Lot Size</Label>
                      <Input
                        id="lot_size"
                        type="number"
                        step="0.01"
                        value={tradeData.lot_size}
                        onChange={(e) => setTradeData(prev => ({ ...prev, lot_size: e.target.value }))}
                        placeholder="0.10"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="entry_price" className="text-slate-300 text-sm font-medium">Entry Price</Label>
                      <Input
                        id="entry_price"
                        type="number"
                        step="0.00001"
                        value={tradeData.entry_price}
                        onChange={(e) => setTradeData(prev => ({ ...prev, entry_price: e.target.value }))}
                        placeholder="1.12345"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exit_price" className="text-slate-300 text-sm font-medium">Exit Price</Label>
                      <Input
                        id="exit_price"
                        type="number"
                        step="0.00001"
                        value={tradeData.exit_price}
                        onChange={(e) => setTradeData(prev => ({ ...prev, exit_price: e.target.value }))}
                        placeholder="1.12545"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pnl" className="text-slate-300 text-sm font-medium">P&L ($)</Label>
                      <Input
                        id="pnl"
                        type="number"
                        step="0.01"
                        value={tradeData.pnl}
                        onChange={(e) => setTradeData(prev => ({ ...prev, pnl: e.target.value }))}
                        placeholder="15.50 or -12.30"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="strategy_tag" className="text-slate-300 text-sm font-medium">Strategy Tag (Optional)</Label>
                    <Select onValueChange={(value) => setTradeData(prev => ({ ...prev, strategy_tag: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
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
                    <Label htmlFor="notes" className="text-slate-300 text-sm font-medium">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={tradeData.notes}
                      onChange={(e) => setTradeData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="What went well? What could be improved?"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || uploading || ocrProcessing || hasReachedLimit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-medium disabled:bg-slate-600 disabled:cursor-not-allowed"
                  >
                    {(loading || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {uploading ? 'Uploading Screenshot...' : loading ? 'Adding Trade...' : hasReachedLimit ? 'Limit Reached' : 'Add Single Trade'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Extracted Trades Section */}
      {extractedTrades.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm w-full">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Plus className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Extracted Trades ({extractedTrades.length})</CardTitle>
                <CardDescription className="text-slate-400">Review and edit extracted data</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={addNewExtractedTrade} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={hasReachedLimit}>
                <Plus className="h-4 w-4 mr-1" /> {hasReachedLimit ? 'Limit Reached' : 'Add Trade'}
              </Button>
              <Button onClick={handleSaveAllTrades} disabled={loading || uploading || hasReachedLimit} className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed">
                {(loading || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {hasReachedLimit ? 'Limit Reached' : 'Save All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {extractedTrades.map((trade, index) => (
              <div key={trade.id} className="border border-slate-600/50 rounded-lg p-4 bg-slate-700/30 w-full mb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  <div className="flex flex-col min-w-[90px] flex-1">
                    <Label className="text-slate-300 text-xs">Symbol</Label>
                    <Input value={trade.symbol} onChange={(e) => updateExtractedTrade(trade.id, 'symbol', e.target.value)} className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[80px]" />
                  </div>
                  <div className="flex flex-col min-w-[90px] flex-1">
                    <Label className="text-slate-300 text-xs">Trade Type</Label>
                    <Select onValueChange={(value) => updateExtractedTrade(trade.id, 'trade_type', value)} defaultValue={trade.trade_type}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col min-w-[70px] flex-1">
                    <Label className="text-slate-300 text-xs">Lot Size</Label>
                    <Input type="number" step="0.01" value={trade.lot_size} onChange={(e) => updateExtractedTrade(trade.id, 'lot_size', e.target.value)} className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[60px]" />
                  </div>
                  <div className="flex flex-col min-w-[110px] flex-1">
                    <Label className="text-slate-300 text-xs">Entry Price</Label>
                    <Input type="number" step="0.00001" value={trade.entry_price} onChange={(e) => updateExtractedTrade(trade.id, 'entry_price', e.target.value)} className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[100px]" />
                  </div>
                  <div className="flex flex-col min-w-[110px] flex-1">
                    <Label className="text-slate-300 text-xs">Exit Price</Label>
                    <Input type="number" step="0.00001" value={trade.exit_price} onChange={(e) => updateExtractedTrade(trade.id, 'exit_price', e.target.value)} className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[100px]" />
                  </div>
                  <div className="flex flex-col min-w-[90px] flex-1">
                    <Label className="text-slate-300 text-xs">P&L ($)</Label>
                    <Input type="number" step="0.01" value={trade.pnl} onChange={(e) => updateExtractedTrade(trade.id, 'pnl', e.target.value)} className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[80px]" />
                  </div>
                  <div className="flex flex-col min-w-[130px] flex-1">
                    <Label className="text-slate-300 text-xs">Trade Date</Label>
                    <Input type="date" value={trade.trade_date} onChange={(e) => updateExtractedTrade(trade.id, 'trade_date', e.target.value)} className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[120px]" />
                  </div>
                  <div className="flex flex-col min-w-[120px] flex-1">
                    <Label className="text-slate-300 text-xs">Strategy</Label>
                    <Input value={trade.strategy} onChange={(e) => updateExtractedTrade(trade.id, 'strategy', e.target.value)} placeholder="e.g. News Fade" className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[100px]" />
                  </div>
                  <div className="flex flex-col min-w-[160px] flex-1">
                    <Label className="text-slate-300 text-xs">Notes</Label>
                    <Input value={trade.notes} onChange={(e) => updateExtractedTrade(trade.id, 'notes', e.target.value)} placeholder="e.g. High volume confirmation" className="bg-slate-700 border-slate-600 text-white h-8 px-2 text-xs min-w-[140px]" />
                  </div>
                  <div className="flex items-center h-full ml-auto">
                    <Button type="button" onClick={() => removeExtractedTrade(trade.id)} variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {/* Save All Trades Button at Bottom */}
            <div className="pt-6 border-t border-slate-700/50">
              <Button onClick={handleSaveAllTrades} disabled={loading || uploading || hasReachedLimit} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-medium disabled:bg-slate-600 disabled:cursor-not-allowed">
                {(loading || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {hasReachedLimit ? 'Limit Reached' : `Save All Trades (${extractedTrades.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show raw Gemini output if parsing failed */}
      {rawGeminiOutput && extractedTrades.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Raw Gemini Output</CardTitle>
            <CardDescription className="text-slate-400">Could not parse valid trades. Please review the output below and copy manually if needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-x-auto">{rawGeminiOutput}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadTrade;
