import { WaterStandards, FeedingRateConfig, DiseaseCriteria, DrugConfig, ExpertContact } from '../types';

export const DEFAULT_WATER_STANDARDS: WaterStandards = {
  doOptimalMin: 5.0,
  doOptimalMax: 8.0,
  doAlertRed: 3.5,
  phOptimalMin: 7.5,
  phOptimalMax: 8.5,
  phAlertLow: 7.0,
  phAlertHigh: 9.0,
  salinityOptimalMin: 10.0,
  salinityOptimalMax: 25.0,
  salinityMaxDailyChange: 3.0,
  tempOptimalMin: 28.0,
  tempOptimalMax: 32.0,
  tempAlertLow: 25.0,
  tempAlertHigh: 34.0,
  ammoniaAlertRed: 1.0,
  nitriteAlert: 1.0,
  alkalinityOptimalMin: 120.0,
  alkalinityOptimalMax: 200.0,
  alkalinityAlertRed: 80.0,
};

export const DEFAULT_FEEDING_RATES: FeedingRateConfig[] = [
  { abwMin: 0.5, abwMax: 2.0, rateMinPercent: 10.0, rateMaxPercent: 15.0, defaultMeals: 5 },
  { abwMin: 2.0, abwMax: 5.0, rateMinPercent: 7.0, rateMaxPercent: 10.0, defaultMeals: 4 },
  { abwMin: 5.0, abwMax: 10.0, rateMinPercent: 5.0, rateMaxPercent: 7.0, defaultMeals: 4 },
  { abwMin: 10.0, abwMax: 15.0, rateMinPercent: 4.0, rateMaxPercent: 5.0, defaultMeals: 4 },
  { abwMin: 15.0, abwMax: 20.0, rateMinPercent: 3.5, rateMaxPercent: 4.5, defaultMeals: 3 },
  { abwMin: 20.0, abwMax: 30.0, rateMinPercent: 3.0, rateMaxPercent: 3.5, defaultMeals: 3 },
  { abwMin: 30.0, abwMax: 999.0, rateMinPercent: 2.5, rateMaxPercent: 3.0, defaultMeals: 3 },
];

export const SYMPTOM_OPTIONS = [
  { id: 'acute_mortality', labelTh: 'ตายเยอะเฉียบพลัน', labelEn: 'Acute massive mortality' },
  { id: 'pale_liver', labelTh: 'ตับเหลือง/ซีด/ฝ่อ', labelEn: 'Hepatopancreas pale / yellow / atrophied' },
  { id: 'empty_gut', labelTh: 'ลำไส้ไม่เต็ม / ขาดตอน', labelEn: 'Empty or broken gut line' },
  { id: 'slow_growth', labelTh: 'โตช้า / ขนาดไม่เท่ากัน', labelEn: 'Slow growth / uneven size variation' },
  { id: 'red_body', labelTh: 'ตัวแดง', labelEn: 'Red coloration on body and pleopods' },
  { id: 'white_spots', labelTh: 'จุดขาวใต้เปลือก', labelEn: 'White spots under carapace' },
  { id: 'yellow_body', labelTh: 'ตัวเหลือง / หัวเหลือง', labelEn: 'Yellow body / yellow cephalothorax' },
  { id: 'swimming_edge', labelTh: 'ว่ายลอยข้างบ่อ ไร้ทิศทาง', labelEn: 'Lethargic swimming along pond edges' },
  { id: 'soft_shell', labelTh: 'เปลือกนิ่ม / ลอกคราบไม่ออก', labelEn: 'Soft shell / incomplete ecdysis' },
  { id: 'drop_feed', labelTh: 'กินอาหารลดลงฮวบ', labelEn: 'Sudden drastic drop in feed intake' },
];

