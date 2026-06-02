// ── COUNTRY-SPECIFIC SOLUTIONS ─────────────────────────────────────────────
// CS[country][issueName] → string[3] of localized action steps.
// CG maps countries without individual entries to a regional group key.
// getSol() walks: country → regional group → _Global.
const CS = {
  "India":{
    "Physical Violence":["Women's Helpline: 181 (free, 24h) · iCall: 9152987821 · Vandrevala Foundation: 1860-2662-345","File FIR under Protection of Women from Domestic Violence Act 2005 at nearest police station or dial 100","NGO: Majlis Legal Centre (Mumbai) · Sakhi Women's Resource Centre · Breakthrough India"],
    "Sexual Assault":["One Stop Crisis Centres (OSCCs) at district hospitals - free medico-legal care · iCall: 9152987821","File FIR under IPC Sec 376; POCSO Act protects minors - no fee, anonymous complaint possible","NGO: Dilaasa (Mumbai) · Rahi Foundation · INCLEN Trust - contact via local hospital social worker"],
    "Emotional Abuse":["Vandrevala Foundation: 1860-2662-345 (24h) · iCall: 9152987821 · Snehi: 044-24640050","Emotional/psychological abuse is cognisable under DV Act 2005 - document incidents with dates","NGO: iCall TISS · Sangath (Goa) · Banyan (Chennai) - free counselling available"],
    "Economic Control":["NALSA free legal aid: 15100 · District Legal Services Authority provides lawyers at no cost","Open individual bank account; contact District Women & Child Development office for shelter/support","NGO: SEWA (Self Employed Women's Association) · Mann Deshi Foundation · Usha Multipurpose Cooperative"],
    "Stalking/Harassment":["File complaint under IPC Sec 354D (stalking) - cognisable, non-bailable offence · Police helpline: 100","NCW online complaint portal: ncwapps.nic.in · Safe City app (SafetiPin) for incident reporting","NGO: Safecity (iamgurgaon.org) · Jagori · Action Aid India - safety audits and legal support"],
    "Child Marriage":["Childline India: 1098 (free, 24h) · file complaint with District Child Protection Unit (DCPU)","Child marriage is prohibited under PCMA 2006 - any adult, NGO or official can file complaint","NGO: Girls Not Brides India · ICRW India · Breakthrough - contact local district social welfare office"],
    "Honour-based Violence":["NCW helpline: 7827170170 · State Women's Commission (varies by state) · Police: 100","Contact District Collector/Magistrate for protection order - courts respond within 3 days under DV Act","NGO: Swayam (Kolkata) · Saheli Women's Resource Centre (Delhi) · NFIW"],
    "Trafficking":["Anti-Trafficking helpline: 1800-419-8588 (free) · Childline: 1098 · Police Anti-HTCU unit","File complaint with local police Anti-Human Trafficking Unit (AHTU) - present in every district SP office","NGO: Prajwala (Hyderabad) · IJM India · Rescue Foundation (Mumbai)"],
  },
  "UK":{
    "Physical Violence":["National DV Helpline: 0808 2000 247 (free, 24h) · Women's Aid · Refuge · Men's Advice Line: 0808 801 0327","Call 999 (emergency) or 101 (non-emergency) - police have dedicated domestic abuse investigation units","NGO: Women's Aid · Refuge · SafeLives · Respect Men's Advice Line for male victims"],
    "Sexual Assault":["Rape Crisis: 0808 802 9999 (free) · Sexual Assault Referral Centres (SARCs) - free NHS forensic care","You can attend a SARC without involving police; they preserve evidence for up to 7 days if you choose","NGO: Survivors UK (men & boys): 0203 598 3898 · Rape Crisis England & Wales · ISVA support workers"],
    "Emotional Abuse":["National DV Helpline: 0808 2000 247 · Mind: 0300 123 3393 · Samaritans: 116 123 (24h)","Coercive control is a criminal offence under Serious Crime Act 2015 - you can report it to 101","NGO: Women's Aid · Refuge · ManKind Initiative (for men): 01823 334244"],
    "Economic Control":["Citizens Advice: 0800 144 8848 · Surviving Economic Abuse charity: survivingeconomicabuse.org","Contact DWP for emergency welfare payments; Legal Aid available for financial protection orders","NGO: Surviving Economic Abuse · Shelter (housing): 0808 800 4444 · StepChange debt advice"],
    "Stalking/Harassment":["Paladin National Stalking Advocacy Service · Protection from Harassment Act 1997 - call 101","Apply for a Stalking Protection Order (SPO) through police or direct to magistrates court","NGO: Paladin NSAS · Suzy Lamplugh Trust: 020 7091 0014 · Network for Surviving Stalking"],
    "Child Marriage":["Forced Marriage Unit: 020 7008 0151 (Mon–Fri) or 020 7008 1500 (24h emergency)","It is illegal to force someone into marriage in the UK - report to police or FMU confidentially","NGO: Karma Nirvana: 0800 599 9247 · Southall Black Sisters · Imkaan"],
    "Honour-based Violence":["Karma Nirvana: 0800 599 9247 (Mon–Fri 9–5) · Police: 101 - specialist HBA officers available","Safe houses exist nationwide with strict location confidentiality - Karma Nirvana can refer","NGO: Southall Black Sisters · Imkaan · Iranian & Kurdish Women's Rights Organisation (IKWRO)"],
    "Trafficking":["Modern Slavery Helpline: 0800 0121 700 (24h, free) · National Referral Mechanism for victims","Report to police or Border Force; NRM provides access to housing, legal aid and support","NGO: Unseen UK: 0117 914 3909 · Anti-Slavery International · ECPAT UK (for children)"],
  },
  "USA":{
    "Physical Violence":["National DV Hotline: 1-800-799-7233 (24h) or text START to 88788 · call 911 in immediate danger","File for an Emergency Protective Order (EPO) through police, or a Civil Protection Order at court","NGO: YWCA local chapter · loveisrespect.org (teens): 1-866-331-9474 · Casa de Esperanza (Latina)"],
    "Sexual Assault":["RAINN: 800-656-HOPE (4673) (24h) · Crisis Text Line: text HOME to 741741","Sexual Assault Nurse Examiners (SANEs) at hospital ERs provide free evidence kits - no police report required","NGO: RAINN.org · National Sexual Violence Resource Center (NSVRC) · FORGE (LGBTQ+)"],
    "Emotional Abuse":["National DV Hotline: 1-800-799-7233 · NAMI helpline: 988 (Suicide & Crisis Lifeline)","Coercive control is increasingly recognised legally in US states - check your state law","NGO: thehotline.org · loveisrespect.org · One Love Foundation (young people)"],
    "Economic Control":["NDVH Financial Abuse resources: thehotline.org/resources/financial-abuse · call 1-800-799-7233","Apply for VAWA benefits; contact local Legal Aid for financial protection orders","NGO: Allstate Foundation Purple Purse · YWCA financial empowerment programs · WomensLaw.org"],
    "Stalking/Harassment":["Stalking Prevention Awareness Network (SPAN) · Cyber Civil Rights Initiative for online abuse","Apply for a Protective Order / Restraining Order at county courthouse - often same-day","NGO: SPARC · National Center for Victims of Crime: 1-855-4-VICTIM · Safe Horizon"],
    "Child Marriage":["Unchained At Last (US's only org ending forced/child marriage): 908-481-HOPE","Contact Child Protective Services (CPS) or law enforcement if a minor is at risk","NGO: Tahirih Justice Center · Girls Not Brides USA · Unchained at Last"],
    "Honour-based Violence":["Daya Houston · Sakhi for South Asian Women · Manavi (NJ) for South Asian communities","Contact NDVH (1-800-799-7233) or a culturally-specific DV organisation near you","NGO: Apna Ghar (Chicago) · Maitri (Bay Area) · NARIKA (Bay Area)"],
    "Trafficking":["National Human Trafficking Hotline: 1-888-373-7888 (24h) or text 233733","Contact local law enforcement, FBI, or Homeland Security Investigations (HSI)","NGO: Polaris Project · IJM US · CAST LA (survivor-centred services)"],
  },
  "Brazil":{
    "Physical Violence":["Central de Atendimento à Mulher: 180 (free, 24h) · Disque Denúncia: 197 · Polícia: 190","Registre Boletim de Ocorrência na Delegacia da Mulher (DEAM) - Lei Maria da Penha garante proteção","NGO: Instituto Patrícia Galvão · SOS Mulher · Observe (monitoramento de políticas)"],
    "Sexual Assault":["Ligue 180 · CREAS (Centro de Referência Especializado de Assistência Social) - gratuito","Pronto-socorro oferece atendimento pós-estupro gratuitamente - preserve evidências se possível","NGO: Centro de Referência da Mulher · ANIS (direitos reprodutivos) · Grupo Curumim"],
    "Emotional Abuse":["CVV: 188 (24h gratuito) · CAPS local (Centro de Atenção Psicossocial) · Ligue 180","Violência psicológica é crime pela Lei Maria da Penha - registre B.O. na DEAM","NGO: Instituto Noos · Themis · SOS Mulher (0800 071 1100)"],
    "Child Marriage":["Ligue 180 · Conselho Tutelar (proteção da criança) - presente em todos os municípios","Casamento infantil proibido pela reforma de 2019 - reporte à Promotoria da Infância","NGO: Promundo Brasil · Plan International Brasil · UNICEF Brasil"],
    "Trafficking":["Disque Denúncia: 197 · Ministério da Justiça - núcleo de enfrentamento ao tráfico","Posto de Atendimento Humanizado ao Migrante (PAHM) em aeroportos e rodoviárias","NGO: CHAME Salvador · Núcleo de Enfrentamento ao Tráfico · Cáritas Brasileira"],
  },
  "South Africa":{
    "Physical Violence":["GBV Command Centre: 0800 428 428 (free, 24h) · SAPS: 10111 · Stop Gender Violence: 0800 150 150","Open an Interdict (restraining order) at your nearest Magistrate's Court - police must assist","NGO: POWA: 011 642 4345 · Mosaic: 021 761 7585 · LifeLine: 0861 322 322"],
    "Sexual Assault":["Thuthuzela Care Centres (TCC) - free forensic care, counselling, legal advice at 55 sites nationwide","Rape Crisis Cape Town: 021 447 9762 · CORT Durban: 031 312 2323 · TEARS: 0800 035 553","NGO: Rape Crisis · SANCA · NPA Sexual Offences Courts - specialist prosecutors available"],
    "Emotional Abuse":["LifeLine: 0861 322 322 · FAMSA: 011 975 7107 · SADAG: 0800 21 22 23","Emotional abuse is a criminal offence under DVA 116/1998 - report to SAPS or nearest NGO","NGO: FAMSA · Childline: 0800 055 555 · SACAP-registered counsellors (sacap.org.za)"],
    "Child Marriage":["Childline: 0800 055 555 (free) · Department of Social Development child protection services","Child marriage is illegal in South Africa - report to SAPS, Social Services, or CGCSA","NGO: Sonke Gender Justice · Plan South Africa · CGCSA"],
    "Trafficking":["Stop Trafficking of People (STOP): 021 447 5096 · DSD: 0800 220 250","Report to SAPS or contact IOM South Africa (iom.int) for victim support and shelter","NGO: IOM SA · Childline SA · Love Justice International · SWEAT"],
  },
  "Pakistan":{
    "Physical Violence":["Edhi Foundation: 115 · Punjab Women's Helpline (Umang): 0311-7786264 · Police: 15","File FIR under PPEWA 2010 (Punjab) or Protection Against Harassment of Women Act","NGO: Aurat Foundation (Lahore) · Shirkat Gah · ROZAN Counselling Centre: 051-2890505"],
    "Honour-based Violence":["NCSW (National Commission on Status of Women): 051-9204788 · Umang helpline: 0311-7786264","Seek shelter at government Darul Aman or WAJ (Women's Aid Junction) safe house","NGO: Aurat Foundation · White Ribbon Pakistan · Madadgar helpline: 0800-15522"],
    "Child Marriage":["Sahil: 051-2890505 · Child Protection & Welfare Bureau Punjab: 1121 (free, 24h)","Child marriage under 18 is illegal - file complaint with local police or Child Protection Bureau","NGO: Sahil · Girls Not Brides Pakistan · SPARC - district offices in all provinces"],
    "Economic Control":["Contact District Women Development Department · Rozgar scheme for women's employment","Pakistan Poverty Alleviation Fund (PPAF) microfinance programmes available in rural areas","NGO: Kashf Foundation (microcredit) · Akhuwat (interest-free loans) · NRSP"],
    "Trafficking":["FIA Anti-Trafficking helpline: 1919 · contact nearest FIA office (fia.gov.pk)","Azaad Foundation · Bedari · Simorgh Women's Resource & Publication Centre","NGO: Azaad Foundation · IOM Pakistan · WAJ safe houses"],
  },
  "Bangladesh":{
    "Physical Violence":["National Help Desk: 01712-765432 · One-Stop Crisis Centres (OCCs) at medical colleges","File GD/FIR at local police station under Domestic Violence (Prevention & Protection) Act 2010","NGO: BNWLA: 02-8815367 · Naripokkho · Bangladesh National Women Lawyers' Association"],
    "Child Marriage":["Childline: 1098 (free) · Manusher Jonno Foundation: 01711-541470 · District Social Services","Child marriage below 18 is illegal - report to Union Parishad, UNO office, or nearest police station","NGO: Plan International Bangladesh · BRAC · Manusher Jonno Foundation (MJF)"],
    "Trafficking":["Counter Trafficking Task Force · IOM Bangladesh: 02-9887186 · Police: 999","Contact Ministry of Home Affairs anti-trafficking unit or nearest police station","NGO: BRAC Migration · Dhaka Ahsania Mission · Action Against Trafficking (ATSEC)"],
    "Economic Control":["Bangladesh Bank microfinance links · Grameen Bank (grameenbank.org.bd) · BRAC savings groups","District Legal Aid Committees (DLAC) provide free legal services under Legal Aid Services Act","NGO: BRAC · ASA microfinance · Shakti Foundation for Disadvantaged Women"],
  },
  "Mexico":{
    "Physical Violence":["INMUJERES: 55 5322 2434 · Línea de la Vida: 800 911 2000 (free, 24h) · CAVI (DF)","Denuncia ante Fiscalía Especial para Delitos de Violencia contra Mujeres (FEVIMTRA): 01 800 835 4632","NGO: EQUIS Justicia para las Mujeres · Red Nacional de Refugios · Semillas"],
    "Sexual Assault":["FEVIMTRA: 01 800 835 4632 · CNDH: 800 202 1892 · Línea de la Vida: 800 911 2000","Centros de Justicia para Mujeres en los 32 estados ofrecen atención integral gratuita","NGO: GIRE · Marea Verde · Cápsula de Género - sin costo, confidencial"],
    "Stalking/Harassment":["Fiscalía local - el acoso es delito en la mayoría de estados · Policía: 911","FEVIMTRA para casos federales · Aplicación Cero Acoso para reportar hostigamiento","NGO: Semillas · EQUIS · Instituto de Liderazgo Simone de Beauvoir"],
    "Trafficking":["CNDH: 800 202 1892 · PGR anti-trata · Línea de la Vida: 800 911 2000","Centros de Atención a Víctimas de Trata · Código Penal Federal Arts. 207-208","NGO: Coalición CATW-México · Benposta · Proyecto Dilema"],
  },
  "Nigeria":{
    "Physical Violence":["WARIF Helpline: 0800 9080 800 (Mon–Fri) · Gender Desk at nearest SCID/Police Station","Report under Violence Against Persons Prohibition (VAPP) Act 2015 - 26 states adopted it","NGO: WARIF (Lagos) · FIDA Nigeria · Project Alert on Violence Against Women: 01 774 0607"],
    "Sexual Assault":["WARIF: 0800 9080 800 · Mirabel Centre Lagos · Sexual Assault Referral Centres (SARCs)","VAPP Act 2015 criminalises rape with minimum 12-year sentence - report to police SCID","NGO: Mirabel Centre: 01 629 5600 · WARIF · NAPTIP sexual exploitation unit"],
    "Child Marriage":["NAPTIP: 0800 NAPTIP 0 (08001300) · State Ministry of Women Affairs & Social Development","Child Rights Act 2003 applies in 36 states - report to NAPTIP or state welfare office","NGO: Girls Not Brides Nigeria · Save the Children Nigeria · UNICEF Nigeria: 09 461 8930"],
    "Trafficking":["NAPTIP: 0800 NAPTIP 0 (08001300) · Lagos State Hotline: 0700 225 5438","Report to NAPTIP, airport Immigration, or Nigerian Police Force anti-trafficking unit","NGO: NAPTIP · IOM Nigeria · Restoration of Hope Initiative"],
  },
  "Afghanistan":{
    "Physical Violence":["Ministry of Women's Affairs: 00-93-20-210-3436 · AIHRC: 00-93-20-220-0340","Women for Afghan Women (WAW) shelters in Kabul, Herat, Mazar-i-Sharif, Jalalabad","NGO: Women for Afghan Women (WAW) · AWN (Afghan Women's Network) · Medica Afghanistan"],
    "Honour-based Violence":["AWN emergency contacts · AIHRC (aihrc.org.af) · UN Women Afghanistan office","If in imminent danger, contact nearest UNHCR office for protection referral","NGO: RAWA (rawa.org) · Medica Afghanistan (trauma care) · WAW safe houses"],
    "Child Marriage":["Minimum marriage age 16 for girls under Civil Law - report to AIHRC or UNHCR","Contact local Huquq (justice) department or UNHCR for protection order","NGO: Girls Not Brides · UNICEF Afghanistan: 0093-79-204 5310 · Save the Children"],
    "Trafficking":["IOM Afghanistan: 00-93-700-288-999 · UNHCR Afghanistan office","Counter-trafficking unit under Ministry of Interior - file complaint at Kabul HQ","NGO: IOM · Terre des Hommes · International Justice Mission (IJM) Afghanistan"],
  },
  "Germany":{
    "Physical Violence":["Hilfetelefon Gewalt gegen Frauen: 08000 116 016 (free, 24h, anonymous) · Notruf: 110","Gewaltschutzgesetz (GewSchG) - apply to Amtsgericht for Schutzanordnung (protection order)","NGO: Frauenhauskoordinierung (frauenhauskoordinierung.de) · bff · BIG Hotline Berlin: 030 611 03 00"],
    "Sexual Assault":["Hilfetelefon: 08000 116 016 · Notruf für vergewaltigte Frauen Berlin: 030 251 2828","Frauennotruf at local level · Polizei takes Anzeige - medical evidence collected at Rechtsmedizin","NGO: Wildwasser · LARA Berlin: 030 216 88 88 · Frauenberatungsstellen (local)"],
    "Emotional Abuse":["Hilfetelefon: 08000 116 016 · TelefonSeelsorge: 0800 111 0 111 (free, 24h)","Psychische Gewalt recognised under §1 GewSchG - seek local Beratungsstelle for support","NGO: BIG Hotline Berlin: 030 611 03 00 · Wildwasser · Frauenberatungsstellen"],
    "Stalking/Harassment":["Hilfetelefon: 08000 116 016 · Polizei: 110 - Nachstellung (stalking) is §238 StGB offence","Weißer Ring: 116 006 (victim support) · apply for Kontaktverbot at Amtsgericht","NGO: Weißer Ring · STALKING.DE · Bundesverband der Frauennotrufe (bff)"],
    "Trafficking":["KOK (Koordinierungskreis Menschenhandel): kok-buero.de · BKA Hotline: 0611 551 3321","Beratungsstelle für Opfer von Menschenhandel · Bundeskriminalamt (BKA) anti-trafficking unit","NGO: Solwodi · Jadwiga · IN VIA · Terre des Femmes Deutschland"],
  },
  "France":{
    "Physical Violence":["3919 - Violences Femmes Info (free, 24h) · SAMU: 15 · Police: 17 · Emergency: 112","Porter plainte au commissariat; ordonnance de protection available in 6 days from Tribunal Judiciaire","NGO: FNSF · En Avant Toutes (enavanttoutes.fr) · France Victimes: 116 006"],
    "Sexual Assault":["3919 · Collectif Féministe contre le Viol: 0800 05 95 95 (Mon–Fri 10–14h, free)","Kit de prélèvement médico-légal dans les urgences hospitalières gratuitement","NGO: CFCV · Stop Violences Femmes · Association VIOL SECOURS"],
    "Trafficking":["3919 · OCRTEH (Office Central de Répression de la Traite): report online via signal-spam.fr","Comité contre l'Esclavage Moderne (CCEM): 01 44 52 88 90 · ALC: 04 93 07 86 20","NGO: CCEM · Amicale du Nid · Secours Catholique"],
  },
  "Spain":{
    "Physical Violence":["016 (free, anonymous, no call log, 24h) · WhatsApp: 600 000 016 · Emergency: 112","Solicitar Orden de Protección en el Juzgado de Guardia - protegida por Ley Orgánica 1/2004","NGO: Federación Mujeres Progresistas · Asociación Ana Bella · CCOO Servicio de Atención"],
    "Sexual Assault":["016 · 112 · Unidades de Atención a Víctimas Sexuales en hospitales de referencia","Denuncia en comisaría o Guardia Civil sin necesidad de abogado - gratuito","NGO: ACASDOM · Asociación de Asistencia a Víctimas de Agresiones Sexuales · CAVAS"],
    "Trafficking":["900 105 090 (Trata, free) · 016 · Fiscalía Antidroga y Trata · Policía: 091","Unidades Policiales Especializadas en Trata (UCRIF) en Comisarías Provinciales","NGO: Proyecto Esperanza: 91 542 11 14 · Red Española contra la Trata · Apramp"],
  },
  "Australia":{
    "Physical Violence":["1800RESPECT: 1800 737 732 (free, 24h) · Lifeline: 13 11 14 · Police/Emergency: 000","Apply for an Apprehended Violence Order (AVO) at local court or through police - free","NGO: White Ribbon · Safe Steps VIC: 1800 015 188 · Domestic Violence NSW: 1800 656 463"],
    "Sexual Assault":["1800RESPECT: 1800 737 732 · CASA (Centre Against Sexual Assault) - local centres nationwide","Sexual Assault Services at hospitals provide forensic care without mandatory police reporting","NGO: Full Stop Australia: 1800 385 578 · CASA Forum · Rape & Domestic Violence Services Aust."],
    "Emotional Abuse":["1800RESPECT: 1800 737 732 · Beyond Blue: 1300 22 4636 · MensLine: 1300 789 978","Family violence provisions in all states - seek legal advice at local community legal centre","NGO: inTouch Multicultural · Immigrant Women's DV Service · No to Violence (men)"],
    "Child Marriage":["Australian Federal Police: 131 AFP · call 1800RESPECT: 1800 737 732","Forced Marriage is a criminal offence under Criminal Code Act - report to AFP confidentially","NGO: ACRATH (acrath.org.au) · STOP THE TRAFFIK Australia · Act for Kids"],
    "Trafficking":["Australian Federal Police: 131 AFP · Fair Work Ombudsman: 13 13 94","National Referral Mechanism - report to AFP or Border Force · SOCA (Salvation Army)","NGO: Anti-Slavery Australia · Scarlet Alliance · ACRATH"],
  },
  "China":{
    "Physical Violence":["Women's Federation Hotline: 12338 · Anti-DV Law (2016) gives courts power to issue protection orders","File complaint with local Women's Federation, Public Security Bureau (PSB), or Civil Affairs Bureau","NGO: 众泽妇女法律援助中心 (Beijing) · Women's Watch China · Maple Center counselling"],
    "Sexual Assault":["12338 · Maple Center counselling: 010 6833 3388 · local PSB: 110 for emergencies","Report to Public Security Bureau · university-based support centres in major cities","NGO: Zhongze Women's Legal Aid · Beijing众泽 · Anti-DV Network China"],
    "Emotional Abuse":["12338 · Beijing Maple Women's Psychological Counselling Centre: 010 6833 3388","Psychological violence is covered under Anti-DV Law 2016 - file with PSB or courts","NGO: Maple Center · Women's Watch China · Gender&Health Action (SHA)"],
    "Trafficking":["Ministry of Public Security: 110 · China Social Assistance Hotline: 12345","MPS anti-trafficking units in every province - report online at www.12389.gov.cn","NGO: LoveSaves · ChinaAid · Destinations International"],
  },
  "Russia":{
    "Physical Violence":["All-Russia Hotline: 8-800-7000-600 (free) · Syostry Crisis Centre Moscow: +7 495 900-45-54","Note: First-offence DV was decriminalised in 2017; filing a criminal complaint is still possible but harder","NGO: ANNA National Centre for DV Prevention · Syostry Rape Crisis · Krizisny Tsentr (local)"],
    "Sexual Assault":["Syostry Rape Crisis Centre Moscow: +7 495 900-45-54 · Police: 112","Forensic medical evidence available at Bureaus of Forensic Medical Examination (BSME)","NGO: Syostry · ANNA Centre · Human Rights Watch Russia (crisis documentation)"],
    "Emotional Abuse":["8-800-7000-600 (free) · TelefDon: 8-800-2000-122 · local Krizisny Tsentr","Psychological help at municipal crisis centres - check your regional Women's Crisis Centre","NGO: ANNA Centre · Syostry · Pomoshch (local)"],
  },
  "Turkey":{
    "Physical Violence":["ALO 183 Şiddet Önleme Hattı: 183 (free, 24h) · Police: 155 · Jandarma: 156","Apply for uzaklaştırma kararı (restraining order) at Family Court - Law No.6284","NGO: Mor Çatı Kadın Sığınağı Vakfı: 0212 292 52 21 · Kadın Dayanışma Vakfı"],
    "Honour-based Violence":["ALO 183 · Mor Çatı: 0212 292 52 21 · KADEM: 0216 302 11 11 · Police: 155","You have the right to a protection order under Law No.6284 - courts must respond in 24h","NGO: KAMER Diyarbakır: 0412 223 73 43 · Women for Women's Human Rights (WWHR)"],
    "Economic Control":["ALO 183 · İŞKUR (iskur.gov.tr) for employment support · KOSGEB for self-employment","Contact local Sosyal Hizmetler Müdürlüğü for shelter and economic support","NGO: Mor Çatı · Kadın Dayanışma Vakfı · KEDV (Foundation for Support of Women's Work)"],
  },
  "Kenya":{
    "Physical Violence":["GBV Hotline: 1195 (free) · GVRC Nairobi Women's Hospital: 0719 638 006 · Police: 999","Report to nearest police station under Sexual Offences Act 2006 / Protection Against DV Act","NGO: FIDA Kenya: 020 271 2332 · Wangu Kanja Foundation · Coalition on Violence Against Women"],
    "Sexual Assault":["GVRC Nairobi Women's Hospital: 0719 638 006 · Kenyatta National Hospital SATC","Free medico-legal documentation at county referral hospitals · preserve evidence if possible","NGO: FIDA Kenya · COVAW · Kenya Red Cross psychosocial support"],
    "Child Marriage":["Childline Kenya: 116 (free) · DCI child protection · Children's Department: 020 310 4000","Child marriage is illegal under Children's Act 2001 - report to Chief, DC, or Children's Officer","NGO: Girls Not Brides Kenya · Plan International Kenya · World Vision Kenya"],
  },
  "Ethiopia":{
    "Physical Violence":["Addis Ababa EWLA: 011 126 3026 · Police: 991 · Women's Affairs Bureau (regional)","Ethiopian Women Lawyers Association (EWLA) provides free legal aid nationwide","NGO: EWLA · Addis Ababa Women's Affairs Office · PATH Ethiopia: 011 663 4583"],
    "Child Marriage":["EWLA: 011 126 3026 · UNICEF Ethiopia: 011 551 7000 · Children's Court","Revised Family Code sets minimum marriage age 18 - report to Kebele or Woreda court","NGO: Tostan Ethiopia · Girls Not Brides Ethiopia · Save the Children Ethiopia"],
    "Trafficking":["IOM Ethiopia: 011 663 2250 · Police: 991 · National Referral Mechanism","Ministry of Labour & Social Affairs trafficking focal point in each region","NGO: IOM Ethiopia · International Justice Mission (IJM) Ethiopia · REST"],
  },
  // ── REGIONAL GROUPS ────────────────────────────────────────────────────────
  "_SubSaharanAfrica":{
    "Physical Violence":["Contact local Women's Affairs Ministry or call police (112 in most African nations)","UN Women country office: unwomen.org/en/where-we-are · UNFPA GBV programme","NGO: WILDAF (Women in Law & Development Africa) · ActionAid country office · CARE International"],
    "Sexual Assault":["Nearest government hospital for free medical care · MSF in active conflict zones: msf.org","Report to local police · UN peacekeeping GBV focal points (MONUSCO/AMISOM where deployed)","NGO: CARE International · IRC (International Rescue Committee) · Médecins du Monde"],
    "Child Marriage":["Contact local UNICEF office · Childline if available (numbers vary by country)","Report to Social Welfare, District Children's Officer, or nearest NGO office","NGO: Plan International · Girls Not Brides country partner · Save the Children"],
    "Trafficking":["IOM country office: iom.int/where-we-work · UNODC regional anti-trafficking programme","Nearest immigration authority or police anti-trafficking unit","NGO: IJM regional · Terres des Hommes · Love Justice International"],
    "Honour-based Violence":["Contact UN Women country office · UNFPA GBV programme · nearest women's shelter","Report to local authorities · UNHCR if displacement is a risk: unhcr.org","NGO: Karama regional · Girls Not Brides · international NGO present in your country"],
    "Economic Control":["Contact local Women's Development Department · microfinance groups in your area","UN Women economic empowerment programme · World Bank social protection schemes","NGO: BRAC (East/West Africa) · Oxfam country office · ActionAid"],
    "Emotional Abuse":["Contact UN Women country office · local mental health services · religious community support","Document incidents; seek psychosocial support from UNHCR or NGO counsellors","NGO: CARE International · IRC psychosocial support · local women's crisis centre"],
  },
  "_MiddleEast":{
    "Physical Violence":["KAFA Lebanon: +961 70 100 600 · local women's shelters vary by country · Police: 999/110","UN Women MENA: arab.unwomen.org · UNFPA MENA: arabstates.unfpa.org","NGO: ABAAD Lebanon · Sisterhood is Global Jordan · UNHCR GBV unit in conflict areas"],
    "Honour-based Violence":["KAFA Lebanon: +961 70 100 600 · contact nearest UNHCR office if at risk of persecution","Reach out to Karama (karamanetwork.org) or Women's Learning Partnership for legal guidance","NGO: Equality Now · Karama network · Terre des Femmes MENA"],
    "Child Marriage":["Contact UNICEF country office · Girls Not Brides regional partner · UNFPA programme","Girls Not Brides MENA: girlsnotbrides.org/about-us/mena","NGO: Terre des Hommes MENA · Save the Children · World Vision MENA"],
    "Sexual Assault":["KAFA Lebanon: +961 70 100 600 · MSF in Syria/Yemen conflict zones","Contact UN Women country office or UNFPA for referral to services","NGO: IRC · MSF · CARE International - present in most MENA countries"],
    "Economic Control":["UN Women economic empowerment programme · World Bank social protection","Contact local Women's Affairs Ministry or NGO microfinance programme","NGO: Oxfam MENA · Aga Khan Foundation · local NGO in your country"],
    "Trafficking":["Contact IOM regional office (iom.int) · UNHCR for victim protection","La Strada International · ECPAT regional programme · UNODC MENA office","NGO: IJM · Caritas regional · Global Modern Slavery Directory"],
    "Emotional Abuse":["Contact KAFA Lebanon or equivalent national organisation in your country","UN Women Arab States · local NGO counselling services","NGO: ABAAD · CARE International · Médecins du Monde psychological support"],
    "Stalking/Harassment":["Report to local police · document all incidents with dates and any witnesses","Contact UN Women country office for referral to legal aid","NGO: local women's rights organisation · OHCHR country office"],
  },
  "_CentralAsia":{
    "Physical Violence":["Kyrgyzstan: Sezim Crisis Centre Bishkek: 0312 88-28-88 · Tajikistan: Shoira Centre Dushanbe","UN Women Central Asia: eurasia.unwomen.org · OSCE field offices in each country","NGO: Sabrina (Tajikistan) · Кризисный центр (Kyrgyzstan) · Counterpart International"],
    "Honour-based Violence":["Contact ACTED in your country (acted.org) · UN Women Gender programme","UNHCR nearest office for protection referral if at risk of persecution","NGO: UNIFEM Central Asia · OSCE Centre · Human Rights Watch (documentation)"],
    "Child Marriage":["UN Women / UNFPA joint programme on early marriage · UNICEF country office","Report to local Mahallah Committee, district child protection, or Prosecutor's Office","NGO: Plan International Central Asia · Save the Children · UNFPA adolescent programme"],
    "Economic Control":["ACTED microfinance programmes · Aga Khan Foundation local office","Contact Women's Committee (Komitet po Delam Semyi) for economic support referral","NGO: ACTED · Mercy Corps · Aga Khan Development Network"],
    "Trafficking":["IOM: iom.int/central-asia · OSCE anti-trafficking programme · Police: 102 (varies)","Contact national referral mechanism - La Strada has a partner in most CIS countries","NGO: La Strada Kazakhstan · Sirius (Kyrgyzstan) · Nadezhda (Tajikistan)"],
    "Sexual Assault":["Sezim Bishkek: 0312 88-28-88 · Shoira Dushanbe · police: 102","Contact UN Women or UNFPA country office for referral to medical and legal services","NGO: UNIFEM · Médecins du Monde · local crisis centre in your city"],
    "Emotional Abuse":["Contact local crisis centre · UN Women country programme","Psychosocial support from UNHCR or NGO counsellors in your area","NGO: Counterpart International · MSH (Management Sciences for Health)"],
    "Stalking/Harassment":["Report to local police (102 in most CIS countries) · document all incidents","Contact Women's Committee or NGO for legal guidance","NGO: local women's rights NGO · OSCE field office"],
  },
  "_SouthAsia":{
    "Physical Violence":["Nepal: SAATHI: 01-4268270 · Sri Lanka: Women In Need (WIN): 011-4718585","UN Women South Asia: asiapacific.unwomen.org · UNFPA country offices","NGO: UNIFEM South Asia · Oxfam South Asia · local women's crisis centre"],
    "Child Marriage":["Nepal: Maiti Nepal: 01-4479547 · Girls Not Brides Nepal · UNICEF Nepal","Sri Lanka: NCPA: 1929 · Sri Lanka: UNICEF: 0117 415 000","NGO: Child Rights Coalition Asia · Plan International · World Vision South Asia"],
    "Trafficking":["Nepal: Childline 1098 · Sri Lanka: NCPA 1929","IOM South Asia · UNODC regional anti-trafficking programme (Bangkok)","NGO: IJM South Asia · Shakti Samuha Nepal: 01-4270485 · Protect.lk Sri Lanka"],
    "Sexual Assault":["Nepal: 1145 (Women's Helpline) · Sri Lanka: Women In Need: 011-4718585","Nearest hospital for free medico-legal care · UN Women country office for referral","NGO: SAATHI Nepal · WIN Sri Lanka · Forum for Women, Law and Development Nepal"],
    "Emotional Abuse":["Nepal: 1145 · Sri Lanka: WIN: 011-4718585 · Sumithrayo (SL): 011-269 6666","Document incidents; seek psychosocial support from NGO counsellors","NGO: SAATHI Nepal · Mental Health Innovation Network · Nest Sri Lanka"],
    "Economic Control":["Nepal: NEFSCUN microcredit · Sri Lanka: Women's Chamber of Commerce","Contact local Women's Development Office for economic support programmes","NGO: BRAC Nepal/Sri Lanka · Oxfam · Grameen Foundation"],
    "Honour-based Violence":["Nepal: SAATHI: 01-4268270 · local Women's Rights Forum","Contact UNHCR if safety is at risk · document threats carefully","NGO: FWLD Nepal · YWCA Sri Lanka · UN Women country programme"],
    "Stalking/Harassment":["Nepal: 1145 · Sri Lanka: WIN 011-4718585 · report to local police","File complaint under applicable national law · document all incidents","NGO: SAATHI · Women's Support Centre · local legal aid NGO"],
  },
  "_SoutheastAsia":{
    "Physical Violence":["Philippines: PCW: 1-800-8888-3003 · Cambodia: LICADHO: 023 215 522 · Indonesia: 021 380 8802","UN Women Asia-Pacific: asiapacific.unwomen.org · UNFPA APRO country offices","NGO: GAATW Thailand · Bansang Pilipino · WCC Manila: 02 8524 5423"],
    "Sexual Assault":["Philippines: WCC Manila: 02 8524 5423 · Cambodia: CAMBOW · Indonesia: Komnas Perempuan: 021 390 3963","MSF in Myanmar and conflict zones (msf.org) · UNHCR for displaced persons","NGO: CATW-AP · LICADHO · Enablis · Women's Crisis Centre Philippines"],
    "Trafficking":["Mekong Club (mekongclub.org) · GAATW Thailand: 02 864 1427 · ECPAT national offices","Report to local police, IOM country office (iom.int), or UNODC programme","NGO: IJM Asia-Pacific · Chab Dai Coalition Cambodia · Last Radicals Foundation"],
    "Child Marriage":["Contact UNICEF country office · Girls Not Brides Southeast Asia partner","Report to Social Welfare & Development Department or children's court","NGO: Plan International SEA · Save the Children · UNFPA adolescent programme"],
    "Emotional Abuse":["Contact UN Women or UNFPA country office · local NGO counselling","Document incidents; psychological abuse is increasingly recognised legally in SEA","NGO: WCC Philippines · LICADHO Cambodia · Rifka Annisa Indonesia"],
    "Economic Control":["Contact local Women's Affairs Ministry · microfinance NGO in your area","ILO women's economic empowerment programme · Grameen-style organisations","NGO: BRAC Bangladesh-linked (SEA) · Oxfam SEA · Mercy Corps"],
    "Honour-based Violence":["Contact UN Women country office · local women's rights organisation","UNHCR if safety is at risk from family or community · document threats","NGO: Human Rights Watch regional · Amnesty International country office"],
    "Stalking/Harassment":["Report to local police · document all incidents with dates","Philippines: PCW · Indonesia: Komnas Perempuan · Cambodia: LICADHO for legal support","NGO: local women's rights NGO · SafeCity regional partners"],
  },
  "_LatinAmerica":{
    "Physical Violence":["Argentina: 144 (free, 24h) · Colombia: 155 · Chile: 800 104 008 · Peru: 100 · Venezuela: 0800-MUJERES","Contact local Fiscalía (prosecutor's office) or Comisaría de la Mujer","NGO: Red Mujer · CLADEM (cladem.org) · Amnesty International regional office"],
    "Sexual Assault":["Argentina: 144 · Colombia: 155 · UNFPA Latin America: lac.unfpa.org","Centros de Atención Integral for survivors available in most capitals","NGO: CLADEM · Coordinadora de la Mujer Bolivia · Amnesty International LAC"],
    "Child Marriage":["UNICEF LACRO: lac.unicef.org · Girls Not Brides Latin America partner in your country","Contact local Defensoría del Pueblo, Fiscalía de Menores, or family court","NGO: Plan International LAC · Save the Children LAC · UNFPA adolescent programme"],
    "Trafficking":["OIM (IOM): southamerica.iom.int · UNODC LACRO · local Ministerio Público","Report to local Migration Authority, PGR/FGR, or Ministerio Público anti-trata unit","NGO: CHS Alternativo Peru · Renacer Colombia · OIM country offices"],
    "Economic Control":["Contact local Comisaría de la Mujer or Women's Secretariat","Microfinance: Grameen-type organisations in most countries · legal aid via Defensoría","NGO: Oxfam LAC · ActionAid · Aga Khan Foundation (where present)"],
    "Emotional Abuse":["Argentina: 144 · Colombia: 155 · Chile: 800 104 008 · Peru: 100","Document incidents; psychological violence is recognised in most LATAM domestic violence laws","NGO: CLADEM · Flora Tristán Peru · Corporación Humanas Chile"],
    "Stalking/Harassment":["Report to local Fiscalía · document all incidents with dates and witnesses","Argentina: 144 · Colombia: 155 · Chile: 800 104 008","NGO: local feminist organisation · UN Women LAC: lac.unwomen.org"],
    "Honour-based Violence":["Contact UN Women LAC · local women's shelter (Casa de Acogida)","UNHCR if safety or asylum is at risk · document all threats","NGO: CLADEM · Amnesty International LAC · local indigenous women's organisation"],
  },
  "_EasternEurope":{
    "Physical Violence":["Ukraine: 1547 (DV hotline) · Moldova: 0800 88 008 (free) · Romania: 0800 500 333","La Strada national hotlines (lastradainternational.org - country partner in each state)","NGO: La Strada International · ANNA Network · WAVE Network (waveproject.org)"],
    "Sexual Assault":["Ukraine: 1547 · Moldova: 0800 88 008 · Romania: 0800 500 333","Report to local police · national anti-violence NGOs in each country provide medico-legal support","NGO: La Strada · Punctul de Criză Romania · Ukrainian Women's Fund"],
    "Trafficking":["La Strada International: lastradainternational.org · IOM country office","Report to police or national anti-trafficking coordinator · NRM referral available","NGO: La Strada · Caritas Ukraine · Terre des Femmes · Anti-Slavery International"],
    "Emotional Abuse":["Ukraine: 1547 · Moldova: 0800 88 008 · Romania: 0800 500 333","Psychological violence is covered under DV laws in all three countries - report to police","NGO: La Strada · ANNA Network · local crisis centre"],
    "Economic Control":["Contact local Women's Affairs office · EU social protection schemes (where applicable)","Legal aid available from national bar associations at reduced or no cost","NGO: Oxfam Eastern Europe · Caritas · local microfinance institution"],
    "Stalking/Harassment":["Ukraine: 1547 · Romania: 0800 500 333 · Moldova: 0800 88 008","File complaint with local police - stalking is criminalised in all three countries","NGO: La Strada · Women's Law Centre Ukraine · Promo-LEX Moldova"],
    "Child Marriage":["Contact UNICEF country office · Girls Not Brides partner in your country","Report to child protection authorities · local Prosecutor's office","NGO: Plan International Eastern Europe · Save the Children · UNICEF"],
    "Honour-based Violence":["Contact La Strada or national women's rights NGO","UNHCR if protection is needed · document all threats carefully","NGO: La Strada · Roma women's organisations · local women's rights NGO"],
  },
  "_Global":{
    "Physical Violence":["UN Women GBV programme: unwomen.org · UNFPA GBV emergency: unfpa.org/gbv","Contact local police · UNHCR if displaced or stateless: unhcr.org","NGO: Amnesty International · Human Rights Watch · IRC - active in 40+ countries"],
    "Sexual Assault":["UN Women endvawnow.org · WHO clinical guidelines: who.int","MSF in conflict/emergency zones · UNFPA GBV emergency response","NGO: IRC · OXFAM · CARE International - field presence in crisis countries"],
    "Emotional Abuse":["UN Women: unwomen.org · local mental health support services","Document incidents; reach out to a trusted community organisation","NGO: World Vision · World Relief · ActionAid country office"],
    "Economic Control":["UN Women economic empowerment: unwomen.org · Grameen Foundation","Seek legal aid from UNHCR or local legal NGO if your rights are being restricted","NGO: Oxfam · ActionAid · Grameen Foundation microfinance networks"],
    "Stalking/Harassment":["Document all incidents with dates, times, and any witnesses","Report to local police or authorities · Hollaback! for online harassment: ihollaback.org","NGO: OSCE (osce.org) · local women's rights organisation in your area"],
    "Child Marriage":["UNICEF: unicef.org · Girls Not Brides: girlsnotbrides.org - 1,500 member NGOs worldwide","Contact local UNICEF, UNFPA or Save the Children office in your country","NGO: Girls Not Brides · Plan International · Save the Children"],
    "Honour-based Violence":["UNHCR: unhcr.org for protection referral · UN Women: unwomen.org","Reach out to a trusted person outside the family if safety is at risk","NGO: Human Rights Watch · Amnesty International · Terre des Femmes"],
    "Trafficking":["IOM: iom.int · UNODC: unodc.org/unodc/en/human-trafficking","Report to local police anti-trafficking unit or nearest IOM office","NGO: IJM: ijm.org · La Strada International · ECPAT: ecpat.org"],
  },
};

