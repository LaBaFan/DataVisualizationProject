import WeatherOrdersView from './weather/WeatherOrdersView';
import WeatherOverviewView from './weather/WeatherOverviewView';
import WeatherRiskView from './weather/WeatherRiskView';
import WeatherTimeView from './weather/WeatherTimeView';
import WeatherTrafficView from './weather/WeatherTrafficView';
import WeatherVehicleView from './weather/WeatherVehicleView';
import { useWeatherViewData } from './weather/weatherViewUtils';
import type { WeatherSubView } from '../store/interactionContext';

interface WeatherSubViewPanelProps {
  selectedWeather: string;
  selectedSubView: WeatherSubView;
  selectedTimePeriod: string;
}

export default function WeatherSubViewPanel({
  selectedWeather,
  selectedSubView,
  selectedTimePeriod
}: WeatherSubViewPanelProps) {
  const data = useWeatherViewData();

  switch (selectedSubView) {
    case 'traffic':
      return <WeatherTrafficView selectedWeather={selectedWeather} data={data} />;
    case 'time':
      return <WeatherTimeView selectedWeather={selectedWeather} selectedTimePeriod={selectedTimePeriod} data={data} />;
    case 'vehicle':
      return <WeatherVehicleView selectedWeather={selectedWeather} selectedTimePeriod={selectedTimePeriod} data={data} />;
    case 'risk':
      return <WeatherRiskView selectedWeather={selectedWeather} selectedTimePeriod={selectedTimePeriod} data={data} />;
    case 'orders':
      return <WeatherOrdersView selectedWeather={selectedWeather} selectedTimePeriod={selectedTimePeriod} data={data} />;
    case 'overview':
    default:
      return <WeatherOverviewView selectedWeather={selectedWeather} data={data} />;
  }
}
