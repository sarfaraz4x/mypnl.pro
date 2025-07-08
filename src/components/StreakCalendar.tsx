import { useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { format, parseISO } from 'date-fns';

interface Trade {
  trade_date: string;
  pnl: number;
}

interface StreakCalendarProps {
  trades: Trade[];
}

interface DailyPnL {
  [date: string]: number;
}

type HeatmapValue = {
  date: string;
  count: number;
};

const StreakCalendar = ({ trades }: StreakCalendarProps) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const dailyPnL = trades.reduce((acc, trade) => {
    const date = format(parseISO(trade.trade_date), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + trade.pnl;
    return acc;
  }, {} as DailyPnL);

  const heatmapValues: HeatmapValue[] = Object.keys(dailyPnL).map(date => ({
    date,
    count: dailyPnL[date],
  }));

  const yearlyTrades = heatmapValues.filter(
    (value) => new Date(value.date).getFullYear() === year
  );

  const getTooltipDataAttrs = (value: HeatmapValue) => {
    if (!value || !value.date) {
      return {};
    }
    const pnl = value.count || 0;
    const formattedDate = format(parseISO(value.date), 'MMMM d, yyyy');
    return {
      'data-tooltip-id': 'heatmap-tooltip',
      'data-tooltip-content': `${formattedDate}: P&L $${pnl.toFixed(2)}`,
    } as any;
  };

  const getClassForValue = (value: HeatmapValue) => {
    if (!value || value.count === undefined) {
      return 'color-empty';
    }
    const pnl = value.count;
    if (pnl > 200) return 'color-profit-4';
    if (pnl > 50) return 'color-profit-3';
    if (pnl > 0) return 'color-profit-2';
    if (pnl === 0) return 'color-profit-1';
    if (pnl < -200) return 'color-loss-4';
    if (pnl < -50) return 'color-loss-3';
    if (pnl < 0) return 'color-loss-2';
    return 'color-empty';
  };



  return (
    <div className="streak-calendar-container">
       <div className="flex justify-between items-center mb-4 px-2">
        <button 
          onClick={() => setYear(year - 1)} 
          className="p-1 rounded-md hover:bg-slate-700 text-white"
        >
          &lt;
        </button>
        <h3 className="text-lg font-semibold text-white">{year}</h3>
        <button 
          onClick={() => setYear(year + 1)} 
          disabled={year === new Date().getFullYear()}
          className="p-1 rounded-md hover:bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
      </div>
      <CalendarHeatmap
        startDate={new Date(`${year}-01-01`)}
        endDate={new Date(`${year}-12-31`)}
        values={yearlyTrades}
        classForValue={getClassForValue}
        tooltipDataAttrs={getTooltipDataAttrs}
        showWeekdayLabels
      />
      <Tooltip id="heatmap-tooltip" />
    </div>
  );
};

export default StreakCalendar;