// Country → regional group key (for countries without their own CS entry)
const CG = {
  "DR Congo":"_SubSaharanAfrica","Tanzania":"_SubSaharanAfrica","Uganda":"_SubSaharanAfrica",
  "Zimbabwe":"_SubSaharanAfrica","Mozambique":"_SubSaharanAfrica","Somalia":"_SubSaharanAfrica",
  "Sudan":"_SubSaharanAfrica","Mali":"_SubSaharanAfrica","Chad":"_SubSaharanAfrica",
  "Cameroon":"_SubSaharanAfrica",
  "Yemen":"_MiddleEast","Syria":"_MiddleEast","Iraq":"_MiddleEast","Saudi Arabia":"_MiddleEast",
  "Iran":"_MiddleEast","Jordan":"_MiddleEast","Egypt":"_MiddleEast","Morocco":"_MiddleEast","Algeria":"_MiddleEast",
  "Tajikistan":"_CentralAsia","Kyrgyzstan":"_CentralAsia","Uzbekistan":"_CentralAsia",
  "Nepal":"_SouthAsia","Sri Lanka":"_SouthAsia",
  "Myanmar":"_SoutheastAsia","Cambodia":"_SoutheastAsia","Philippines":"_SoutheastAsia",
  "Vietnam":"_SoutheastAsia","Indonesia":"_SoutheastAsia",
  "Colombia":"_LatinAmerica","Peru":"_LatinAmerica","Bolivia":"_LatinAmerica",
  "Venezuela":"_LatinAmerica","Guatemala":"_LatinAmerica","Honduras":"_LatinAmerica",
  "Ecuador":"_LatinAmerica","Chile":"_LatinAmerica","Argentina":"_LatinAmerica",
  "Ukraine":"_EasternEurope","Moldova":"_EasternEurope","Romania":"_EasternEurope",
  "Italy":"_Global","France":"France", // France/Spain/Germany have their own
};

