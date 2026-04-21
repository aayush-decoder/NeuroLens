/** Hard-word map shared between extension and webapp. */
export const AR_HARD_WORDS = new Map<string, { meaning: string; hindi: string }>([
  ['vietnamese', { meaning: 'from Vietnam', hindi: 'वियतनामी' }],
  ['honorary', { meaning: 'given as an honor', hindi: 'मानदंडित' }],
  ['archipelago', { meaning: 'group of islands', hindi: 'द्वीपसमूह' }],
  ['sovereignty', { meaning: 'supreme authority', hindi: 'सार्वभौमिकता' }],
  ['asserts', { meaning: 'claims strongly', hindi: 'दावा करना' }],
  ['covertly', { meaning: 'secretly', hindi: 'गुप्त रूप से' }],
  ['paramilitary', { meaning: 'semi-military', hindi: 'अर्धसैनिक' }],
  ['ethnographic', { meaning: 'study of people', hindi: 'जनजातीय अध्ययन' }],
  ['interrogation', { meaning: 'formal questioning', hindi: 'पूछताछ' }],
  ['misery', { meaning: 'extreme suffering', hindi: 'दुःख' }],
  ['intimidated', { meaning: 'frightened', hindi: 'डरा हुआ' }],
  ['expeditions', { meaning: 'journeys', hindi: 'अभियान' }],
  ['reclamation', { meaning: 'land recovery', hindi: 'पुनः दावा' }],
  ['infrastructure', { meaning: 'basic facilities', hindi: 'बुनियादी ढांचा' }],
  ['disappeared', { meaning: 'vanished', hindi: 'गायब' }],
  ['transnational', { meaning: 'crossing countries', hindi: 'अंतरराष्ट्रीय' }],
  ['assertiveness', { meaning: 'forceful behavior', hindi: 'आत्मविश्वासपूर्ण' }],
  ['harassment', { meaning: 'persistent trouble', hindi: 'उत्पीड़न' }],
  ['oblivion', { meaning: 'state of being forgotten', hindi: 'अविस्मरण' }],
  ['detained', { meaning: 'kept in custody', hindi: 'हिरासत में लिया' }],
  ['bureaucracy', { meaning: 'official procedures', hindi: 'राजस्व प्रशासन' }],
  ['intervention', { meaning: 'getting involved', hindi: 'हस्तक्षेप' }],
  ['diplomatic', { meaning: 'relating to diplomacy', hindi: 'राजनयिक' }],
  ['unilateral', { meaning: 'one-sided', hindi: 'एकतरफा' }],
  ['paramount', { meaning: 'most important', hindi: 'परम' }],
  ['resilience', { meaning: 'ability to recover', hindi: 'लचीलापन' }],
  ['evacuated', { meaning: 'removed safely', hindi: 'खाली किया' }],
  ['adversity', { meaning: 'difficulties', hindi: 'कठिनाई' }],
  ['extrajudicial', { meaning: 'outside courts', hindi: 'अधिकारित न्याय के बाहर' }],
  ['espionage', { meaning: 'spying', hindi: 'जासूसी' }],
  ['guerilla', { meaning: 'irregular fighter', hindi: 'गुरिल्ला' }],
  ['cooperation', { meaning: 'working together', hindi: 'सहयोग' }],
  ['rhetoric', { meaning: 'persuasive language', hindi: 'प्रशंसात्मक भाषा' }],
  ['sanctions', { meaning: 'penalties', hindi: 'प्रतिबंध' }],
  ['annexed', { meaning: 'added territory', hindi: 'संपत्ति जोड़ना' }],
  ['vulnerability', { meaning: 'weakness', hindi: 'असुरक्षा' }],
  ['impunity', { meaning: 'without punishment', hindi: 'निर्दोषता' }],
  ['insurgency', { meaning: 'rebellion', hindi: 'विद्रोह' }],
  ['displacement', { meaning: 'forced moving', hindi: 'स्थलांतरण' }],
  ['maritime', { meaning: 'related to sea', hindi: 'समुद्री' }],
  ['navigation', { meaning: 'sailing skill', hindi: 'नौवहन' }],
  ['jurisdiction', { meaning: 'legal authority', hindi: 'क्षेत्राधिकार' }],
  ['escalated', { meaning: 'intensified', hindi: 'बढ़ा' }],
  ['disputed', { meaning: 'argued over', hindi: 'विवादित' }],
  ['casualties', { meaning: 'injured/killed', hindi: 'हानि' }],
  ['armistice', { meaning: 'truce', hindi: 'युद्धविराम' }],
  ['militia', { meaning: 'armed civilians', hindi: 'स्वयंसेवक सेना' }],
  ['coercion', { meaning: 'forcing', hindi: 'दबाव' }],
  ['mediation', { meaning: 'conflict resolving', hindi: 'मध्यस्थता' }],
  ['bilateral', { meaning: 'two-sided', hindi: 'द्विपक्षीय' }],
  ['negotiation', { meaning: 'discussion to agree', hindi: 'समझौता वार्ता' }],
  ['retaliation', { meaning: 'counterattack', hindi: 'प्रतिशोध' }],
  ['deterrence', { meaning: 'prevention', hindi: 'निरोध' }],
  ['occupation', { meaning: 'control of land', hindi: 'अधिकार' }],
  ['abduction', { meaning: 'kidnapping', hindi: 'अपहरण' }],
  ['precarious', { meaning: 'unsafe', hindi: 'असुरक्षित' }],
  ['fatalities', { meaning: 'deaths', hindi: 'मृत्यु' }],
  ['hostile', { meaning: 'unfriendly', hindi: 'शत्रुतापूर्ण' }],
  ['subversion', { meaning: 'undermining authority', hindi: 'उपद्रव' }],
  ['obstruction', { meaning: 'blocking', hindi: 'अवरोध' }],
]);

export function scanWordmap(text: string): Array<{ original: string; meaning: string; hindi: string }> {
  const results: Array<{ original: string; meaning: string; hindi: string }> = [];
  for (const [key, entry] of AR_HARD_WORDS) {
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(text)) {
      const match = text.match(new RegExp(`\\b${key}\\b`, 'i'));
      results.push({ original: match ? match[0] : key, meaning: entry.meaning, hindi: entry.hindi });
    }
  }
  return results;
}