export const DEFAULT_DISEASES: DiseaseCriteria[] = [
  {
    id: 'ems_ahpnd',
    nameTh: 'EMS / AHPND (โรคตับวายเฉียบพลัน)',
    nameEn: 'EMS / AHPND (Acute Hepatopancreatic Necrosis Disease)',
    code: 'EMS',
    descriptionTh: 'กุ้งมักตายเฉียบพลันในช่วงอายุ 20-40 วันหลังปล่อย ตับซีดฝ่อ ลำไส้ลีบไม่มีอาหาร',
    descriptionEn: 'High mortality at DOC 20-40, atrophied and pale hepatopancreas, empty gut.',
    symptoms: ['acute_mortality', 'pale_liver', 'empty_gut', 'drop_feed', 'swimming_edge'],
    isolationStepsTh: [
      'งดถ่ายเทน้ำเข้า-ออกจากบ่อโดยเด็ดขาด เพื่อป้องกันการแพร่กระจายเชื้อวิบริโอ',
      'ลดปริมาณอาหาร 50-70% ทันทีเพื่อลดภาระตับและลดของเสียในน้ำ',
      'เพิ่มการให้ออกซิเจนให้ DO > 6.0 ppm ตลอด 24 ชั่วโมง',
      'ส่งตัวอย่างกุ้งตรวจวิเคราะห์ยืนยันด้วย PCR Lab ด่วนที่สุด',
      'แยกอุปกรณ์ อวน ถาดเช็ค ประจำบ่อนี้ ห้ามใช้ปนกับบ่ออื่น'
    ],
    isolationStepsEn: [
      'Strictly prohibit water exchange into or out of the pond.',
      'Immediately reduce feeding by 50-70% to alleviate digestive load.',
      'Maximize aeration to keep DO > 6.0 mg/L 24/7.',
      'Submit live shrimp samples to an accredited lab for PCR confirmation.',
      'Quarantine and disinfect all nets, check trays, and tools used in this pond.'
    ]
  },
  {
    id: 'ehp',
    nameTh: 'EHP (โรคไมโครสปอริเดียลำไส้กุ้ง)',
    nameEn: 'EHP (Enterocytozoon hepatopenaei)',
    code: 'EHP',
    descriptionTh: 'กุ้งโตช้ามาก กุ้งแตกไซส์ กินอาหารได้ปกติแต่ตัวไม่โต ค่า FCR พุ่งสูงเกิน 1.8',
    descriptionEn: 'Severe growth retardation, uneven sizes, shrimp consume feed but fail to gain weight, FCR > 1.8.',
    symptoms: ['slow_growth', 'empty_gut'],
    isolationStepsTh: [
      'ตรวจเช็คขี้ขาวและสุ่มตรวจเนื้อเยื่อตับด้วยกล้องจุลทรรศน์และ PCR',
      'หลีกเลี่ยงการกวนเลนก้นบ่อ และคัดกรองตะกอนแขวนลอย',
      'ควบคุมการให้อาหารอย่างเคร่งครัดตามอัตราการโต อย่าให้อาหารเกินจน FCR บวม',
      'เมื่อจับกุ้งแล้ว ต้องตากบ่อและกำจัดสปอร์ด้วยปูนขาวร้อน (CaO) ค่า pH ดิน >12'
    ],
    isolationStepsEn: [
      'Inspect for white feces and perform PCR test on hepatopancreas tissue.',
      'Prevent sludge agitation at the pond bottom.',
      'Strictly ration feed to prevent feed waste and elevated FCR.',
      'Post-harvest: Treat pond bottom with quicklime (CaO) to achieve soil pH >12 to deactivate spores.'
    ]
  },
  {
    id: 'wssv',
    nameTh: 'WSSV (โรคตัวแดงดวงขาว)',
    nameEn: 'WSSV (White Spot Syndrome Virus)',
    code: 'WSSV',
    descriptionTh: 'ลำตัวเปลี่ยนเป็นสีแดง พบจุดขาวขนาด 0.5-2 มม. ใต้เปลือกหัวและลำตัว อัตราตายสูงถึง 80-100% ใน 3-7 วัน',
    descriptionEn: 'Red coloration, distinctive white spots under carapace, 80-100% mortality within 3 to 7 days.',
    symptoms: ['acute_mortality', 'red_body', 'white_spots', 'swimming_edge', 'drop_feed'],
    isolationStepsTh: [
      'ประกาศกักกันโรคระดับสูงสุด ปิดระบบระบายน้ำทุกจุด',
      'กั้นตาข่ายกันนกและตาข่ายกันปู/สัตว์พาหะรอบขอบบ่ออย่างมิดชิด',
      'หากยืนยันผลบวก PCR และเริ่มตายเกิน 50% ให้พิจารณาจับกุ้งฉุกเฉินหรือฆ่าเชื้อในบ่อด้วยคลอรีนเข้มข้น',
      'ห้ามถ่ายน้ำลงสู่แหล่งน้ำสาธารณะโดยไม่ผ่านการบำบัดคลอรีนอย่างน้อย 30 ppm เป็นเวลา 7 วัน'
    ],
    isolationStepsEn: [
      'Declare highest biosecurity quarantine. Seal all pond inlet and outlet valves.',
      'Inspect and secure bird scare lines and crab barriers along pond dykes.',
      'If PCR confirms WSSV with massive die-off, evaluate emergency harvest or chlorine sanitation.',
      'Never release pond water into public canals without 30 ppm chlorine neutralization for 7 days.'
    ]
  },
  {
    id: 'yhv',
    nameTh: 'YHV (โรคหัวเหลือง)',
    nameEn: 'YHV (Yellow Head Virus)',
    code: 'YHV',
    descriptionTh: 'กุ้งตัวซีดอมเหลือง บริเวณหัวและตับเหลืองเข้ม ว่ายน้ำเฉื่อยชาตามผิวน้ำหรือชิดคันบ่อ และทยอยตายอย่างรวดเร็ว',
    descriptionEn: 'Yellow discoloration of the cephalothorax, pale body, sluggish surface swimming near dyke, rapid die-off.',
    symptoms: ['acute_mortality', 'yellow_body', 'pale_liver', 'swimming_edge', 'drop_feed'],
    isolationStepsTh: [
      'กักบริเวณบ่อ ปิดประตูน้ำเข้าออก และห้ามคนงานเดินข้ามไปยังบ่ออื่น',
      'เก็บตัวอย่างส่งแล็บเพื่อยืนยันชนิดไวรัส (YHV RT-PCR)',
      'ฆ่าเชื้ออุปกรณ์ทุกชนิดด้วยคลอรีน 50-100 ppm ก่อนนำไปใช้ที่อื่น',
      'ตรวจสภาพน้ำบ่อข้างเคียงและเตรียมสารเคมีเสริมภูมิคุ้มกัน (วิตามินซี / เบต้ากลูแคน)'
    ],
    isolationStepsEn: [
      'Quarantine the pond. Forbid staff crossover to adjacent ponds without boot dips.',
      'Dispatch fresh iced samples for RT-PCR virus confirmation.',
      'Disinfect all nets and buckets in 50-100 ppm chlorine.',
      'Fortify immune feed with Vitamin C and Beta-glucan in adjacent buffer ponds.'
    ]
  },
  {
    id: 'soft_shell',
    nameTh: 'กลุ่มอาการเปลือกนิ่ม (Soft Shell Syndrome)',
    nameEn: 'Soft Shell Syndrome / Mineral Deficiency',
    code: 'SOFT_SHELL',
    descriptionTh: 'กุ้งเปลือกนิ่มยวบนานเกิน 24 ชั่วโมง ลอกคราบไม่ออก กุ้งติดคราบและตายหลังการลอก มักสัมพันธ์กับอัลคาไลน์ < 80 mg/L หรือขาดแร่ธาตุ Ca/Mg',
    descriptionEn: 'Persistent soft carapace exceeding 24 hours post-molt, molt mortality, correlated with alkalinity < 80 mg/L or Ca/Mg mineral deficiency.',
    symptoms: ['soft_shell', 'drop_feed', 'acute_mortality'],
    isolationStepsTh: [
      'ตรวจวัดค่าอัลคาไลน์และแคลเซียม/แมกนีเซียมในน้ำทันที หากอัลคาไลน์ < 80 ppm ให้สาดโซเดียมไบคาร์บอเนต 10-15 กก./ไร่',
      'เติมแร่ธาตุรวมที่มีสัดส่วน Ca:Mg:K เหมาะสม (สัดส่วน 1:3:1 ตามระดับความเค็ม)',
      'รักษาค่า pH น้ำไม่ให้แกว่งเกิน 0.5 ในรอบวัน',
      'ลดปริมาณอาหารชั่วคราวขณะกุ้งกำลังรวมกลุ่มลอกคราบ เพื่อป้องกันการกินกันเอง'
    ],
    isolationStepsEn: [
      'Immediately test water alkalinity and Ca/Mg. If alkalinity < 80 mg/L, apply sodium bicarbonate at 10-15 kg/rai.',
      'Dose balanced aquatic mineral supplements maintaining optimal Ca:Mg:K ratio according to salinity.',
      'Stabilize water pH fluctuation within 0.5 per day.',
      'Temporarily reduce feed during mass molting to avoid cannibalism on soft-shell individuals.'
    ]
  }
];

