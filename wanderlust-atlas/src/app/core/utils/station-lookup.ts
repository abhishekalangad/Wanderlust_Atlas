export interface LocationSuggestion {
  code: string;
  name: string;
  type: 'station' | 'airport';
}

export const RAILWAY_STATIONS: LocationSuggestion[] = [
  // Kerala Stations
  { code: 'TVC', name: 'Thiruvananthapuram Central (TVC)', type: 'station' },
  { code: 'KCVL', name: 'Kochuveli, Trivandrum (KCVL)', type: 'station' },
  { code: 'VAK', name: 'Varkala Sivagiri (VAK)', type: 'station' },
  { code: 'QLN', name: 'Kollam Junction (QLN)', type: 'station' },
  { code: 'KYJ', name: 'Kayamkulam Junction (KYJ)', type: 'station' },
  { code: 'MVLK', name: 'Mavelikara (MVLK)', type: 'station' },
  { code: 'CNGR', name: 'Chengannur (CNGR)', type: 'station' },
  { code: 'TRVL', name: 'Tiruvalla (TRVL)', type: 'station' },
  { code: 'CGY', name: 'Changanassery (CGY)', type: 'station' },
  { code: 'KTYM', name: 'Kottayam (KTYM)', type: 'station' },
  { code: 'ALLP', name: 'Alappuzha / Alleppey (ALLP)', type: 'station' },
  { code: 'SRTL', name: 'Cherthala (SRTL)', type: 'station' },
  { code: 'ERS', name: 'Ernakulam Junction / South (ERS)', type: 'station' },
  { code: 'ERN', name: 'Ernakulam Town / North (ERN)', type: 'station' },
  { code: 'AWY', name: 'Aluva (AWY)', type: 'station' },
  { code: 'AFK', name: 'Angamaly for Kalady (AFK)', type: 'station' },
  { code: 'CKI', name: 'Chalakudi (CKI)', type: 'station' },
  { code: 'IJK', name: 'Irinjalakuda (IJK)', type: 'station' },
  { code: 'TCR', name: 'Thrissur (TCR)', type: 'station' },
  { code: 'PNQ', name: 'Punkunnam (PNQ)', type: 'station' },
  { code: 'GUV', name: 'Guruvayur (GUV)', type: 'station' },
  { code: 'SRR', name: 'Shoranur Junction (SRR)', type: 'station' },
  { code: 'OTP', name: 'Ottapalam (OTP)', type: 'station' },
  { code: 'PGT', name: 'Palakkad Junction (PGT)', type: 'station' },
  { code: 'PGTN', name: 'Palakkad Town (PGTN)', type: 'station' },
  { code: 'PTB', name: 'Pattambi (PTB)', type: 'station' },
  { code: 'KTU', name: 'Kuttippuram (KTU)', type: 'station' },
  { code: 'TIR', name: 'Tirur (TIR)', type: 'station' },
  { code: 'TA', name: 'Tanur (TA)', type: 'station' },
  { code: 'PGI', name: 'Parappanangadi (PGI)', type: 'station' },
  { code: 'FK', name: 'Ferok (FK)', type: 'station' },
  { code: 'CLT', name: 'Kozhikode Main (CLT)', type: 'station' },
  { code: 'QLD', name: 'Quilandi / Koyilandy (QLD)', type: 'station' },
  { code: 'BDJ', name: 'Vadakara / Badagara (BDJ)', type: 'station' },
  { code: 'MAHE', name: 'Mahe (MAHE)', type: 'station' },
  { code: 'TLY', name: 'Thalassery / Tellicherry (TLY)', type: 'station' },
  { code: 'CAN', name: 'Kannur / Cannanore (CAN)', type: 'station' },
  { code: 'KPQ', name: 'Kannapuram (KPQ)', type: 'station' },
  { code: 'PAY', name: 'Payyanur (PAY)', type: 'station' },
  { code: 'CHV', name: 'Cheruvathur (CHV)', type: 'station' },
  { code: 'KZE', name: 'Kanhangad (KZE)', type: 'station' },
  { code: 'KGQ', name: 'Kasaragod (KGQ)', type: 'station' },
  { code: 'KMQ', name: 'Kumbla (KMQ)', type: 'station' },
  { code: 'MJS', name: 'Manjeshwar (MJS)', type: 'station' },

  // Delhi / NCR / UP North
  { code: 'NDLS', name: 'New Delhi Railway Station (NDLS)', type: 'station' },
  { code: 'NZM', name: 'Hazrat Nizamuddin Railway Station (NZM)', type: 'station' },
  { code: 'ANVT', name: 'Anand Vihar Terminal (ANVT)', type: 'station' },
  { code: 'DLI', name: 'Old Delhi Junction (DLI)', type: 'station' },
  { code: 'DEC', name: 'Delhi Cantt (DEC)', type: 'station' },
  { code: 'GZB', name: 'Ghaziabad Junction (GZB)', type: 'station' },
  { code: 'MTC', name: 'Meerut City Junction (MTC)', type: 'station' },
  { code: 'SRE', name: 'Saharanpur Junction (SRE)', type: 'station' },
  { code: 'MB', name: 'Moradabad Junction (MB)', type: 'station' },
  { code: 'BE', name: 'Bareilly Junction (BE)', type: 'station' },
  { code: 'ALJN', name: 'Aligarh Junction (ALJN)', type: 'station' },
  { code: 'TDL', name: 'Tundla Junction (TDL)', type: 'station' },

  // Punjab / Haryana / JK / Himachal
  { code: 'ASR', name: 'Amritsar Junction (ASR)', type: 'station' },
  { code: 'JUC', name: 'Jalandhar City Junction (JUC)', type: 'station' },
  { code: 'LDH', name: 'Ludhiana Junction (LDH)', type: 'station' },
  { code: 'UMB', name: 'Ambala Cantt Junction (UMB)', type: 'station' },
  { code: 'CDG', name: 'Chandigarh Junction (CDG)', type: 'station' },
  { code: 'KLK', name: 'Kalka (KLK)', type: 'station' },
  { code: 'SML', name: 'Shimla (SML)', type: 'station' },
  { code: 'ROK', name: 'Rohtak Junction (ROK)', type: 'station' },
  { code: 'KKDE', name: 'Kurukshetra Junction (KKDE)', type: 'station' },
  { code: 'JAT', name: 'Jammu Tawi (JAT)', type: 'station' },
  { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra (SVDK)', type: 'station' },
  { code: 'PTKC', name: 'Pathankot Cantt (PTKC)', type: 'station' },
  { code: 'FZR', name: 'Firozpur Cantt (FZR)', type: 'station' },
  { code: 'BTI', name: 'Bathinda Junction (BTI)', type: 'station' },
  { code: 'DDN', name: 'Dehradun (DDN)', type: 'station' },
  { code: 'HW', name: 'Haridwar Junction (HW)', type: 'station' },

  // Uttar Pradesh Central & East
  { code: 'CNB', name: 'Kanpur Central (CNB)', type: 'station' },
  { code: 'CPA', name: 'Kanpur Anwarganj (CPA)', type: 'station' },
  { code: 'LKO', name: 'Lucknow Charbagh NR (LKO)', type: 'station' },
  { code: 'LJN', name: 'Lucknow Junction NER (LJN)', type: 'station' },
  { code: 'BBK', name: 'Barabanki Junction (BBK)', type: 'station' },
  { code: 'AY', name: 'Ayodhya Dham Junction (AY)', type: 'station' },
  { code: 'AYC', name: 'Ayodhya Cantt / Faizabad (AYC)', type: 'station' },
  { code: 'SLN', name: 'Sultanpur Junction (SLN)', type: 'station' },
  { code: 'RBL', name: 'Rae Bareli Junction (RBL)', type: 'station' },
  { code: 'PRYJ', name: 'Prayagraj Junction / Allahabad (PRYJ)', type: 'station' },
  { code: 'BSB', name: 'Varanasi Junction (BSB)', type: 'station' },
  { code: 'BSBS', name: 'Banaras / Manduadih (BSBS)', type: 'station' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction / Mughal Sarai (DDU)', type: 'station' },
  { code: 'GKP', name: 'Gorakhpur Junction (GKP)', type: 'station' },
  { code: 'GD', name: 'Gonda Junction (GD)', type: 'station' },
  { code: 'MAU', name: 'Mau Junction (MAU)', type: 'station' },

  // Rajasthan
  { code: 'JP', name: 'Jaipur Junction (JP)', type: 'station' },
  { code: 'GADJ', name: 'Gandhinagar Jaipur (GADJ)', type: 'station' },
  { code: 'AII', name: 'Ajmer Junction (AII)', type: 'station' },
  { code: 'KOTA', name: 'Kota Junction (KOTA)', type: 'station' },
  { code: 'UDZ', name: 'Udaipur City (UDZ)', type: 'station' },
  { code: 'JSM', name: 'Jaisalmer (JSM)', type: 'station' },
  { code: 'JU', name: 'Jodhpur Junction (JU)', type: 'station' },
  { code: 'BKN', name: 'Bikaner Junction (BKN)', type: 'station' },

  // MP / Chattisgarh
  { code: 'GWL', name: 'Gwalior Junction (GWL)', type: 'station' },
  { code: 'VGLJ', name: 'VGL Jhansi Junction (VGLJ)', type: 'station' },
  { code: 'BPL', name: 'Bhopal Junction (BPL)', type: 'station' },
  { code: 'RKMP', name: 'Rani Kamlapati, Bhopal (RKMP)', type: 'station' },
  { code: 'INDB', name: 'Indore Junction (INDB)', type: 'station' },
  { code: 'UJN', name: 'Ujjain Junction (UJN)', type: 'station' },
  { code: 'JBP', name: 'Jabalpur Junction (JBP)', type: 'station' },
  { code: 'ET', name: 'Itarsi Junction (ET)', type: 'station' },
  { code: 'R', name: 'Raipur Junction (R)', type: 'station' },
  { code: 'BSP', name: 'Bilaspur Junction (BSP)', type: 'station' },
  { code: 'DURG', name: 'Durg Junction (DURG)', type: 'station' },

  // Maharashtra & Gujarat
  { code: 'CSMT', name: 'Mumbai Chhatrapati Shivaji Maharaj Terminus (CSMT)', type: 'station' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus, Mumbai (LTT)', type: 'station' },
  { code: 'MMCT', name: 'Mumbai Central (MMCT)', type: 'station' },
  { code: 'BDTS', name: 'Bandra Terminus, Mumbai (BDTS)', type: 'station' },
  { code: 'DR', name: 'Dadar, Mumbai (DR)', type: 'station' },
  { code: 'BVI', name: 'Borivali, Mumbai (BVI)', type: 'station' },
  { code: 'TNA', name: 'Thane, Mumbai (TNA)', type: 'station' },
  { code: 'KYN', name: 'Kalyan Junction (KYN)', type: 'station' },
  { code: 'PNVL', name: 'Panvel (PNVL)', type: 'station' },
  { code: 'PUNE', name: 'Pune Junction (PUNE)', type: 'station' },
  { code: 'NK', name: 'Nashik Road (NK)', type: 'station' },
  { code: 'BSL', name: 'Bhusaval Junction (BSL)', type: 'station' },
  { code: 'NGP', name: 'Nagpur Junction (NGP)', type: 'station' },
  { code: 'SUR', name: 'Solapur (SUR)', type: 'station' },
  { code: 'ADI', name: 'Ahmedabad Junction (ADI)', type: 'station' },
  { code: 'BRC', name: 'Vadodara Junction (BRC)', type: 'station' },
  { code: 'ST', name: 'Surat (ST)', type: 'station' },
  { code: 'RJT', name: 'Rajkot Junction (RJT)', type: 'station' },

  // Bihar & Jharkhand
  { code: 'PNBE', name: 'Patna Junction (PNBE)', type: 'station' },
  { code: 'DNR', name: 'Danapur (DNR)', type: 'station' },
  { code: 'PPTA', name: 'Patliputra Junction (PPTA)', type: 'station' },
  { code: 'GAYA', name: 'Gaya Junction (GAYA)', type: 'station' },
  { code: 'MFP', name: 'Muzaffarpur Junction (MFP)', type: 'station' },
  { code: 'DBG', name: 'Darbhanga Junction (DBG)', type: 'station' },
  { code: 'DHN', name: 'Dhanbad Junction (DHN)', type: 'station' },
  { code: 'RNC', name: 'Ranchi Junction (RNC)', type: 'station' },
  { code: 'TATA', name: 'Tatanagar Junction / Jamshedpur (TATA)', type: 'station' },

  // Bengal / Odisha / North-East
  { code: 'HWH', name: 'Howrah Junction, Kolkata (HWH)', type: 'station' },
  { code: 'SDAH', name: 'Sealdah, Kolkata (SDAH)', type: 'station' },
  { code: 'KOAA', name: 'Kolkata Railway Station (KOAA)', type: 'station' },
  { code: 'SHM', name: 'Shalimar, Kolkata (SHM)', type: 'station' },
  { code: 'NJP', name: 'New Jalpaiguri, Siliguri (NJP)', type: 'station' },
  { code: 'GHY', name: 'Guwahati (GHY)', type: 'station' },
  { code: 'BBI', name: 'Bhubaneswar (BBI)', type: 'station' },
  { code: 'PURI', name: 'Puri (PURI)', type: 'station' },

  // South - Karnataka, AP, Telangana
  { code: 'SBC', name: 'KSR Bengaluru City Junction (SBC)', type: 'station' },
  { code: 'YPR', name: 'Yesvantpur Junction, Bengaluru (YPR)', type: 'station' },
  { code: 'SMVB', name: 'Sir M. Visvesvaraya Terminal, Bengaluru (SMVB)', type: 'station' },
  { code: 'MYS', name: 'Mysuru Junction (MYS)', type: 'station' },
  { code: 'UBL', name: 'SSS Hubballi Junction (UBL)', type: 'station' },
  { code: 'MAQ', name: 'Mangaluru Central (MAQ)', type: 'station' },
  { code: 'MAJN', name: 'Mangaluru Junction (MAJN)', type: 'station' },
  { code: 'SC', name: 'Secunderabad Junction (SC)', type: 'station' },
  { code: 'HYB', name: 'Hyderabad Deccan Nampally (HYB)', type: 'station' },
  { code: 'BZA', name: 'Vijayawada Junction (BZA)', type: 'station' },
  { code: 'VSKP', name: 'Visakhapatnam Junction (VSKP)', type: 'station' },
  { code: 'TPTY', name: 'Tirupati (TPTY)', type: 'station' },

  // South - Tamil Nadu
  { code: 'MAS', name: 'Chennai Central (MAS)', type: 'station' },
  { code: 'MS', name: 'Chennai Egmore (MS)', type: 'station' },
  { code: 'TBM', name: 'Tambaram, Chennai (TBM)', type: 'station' },
  { code: 'CBE', name: 'Coimbatore Junction (CBE)', type: 'station' },
  { code: 'MDU', name: 'Madurai Junction (MDU)', type: 'station' },
  { code: 'TPJ', name: 'Tiruchchirappalli Junction (TPJ)', type: 'station' },
  { code: 'SA', name: 'Salem Junction (SA)', type: 'station' },
  { code: 'ED', name: 'Erode Junction (ED)', type: 'station' },
  { code: 'RMM', name: 'Rameswaram (RMM)', type: 'station' },
  { code: 'CAPE', name: 'Kanniyakumari (CAPE)', type: 'station' },

  // Konkan & Goa
  { code: 'MAO', name: 'Madgaon Junction, Goa (MAO)', type: 'station' },
  { code: 'KRMI', name: 'Karmali, Goa (KRMI)', type: 'station' },
  { code: 'THVM', name: 'Thivim, Goa (THVM)', type: 'station' },
  { code: 'VSG', name: 'Vasco-da-Gama, Goa (VSG)', type: 'station' },
  { code: 'RN', name: 'Ratnagiri (RN)', type: 'station' },
  { code: 'UD', name: 'Udupi (UD)', type: 'station' },
];

export const AIRPORTS: LocationSuggestion[] = [
  { code: 'DEL', name: 'Indira Gandhi International Airport, New Delhi (DEL)', type: 'airport' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai (BOM)', type: 'airport' },
  { code: 'BLR', name: 'Kempegowda International Airport, Bengaluru (BLR)', type: 'airport' },
  { code: 'MAA', name: 'Chennai International Airport (MAA)', type: 'airport' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose Intl Airport, Kolkata (CCU)', type: 'airport' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport, Hyderabad (HYD)', type: 'airport' },
  { code: 'GOI', name: 'Dabolim Airport, South Goa (GOI)', type: 'airport' },
  { code: 'GOX', name: 'Manohar International Airport, Mopa North Goa (GOX)', type: 'airport' },
  { code: 'COK', name: 'Cochin International Airport, Kochi (COK)', type: 'airport' },
  { code: 'TRV', name: 'Thiruvananthapuram International Airport (TRV)', type: 'airport' },
  { code: 'CCJ', name: 'Calicut International Airport, Kozhikode (CCJ)', type: 'airport' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl Airport, Ahmedabad (AMD)', type: 'airport' },
  { code: 'PNQ', name: 'Pune Airport (PNQ)', type: 'airport' },
  { code: 'JAI', name: 'Jaipur International Airport (JAI)', type: 'airport' },
  { code: 'LKO', name: 'Chaudhary Charan Singh Intl Airport, Lucknow (LKO)', type: 'airport' },
  { code: 'IXC', name: 'Chandigarh International Airport (IXC)', type: 'airport' },
  { code: 'ATQ', name: 'Sri Guru Ram Dass Jee Intl Airport, Amritsar (ATQ)', type: 'airport' },
  { code: 'PAT', name: 'Jayprakash Narayan Airport, Patna (PAT)', type: 'airport' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi Intl Airport, Guwahati (GAU)', type: 'airport' },
  { code: 'DXB', name: 'Dubai International Airport (DXB)', type: 'airport' },
  { code: 'SIN', name: 'Singapore Changi Airport (SIN)', type: 'airport' },
  { code: 'LHR', name: 'London Heathrow Airport (LHR)', type: 'airport' },
  { code: 'JFK', name: 'John F. Kennedy Intl Airport, New York (JFK)', type: 'airport' },
  { code: 'CDG', name: 'Paris Charles de Gaulle Airport (CDG)', type: 'airport' },
  { code: 'BKK', name: 'Suvarnabhumi Airport, Bangkok (BKK)', type: 'airport' },
];

export function lookupStationOrAirport(query: string, mode: string): LocationSuggestion | null {
  if (!query || query.trim().length < 2) return null;
  const q = query.trim().toUpperCase();

  let dataset: LocationSuggestion[] = [];
  if (mode === 'train') dataset = RAILWAY_STATIONS;
  else if (mode === 'plane') dataset = AIRPORTS;
  else dataset = [...RAILWAY_STATIONS, ...AIRPORTS];

  // Match exact code first
  const exactCode = dataset.find(item => item.code.toUpperCase() === q);
  if (exactCode) return exactCode;

  // Match code starting with query
  const startCode = dataset.find(item => item.code.toUpperCase().startsWith(q));
  if (startCode) return startCode;

  // Match name containing query
  const nameMatch = dataset.find(item => item.name.toUpperCase().includes(q));
  if (nameMatch) return nameMatch;

  return null;
}

export function searchSuggestions(query: string, mode: string): LocationSuggestion[] {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim().toUpperCase();

  let dataset: LocationSuggestion[] = [];
  if (mode === 'train') dataset = RAILWAY_STATIONS;
  else if (mode === 'plane') dataset = AIRPORTS;
  else dataset = [...RAILWAY_STATIONS, ...AIRPORTS];

  return dataset.filter(item =>
    item.code.toUpperCase().includes(q) || item.name.toUpperCase().includes(q)
  ).slice(0, 8);
}
