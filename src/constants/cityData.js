// City data, city gazetteer, major cities, regional lookup
const BAD_GPS_MEDICAL_IDS = new Set([522086,522138,522150,522162,522176,522239,522243,522252,522258,522264,522311,522471,522484,522489,522511,522581,522600,522851,522944,523167,523339,523365,523423,523432,523476,523488,523510,523625,523628,523672,523814,523855,523902,523926,523937,523948,524045,524050,524072,524083,524089,524105,524144,524147,524211,524581,524592,524879,525290,525298,525312,525393,525419,525573,525664,525698,525702,525750,525756,525760,525773,525783,525789,525803]);;
const CITY_GAZETTEER = {
  'leh': [34.1526, 77.5771], 'kargil': [34.5539, 76.1349],
  'kannauj': [27.0575, 79.9198], 'ahmedabad': [23.0225, 72.5714],
  'sangrur': [30.2458, 75.8421], 'hassan': [13.0072, 76.1004],
  'coimbatore': [11.0168, 76.9558], 'visnagar': [23.6975, 72.5497],
  'indore': [22.7196, 75.8577], 'mandsaur': [24.0735, 75.0694],
  'gandhinagar': [23.2156, 72.6369], 'kota': [25.2138, 75.8648],
  'karad': [17.2905, 74.1804], 'gadhinglaj': [16.2333, 74.3500],
  'sarangarh': [21.6167, 83.0833], 'sri muktsar sahib': [30.4762, 74.5161],
  'udupi': [13.3409, 74.7421], 'new delhi': [28.6139, 77.2090],
  'jamkhandi': [16.5044, 75.2919], 'jalgaon': [21.0077, 75.5626],
  'sriganganagar': [29.9094, 73.8800], 'ambikapur�': [23.1194, 83.1953],
  'ambikapur': [23.1194, 83.1953], 'tumkur': [13.3379, 77.1173],
  'burhanpur': [21.3009, 76.2291], 'sawantwadi': [15.9046, 73.8286],
  'gurugram': [28.4595, 77.0266], 'gurgaon kty.': [28.4595, 77.0266],
  'gandevi': [20.8167, 72.9167], 'renwal': [27.0167, 75.6667],
  'vellore': [12.9165, 79.1325], 'bargari': [30.7333, 74.7500],
  'khargone': [21.8225, 75.6100], 'jabalpur': [23.1815, 79.9864],
  'bhiwandi': [19.3002, 73.0629], 'valsad': [20.5992, 72.9342],
  'pathankot': [32.2746, 75.6524], 'thane': [19.2183, 72.9781],
  'kishangarh': [26.5833, 74.8667], 'gobichettipalayam': [11.4552, 77.4432],
  'lakheri': [25.6833, 76.1667], 'azamgarh': [26.0685, 83.1836],
  'agartala': [23.8315, 91.2868], 'greater noida': [28.4744, 77.5040],
  'lucknow': [26.8467, 80.9462], 'rishikesh': [30.0869, 78.2676],
  'solur': [12.9333, 77.2333],
  // Haveli is Pune district's surrounding taluka, not a single town --
  // Pune city itself is the best single reference point for it.
  'haveli': [18.5204, 73.8567],
  // Added to re-place readings whose recorded GPS was bad (see
  // BAD_GPS_MEDICAL_IDS above) but whose declared city is real and known:
  'bhiwani': [28.7929, 76.1393], 'chandigarh': [30.7333, 76.7794],
  'angul': [20.8397, 85.0993], 'sarkaghat': [31.7833, 76.7500],
  'rampur': [28.8043, 79.0250], 'nagpur': [21.1458, 79.0882],
  'pune': [18.5204, 73.8567],
  // Outside India:
  'dubai silicon oasis': [25.1216, 55.3773], 'dubai': [25.2048, 55.2708],
  'biratnagar': [26.4525, 87.2718], 'birtamode': [26.5680, 87.9967],
  'manchester': [53.4808, -2.2426], 'sterling': [39.0062, -77.4286],
  // A patient recorded as being in Zaragoza/Aragon (Spain) or Kelapa
  // Gading/North Jakarta (Indonesia) still had a stuck Indian default GPS
  // value -- placing them near their own declared city instead of forcing
  // them into India:
  'zaragoza': [41.6488, -0.8891], 'north jakarta': [-6.1500, 106.9000],
};