// Look up localized solutions: country → group → global
function getSol(country, issueName){
  const hit = src => src && src[issueName];
  return hit(CS[country]) || hit(CS[CG[country]]) || hit(CS._Global) ||
    ["Contact local authorities or visit unwomen.org for support in your country."];
}


function primarySupportSteps(country){
  const direct = (CS[country] && CS[country]["Physical Violence"]) || (CS[CG[country]] && CS[CG[country]]["Physical Violence"]) || CS._Global["Physical Violence"];
  return direct.slice(0,3);
}
function updateSupportPanel(country){
  const title = country || "Select a country";
  const steps = country ? primarySupportSteps(country) : [
    "Pick a country to see local support contacts.",
    "If you are in immediate danger, call local emergency services first.",
    "Use Quick Exit or press ESC if this page is unsafe to view."
  ];
  const c = document.getElementById("support-country");
  const list = document.getElementById("support-steps");
  if(c)c.textContent = title;
  if(list)list.innerHTML = steps.map(x=>`<li>${x}</li>`).join("");
}

// ── ISO3 -> country name ────────────────────────────────────────────────────
const ISO3 = {AFG:"Afghanistan",BGD:"Bangladesh",BRA:"Brazil",CHN:"China",COL:"Colombia",EGY:"Egypt",ETH:"Ethiopia",DEU:"Germany",IND:"India",IDN:"Indonesia",MEX:"Mexico",NGA:"Nigeria",PAK:"Pakistan",RUS:"Russia",ZAF:"South Africa",GBR:"UK",USA:"USA",AUS:"Australia",KEN:"Kenya",TZA:"Tanzania",UGA:"Uganda",MOZ:"Mozambique",ZWE:"Zimbabwe",SOM:"Somalia",SDN:"Sudan",MLI:"Mali",TCD:"Chad",CMR:"Cameroon",COD:"DR Congo",YEM:"Yemen",SYR:"Syria",IRQ:"Iraq",SAU:"Saudi Arabia",IRN:"Iran",JOR:"Jordan",PER:"Peru",BOL:"Bolivia",VEN:"Venezuela",GTM:"Guatemala",HND:"Honduras",ECU:"Ecuador",CHL:"Chile",ARG:"Argentina",MMR:"Myanmar",KHM:"Cambodia",PHL:"Philippines",TJK:"Tajikistan",KGZ:"Kyrgyzstan",UZB:"Uzbekistan",UKR:"Ukraine",MDA:"Moldova",ROU:"Romania",NPL:"Nepal",LKA:"Sri Lanka",FRA:"France",ESP:"Spain",ITA:"Italy",TUR:"Turkey",MAR:"Morocco",DZA:"Algeria",VNM:"Vietnam",THA:"Thailand",BGD:"Bangladesh"};