export const DEFAULT_DRUGS: DrugConfig[] = [
  {
    id: 'otc',
    name: 'อ็อกซีเตตราไซคลีน (Oxytetracycline)',
    genericName: 'Oxytetracycline HCl',
    type: 'antibiotic',
    standardWithdrawalDays: 21,
    indicationTh: 'รักษาโรคติดเชื้อแบคทีเรียเรื้อรัง (ต้องใช้ภายใต้คำสั่งสัตวแพทย์)',
    indicationEn: 'Bacterial infection treatment (Requires vet prescription)'
  },
  {
    id: 'enro',
    name: 'เอนโรฟลอกซาซิน (Enrofloxacin)',
    genericName: 'Enrofloxacin',
    type: 'antibiotic',
    standardWithdrawalDays: 30,
    indicationTh: 'ยาปฏิชีวนะกลุ่มฟลูออโรควิโนโลน (ห้ามใช้ในฟาร์มที่ส่งออกตลาดสหรัฐฯ/EU)',
    indicationEn: 'Fluoroquinolone antibiotic (Strictly banned in US/EU exports)'
  },
  {
    id: 'formalin',
    name: 'ฟอร์มาลินบริสุทธิ์ (Formalin 37%)',
    genericName: 'Formaldehyde solution',
    type: 'disinfectant',
    standardWithdrawalDays: 3,
    indicationTh: 'กำจัดปรสิตภายนอกและโพรโทซัวเกาะติดเหงือก',
    indicationEn: 'Ectoparasite and gill protozoan flush'
  },
  {
    id: 'bkc',
    name: 'บีเคซี (BKC 50%)',
    genericName: 'Benzalkonium Chloride',
    type: 'disinfectant',
    standardWithdrawalDays: 3,
    indicationTh: 'ฆ่าเชื้อแบคทีเรียและสาหร่ายในมวลน้ำ',
    indicationEn: 'Water column bactericide and algicide'
  },
  {
    id: 'iodine',
    name: 'โพวิโดนไอโอดีน (Povidone Iodine 10%)',
    genericName: 'Povidone Iodine',
    type: 'disinfectant',
    standardWithdrawalDays: 2,
    indicationTh: 'ฆ่าเชื้อและรักษาบาดแผลตามเปลือกกุ้ง',
    indicationEn: 'Broad-spectrum disinfectant for external lesions'
  },
  {
    id: 'probiotic',
    name: 'โปรไบโอติก บาซิลลัส (Bacillus subtilis)',
    genericName: 'Bacillus subtilis blend',
    type: 'probiotic',
    standardWithdrawalDays: 0,
    indicationTh: 'จุลินทรีย์ย่อยสลายของเสียและคุมเชื้อวิบริโอในทางเดินอาหาร (ไม่มีสารตกค้าง)',
    indicationEn: 'Biological sludge degrader & gut microbiome optimizer (Zero withdrawal)'
  }
];