const MAJOR_CITIES_RAW = [
  // North
  ['Delhi',28.7041,77.1025,1,'north'], ['New Delhi',28.6139,77.2090,1,'north'],
  ['Jaipur',26.9124,75.7873,2,'north'], ['Jodhpur',26.2389,73.0243,3,'north'],
  ['Udaipur',24.5854,73.7125,3,'north'], ['Kota',25.2138,75.8648,3,'north'],
  ['Ajmer',26.4499,74.6399,3,'north'], ['Bikaner',28.0229,73.3119,3,'north'],
  ['Sri Ganganagar',29.9094,73.8800,4,'north'], ['Alwar',27.5530,76.6346,4,'north'],
  ['Bhilwara',25.3463,74.6364,4,'north'], ['Sikar',27.6094,75.1399,4,'north'],
  ['Chandigarh',30.7333,76.7794,2,'north'], ['Ludhiana',30.9010,75.8573,2,'north'],
  ['Amritsar',31.6340,74.8723,2,'north'], ['Jalandhar',31.3260,75.5762,3,'north'],
  ['Patiala',30.3398,76.3869,3,'north'], ['Bathinda',30.2110,74.9455,4,'north'],
  ['Shimla',31.1048,77.1734,3,'north'], ['Dehradun',30.3165,78.0322,3,'north'],
  ['Haridwar',29.9457,78.1642,4,'north'], ['Srinagar',34.0837,74.7973,3,'north'], ['Leh',34.1526,77.5771,3,'north'], ['Kargil',34.5539,76.1349,4,'north'],
  ['Jammu',32.7266,74.8570,3,'north'], ['Gurugram',28.4595,77.0266,2,'north'],
  ['Faridabad',28.4089,77.3178,2,'north'], ['Panipat',29.3909,76.9635,4,'north'],
  ['Ambala',30.3782,76.7767,4,'north'], ['Hisar',29.1492,75.7217,4,'north'],
  ['Rohtak',28.8955,76.6066,4,'north'], ['Karnal',29.6857,76.9905,4,'north'],
  ['Panchkula',30.6942,76.8606,4,'north'],
  // Central
  ['Bhopal',23.2599,77.4126,2,'central'], ['Indore',22.7196,75.8577,2,'central'],
  ['Gwalior',26.2183,78.1828,3,'central'], ['Jabalpur',23.1815,79.9864,3,'central'],
  ['Ujjain',23.1793,75.7849,3,'central'], ['Sagar',23.8388,78.7378,4,'central'],
  ['Satna',24.6005,80.8322,4,'central'], ['Rewa',24.5362,81.3037,4,'central'],
  ['Raipur',21.2514,81.6296,2,'central'], ['Bilaspur',22.0797,82.1409,3,'central'],
  ['Durg',21.1938,81.2849,4,'central'], ['Lucknow',26.8467,80.9462,2,'central'],
  ['Kanpur',26.4499,80.3319,2,'central'], ['Varanasi',25.3176,82.9739,2,'central'],
  ['Prayagraj',25.4358,81.8463,3,'central'], ['Agra',27.1767,78.0081,2,'central'],
  ['Meerut',28.9845,77.7064,3,'central'], ['Bareilly',28.3670,79.4304,3,'central'],
  ['Gorakhpur',26.7606,83.3732,3,'central'], ['Noida',28.5355,77.3910,3,'central'],
  ['Ghaziabad',28.6692,77.4538,3,'central'], ['Aligarh',27.8974,78.0880,4,'central'],
  ['Moradabad',28.8386,78.7733,4,'central'], ['Saharanpur',29.9640,77.5460,4,'central'],
  ['Jhansi',25.4484,78.5685,4,'central'], ['Firozabad',27.1592,78.3957,4,'central'],
  ['Nainital',29.3803,79.4636,4,'central'],
  // East
  ['Kolkata',22.5726,88.3639,1,'east'], ['Howrah',22.5958,88.2636,3,'east'],
  ['Patna',25.5941,85.1376,2,'east'], ['Gaya',24.7955,84.9994,4,'east'],
  ['Bhagalpur',25.2445,87.0108,4,'east'], ['Muzaffarpur',26.1225,85.3906,4,'east'],
  ['Darbhanga',26.1542,85.8918,4,'east'], ['Ranchi',23.3441,85.3096,3,'east'],
  ['Jamshedpur',22.8046,86.2029,3,'east'], ['Dhanbad',23.7957,86.4304,3,'east'],
  ['Bokaro',23.6693,86.1511,4,'east'], ['Bhubaneswar',20.2961,85.8245,2,'east'],
  ['Cuttack',20.4625,85.8828,3,'east'], ['Rourkela',22.2604,84.8536,4,'east'],
  ['Siliguri',26.7271,88.3953,3,'east'], ['Asansol',23.6889,86.9661,3,'east'],
  ['Durgapur',23.5204,87.3119,4,'east'], ['Port Blair',11.6234,92.7265,4,'east'],
  // West
  ['Mumbai',19.0760,72.8777,1,'west'], ['Pune',18.5204,73.8567,2,'west'],
  ['Nagpur',21.1458,79.0882,2,'west'], ['Nashik',19.9975,73.7898,2,'west'],
  ['Thane',19.2183,72.9781,2,'west'], ['Aurangabad',19.8762,75.3433,3,'west'],
  ['Solapur',17.6599,75.9064,3,'west'], ['Kolhapur',16.7050,74.2433,3,'west'],
  ['Amravati',20.9374,77.7796,3,'west'], ['Ahmedabad',23.0225,72.5714,1,'west'],
  ['Surat',21.1702,72.8311,2,'west'], ['Vadodara',22.3072,73.1812,2,'west'],
  ['Rajkot',22.3039,70.8022,3,'west'], ['Bhavnagar',21.7645,72.1519,3,'west'],
  ['Jamnagar',22.4707,70.0577,4,'west'], ['Junagadh',21.5222,70.4579,4,'west'],
  ['Panaji',15.4909,73.8278,4,'west'], ['Margao',15.2832,73.9862,4,'west'],
  // South
  ['Bengaluru',12.9716,77.5946,1,'south'], ['Mysuru',12.2958,76.6394,3,'south'],
  ['Hubli',15.3647,75.1240,3,'south'], ['Mangaluru',12.9141,74.8560,3,'south'],
  ['Belagavi',15.8497,74.4977,4,'south'], ['Chennai',13.0827,80.2707,1,'south'],
  ['Coimbatore',11.0168,76.9558,2,'south'], ['Madurai',9.9252,78.1198,3,'south'],
  ['Tiruchirappalli',10.7905,78.7047,3,'south'], ['Salem',11.6643,78.1460,3,'south'],
  ['Tirunelveli',8.7139,77.7567,4,'south'], ['Erode',11.3410,77.7172,4,'south'],
  ['Vellore',12.9165,79.1325,4,'south'], ['Hyderabad',17.3850,78.4867,1,'south'],
  ['Warangal',17.9689,79.5941,3,'south'], ['Nizamabad',18.6725,78.0941,4,'south'],
  ['Karimnagar',18.4386,79.1288,4,'south'], ['Vijayawada',16.5062,80.6480,2,'south'],
  ['Visakhapatnam',17.6868,83.2185,2,'south'], ['Guntur',16.3067,80.4365,3,'south'],
  ['Nellore',14.4426,79.9865,4,'south'], ['Rajahmundry',17.0005,81.8040,4,'south'],
  ['Tirupati',13.6288,79.4192,4,'south'], ['Kochi',9.9312,76.2673,2,'south'],
  ['Thiruvananthapuram',8.5241,76.9366,2,'south'], ['Kozhikode',11.2588,75.7804,3,'south'],
  ['Thrissur',10.5276,76.2144,4,'south'], ['Kannur',11.8745,75.3704,4,'south'],
  ['Puducherry',11.9416,79.8083,3,'south'], ['Kavaratti',10.5669,72.6420,4,'south'],
  // Northeast
  ['Guwahati',26.1445,91.7362,2,'northeast'], ['Dibrugarh',27.4728,94.9120,4,'northeast'],
  ['Silchar',24.8333,92.7789,4,'northeast'], ['Shillong',25.5788,91.8933,3,'northeast'],
  ['Imphal',24.8170,93.9368,3,'northeast'], ['Agartala',23.8315,91.2868,3,'northeast'],
  ['Aizawl',23.7271,92.7176,4,'northeast'], ['Kohima',25.6751,94.1086,4,'northeast'],
  ['Itanagar',27.0844,93.6053,4,'northeast'], ['Gangtok',27.3389,88.6065,4,'northeast']
];
const MAJOR_CITIES = MAJOR_CITIES_RAW.map(c => ({ name: c[0], lat: c[1], lon: c[2], tier: c[3], region: c[4] }));
const CITY_TIER_LOOKUP = {};
const MAJOR_CITY_GAZETTEER = {};
MAJOR_CITIES.forEach(c => {
  const key = c.name.toLowerCase();
  CITY_TIER_LOOKUP[key] = c.tier;
  MAJOR_CITY_GAZETTEER[key] = [c.lat, c.lon];
});
const REGION_OF_STATE = {
  'chandigarh': 'north', 'delhi': 'north', 'haryana': 'north',
  'himachal pradesh': 'north', 'jammu and kashmir': 'north', 'ladakh': 'north',
  'punjab': 'north', 'rajasthan': 'north',
  'chhattisgarh': 'central', 'madhya pradesh': 'central',
  'uttar pradesh': 'central', 'uttarakhand': 'central',
  'bihar': 'east', 'jharkhand': 'east', 'odisha': 'east', 'west bengal': 'east',
  'andaman and nicobar': 'east',
  'dadra and nagar haveli and daman and diu': 'west', 'goa': 'west',
  'gujarat': 'west', 'maharashtra': 'west',
  'andhra pradesh': 'south', 'karnataka': 'south', 'kerala': 'south',
  'puducherry': 'south', 'tamil nadu': 'south', 'telangana': 'south',
  'lakshadweep': 'south',
  'arunachal pradesh': 'northeast', 'assam': 'northeast', 'manipur': 'northeast',
  'meghalaya': 'northeast', 'mizoram': 'northeast', 'nagaland': 'northeast',
  'sikkim': 'northeast', 'tripura': 'northeast'
};
function regionForStateName(stateName){
  return REGION_OF_STATE[normStateName(stateName)] || null;
}

export { BAD_GPS_MEDICAL_IDS, CITY_GAZETTEER, MAJOR_CITIES_RAW, MAJOR_CITIES, CITY_TIER_LOOKUP, MAJOR_CITY_GAZETTEER, REGION_OF_STATE };