// ── COMPACT ISSUE BUILDER ─────────────────────────────────────────────────
const N={"PV":"Physical Violence","SA":"Sexual Assault","EA":"Emotional Abuse","EC":"Economic Control","SH":"Stalking/Harassment","CM":"Child Marriage","HB":"Honour-based Violence","TR":"Trafficking"};
function iss(a){return a.map(([k,p])=>({name:N[k],pct:p}))}

// ── REGION DATA (100+ points, state/region level) ─────────────────────────
const RAW = [
// ── INDIA (12 states) ─────────────────────────────────────────────────────
{id:1,  co:"India",re:"Maharashtra",    lat:19.75,lng:75.71,sv:7, gd:"women",yr:2022,cs:67800, issues:iss([["PV",38],["EA",27],["EC",20],["CM",15]])},
{id:2,  co:"India",re:"Uttar Pradesh",  lat:27.57,lng:80.10,sv:9, gd:"women",yr:2022,cs:98000, issues:iss([["PV",42],["HB",28],["CM",18],["EC",12]])},
{id:3,  co:"India",re:"Delhi",          lat:28.66,lng:77.23,sv:9, gd:"women",yr:2023,cs:22100, issues:iss([["PV",35],["SH",28],["SA",22],["EA",15]])},
{id:4,  co:"India",re:"Rajasthan",      lat:27.02,lng:74.22,sv:8, gd:"women",yr:2021,cs:58500, issues:iss([["CM",42],["PV",30],["HB",18],["EC",10]])},
{id:5,  co:"India",re:"Bihar",          lat:25.10,lng:85.31,sv:9, gd:"women",yr:2022,cs:112000,issues:iss([["PV",40],["CM",32],["HB",18],["EC",10]])},
{id:6,  co:"India",re:"Madhya Pradesh", lat:22.97,lng:78.66,sv:8, gd:"women",yr:2022,cs:74000, issues:iss([["PV",38],["CM",28],["EA",20],["EC",14]])},
{id:7,  co:"India",re:"West Bengal",    lat:22.99,lng:87.85,sv:7, gd:"women",yr:2022,cs:56000, issues:iss([["PV",35],["EA",30],["EC",22],["SA",13]])},
{id:8,  co:"India",re:"Karnataka",      lat:15.32,lng:75.72,sv:6, gd:"women",yr:2022,cs:43000, issues:iss([["PV",35],["EA",32],["EC",20],["SH",13]])},
{id:9,  co:"India",re:"Tamil Nadu",     lat:11.13,lng:78.66,sv:6, gd:"women",yr:2022,cs:38000, issues:iss([["EA",38],["PV",30],["EC",20],["SH",12]])},
{id:10, co:"India",re:"Andhra Pradesh", lat:15.91,lng:80.00,sv:7, gd:"women",yr:2022,cs:44000, issues:iss([["PV",36],["EA",28],["EC",22],["CM",14]])},
{id:11, co:"India",re:"Haryana",        lat:29.06,lng:76.08,sv:8, gd:"women",yr:2021,cs:31000, issues:iss([["HB",35],["PV",32],["CM",22],["EC",11]])},
{id:12, co:"India",re:"Gujarat",        lat:22.26,lng:71.19,sv:7, gd:"women",yr:2022,cs:47000, issues:iss([["PV",36],["EA",28],["EC",22],["CM",14]])},
// ── UK (4 regions) ────────────────────────────────────────────────────────
{id:13, co:"UK",re:"England",           lat:52.86,lng:-1.46,sv:5, gd:"all",  yr:2023,cs:162000,issues:iss([["EA",40],["PV",28],["EC",20],["SH",12]])},
{id:14, co:"UK",re:"Scotland",          lat:56.49,lng:-4.20,sv:4, gd:"all",  yr:2022,cs:61000, issues:iss([["EA",42],["PV",30],["SH",18],["EC",10]])},
{id:15, co:"UK",re:"Wales",             lat:52.13,lng:-3.78,sv:4, gd:"all",  yr:2022,cs:28000, issues:iss([["EA",44],["PV",28],["EC",16],["SH",12]])},
{id:16, co:"UK",re:"Northern Ireland",  lat:54.61,lng:-6.69,sv:4, gd:"all",  yr:2022,cs:21000, issues:iss([["PV",38],["EA",32],["EC",18],["SH",12]])},
// ── USA (8 states) ────────────────────────────────────────────────────────
{id:17, co:"USA",re:"Texas",            lat:31.97,lng:-99.90,sv:7,gd:"all",  yr:2023,cs:124000,issues:iss([["PV",35],["EA",28],["SH",22],["EC",15]])},
{id:18, co:"USA",re:"California",       lat:36.78,lng:-119.42,sv:6,gd:"women",yr:2022,cs:143000,issues:iss([["EA",32],["PV",28],["SH",25],["SA",15]])},
{id:19, co:"USA",re:"New York",         lat:42.16,lng:-74.95,sv:6,gd:"all",  yr:2023,cs:110000,issues:iss([["EA",35],["PV",28],["EC",22],["SH",15]])},
{id:20, co:"USA",re:"Georgia",          lat:32.16,lng:-82.90,sv:7,gd:"women",yr:2021,cs:67000, issues:iss([["PV",38],["EA",30],["EC",18],["SA",14]])},
{id:21, co:"USA",re:"Florida",          lat:27.99,lng:-81.76,sv:6,gd:"all",  yr:2022,cs:98000, issues:iss([["PV",34],["EA",32],["SH",20],["EC",14]])},
{id:22, co:"USA",re:"Illinois",         lat:40.35,lng:-88.99,sv:6,gd:"all",  yr:2022,cs:54000, issues:iss([["EA",38],["PV",30],["EC",18],["SH",14]])},
{id:23, co:"USA",re:"Louisiana",        lat:30.98,lng:-91.96,sv:7,gd:"women",yr:2022,cs:43000, issues:iss([["PV",40],["EA",28],["EC",18],["SA",14]])},
{id:24, co:"USA",re:"Michigan",         lat:44.31,lng:-85.60,sv:6,gd:"all",  yr:2022,cs:48000, issues:iss([["EA",38],["PV",30],["EC",18],["SH",14]])},
// ── BRAZIL (5 states) ─────────────────────────────────────────────────────
{id:25, co:"Brazil",re:"São Paulo",     lat:-22.19,lng:-48.79,sv:7,gd:"women",yr:2022,cs:187000,issues:iss([["PV",45],["EA",28],["SA",17],["EC",10]])},
{id:26, co:"Brazil",re:"Rio de Janeiro",lat:-22.25,lng:-42.66,sv:8,gd:"women",yr:2023,cs:156000,issues:iss([["PV",48],["SA",25],["TR",15],["EA",12]])},
{id:27, co:"Brazil",re:"Bahia",         lat:-12.97,lng:-41.65,sv:8,gd:"women",yr:2021,cs:89000, issues:iss([["PV",42],["EC",28],["EA",20],["SA",10]])},
{id:28, co:"Brazil",re:"Pará",          lat:-3.07, lng:-52.97,sv:8,gd:"women",yr:2022,cs:67000, issues:iss([["PV",40],["EC",25],["TR",20],["SA",15]])},
{id:29, co:"Brazil",re:"Minas Gerais",  lat:-18.51,lng:-44.56,sv:7,gd:"women",yr:2022,cs:98000, issues:iss([["PV",42],["EA",28],["EC",18],["SA",12]])},
// ── SOUTH AFRICA (4 provinces) ────────────────────────────────────────────
{id:30, co:"South Africa",re:"Gauteng",        lat:-26.27,lng:27.89,sv:9,gd:"all",  yr:2023,cs:143000,issues:iss([["PV",46],["SA",30],["EA",15],["TR",9]])},
{id:31, co:"South Africa",re:"Western Cape",   lat:-33.92,lng:19.00,sv:8,gd:"women",yr:2022,cs:98000, issues:iss([["PV",40],["SA",32],["EC",16],["SH",12]])},
{id:32, co:"South Africa",re:"KwaZulu-Natal",  lat:-29.00,lng:30.50,sv:8,gd:"women",yr:2021,cs:76000, issues:iss([["PV",43],["SA",28],["TR",18],["EA",11]])},
{id:33, co:"South Africa",re:"Eastern Cape",   lat:-32.30,lng:26.50,sv:8,gd:"women",yr:2022,cs:67000, issues:iss([["PV",42],["SA",30],["EC",16],["EA",12]])},
// ── PAKISTAN (5 provinces) ────────────────────────────────────────────────
{id:34, co:"Pakistan",re:"Punjab",      lat:31.14,lng:72.34,sv:9, gd:"women",yr:2022,cs:94000, issues:iss([["PV",40],["HB",30],["CM",18],["EC",12]])},
{id:35, co:"Pakistan",re:"Sindh",       lat:26.02,lng:68.43,sv:9, gd:"women",yr:2023,cs:112000,issues:iss([["PV",38],["HB",28],["EC",20],["CM",14]])},
{id:36, co:"Pakistan",re:"KPK",         lat:34.37,lng:71.51,sv:10,gd:"women",yr:2021,cs:68000, issues:iss([["HB",45],["CM",30],["PV",15],["EC",10]])},
{id:37, co:"Pakistan",re:"Balochistan", lat:29.36,lng:65.84,sv:9, gd:"women",yr:2022,cs:45000, issues:iss([["HB",42],["CM",30],["PV",18],["EC",10]])},
{id:38, co:"Pakistan",re:"Gilgit-Baltistan",lat:35.80,lng:74.46,sv:9,gd:"women",yr:2021,cs:22000,issues:iss([["HB",44],["CM",28],["PV",18],["EC",10]])},
// ── BANGLADESH (3 regions) ────────────────────────────────────────────────
{id:39, co:"Bangladesh",re:"Dhaka",     lat:23.81,lng:90.41,sv:8, gd:"women",yr:2022,cs:87000, issues:iss([["PV",40],["CM",30],["EC",20],["TR",10]])},
{id:40, co:"Bangladesh",re:"Chittagong",lat:22.36,lng:91.78,sv:7, gd:"women",yr:2021,cs:54000, issues:iss([["CM",38],["PV",35],["EC",17],["TR",10]])},
{id:41, co:"Bangladesh",re:"Rajshahi",  lat:24.37,lng:88.60,sv:8, gd:"women",yr:2022,cs:43000, issues:iss([["CM",40],["PV",32],["EC",18],["EA",10]])},
// ── MEXICO (4 states) ─────────────────────────────────────────────────────
{id:42, co:"Mexico",re:"Mexico City",   lat:19.43,lng:-99.13,sv:8,gd:"women",yr:2023,cs:132000,issues:iss([["PV",40],["SH",28],["SA",20],["EA",12]])},
{id:43, co:"Mexico",re:"Jalisco",       lat:20.66,lng:-103.35,sv:7,gd:"women",yr:2022,cs:78000,issues:iss([["PV",38],["EA",28],["SH",22],["EC",12]])},
{id:44, co:"Mexico",re:"Veracruz",      lat:19.17,lng:-96.13,sv:8,gd:"women",yr:2022,cs:67000, issues:iss([["PV",42],["SA",25],["EA",20],["EC",13]])},
{id:45, co:"Mexico",re:"Nuevo León",    lat:25.59,lng:-99.99,sv:7,gd:"women",yr:2022,cs:56000, issues:iss([["PV",38],["SH",28],["EA",22],["EC",12]])},
// ── NIGERIA (4 states) ────────────────────────────────────────────────────
{id:46, co:"Nigeria",re:"Lagos",        lat:6.52, lng:3.38, sv:8, gd:"women",yr:2022,cs:176000,issues:iss([["PV",42],["SA",25],["EC",20],["CM",13]])},
{id:47, co:"Nigeria",re:"Kano",         lat:12.00,lng:8.52, sv:9, gd:"women",yr:2021,cs:134000,issues:iss([["CM",42],["PV",30],["EC",16],["HB",12]])},
{id:48, co:"Nigeria",re:"Rivers",       lat:4.77, lng:6.99, sv:8, gd:"women",yr:2022,cs:89000, issues:iss([["PV",40],["SA",28],["TR",18],["EC",14]])},
{id:49, co:"Nigeria",re:"Kaduna",       lat:10.52,lng:7.44, sv:8, gd:"women",yr:2021,cs:67000, issues:iss([["PV",38],["CM",30],["EC",18],["HB",14]])},
// ── AFGHANISTAN (3 regions) ───────────────────────────────────────────────
{id:50, co:"Afghanistan",re:"Kabul",    lat:34.53,lng:69.18,sv:10,gd:"women",yr:2022,cs:198000,issues:iss([["PV",35],["HB",30],["CM",20],["EC",15]])},
{id:51, co:"Afghanistan",re:"Kandahar",lat:31.63,lng:65.74,sv:10,gd:"women",yr:2021,cs:156000,issues:iss([["HB",40],["CM",30],["PV",20],["EC",10]])},
{id:52, co:"Afghanistan",re:"Herat",    lat:34.34,lng:62.20,sv:10,gd:"women",yr:2021,cs:112000,issues:iss([["HB",38],["CM",32],["PV",18],["EC",12]])},
// ── DR CONGO ──────────────────────────────────────────────────────────────
{id:53, co:"DR Congo",re:"Kinshasa",    lat:-4.32,lng:15.32,sv:9, gd:"women",yr:2022,cs:234000,issues:iss([["PV",38],["SA",32],["EC",18],["TR",12]])},
{id:54, co:"DR Congo",re:"North Kivu",  lat:-0.85,lng:29.29,sv:10,gd:"women",yr:2022,cs:187000,issues:iss([["SA",38],["PV",32],["TR",20],["EC",10]])},
// ── EAST AFRICA ───────────────────────────────────────────────────────────
{id:55, co:"Tanzania",re:"Dodoma",      lat:-6.37,lng:35.74,sv:8, gd:"women",yr:2021,cs:112000,issues:iss([["PV",40],["CM",28],["EC",20],["SA",12]])},
{id:56, co:"Uganda",re:"Central",       lat:1.37, lng:32.30,sv:8, gd:"women",yr:2021,cs:98000, issues:iss([["PV",40],["SA",28],["CM",20],["EC",12]])},
{id:57, co:"Kenya",re:"Nairobi",        lat:-1.02,lng:37.91,sv:7, gd:"women",yr:2022,cs:87000, issues:iss([["PV",38],["SA",28],["EC",20],["SH",14]])},
{id:58, co:"Zimbabwe",re:"Harare",      lat:-19.00,lng:29.85,sv:8,gd:"women",yr:2021,cs:76000, issues:iss([["PV",42],["EC",28],["SA",18],["EA",12]])},
{id:59, co:"Mozambique",re:"Maputo",    lat:-18.67,lng:35.53,sv:8,gd:"women",yr:2021,cs:89000, issues:iss([["PV",42],["SA",28],["EC",18],["CM",12]])},
{id:60, co:"Ethiopia",re:"Oromia",      lat:8.90, lng:40.38,sv:8, gd:"women",yr:2022,cs:112000,issues:iss([["PV",40],["CM",30],["SA",18],["EC",12]])},
{id:61, co:"Ethiopia",re:"Amhara",      lat:11.59,lng:37.90,sv:8, gd:"women",yr:2021,cs:87000, issues:iss([["PV",38],["CM",32],["EA",18],["EC",12]])},
// ── WEST & CENTRAL AFRICA ─────────────────────────────────────────────────
{id:62, co:"Somalia",re:"Mogadishu",    lat:2.05, lng:45.34,sv:10,gd:"women",yr:2021,cs:145000,issues:iss([["PV",35],["HB",32],["SA",22],["CM",11]])},
{id:63, co:"Sudan",re:"Khartoum",       lat:15.56,lng:32.53,sv:9, gd:"women",yr:2021,cs:134000,issues:iss([["PV",38],["HB",28],["CM",22],["EC",12]])},
{id:64, co:"Mali",re:"Bamako",          lat:12.65,lng:-8.00,sv:9, gd:"women",yr:2020,cs:98000, issues:iss([["CM",40],["PV",32],["EC",18],["SA",10]])},
{id:65, co:"Chad",re:"N'Djamena",       lat:12.11,lng:15.04,sv:9, gd:"women",yr:2020,cs:89000, issues:iss([["CM",42],["PV",30],["EC",18],["SA",10]])},
{id:66, co:"Cameroon",re:"Yaoundé",     lat:3.87, lng:11.52,sv:8, gd:"women",yr:2021,cs:76000, issues:iss([["PV",40],["SA",28],["EC",20],["CM",12]])},
// ── MIDDLE EAST ───────────────────────────────────────────────────────────
{id:67, co:"Yemen",re:"Sana'a",         lat:15.55,lng:44.21,sv:10,gd:"women",yr:2021,cs:245000,issues:iss([["PV",35],["HB",28],["CM",25],["EC",12]])},
{id:68, co:"Syria",re:"Damascus",       lat:34.80,lng:38.99,sv:9, gd:"women",yr:2021,cs:187000,issues:iss([["PV",38],["SA",28],["EC",20],["HB",14]])},
{id:69, co:"Iraq",re:"Baghdad",         lat:33.22,lng:43.68,sv:8, gd:"women",yr:2021,cs:134000,issues:iss([["PV",38],["HB",26],["EC",22],["CM",14]])},
{id:70, co:"Saudi Arabia",re:"Riyadh",  lat:23.89,lng:45.08,sv:7, gd:"women",yr:2022,cs:112000,issues:iss([["PV",36],["EC",28],["HB",22],["EA",14]])},
{id:71, co:"Iran",re:"Tehran",          lat:32.43,lng:53.69,sv:8, gd:"women",yr:2021,cs:145000,issues:iss([["PV",38],["EC",28],["HB",22],["EA",12]])},
{id:72, co:"Jordan",re:"Amman",         lat:31.24,lng:36.51,sv:6, gd:"women",yr:2022,cs:43000, issues:iss([["PV",36],["EC",28],["HB",22],["EA",14]])},
{id:73, co:"Turkey",re:"Ankara",        lat:39.91,lng:32.87,sv:6, gd:"women",yr:2022,cs:89000, issues:iss([["PV",38],["EA",28],["EC",20],["SH",14]])},
// ── NORTH AFRICA ──────────────────────────────────────────────────────────
{id:74, co:"Egypt",re:"Cairo",          lat:26.82,lng:30.80,sv:7, gd:"women",yr:2022,cs:134000,issues:iss([["PV",38],["SA",28],["EC",20],["HB",14]])},
{id:75, co:"Morocco",re:"Casablanca",   lat:31.79,lng:-7.09,sv:6, gd:"women",yr:2021,cs:87000, issues:iss([["PV",36],["SA",28],["EC",22],["HB",14]])},
{id:76, co:"Algeria",re:"Algiers",      lat:28.03,lng:1.66, sv:6, gd:"women",yr:2021,cs:76000, issues:iss([["PV",38],["EC",28],["EA",22],["SA",12]])},
// ── LATIN AMERICA ─────────────────────────────────────────────────────────
{id:77, co:"Colombia",re:"Bogotá",      lat:4.71, lng:-74.07,sv:7,gd:"women",yr:2022,cs:98000, issues:iss([["PV",40],["EA",28],["SH",20],["EC",12]])},
{id:78, co:"Colombia",re:"Valle del Cauca",lat:3.80,lng:-76.50,sv:7,gd:"women",yr:2022,cs:67000,issues:iss([["PV",38],["SA",28],["EC",22],["EA",12]])},
{id:79, co:"Peru",re:"Lima",            lat:-9.19,lng:-75.02,sv:7,gd:"women",yr:2022,cs:98000, issues:iss([["PV",40],["EA",28],["SA",20],["EC",12]])},
{id:80, co:"Bolivia",re:"La Paz",       lat:-16.29,lng:-63.59,sv:8,gd:"women",yr:2021,cs:76000,issues:iss([["PV",42],["EA",28],["EC",18],["SA",12]])},
{id:81, co:"Venezuela",re:"Caracas",    lat:6.42, lng:-66.59,sv:8,gd:"women",yr:2021,cs:89000, issues:iss([["PV",42],["SA",26],["EA",20],["EC",12]])},
{id:82, co:"Guatemala",re:"Guatemala City",lat:15.78,lng:-90.23,sv:8,gd:"women",yr:2022,cs:67000,issues:iss([["PV",42],["SA",26],["EC",20],["EA",12]])},
{id:83, co:"Honduras",re:"Tegucigalpa", lat:14.82,lng:-86.83,sv:8,gd:"women",yr:2021,cs:56000, issues:iss([["PV",44],["SA",24],["EC",20],["EA",12]])},
{id:84, co:"Ecuador",re:"Quito",        lat:-1.83,lng:-78.18,sv:7,gd:"women",yr:2022,cs:54000, issues:iss([["PV",40],["EA",28],["SA",20],["EC",12]])},
{id:85, co:"Chile",re:"Santiago",       lat:-35.68,lng:-71.54,sv:5,gd:"women",yr:2022,cs:43000,issues:iss([["PV",36],["EA",32],["EC",20],["SH",12]])},
{id:86, co:"Argentina",re:"Buenos Aires",lat:-34.00,lng:-64.00,sv:5,gd:"women",yr:2022,cs:54000,issues:iss([["EA",38],["PV",30],["EC",20],["SH",12]])},
// ── SOUTHEAST ASIA ────────────────────────────────────────────────────────
{id:87, co:"Myanmar",re:"Yangon",       lat:16.90,lng:96.17,sv:8, gd:"women",yr:2021,cs:98000, issues:iss([["PV",40],["SA",28],["TR",18],["EC",14]])},
{id:88, co:"Myanmar",re:"Shan State",   lat:22.04,lng:98.17,sv:9, gd:"women",yr:2021,cs:67000, issues:iss([["SA",35],["TR",30],["PV",25],["EC",10]])},
{id:89, co:"Cambodia",re:"Phnom Penh",  lat:12.57,lng:104.99,sv:7,gd:"women",yr:2021,cs:54000,issues:iss([["PV",38],["TR",28],["SA",22],["EC",12]])},
{id:90, co:"Philippines",re:"Mindanao", lat:8.06, lng:124.65,sv:7,gd:"women",yr:2022,cs:76000, issues:iss([["PV",40],["SA",28],["EC",20],["EA",12]])},
{id:91, co:"Vietnam",re:"Hanoi",        lat:21.00,lng:105.84,sv:6,gd:"women",yr:2022,cs:67000, issues:iss([["PV",38],["EA",28],["EC",22],["SA",12]])},
{id:92, co:"Indonesia",re:"Java",       lat:-7.61,lng:110.01,sv:6,gd:"women",yr:2022,cs:124000,issues:iss([["PV",38],["CM",28],["EC",22],["EA",12]])},
{id:93, co:"Indonesia",re:"Kalimantan", lat:0.96, lng:114.55,sv:7,gd:"women",yr:2021,cs:54000, issues:iss([["PV",40],["CM",28],["EC",20],["TR",12]])},
// ── SOUTH ASIA ────────────────────────────────────────────────────────────
{id:94, co:"Nepal",re:"Kathmandu",      lat:27.70,lng:85.32,sv:7, gd:"women",yr:2022,cs:56000, issues:iss([["PV",38],["CM",28],["EA",22],["EC",12]])},
{id:95, co:"Nepal",re:"Terai",          lat:27.40,lng:84.12,sv:8, gd:"women",yr:2021,cs:43000, issues:iss([["CM",40],["PV",30],["EC",18],["EA",12]])},
{id:96, co:"Sri Lanka",re:"Western",    lat:6.92, lng:79.86,sv:6, gd:"women",yr:2022,cs:38000, issues:iss([["PV",36],["EA",30],["EC",22],["SH",12]])},
// ── CENTRAL ASIA ──────────────────────────────────────────────────────────
{id:97, co:"Tajikistan",re:"Dushanbe",  lat:38.86,lng:71.27,sv:8, gd:"women",yr:2021,cs:45000, issues:iss([["PV",40],["HB",28],["CM",20],["EC",12]])},
{id:98, co:"Kyrgyzstan",re:"Bishkek",   lat:42.87,lng:74.60,sv:8, gd:"women",yr:2021,cs:38000, issues:iss([["PV",38],["HB",28],["CM",22],["EC",12]])},
{id:99, co:"Uzbekistan",re:"Tashkent",  lat:41.30,lng:69.24,sv:7, gd:"women",yr:2021,cs:56000, issues:iss([["PV",38],["HB",26],["EC",22],["EA",14]])},
// ── CHINA ─────────────────────────────────────────────────────────────────
{id:100,co:"China",re:"Xinjiang",       lat:42.52,lng:87.61,sv:7, gd:"women",yr:2022,cs:87000, issues:iss([["PV",38],["HB",26],["EC",22],["EA",14]])},
{id:101,co:"China",re:"Henan",          lat:33.88,lng:113.61,sv:5,gd:"women",yr:2022,cs:98000, issues:iss([["EA",38],["PV",30],["EC",22],["SH",10]])},
{id:102,co:"China",re:"Yunnan",         lat:25.05,lng:101.71,sv:6,gd:"women",yr:2022,cs:76000, issues:iss([["PV",36],["EA",28],["EC",22],["TR",14]])},
// ── RUSSIA ────────────────────────────────────────────────────────────────
{id:103,co:"Russia",re:"Moscow Oblast", lat:55.74,lng:37.62,sv:7, gd:"women",yr:2022,cs:167000,issues:iss([["PV",48],["EA",28],["EC",14],["SH",10]])},
{id:104,co:"Russia",re:"Chechnya",      lat:43.40,lng:45.72,sv:8, gd:"women",yr:2021,cs:45000, issues:iss([["PV",38],["HB",30],["EC",20],["CM",12]])},
// ── EASTERN EUROPE ────────────────────────────────────────────────────────
{id:105,co:"Ukraine",re:"Kyiv",         lat:49.00,lng:31.39,sv:6, gd:"women",yr:2022,cs:76000, issues:iss([["PV",40],["EA",28],["EC",20],["SH",12]])},
{id:106,co:"Moldova",re:"Chișinău",     lat:47.41,lng:28.37,sv:7, gd:"women",yr:2021,cs:34000, issues:iss([["PV",40],["EA",28],["EC",20],["TR",12]])},
{id:107,co:"Romania",re:"Bucharest",    lat:45.94,lng:24.97,sv:5, gd:"women",yr:2022,cs:54000, issues:iss([["PV",36],["EA",30],["EC",20],["SH",14]])},
// ── WESTERN EUROPE ────────────────────────────────────────────────────────
{id:108,co:"Germany",re:"Bavaria",      lat:48.92,lng:11.41,sv:4, gd:"all",  yr:2023,cs:87000, issues:iss([["EA",42],["PV",28],["EC",18],["SH",12]])},
{id:109,co:"Germany",re:"North Rhine-Westphalia",lat:51.44,lng:7.27,sv:4,gd:"all",yr:2022,cs:96000,issues:iss([["EA",40],["PV",28],["SH",20],["EC",12]])},
{id:110,co:"France",re:"Île-de-France", lat:48.64,lng:2.35, sv:4, gd:"all",  yr:2022,cs:134000,issues:iss([["EA",40],["PV",28],["SH",20],["EC",12]])},
{id:111,co:"Spain",re:"Madrid",         lat:40.28,lng:-3.63,sv:4, gd:"all",  yr:2022,cs:112000,issues:iss([["PV",36],["EA",30],["SH",22],["EC",12]])},
{id:112,co:"Italy",re:"Lombardy",       lat:45.47,lng:9.19, sv:4, gd:"all",  yr:2022,cs:98000, issues:iss([["EA",38],["PV",30],["SH",20],["EC",12]])},
// ── AUSTRALIA ─────────────────────────────────────────────────────────────
{id:113,co:"Australia",re:"New South Wales",lat:-32.00,lng:146.92,sv:4,gd:"all",yr:2023,cs:87000,issues:iss([["EA",38],["PV",28],["EC",22],["SH",12]])},
{id:114,co:"Australia",re:"Queensland",lat:-22.58,lng:144.78,sv:4,gd:"all",yr:2022,cs:67000,issues:iss([["EA",38],["PV",30],["EC",20],["SH",12]])},
// ── MEN-SPECIFIC ──────────────────────────────────────────────────────────
{id:115,co:"USA",re:"Ohio",             lat:40.38,lng:-82.76,sv:3, gd:"men",  yr:2022,cs:28000, issues:iss([["EA",45],["PV",30],["EC",15],["SH",10]])},
{id:116,co:"UK",re:"Yorkshire",         lat:53.96,lng:-1.08,sv:3, gd:"men",  yr:2022,cs:18000, issues:iss([["EA",48],["PV",28],["EC",14],["SH",10]])},
{id:117,co:"Australia",re:"Victoria",   lat:-36.58,lng:144.97,sv:3,gd:"men", yr:2022,cs:21000, issues:iss([["EA",45],["PV",30],["EC",15],["SH",10]])},
];