export const DEFAULT_EXPERTS: ExpertContact[] = [
  {
    id: 'exp-1',
    name: 'น.สพ. ดร. วิชัย ชัยชนะ',
    title: 'ผู้เชี่ยวชาญด้านพยาธิสภาพสัตว์น้ำชายฝั่ง',
    organization: 'ศูนย์วิจัยและพัฒนาการเพาะเลี้ยงสัตว์น้ำชายฝั่ง เขต 2',
    phone: '081-456-7890',
    province: 'สุราษฎร์ธานี',
    notes: 'เชี่ยวชาญการชันสูตรโรคตับวายและไวรัส WSSV'
  },
  {
    id: 'exp-2',
    name: 'สพ.ญ. กานดา รัตนพาณิชย์',
    title: 'สัตวแพทย์ควบคุมฟาร์มสัตว์น้ำ (GAP/CoC)',
    organization: 'สมาคมผู้เพาะเลี้ยงสัตว์น้ำไทย',
    phone: '089-123-4567',
    province: 'สมุทรสาคร',
    notes: 'ให้คำปรึกษาด้านการจัดการชีวอนามัยและเวชภัณฑ์สัตว์น้ำ'
  },
  {
    id: 'exp-3',
    name: 'ดร. สมชาย มงคลกุล',
    title: 'นักวิชาการประมงชำนาญการพิเศษ',
    organization: 'ห้องปฏิบัติการตรวจโรค PCR สัตว์น้ำ',
    phone: '086-789-0123',
    province: 'ระยอง',
    notes: 'รับตัวอย่างตรวจ PCR ด่วน ทราบผลภายใน 24 ชม.'
  }
];

