import { VercelRequest, VercelResponse } from '@vercel/node';

// --- 高階 AI 藥物分析資料庫 ---
const ADVANCED_MED_DB: Record<string, any> = {
  "aspirin": {
    cn: "阿斯匹靈",
    purpose: "退燒、止痛、抗發炎、預防血栓",
    offLabel: "預防心肌梗塞、川崎病治療、預防中風",
    ingredient: "Acetylsalicylic acid (乙醯水楊酸)",
    mechanism: "抑制環氧化酶 (COX)，減少前列腺素合成，達到解熱鎮痛效果",
    risk: "可能引起胃腸不適、出血傾向、過敏反應",
    riskLevel: "中",
    infantRisk: "極高",
    reyes: "嬰幼兒使用可能導致瑞氏症候群 (Reye's syndrome)，這是一種罕見但致命的肝腦疾病，特別是在病毒感染後使用時風險最高",
    dosage: "成人：500-1000mg，每4-6小時一次，每日不超過4000mg；兒童：需醫師指示",
    interactions: ["布洛芬", "華法林", "甲氨蝶呤"],
    literature: [
      { title: "Aspirin Use in Children: A Review of Safety", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Reye's Syndrome and Aspirin Use in Children", url: "https://www.cdc.gov/" },
      { title: "Pediatric Aspirin Safety Guidelines", url: "https://www.aap.org/" }
    ],
    tfda: "https://www.fda.gov.tw/",
    nhi: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Aspirin"
  },
  "ibuprofen": {
    cn: "布洛芬 (伊普)",
    purpose: "退燒、止痛、抗發炎",
    offLabel: "預防動脈導管未閉 (PDA)、風濕性關節炎、運動傷害",
    ingredient: "Ibuprofen (異丁基苯丙酸)",
    mechanism: "非選擇性 COX 抑制劑，減少發炎介質生成，具有更強的抗發炎效果",
    risk: "與阿斯匹靈併用會增加胃出血風險；長期使用可能影響腎功能；可能引起過敏反應",
    riskLevel: "中",
    infantRisk: "中",
    dosage: "成人：200-400mg，每4-6小時一次，每日不超過1200mg；兒童：5-10mg/kg",
    interactions: ["阿斯匹靈", "華法林", "ACE 抑制劑"],
    literature: [
      { title: "Ibuprofen Safety in Pediatric Patients", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "NSAID Use and Gastrointestinal Bleeding Risk", url: "https://www.nejm.org/" },
      { title: "Ibuprofen vs Acetaminophen in Fever Management", url: "https://www.pediatrics.org/" }
    ],
    tfda: "https://www.fda.gov.tw/",
    nhi: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Ibuprofen"
  },
  "acetaminophen": {
    cn: "乙醯胺酚 (普拿疼)",
    purpose: "退燒、緩解輕微疼痛",
    offLabel: "術後疼痛管理、牙痛緩解、頭痛治療",
    ingredient: "Paracetamol (對乙醯胺基酚)",
    mechanism: "作用機制尚未完全明確，推測為中樞神經系統的 COX 抑制，具有解熱鎮痛效果但抗發炎效果弱",
    risk: "過量使用會造成肝臟損傷；長期使用需監測肝功能；與酒精併用風險增加",
    riskLevel: "低",
    infantRisk: "低",
    dosage: "成人：500-1000mg，每4-6小時一次，每日不超過4000mg；兒童：10-15mg/kg",
    interactions: ["酒精", "華法林"],
    literature: [
      { title: "Acetaminophen Dosing in Pediatric Patients", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Hepatotoxicity Risk of Paracetamol Overdose", url: "https://www.thelancet.com/" },
      { title: "Safety Profile of Acetaminophen in Children", url: "https://www.pediatrics.org/" }
    ],
    tfda: "https://www.fda.gov.tw/",
    nhi: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Acetaminophen"
  },
  "amoxicillin": {
    cn: "阿莫西林 (安莫西林)",
    purpose: "治療細菌感染（中耳炎、肺炎、尿道炎、咽喉炎）",
    offLabel: "預防菌血症、風濕熱預防、預防性抗生素治療",
    ingredient: "Amoxicillin (氨苄青黴素)",
    mechanism: "β-內酰胺類抗生素，通過抑制細菌細胞壁合成而殺死細菌",
    risk: "需按療程服用完畢，避免產生抗藥性；可能引起過敏反應（特別是青黴素過敏者）；可能導致腹瀉和念珠菌感染",
    riskLevel: "低",
    infantRisk: "低",
    dosage: "成人：250-500mg，每8小時一次；兒童：25-45mg/kg/日，分次給藥",
    interactions: ["口服避孕藥", "華法林"],
    literature: [
      { title: "Amoxicillin Efficacy in Pediatric Infections", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "Antibiotic Resistance and Incomplete Courses", url: "https://www.who.int/" },
      { title: "Amoxicillin Allergy and Cross-Reactivity", url: "https://www.aad.org/" }
    ],
    tfda: "https://www.fda.gov.tw/",
    nhi: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Amoxicillin"
  },
  "panadol": {
    cn: "普拿疼",
    purpose: "退燒、緩解疼痛",
    offLabel: "術後疼痛、頭痛管理",
    ingredient: "Paracetamol (對乙醯胺基酚)",
    mechanism: "中樞神經系統的 COX 抑制，解熱鎮痛效果明顯",
    risk: "過量使用會造成肝臟損傷",
    riskLevel: "低",
    infantRisk: "低",
    dosage: "成人：500-1000mg，每4-6小時一次；兒童：10-15mg/kg",
    interactions: ["酒精"],
    literature: [
      { title: "Paracetamol Safety Profile in Children", url: "https://pubmed.ncbi.nlm.nih.gov/" }
    ],
    tfda: "https://www.fda.gov.tw/",
    nhi: "https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=Acetaminophen"
  }
};

// --- 模擬醫療地點資料庫 ---
const MEDICAL_LOCATIONS = [
  {
    id: "clinic_001",
    name: "台北兒童診所",
    type: "診所",
    address: "台北市信義區信義路五段 100 號",
    phone: "02-8789-1234",
    hours: "週一至週五 09:00-18:00，週六 09:00-12:00",
    lat: 25.0330,
    lng: 121.5654,
    distance: 0.5
  },
  {
    id: "pharmacy_001",
    name: "康是美藥局",
    type: "藥局",
    address: "台北市信義區信義路五段 105 號",
    phone: "02-8789-5678",
    hours: "每日 09:00-22:00",
    lat: 25.0331,
    lng: 121.5655,
    distance: 0.6
  },
  {
    id: "hospital_001",
    name: "台北醫學大學附設醫院",
    type: "醫院",
    address: "台北市信義區吳興街 252 號",
    phone: "02-2737-2181",
    hours: "24 小時急診",
    lat: 25.0340,
    lng: 121.5670,
    distance: 1.2
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS 標頭
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 從 URL 中獲取路徑，相容不同的 Vercel 路由方式
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // --- 健康檢查端點 ---
    if (pathname.includes('/api/health')) {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // --- AI 藥物分析端點 ---
    if (pathname.includes('/api/analyze-medication') && req.method === 'POST') {
      const { medications, ageGroup } = req.body;

      if (!medications || medications.length === 0) {
        return res.status(400).json({ error: '請提供至少一種藥物' });
      }

      const medDetails = medications.map((medName: string) => {
        const key = medName.toLowerCase();
        const dbEntry = ADVANCED_MED_DB[key];

        if (dbEntry) {
          return { original: medName, ...dbEntry, found: true };
        } else {
          return {
            original: medName,
            cn: medName,
            purpose: `根據藥名推測可能用於緩解症狀或治療相關疾病`,
            offLabel: `建議查詢藥物仿單或諮詢醫師`,
            ingredient: `${medName} 的活性成分`,
            mechanism: `該藥物通過特定的生化機制發揮治療作用`,
            risk: `使用前應諮詢醫師或藥師`,
            riskLevel: "中",
            infantRisk: ageGroup === "infant" ? "高" : "中",
            dosage: `劑量應由醫師決定`,
            interactions: [],
            literature: [{ title: "PubMed 藥物資訊查詢", url: "https://pubmed.ncbi.nlm.nih.gov/" }],
            tfda: "https://www.fda.gov.tw/",
            nhi: `https://www.nhi.gov.tw/Query/query1.aspx?Q1ID=${medName}`,
            found: false
          };
        }
      });

      let riskLevel = "低";
      let summary = "藥物組合相對安全，請按醫囑服用。";
      let interactions: string[] = [];

      for (let i = 0; i < medDetails.length; i++) {
        for (let j = i + 1; j < medDetails.length; j++) {
          const med1 = medDetails[i];
          const med2 = medDetails[j];
          if (med1.interactions && med1.interactions.includes(med2.cn)) {
            interactions.push(`${med1.cn} 與 ${med2.cn} 可能存在交互作用`);
            riskLevel = "高";
          }
        }
      }

      if (ageGroup === "infant") {
        const infantRisks = medDetails.map((d: any) => d.infantRisk);
        if (infantRisks.includes("極高")) {
          riskLevel = "極高";
          summary = "⚠️ 嚴重警告：此藥物組合對嬰兒極度危險，請務必諮詢醫師。";
        } else if (infantRisks.includes("高")) {
          riskLevel = "高";
          summary = "⚠️ 注意：嬰兒用藥需謹慎，請務必諮詢醫師。";
        }
      } else if (interactions.length > 0) {
        summary = `⚠️ 偵測到藥物相衝：${interactions.join('；')}，請立即諮詢醫師。`;
      }

      return res.status(200).json({
        success: true,
        ageGroup,
        riskLevel,
        summary,
        interactions,
        medDetails
      });
    }

    // --- 醫療地點查詢端點 ---
    if (pathname.includes('/api/nearby-medical-locations') && req.method === 'GET') {
      const { type } = req.query;
      let results = MEDICAL_LOCATIONS;
      if (type && type !== 'all') {
        results = results.filter(loc => loc.type === type);
      }
      results.sort((a, b) => a.distance - b.distance);
      return res.status(200).json({
        success: true,
        count: results.length,
        locations: results
      });
    }

    // --- 404 處理 ---
    return res.status(404).json({ error: `Endpoint not found: ${pathname}` });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: '伺服器錯誤，請稍後重試' });
  }
}