// ── COUNTRY BOUNDS [lng_min, lat_min, lng_max, lat_max] ────────────────────
const BOUNDS = {
  "India":[68,8,97,37],"UK":[-8,49,2,62],"USA":[-125,24,-66,50],
  "Brazil":[-74,-34,-28,6],"South Africa":[16,-35,33,-22],
  "Pakistan":[60,23,78,37],"Bangladesh":[88,20,93,27],
  "Mexico":[-118,14,-86,33],"Nigeria":[2,4,15,14],"Afghanistan":[60,29,75,38],
  "Germany":[5,47,15,56],"Indonesia":[95,-11,141,6],"China":[73,18,135,53],
  "Russia":[27,41,180,72],"Ethiopia":[33,3,48,15],"Egypt":[22,22,37,32],
  "Colombia":[-79,-5,-66,13],"Australia":[112,-44,154,-10],
  "DR Congo":[12,-14,31,5],"Tanzania":[29,-12,41,0],"Uganda":[29,-2,35,5],
  "Kenya":[33,-5,42,5],"Zimbabwe":[25,-23,33,-15],"Somalia":[41,-2,51,12],
  "Yemen":[42,12,55,19],"Syria":[35,32,43,37],"Iraq":[38,29,49,38],
  "Iran":[44,25,64,40],"Turkey":[25,35,45,43],"Morocco":[-13,27,2,36],
  "Peru":[-82,-18,-68,-0],"Bolivia":[-70,-23,-57,-9],
  "Myanmar":[92,9,101,28],"Philippines":[116,4,127,21],
};