export const EXPORT_MARKET_CHECKLISTS = {
  US: [
    { checkId: 'us-1', title: 'FDA Food Safety Modernization Act (FSMA) / HACCP compliant' },
    { checkId: 'us-2', title: 'Zero Chloramphenicol & Nitrofurans residues certified' },
    { checkId: 'us-3', title: 'Enrofloxacin / Fluoroquinolone not detected' },
    { checkId: 'us-4', title: 'Country of Origin Labeling (COOL) trace chain verified' }
  ],
  EU: [
    { checkId: 'eu-1', title: 'EU Regulation 2017/625 Health & Veterinary certificate issued' },
    { checkId: 'eu-2', title: 'Strict Minimum Required Performance Limit (MRPL) antibiotic test' },
    { checkId: 'eu-3', title: 'Full batch traceability from hatchery PL to export container' },
    { checkId: 'eu-4', title: 'Cold chain temperature logs continuously verified below -18°C' }
  ],
  JP: [
    { checkId: 'jp-1', title: 'Positive List System compliant for all veterinary chemicals' },
    { checkId: 'jp-2', title: 'Sulfonamides & Oxytetracycline within MRL (<0.2 ppm)' },
    { checkId: 'jp-3', title: 'Vibrio parahaemolyticus microbiological clearance certified' }
  ],
  CN: [
    { checkId: 'cn-1', title: 'GACC registration number displayed on packing container' },
    { checkId: 'cn-2', title: 'Free of Decapod Iridescent Virus 1 (DIV1) and WSSV PCR test' },
    { checkId: 'cn-3', title: 'COVID-19 / Pathogen external package sanitation protocol' }
  ],
  ASEAN: [
    { checkId: 'asean-1', title: 'ASEAN GAP Shrimp standard compliance' },
    { checkId: 'asean-2', title: 'Official Veterinary Health Certificate' },
    { checkId: 'asean-3', title: 'Bilingual label specifications' }
  ]
};

