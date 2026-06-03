export type FoodIconName =
  | 'area'
  | 'weather'
  | 'traffic'
  | 'time'
  | 'vehicle'
  | 'delay'
  | 'restaurant'
  | 'rider'
  | 'customer'
  | 'ticket'
  | 'multi'
  | 'risk';

export const foodIconPaths: Record<FoodIconName, string> = {
  area: 'M6 3.5h12l2.5 5.5-8.5 12-8.5-12L6 3.5Zm.5 5.5h17M12 3.5 9.5 9l2.5 12M18 3.5 20.5 9 12 21',
  weather: 'M7.5 16.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.3 9.9 3.6 3.6 0 0 0 7.5 16.5Zm3.2-12.7 1-2.1m5.6 4.1 2-1.2M4 6.8 2.2 5.6',
  traffic: 'M7 4h10l2 6-1.5 10h-13L3 10l2-6Zm.5 5.5h9M6.5 15h.1M17.4 15h.1M5 20v2m14-2v2',
  time: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v6l4 2',
  vehicle: 'M4 15.5h2.2m11.6 0H20M7 15.5a2.5 2.5 0 1 0 0 .1m10 0a2.5 2.5 0 1 0 0 .1M8.5 15.5h7M6 12l2.6-4.5h5.2l2.2 4.5M14 7.5h2.2l2.8 4.5',
  delay: 'M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2M4 4l3-2M20 4l-3-2',
  restaurant: 'M7 3v9m3-9v9M5 3v5a3.5 3.5 0 0 0 7 0V3m5 0v18m0-18c2.5 1.8 3.5 4.1 2.6 7H17',
  rider: 'M7.5 16.5a2.5 2.5 0 1 0 0 .1m9 0a2.5 2.5 0 1 0 0 .1M9.8 16.5h4.2l-2-5h3.5l2 5M10 8.5h3.2l1.4-3.2M13.6 5.3a1.6 1.6 0 1 0 0-.1',
  customer: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  ticket: 'M5 4h14v4a2 2 0 0 0 0 4v8H5v-8a2 2 0 0 0 0-4V4Zm4 4h6M8 12h8M8 16h5',
  multi: 'M7 7h11v13H7V7Zm-3-3h11v3M10 11h5M10 15h5',
  risk: 'M12 3 22 20H2L12 3Zm0 6v5m0 3h.1'
};