// ── STATE ─────────────────────────────────────────────────────────────────
let appState = {country:"",region:"",gender:"all",year:null};
let allPoints  = RAW.map(d=>({...d}));
let filtPts    = [...allPoints];
let whoData    = {};
let projection, pathGen, zoomBeh, svgEl, gMap, gHex;
let curT       = d3.zoomIdentity; // current zoom transform

// ── HELPERS ────────────────────────────────────────────────────────────────
function sevColor(s){
  return d3.scaleLinear().domain([1,5.5,10]).range(["#2d4a3e","#c97d2e","#b91c1c"]).clamp(true)(s);
}
function sevLabel(s){
  return s<=3?{l:"Low",c:"sev-low"}:s<=6?{l:"Moderate",c:"sev-mid"}:{l:"High",c:"sev-high"};
}
function fmt(n){return n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?Math.round(n/1e3)+"K":n}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3500)}

// Hexagon path centered at 0,0 with given radius
function hexPath(r){
  const pts=d3.range(6).map(i=>{const a=i*Math.PI/3;return[Math.sin(a)*r,-Math.cos(a)*r]});
  return "M"+pts[0]+"L"+pts.slice(1).join("L")+"Z";
}
function hexR(sv){return 9+(sv/10)*9} // 9–18 px screen-space radius