export const SANITIZER_OPTIONS = [
  { value: 'chlorine', labelTh: 'คลอรีนผง/น้ำ (Chlorine 50-100 ppm)', labelEn: 'Chlorine (50-100 ppm)', defaultPpm: 100 },
  { value: 'potassium_permanganate', labelTh: 'ด่างทับทิม (Potassium Permanganate)', labelEn: 'Potassium Permanganate', defaultPpm: 20 },
  { value: 'iodine', labelTh: 'ไอโอดีนคอมเพล็กซ์ (Povidone Iodine)', labelEn: 'Povidone Iodine', defaultPpm: 30 },
  { value: 'bkc', labelTh: 'เบนซาลโคเนียม (BKC 80%)', labelEn: 'Benzalkonium Chloride (BKC)', defaultPpm: 2 },
  { value: 'lime', labelTh: 'ปูนขาว / ปูนร้อน (Quicklime CaO)', labelEn: 'Quicklime (CaO)', defaultPpm: 0 },
  { value: 'alcohol', labelTh: 'เอทิลแอลกอฮอล์ 70% (Alcohol 70%)', labelEn: 'Ethyl Alcohol 70%', defaultPpm: 70 },
  { value: 'other', labelTh: 'น้ำยาฆ่าเชื้อเฉพาะทางอื่นๆ', labelEn: 'Other Disinfectant', defaultPpm: 0 },
];

