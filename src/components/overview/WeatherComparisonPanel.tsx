import { useEffect, useMemo, useState } from 'react';
import WeatherComparisonList from './WeatherComparisonList';
import { getWeatherComparisonRows } from '../../data/weatherComparisonSelectors';
import { useInteraction } from '../../store/interactionContext';
import type {
  WeatherComparisonMetric,
  WeatherComparisonMode,
  WeatherComparisonRow
} from '../../types/data';

const modeOptions: Array<{ id: WeatherComparisonMode; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'time_period', label: '按时段' },
  { id: 'traffic_density', label: '按交通' },
  { id: 'vehicle_type', label: '按载具' }
];

const timeOptions = ['All', 'breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night'];
const trafficOptions = ['All', 'Low', 'Medium', 'High', 'Jam'];
const vehicleOptions = ['All', 'motorcycle', 'scooter', 'electric_scooter'];

const metricOptions: Array<{ id: WeatherComparisonMetric; label: string }> = [
  { id: 'delay_rate', label: '延迟率' },
  { id: 'avg_delivery_duration_min', label: '平均时长' },
  { id: 'order_count', label: '订单量' }
];

const conditionLabels: Record<string, string> = {
  All: '全部',
  breakfast: '早餐',
  lunch_peak: '午高峰',
  afternoon: '下午',
  dinner_peak: '晚高峰',
  night: '夜间',
  Low: '低密度',
  Medium: '中密度',
  High: '高密度',
  Jam: '拥堵',
  motorcycle: '摩托车',
  scooter: '踏板车',
  electric_scooter: '电动车'
};

function defaultCondition(mode: WeatherComparisonMode) {
  if (mode === 'time_period' || mode === 'traffic_density' || mode === 'vehicle_type') return 'All';
  return 'All';
}

function subViewForMode(mode: WeatherComparisonMode) {
  if (mode === 'time_period') return 'time';
  if (mode === 'traffic_density') return 'traffic';
  if (mode === 'vehicle_type') return 'vehicle';
  return 'overview';
}

function conditionOptions(mode: WeatherComparisonMode) {
  if (mode === 'time_period') return timeOptions;
  if (mode === 'traffic_density') return trafficOptions;
  if (mode === 'vehicle_type') return vehicleOptions;
  return ['All'];
}

export default function WeatherComparisonPanel() {
  const {
    switchModule,
    setSelectedSubView,
    setSelectedTimePeriod,
    setSelectedTrafficDensity,
    setSelectedVehicleType,
    setWeatherComparisonContext,
    setSelectedItem
  } = useInteraction();
  const [mode, setMode] = useState<WeatherComparisonMode>('all');
  const [condition, setCondition] = useState('All');
  const [metric, setMetric] = useState<WeatherComparisonMetric>('delay_rate');
  const [rows, setRows] = useState<WeatherComparisonRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentOptions = useMemo(() => conditionOptions(mode), [mode]);

  useEffect(() => {
    const nextCondition = defaultCondition(mode);
    setCondition(nextCondition);
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getWeatherComparisonRows({
      mode,
      selectedTimePeriod: condition,
      selectedTrafficDensity: condition,
      selectedVehicleType: condition,
      metric
    })
      .then((nextRows) => {
        if (!mounted) return;
        setRows(nextRows);
        setWeatherComparisonContext({
          mode,
          condition,
          metric,
          row: null,
          isPreview: false
        });
      })
      .catch((error) => {
        console.warn('[WeatherComparisonPanel] Failed to load comparison rows.', error);
        if (mounted) setRows([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [condition, metric, mode, setWeatherComparisonContext]);

  const handlePreview = (row: WeatherComparisonRow | null) => {
    if (row) setSelectedItem(null);
    setWeatherComparisonContext({ mode, condition, metric, row, isPreview: Boolean(row) });
  };

  const handleSelect = (row: WeatherComparisonRow) => {
    switchModule(row.moduleId);
    const subView = subViewForMode(mode);
    setSelectedSubView(subView);
    if (mode === 'time_period') {
      setSelectedTimePeriod(condition);
    } else if (mode === 'traffic_density') {
      setSelectedTrafficDensity(condition);
    } else if (mode === 'vehicle_type') {
      setSelectedVehicleType(condition);
    }
    setWeatherComparisonContext({ mode, condition, metric, row, isPreview: false });
    window.setTimeout(() => {
      setSelectedSubView(subView);
      if (mode === 'time_period') {
        setSelectedTimePeriod(condition);
      } else if (mode === 'traffic_density') {
        setSelectedTrafficDensity(condition);
      } else if (mode === 'vehicle_type') {
        setSelectedVehicleType(condition);
      }
    }, 0);
  };

  return (
    <section className="weather-comparison-section" aria-labelledby="weather-comparison-title">
      <div className="mimo-section-heading">
        <span>02</span>
        <div>
          <p>天气对比</p>
          <h2 id="weather-comparison-title">天气横向对比</h2>
        </div>
      </div>

      <div className="weather-comparison-toolbar" aria-label="天气横向对比控制">
        <div className="comparison-control-group">
          <span>比较方式</span>
          <div>
            {modeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={mode === option.id ? 'is-active' : ''}
                onClick={() => setMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="comparison-control-group">
          <span>筛选条件</span>
          <div>
            {currentOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={condition === option ? 'is-active' : ''}
                onClick={() => setCondition(option)}
                disabled={mode === 'all'}
              >
                {conditionLabels[option] ?? option}
              </button>
            ))}
          </div>
        </div>
        <div className="comparison-control-group">
          <span>比较指标</span>
          <div>
            {metricOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={metric === option.id ? 'is-active' : ''}
                onClick={() => setMetric(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="weather-comparison-loading">正在加载对比数据</div>
      ) : (
        <WeatherComparisonList
          rows={rows}
          metric={metric}
          activeWeather={null}
          onPreview={handlePreview}
          onSelect={handleSelect}
        />
      )}
    </section>
  );
}