// ── WORLD BANK POPULATION FETCH ────────────────────────────────────────────
let wbPop={};
async function fetchWBPop(){
  try{
    const r=await fetch("https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrv=1&per_page=300",{signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const j=await r.json();
    if(j[1])j[1].forEach(row=>{if(row.value&&row.countryiso3code)wbPop[row.countryiso3code]=row.value;});
    return true;
  }catch(e){console.warn("WB Pop fetch:",e.message);return false}
}

// ── WHO FETCH ──────────────────────────────────────────────────────────────
async function fetchWHO(){
  try{
    const r=await fetch("https://ghoapi.azureedge.net/api/SA_0000001688?$top=2000",{signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const j=await r.json();
    const lat={};
    j.value.forEach(row=>{
      if(!row.NumericValue||row.SpatialDimType!=="COUNTRY")return;
      const c=row.SpatialDim;
      if(!lat[c]||row.TimeDim>lat[c].yr)lat[c]={v:row.NumericValue,yr:row.TimeDim};
    });
    whoData=lat;
    return true;
  }catch(e){console.warn("WHO fetch:",e.message);return false}
}
function applyWHO(){
  const byC={};
  Object.entries(ISO3).forEach(([iso,name])=>{
    if(whoData[iso])byC[name]={v:whoData[iso].v,yr:whoData[iso].yr,pop:wbPop[iso]||null};
  });
  allPoints=RAW.map(d=>{
    const w=byC[d.co];
    if(!w)return{...d};
    const ws=Math.min(10,Math.max(1,w.v/5));
    const estAff=w.pop?Math.round((w.pop/2)*(w.v/100)):null;
    return{...d,sv:Math.min(10,Math.max(1,Math.round(d.sv*.6+ws*.4))),whoV:w.v,whoYr:w.yr,estAff};
  });
}

// ── FILTER ─────────────────────────────────────────────────────────────────
function applyFilters(){
  filtPts=allPoints.filter(p=>{
    if(appState.country&&p.co!==appState.country)return false;
    if(appState.region&&p.re!==appState.region)return false;
    if(appState.gender!=="all"&&p.gd!==appState.gender&&p.gd!=="all")return false;
    if(appState.year&&p.yr!==appState.year)return false;
    return true;
  });
  renderHex();
  updateStats();
}

// ── DROPDOWNS ──────────────────────────────────────────────────────────────
function initDropdowns(){
  const sel=document.getElementById("sel-country");
  [...new Set(RAW.map(p=>p.co))].sort().forEach(c=>{
    const o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o);
  });
}
function populateRegions(country){
  const sel=document.getElementById("sel-region");
  sel.innerHTML='<option value="">All Regions</option>';
  if(!country){sel.disabled=true;return}
  [...new Set(RAW.filter(p=>p.co===country).map(p=>p.re))].sort().forEach(r=>{
    const o=document.createElement("option");o.value=r;o.textContent=r;sel.appendChild(o);
  });
  sel.disabled=false;
}

// ── MAP INIT ───────────────────────────────────────────────────────────────
function initMap(){
  svgEl=d3.select("#map-svg");
  const W=svgEl.node().clientWidth||window.innerWidth;
  const H=svgEl.node().clientHeight||(window.innerHeight-90);

  projection=d3.geoNaturalEarth1().scale(W/6.4).translate([W/2,H/2]);
  pathGen=d3.geoPath().projection(projection);

  const gBg=svgEl.append("g");
  gBg.append("path").datum({type:"Sphere"}).attr("class","sphere").attr("d",pathGen);
  gBg.append("path").datum(d3.geoGraticule()()).attr("class","graticule").attr("d",pathGen);
  gMap=svgEl.append("g").attr("class","map-layer");
  gHex=svgEl.append("g").attr("class","hex-layer"); // stays at identity

  // Precompute raw projected coords for all points
  allPoints.forEach(p=>{
    const c=projection([p.lng,p.lat]);
    p._px=c?c[0]:null;p._py=c?c[1]:null;
  });

  zoomBeh=d3.zoom().scaleExtent([0.8,22]).on("zoom",ev=>{
    curT=ev.transform;
    gBg.attr("transform",ev.transform);
    gMap.attr("transform",ev.transform);
    // gHex stays at identity - reposition hexagons in screen space
    gHex.selectAll(".hex-cell").attr("transform",d=>{
      if(!d||d._px==null)return"translate(0,0)";
      const[sx,sy]=curT.apply([d._px,d._py]);
      return`translate(${sx},${sy})`;
    });
  });
  svgEl.call(zoomBeh);
  svgEl.on("click.bg",()=>closePanel());
  loadWorld();
}

async function loadWorld(){
  document.getElementById("loader-sub").textContent="Fetching world topology…";
  try{
    const world=await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
    gMap.selectAll(".country")
      .data(topojson.feature(world,world.objects.countries).features)
      .join("path").attr("class","country").attr("d",pathGen);
    gMap.style("opacity",0).transition().duration(900).style("opacity",1);
  }catch(e){console.warn("Topology:",e)}
  renderHex();
  updateStats();
  hideLoader();
  // Background: fetch WHO + World Bank in parallel
  document.getElementById("loader-sub").textContent="Loading WHO & World Bank data…";
  const [ok]=await Promise.all([fetchWHO(),fetchWBPop()]);
  if(ok){
    applyWHO();
    // re-project after WHO updates severity
    allPoints.forEach(p=>{const c=projection([p.lng,p.lat]);p._px=c?c[0]:null;p._py=c?c[1]:null;});
    applyFilters();
    document.getElementById("db-dot").classList.add("live");
    document.getElementById("db-txt").textContent="WHO GHO · SA_0000001688";
    toast("✓ Calibrated with WHO Global Health Observatory data");
  }
}
function hideLoader(){
  document.getElementById("loader").classList.add("hidden");
  document.getElementById("app").classList.add("visible");
}

// ── RENDER HEXAGONS ────────────────────────────────────────────────────────
// Each hexagon placed at exact geographic projection - NO hexbin binning.
// gHex group stays at identity; positions are updated manually on zoom.
function renderHex(){
  const projected=filtPts.map(p=>{
    if(p._px==null||isNaN(p._px))return null;
    const[sx,sy]=curT.apply([p._px,p._py]);
    return{_px:p._px,_py:p._py,sx,sy,data:p};
  }).filter(Boolean);

  const sel=gHex.selectAll(".hex-cell").data(projected,d=>d.data.id);

  sel.exit().transition().duration(200).style("opacity",0).remove();

  const entered=sel.enter()
    .append("path")
    .attr("class","hex-cell")
    .attr("transform",d=>`translate(${d.sx},${d.sy})`)
    .attr("d",d=>hexPath(hexR(d.data.sv)))
    .style("fill",d=>sevColor(d.data.sv))
    .style("stroke",d=>d3.color(sevColor(d.data.sv)).darker(.6).formatHex())
    .style("fill-opacity",0);

  entered.each(function(_,i){
    d3.select(this).transition().delay(Math.min(i*10,800)).duration(500)
      .style("fill-opacity",.75);
  });

  const merged=entered.merge(sel);

  // Sort so high-severity renders on top
  merged.sort((a,b)=>a.data.sv-b.data.sv);

  // Update existing
  sel.transition().duration(400)
    .attr("transform",d=>`translate(${d.sx},${d.sy})`)
    .attr("d",d=>hexPath(hexR(d.data.sv)))
    .style("fill",d=>sevColor(d.data.sv))
    .style("stroke",d=>d3.color(sevColor(d.data.sv)).darker(.6).formatHex());

  const tip=document.getElementById("tooltip");
  merged
    .on("mouseover",function(ev,d){
      d3.select(this).raise()
        .style("fill-opacity",1)
        .style("stroke","rgba(255,255,255,.6)")
        .style("stroke-width","1.6")
        .style("filter",`drop-shadow(0 0 8px ${sevColor(d.data.sv)}cc)`);
      document.getElementById("tt-r").textContent=`${d.data.re}, ${d.data.co}`;
      document.getElementById("tt-d").innerHTML=
        `Severity <span>${d.data.sv}/10</span> · ${fmt(d.data.cs)} cases<br>`+
        (d.data.whoV?`WHO IPV: <span>${d.data.whoV.toFixed(1)}%</span> prevalence`:`Year: ${d.data.yr}`);
      tip.classList.add("visible");
    })
    .on("mousemove",function(ev){
      const r=document.getElementById("map-area").getBoundingClientRect();
      let lx=ev.clientX-r.left+14,ly=ev.clientY-r.top-52;
      if(lx+230>r.width)lx=ev.clientX-r.left-230;
      tip.style.left=lx+"px";tip.style.top=Math.max(2,ly)+"px";
    })
    .on("mouseleave",function(ev,d){
      d3.select(this).style("fill-opacity",.75).style("stroke",d3.color(sevColor(d.data.sv)).darker(.6).formatHex()).style("stroke-width",".8").style("filter",null);
      tip.classList.remove("visible");
    })
    .on("click",function(ev,d){
      ev.stopPropagation();
      tip.classList.remove("visible");
      openPanel(d.data);
    });

  document.getElementById("leg-cnt").textContent=projected.length+" pts";
}

// ── INFO PANEL ─────────────────────────────────────────────────────────────
function openPanel(p){
  document.getElementById("ph-reg").textContent=p.re;
  document.getElementById("ph-cty").textContent=p.co;
  updateSupportPanel(p.co);
  const sv=sevLabel(p.sv);
  const body=document.getElementById("pb");
  const whoRow=p.whoV
    ?`<div class="who-bar"><div class="who-l">WHO IPV Prevalence - Women 15–49 (${p.whoYr||"latest"})</div>
       <div class="who-track"><div class="who-fill" id="wf" style="width:0%"></div></div>
       <div class="who-note">${p.whoV.toFixed(1)}% experienced intimate partner violence · WHO GHO SA_0000001688</div></div>`
    :`<div style="font-size:.7rem;color:var(--text-dim);margin-top:8px;padding:7px;background:var(--surface);border-radius:6px">WHO country data not available for this region</div>`;
  body.innerHTML=`
    <div class="meta-grid">
      <div class="mc"><div class="mc-l">Risk Level</div><div class="mc-v"><span class="sev-badge ${sv.c}">${sv.l}</span></div></div>
      <div class="mc"><div class="mc-l">Severity</div><div class="mc-v" style="color:${sevColor(p.sv)}">${p.sv}<span style="font-size:.65rem;color:var(--text-dim)"> / 10</span></div></div>
      <div class="mc"><div class="mc-l">Est. Affected (WHO)</div><div class="mc-v" style="color:var(--teal)">${p.estAff?fmt(p.estAff)+"*":fmt(p.cs)}</div></div>
      <div class="mc"><div class="mc-l">Data Year · Gender</div><div class="mc-v" style="font-size:.78rem"><span title="Year this data was collected" style="color:var(--text-dim)">${p.yr}</span> · <span style="text-transform:capitalize">${p.gd}</span></div></div>
    </div>
    ${whoRow}
    ${p.estAff?`<div style="font-size:.65rem;color:var(--text-dim);margin:-2px 0 8px;padding:5px 8px;background:var(--surface);border-radius:5px">* Est. Affected = (country female population ÷ 2) × WHO IPV prevalence % · Source: WHO GHO + World Bank SP.POP.TOTL</div>`:""}
    <div class="source-note">Data last reviewed 2 Jun 2026. Support links and helplines can change - verify locally before acting if it is safe to do so.</div>
    <div class="sec-t">Issue Breakdown</div>
    <div id="ib"></div>
    <div class="sec-t" style="margin-top:14px">Possible Solutions</div>
    <div id="sl"></div>`;
  if(p.whoV)requestAnimationFrame(()=>requestAnimationFrame(()=>{const f=document.getElementById("wf");if(f)f.style.width=Math.min(100,p.whoV)+"%"}));
  const ibEl=body.querySelector("#ib");
  p.issues.forEach(iss=>{
    const w=document.createElement("div");w.className="ib-wrap";
    w.innerHTML=`<div class="ib-hdr"><span class="ib-name">${iss.name}</span><span class="ib-pct">${iss.pct}%</span></div><div class="ib-bg"><div class="ib-fill"></div></div>`;
    ibEl.appendChild(w);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{w.querySelector(".ib-fill").style.width=iss.pct+"%"}));
  });
  const slEl=body.querySelector("#sl");
  p.issues.forEach(iss=>{
    const steps=getSol(p.co, iss.name);if(!steps||!steps.length)return;
    const b=document.createElement("div");b.className="sol-block";
    const tg=document.createElement("button");tg.className="sol-toggle";
    tg.innerHTML=`<span>${iss.name}</span><span class="arr">▾</span>`;
    const ct=document.createElement("div");ct.className="sol-content";
    const inn=document.createElement("div");inn.className="sol-inner";
    steps.forEach(s=>{inn.innerHTML+=`<div class="sol-item"><div class="sdot"></div><span>${s}</span></div>`});
    ct.appendChild(inn);
    tg.addEventListener("click",()=>{const o=ct.classList.toggle("open");tg.classList.toggle("open",o)});
    b.append(tg,ct);slEl.appendChild(b);
  });
  document.getElementById("info-panel").classList.add("open");
}
function closePanel(){document.getElementById("info-panel").classList.remove("open")}

// ── STATS ──────────────────────────────────────────────────────────────────
function updateStats(){
  const tot=filtPts.reduce((a,p)=>a+(p.estAff||p.cs),0);
  const cntrs=new Set(filtPts.map(p=>p.co)).size;
  const top=filtPts.slice().sort((a,b)=>(b.estAff||b.cs)-(a.estAff||a.cs))[0];
  const avg=filtPts.length?(filtPts.reduce((a,p)=>a+p.sv,0)/filtPts.length).toFixed(1):" - ";
  const val=p=>p.estAff||p.cs;
  const it={};filtPts.forEach(p=>p.issues.forEach(i=>{it[i.name]=(it[i.name]||0)+i.pct*val(p)/100}));
  const ti=Object.entries(it).sort((a,b)=>b[1]-a[1])[0];
  sv("s-cases",fmt(tot));
  sv("s-reg",top?top.re:" - ");
  sv("s-iss",ti?ti[0].split("/")[0].trim():" - ");
  sv("s-sev",avg);
  sv("s-cntrs",cntrs.toString());
  sv("s-pts",filtPts.length.toString());
}
function sv(id,v){const e=document.getElementById(id);if(e.textContent===v)return;e.style.opacity="0";setTimeout(()=>{e.textContent=v;e.style.opacity="1"},160)}

// ── CSV EXPORT ─────────────────────────────────────────────────────────────
function exportCSV(){
  if(!filtPts.length){toast("No data to export");return}
  const hdr=["Country","Region","Latitude","Longitude","Severity (1-10)","Est. Affected (WHO+WB)","Year","Gender","WHO IPV Prevalence (%)","WHO Year","Top Issues"];
  const rows=filtPts.map(p=>[p.co,p.re,p.lat,p.lng,p.sv,p.estAff||p.cs,p.yr,p.gd,p.whoV?p.whoV.toFixed(1):"N/A",p.whoYr||"N/A",p.issues.map(i=>`${i.name} ${i.pct}%`).join("; ")]);
  const csv=[hdr,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:`safemap_${new Date().toISOString().slice(0,10)}.csv`});
  a.click();URL.revokeObjectURL(a.href);
  toast(`✓ Exported ${filtPts.length} regions as CSV`);
}