export const BIOSECURITY_CHECKLIST_TEMPLATE = [
  // 1. บุคลากร & รองเท้า
  {
    id: 'bio_footbath',
    category: 'personnel' as const,
    titleTh: 'อ่างจุ่มเท้าฆ่าเชื้อ (Footbath)',
    titleEn: 'Footbath Disinfection Basin',
    descriptionTh: 'น้ำยาฆ่าเชื้อมีความเข้มข้นเพียงพอ และเปลี่ยนน้ำยาใหม่ทุกเช้า',
    descriptionEn: 'Footbath chemical active, refreshed at start of day',
    critical: true,
  },
  {
    id: 'bio_handwash',
    category: 'personnel' as const,
    titleTh: 'การล้างมือฆ่าเชื้อก่อนสัมผัสบ่อ',
    titleEn: 'Hand Sanitization',
    descriptionTh: 'ล้างมือด้วยสบู่หรือแอลกอฮอล์ก่อนหยิบจับอาหารหรือยอยก',
    descriptionEn: 'Wash hands with disinfectant before handling feed or check trays',
    critical: true,
  },
  {
    id: 'bio_boots',
    category: 'personnel' as const,
    titleTh: 'รองเท้าบูทเฉพาะเขตบ่อเลี้ยง',
    titleEn: 'Dedicated Farm Boots',
    descriptionTh: 'สวมรองเท้าบูทที่ล้างทำความสะอาดแล้ว ห้ามใช้รองเท้าภายนอก',
    descriptionEn: 'Clean farm-only rubber boots worn inside culture perimeter',
    critical: false,
  },

  // 2. อุปกรณ์ & ถาดอาหาร
  {
    id: 'bio_dedicated_nets',
    category: 'equipment' as const,
    titleTh: 'แยกสวิงและกระบอกตักน้ำประจำบ่อ',
    titleEn: 'Dedicated Sampling Nets & Buckets',
    descriptionTh: 'ไม่ใช้สวิงหรืออุปกรณ์ตักข้ามระหว่างบ่อโดยเด็ดขาด ป้องกันการระบาดข้ามบ่อ',
    descriptionEn: 'Separate nets and sampling gear per pond to prevent cross-contamination',
    critical: true,
  },
  {
    id: 'bio_tray_clean',
    category: 'equipment' as const,
    titleTh: 'ทำความสะอาดและตากแห้งยอยกอาหาร',
    titleEn: 'Check Tray Sanitation',
    descriptionTh: 'ล้างตะไคร่น้ำและเศษอาหารตกค้างในถาดเช็ค ตากแดดฆ่าเชื้อ',
    descriptionEn: 'Wash residual feed/algae and sun-dry check trays',
    critical: false,
  },
  {
    id: 'bio_aerator_disinfect',
    category: 'equipment' as const,
    titleTh: 'ฆ่าเชื้ออุปกรณ์เติมอากาศก่อนย้าย',
    titleEn: 'Aerator Disinfection',
    descriptionTh: 'กรณีมีการย้ายเครื่องตีน้ำหรือสายอากาศ ต้องฉีดล้างฆ่าเชื้อก่อน',
    descriptionEn: 'Disinfect paddlewheels and aerator lines before cross-pond transfer',
    critical: false,
  },

  // 3. แนวกั้นพาหะ & น้ำเข้า
  {
    id: 'bio_water_filter',
    category: 'water_intake' as const,
    titleTh: 'ถุงกรองน้ำเข้าบ่อ 2 ชั้น',
    titleEn: 'Double-Layer Water Filter Bags',
    descriptionTh: 'ถุงกรองละเอียดสมบูรณ์ ไม่ฉีกขาด กรองตัวอ่อนปู กุ้งเคย และปลาพาหะ',
    descriptionEn: 'Fine mesh filter intact to block larval crabs, sergestid shrimp & wild fish',
    critical: true,
  },
  {
    id: 'bio_crab_fence',
    category: 'vector_control' as const,
    titleTh: 'แนวกั้นปูรอบบ่อ (Crab Barrier)',
    titleEn: 'Pond Dike Crab Barrier',
    descriptionTh: 'พลาสติกแนวกั้นปูสูง >30 ซม. ตึง ไม่มีรูรั่วหรือรอยฉีกขาดริมคันบ่อ',
    descriptionEn: 'Plastic barrier >30cm high around pond dikes intact without gaps',
    critical: true,
  },
  {
    id: 'bio_bird_net',
    category: 'vector_control' as const,
    titleTh: 'ตาข่ายหรือสายเอ็นกันนก (Bird Netting)',
    titleEn: 'Bird Deterrent Netting/Lines',
    descriptionTh: 'เส้นเอ็นขึงตึงเหนือผิวน้ำ ป้องกันนกจับสัตว์น้ำบินลงโฉบนำพาเชื้อโรค',
    descriptionEn: 'Lines/nets strung over water to prevent bird scavenging & pathogen transmission',
    critical: false,
  },

  // 4. พาหนะ & ผู้มาเยือน
  {
    id: 'bio_tire_dip',
    category: 'visitors' as const,
    titleTh: 'บ่อน้ำยาจุ่มล้อรถทางเข้าฟาร์ม (Tire Dip)',
    titleEn: 'Vehicle Tire Disinfection Dip',
    descriptionTh: 'รถขนส่งอาหาร/ลูกกุ้งต้องแล่นผ่านบ่อล้างล้อฆ่าเชื้อก่อนเข้าเขตฟาร์ม',
    descriptionEn: 'All feed trucks and transport vehicles pass through disinfection wheel dip',
    critical: false,
  },
  {
    id: 'bio_visitor_log',
    category: 'visitors' as const,
    titleTh: 'สมุดบันทึกผู้มาเยือน (Visitor Log)',
    titleEn: 'Visitor Logbook & Screening',
    descriptionTh: 'บุคคลภายนอกต้องลงชื่อ และห้ามเข้าใกล้ริมบ่อเลี้ยงโดยไม่ได้รับอนุญาต',
    descriptionEn: 'External visitors logged; strictly prohibited from pond edge without PPE',
    critical: false,
  },

  // 5. คลังอาหาร & การกำจัดซาก
  {
    id: 'bio_feed_pallet',
    category: 'feed_dead_disposal' as const,
    titleTh: 'การจัดเก็บอาหารกุ้งบนพาเลท',
    titleEn: 'Feed Storage on Pallets',
    descriptionTh: 'วางกระสอบบนพาเลทไม้ยกสูง >15 ซม. ห่างผนัง อากาศถ่ายเท ป้องกันหนู/แมลง',
    descriptionEn: 'Store bags on pallets >15cm off floor, ventilated and rodent-proof',
    critical: true,
  },
  {
    id: 'bio_dead_removal',
    category: 'feed_dead_disposal' as const,
    titleTh: 'การเก็บซากและฝังกลบโรยปูนขาว',
    titleEn: 'Mortality Removal & Limed Burial',
    descriptionTh: 'พบกุ้งตายริมบ่อต้องช้อนขึ้นทันที ฝังกลบพร้อมโรยปูนขาว ห้ามโยนลงคลองสาธารณะ',
    descriptionEn: 'Immediately retrieve dead shrimp; bury with lime; never dump into public canals',
    critical: true,
  },
];