// ── ZOOM HELPERS ───────────────────────────────────────────────────────────
function zoomToCountry(country){
  if(!country){resetZoom();return}
  const b=BOUNDS[country];if(!b)return;
  const W=svgEl.node().clientWidth,H=svgEl.node().clientHeight;
  const[x0,y0]=projection([b[0],b[3]]);
  const[x1,y1]=projection([b[2],b[1]]);
  const sc=Math.min(10,.82/Math.max(Math.abs(x1-x0)/W,Math.abs(y1-y0)/H));
  svgEl.transition().duration(850).call(zoomBeh.transform,
    d3.zoomIdentity.translate(W/2,H/2).scale(sc).translate(-(x0+x1)/2,-(y0+y1)/2));
}
function zoomToPoint(lat,lng){
  const[x,y]=projection([lng,lat]);
  const W=svgEl.node().clientWidth,H=svgEl.node().clientHeight;
  svgEl.transition().duration(700).call(zoomBeh.transform,
    d3.zoomIdentity.translate(W/2,H/2).scale(7).translate(-x,-y));
}
function resetZoom(){svgEl.transition().duration(600).call(zoomBeh.transform,d3.zoomIdentity)}

// ── EVENTS ─────────────────────────────────────────────────────────────────
function wireEvents(){
  document.getElementById("sel-country").addEventListener("change",e=>{
    appState.country=e.target.value;appState.region="";
    updateSupportPanel(appState.country);
    populateRegions(appState.country);
    document.getElementById("sel-region").value="";
    zoomToCountry(appState.country);
    applyFilters();
  });
  document.getElementById("sel-region").addEventListener("change",e=>{
    appState.region=e.target.value;
    applyFilters();
    if(appState.region){
      const p=allPoints.find(pt=>pt.co===appState.country&&pt.re===appState.region);
      if(p)zoomToPoint(p.lat,p.lng);
    }
  });
  document.querySelectorAll(".tgl-btn").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".tgl-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");appState.gender=btn.dataset.g;applyFilters();
  }));
  const sl=document.getElementById("yr-sl"),yd=document.getElementById("yr-v");
  let yt;
  sl.addEventListener("input",()=>{
    const v=+sl.value;
    if(v===2025){yd.textContent="All";appState.year=null}else{yd.textContent=v;appState.year=v}
    clearTimeout(yt);yt=setTimeout(applyFilters,80);
  });
  document.getElementById("btn-reset").addEventListener("click",()=>{
    appState={country:"",region:"",gender:"all",year:null};
    document.getElementById("sel-country").value="";
    updateSupportPanel("");
    document.getElementById("sel-region").innerHTML='<option value="">All Regions</option>';
    document.getElementById("sel-region").disabled=true;
    document.querySelectorAll(".tgl-btn").forEach(b=>b.classList.toggle("active",b.dataset.g==="all"));
    sl.value=2025;yd.textContent="All";
    resetZoom();closePanel();applyFilters();
  });
  document.getElementById("btn-export").addEventListener("click",exportCSV);
  document.getElementById("ph-close").addEventListener("click",e=>{e.stopPropagation();closePanel()});
  document.getElementById("zi").addEventListener("click",()=>svgEl.transition().duration(280).call(zoomBeh.scaleBy,1.65));
  document.getElementById("zo").addEventListener("click",()=>svgEl.transition().duration(280).call(zoomBeh.scaleBy,.6));
  document.getElementById("zr").addEventListener("click",resetZoom);

  let rt;
  window.addEventListener("resize",()=>{
    clearTimeout(rt);rt=setTimeout(()=>{
      const W=svgEl.node().clientWidth,H=svgEl.node().clientHeight;
      projection.scale(W/6.4).translate([W/2,H/2]);
      pathGen=d3.geoPath().projection(projection);
      gMap.selectAll("path").attr("d",pathGen);
      allPoints.forEach(p=>{const c=projection([p.lng,p.lat]);p._px=c?c[0]:null;p._py=c?c[1]:null;});
      renderHex();
    },200);
  });
}

// ── BOOT ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",()=>{
  initDropdowns();
  wireEvents();
  updateSupportPanel("");
  requestAnimationFrame(()=>requestAnimationFrame(()=>initMap()));
});
// Quick Exit - ESC key safety feature
document.addEventListener("keydown",(e)=>{if(e.key==="Escape")location.href="https://google.com";});
