import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface AcademicArticle {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  url?: string;
  keywords: string[];
  category: 'anxiety' | 'depression' | 'stress' | 'cbt' | 'mindfulness' | 'trauma' | 'general';
  source: 'pubmed' | 'scholar' | 'manual';
  savedBy?: string[]; // IDs of psychologists who saved this article
  createdAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const ARTICLES_FILE = join(DATA_DIR, 'academicArticles.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getArticles(): AcademicArticle[] {
  ensureDataDir();
  if (!existsSync(ARTICLES_FILE)) {
    // Initialize with sample articles
    const sampleArticles: AcademicArticle[] = [
      {
        id: uuidv4(),
        title: 'Effectiveness of Cognitive Behavioral Therapy for Anxiety Disorders: A Meta-Analysis',
        authors: ['Smith, J.', 'Doe, A.', 'Johnson, M.'],
        journal: 'Journal of Clinical Psychology',
        year: 2023,
        abstract: 'This meta-analysis examines the effectiveness of CBT in treating various anxiety disorders. Results show significant improvements in anxiety symptoms across multiple studies with effect sizes ranging from moderate to large.',
        doi: '10.1234/jcp.2023.001',
        keywords: ['CBT', 'anxiety', 'meta-analysis', 'treatment', 'therapy'],
        category: 'anxiety',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Mindfulness-Based Interventions for Depression: A Systematic Review',
        authors: ['Williams, K.', 'Brown, L.'],
        journal: 'Clinical Psychology Review',
        year: 2023,
        abstract: 'Systematic review of mindfulness interventions for depression. Findings suggest moderate to large effect sizes for mindfulness-based cognitive therapy (MBCT) in reducing depressive symptoms.',
        doi: '10.1234/cpr.2023.002',
        keywords: ['mindfulness', 'depression', 'MBCT', 'systematic review', 'intervention'],
        category: 'depression',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Efficacy of Exposure Therapy for Phobias and Panic Disorder: A Comprehensive Review',
        authors: ['Martinez, R.', 'Chen, L.', 'Anderson, P.'],
        journal: 'Behavior Therapy',
        year: 2023,
        abstract: 'This comprehensive review evaluates exposure therapy protocols for specific phobias and panic disorder. Results indicate high efficacy rates, with 70-90% of patients showing significant improvement.',
        doi: '10.1234/bt.2023.015',
        keywords: ['exposure therapy', 'phobias', 'panic disorder', 'CBT', 'anxiety'],
        category: 'anxiety',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Acceptance and Commitment Therapy for Chronic Stress: Randomized Controlled Trial',
        authors: ['Hayes, S.C.', 'Strosahl, K.D.', 'Wilson, K.G.'],
        journal: 'Journal of Consulting and Clinical Psychology',
        year: 2023,
        abstract: 'Randomized controlled trial examining ACT for chronic stress. Participants showed significant reductions in stress levels and improvements in psychological flexibility compared to control group.',
        doi: '10.1234/jccp.2023.042',
        keywords: ['ACT', 'stress', 'acceptance', 'commitment therapy', 'RCT'],
        category: 'stress',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Digital Mental Health Interventions: Efficacy and Implementation Challenges',
        authors: ['Taylor, M.', 'Roberts, S.', 'Davis, A.'],
        journal: 'Psychological Medicine',
        year: 2023,
        abstract: 'Review of digital mental health interventions including apps, online therapy, and teletherapy. Discusses efficacy, accessibility, and implementation challenges in mental health care delivery.',
        doi: '10.1234/pm.2023.088',
        keywords: ['digital health', 'teletherapy', 'mental health apps', 'e-health', 'technology'],
        category: 'general',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Trauma-Focused Cognitive Behavioral Therapy for PTSD: Meta-Analysis of Randomized Trials',
        authors: ['Cohen, J.A.', 'Mannarino, A.P.', 'Deblinger, E.'],
        journal: 'Journal of Traumatic Stress',
        year: 2022,
        abstract: 'Meta-analysis of randomized controlled trials examining TF-CBT for PTSD. Strong evidence for efficacy in reducing PTSD symptoms, depression, and anxiety in trauma survivors.',
        doi: '10.1234/jts.2022.156',
        keywords: ['TF-CBT', 'PTSD', 'trauma', 'meta-analysis', 'treatment'],
        category: 'trauma',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Dialectical Behavior Therapy for Borderline Personality Disorder: Long-term Outcomes',
        authors: ['Linehan, M.M.', 'Comtois, K.A.', 'Murray, A.M.'],
        journal: 'Archives of General Psychiatry',
        year: 2022,
        abstract: 'Long-term follow-up study of DBT for BPD. Results show sustained improvements in suicidal behaviors, self-harm, and overall functioning at 2-year follow-up.',
        doi: '10.1234/agp.2022.203',
        keywords: ['DBT', 'borderline personality', 'suicide prevention', 'long-term outcomes'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Sleep Interventions for Depression: A Systematic Review and Meta-Analysis',
        authors: ['Baglioni, C.', 'Battagliese, G.', 'Feige, B.'],
        journal: 'Sleep Medicine Reviews',
        year: 2023,
        abstract: 'Systematic review examining sleep-focused interventions for depression. Cognitive behavioral therapy for insomnia (CBT-I) shows promise in treating both sleep and depressive symptoms.',
        doi: '10.1234/smr.2023.091',
        keywords: ['sleep', 'depression', 'CBT-I', 'insomnia', 'intervention'],
        category: 'depression',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Role of Exercise in Mental Health: Evidence from Population Studies',
        authors: ['Schuch, F.B.', 'Vancampfort, D.', 'Firth, J.'],
        journal: 'World Psychiatry',
        year: 2023,
        abstract: 'Large-scale population studies examining the relationship between physical exercise and mental health. Regular exercise associated with reduced risk of depression and anxiety.',
        doi: '10.1234/wp.2023.124',
        keywords: ['exercise', 'mental health', 'depression', 'anxiety', 'prevention'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Internet-Based Cognitive Behavioral Therapy for Social Anxiety: Effectiveness and Predictors',
        authors: ['Andersson, G.', 'Cuijpers, P.', 'Carlbring, P.'],
        journal: 'Journal of Anxiety Disorders',
        year: 2023,
        abstract: 'Randomized controlled trial of internet-based CBT for social anxiety disorder. Significant improvements in social anxiety symptoms, with therapist support enhancing outcomes.',
        doi: '10.1234/jad.2023.067',
        keywords: ['iCBT', 'social anxiety', 'internet therapy', 'CBT', 'digital intervention'],
        category: 'anxiety',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Compassion-Focused Therapy for Shame and Self-Criticism: Clinical Applications',
        authors: ['Gilbert, P.', 'Procter, S.'],
        journal: 'Clinical Psychology & Psychotherapy',
        year: 2022,
        abstract: 'Review of compassion-focused therapy (CFT) for addressing shame and self-criticism. CFT shows effectiveness in reducing self-criticism and increasing self-compassion across various populations.',
        doi: '10.1234/cpp.2022.178',
        keywords: ['CFT', 'compassion', 'shame', 'self-criticism', 'therapy'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Group Therapy vs. Individual Therapy for Depression: Comparative Effectiveness',
        authors: ['McDermut, W.', 'Miller, I.W.', 'Brown, R.A.'],
        journal: 'Clinical Psychology Review',
        year: 2023,
        abstract: 'Meta-analysis comparing group and individual therapy for depression. Both formats show similar effectiveness, with group therapy offering cost-effectiveness advantages.',
        doi: '10.1234/cpr.2023.134',
        keywords: ['group therapy', 'individual therapy', 'depression', 'comparative effectiveness'],
        category: 'depression',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Mindfulness-Based Stress Reduction: Mechanisms of Change',
        authors: ['Hölzel, B.K.', 'Lazar, S.W.', 'Gard, T.'],
        journal: 'Perspectives on Psychological Science',
        year: 2022,
        abstract: 'Review of neurobiological and psychological mechanisms underlying MBSR effectiveness. Changes in attention regulation, body awareness, and emotion regulation identified as key mechanisms.',
        doi: '10.1234/pps.2022.245',
        keywords: ['MBSR', 'mindfulness', 'stress reduction', 'mechanisms', 'neurobiology'],
        category: 'stress',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Early Intervention for At-Risk Youth: Prevention of Mental Health Disorders',
        authors: ['Weisz, J.R.', 'Sandler, I.N.', 'Durlak, J.A.'],
        journal: 'American Psychologist',
        year: 2023,
        abstract: 'Review of early intervention programs for at-risk youth. School-based and community programs show promise in preventing depression, anxiety, and conduct disorders.',
        doi: '10.1234/ap.2023.312',
        keywords: ['prevention', 'youth', 'early intervention', 'mental health', 'school-based'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Schema Therapy for Personality Disorders: A Meta-Analytic Review',
        authors: ['Bamelis, L.L.M.', 'Evers, S.M.A.A.', 'Spinhoven, P.'],
        journal: 'Journal of Personality Disorders',
        year: 2022,
        abstract: 'Meta-analysis of schema therapy outcomes for personality disorders. Significant improvements in personality pathology, depression, and quality of life reported.',
        doi: '10.1234/jpd.2022.189',
        keywords: ['schema therapy', 'personality disorders', 'treatment', 'meta-analysis'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Effectiveness of Brief Interventions for Anxiety in Primary Care Settings',
        authors: ['Roy-Byrne, P.P.', 'Craske, M.G.', 'Sullivan, G.'],
        journal: 'JAMA Psychiatry',
        year: 2023,
        abstract: 'Randomized trial examining brief CBT interventions delivered in primary care for anxiety disorders. Significant improvements in anxiety symptoms with minimal therapist contact.',
        doi: '10.1234/jamapsychiatry.2023.456',
        keywords: ['brief intervention', 'primary care', 'anxiety', 'CBT', 'accessibility'],
        category: 'anxiety',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Neuroplasticity and Psychotherapy: Brain Changes Following Treatment',
        authors: ['Linden, D.E.J.', 'Linden, D.E.J.', 'Fallgatter, A.J.'],
        journal: 'Nature Reviews Neuroscience',
        year: 2022,
        abstract: 'Review of neuroimaging studies showing brain changes following psychotherapy. Structural and functional changes observed in regions associated with emotion regulation and cognitive control.',
        doi: '10.1234/nrn.2022.567',
        keywords: ['neuroplasticity', 'psychotherapy', 'neuroimaging', 'brain changes', 'neuroscience'],
        category: 'general',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Culturally Adapted Cognitive Behavioral Therapy: A Systematic Review',
        authors: ['Huey, S.J.', 'Tilley, J.L.', 'Jones, E.O.'],
        journal: 'Psychological Bulletin',
        year: 2023,
        abstract: 'Systematic review of culturally adapted CBT interventions. Culturally adapted versions show improved outcomes compared to standard CBT for ethnic minority populations.',
        doi: '10.1234/pb.2023.678',
        keywords: ['cultural adaptation', 'CBT', 'ethnic minorities', 'cultural competence', 'treatment'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Resilience Factors in Trauma Recovery: Longitudinal Study',
        authors: ['Bonanno, G.A.', 'Westphal, M.', 'Mancini, A.D.'],
        journal: 'Journal of Traumatic Stress',
        year: 2022,
        abstract: 'Longitudinal study identifying resilience factors in trauma recovery. Social support, positive coping strategies, and meaning-making associated with better outcomes.',
        doi: '10.1234/jts.2022.789',
        keywords: ['resilience', 'trauma', 'recovery', 'longitudinal', 'protective factors'],
        category: 'trauma',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Therapeutic Alliance in Psychotherapy: Meta-Analysis of Outcomes',
        authors: ['Horvath, A.O.', 'Del Re, A.C.', 'Flückiger, C.'],
        journal: 'Psychotherapy',
        year: 2023,
        abstract: 'Meta-analysis examining the relationship between therapeutic alliance and treatment outcomes. Strong therapeutic alliance consistently associated with better treatment outcomes across therapy types.',
        doi: '10.1234/psy.2023.890',
        keywords: ['therapeutic alliance', 'psychotherapy', 'outcomes', 'meta-analysis', 'relationship'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Virtual Reality Exposure Therapy for Anxiety Disorders: Current Evidence',
        authors: ['Freeman, D.', 'Reeve, S.', 'Robinson, A.'],
        journal: 'The Lancet Psychiatry',
        year: 2023,
        abstract: 'Review of virtual reality exposure therapy (VRET) for anxiety disorders. VRET shows comparable effectiveness to in vivo exposure with advantages in accessibility and cost.',
        doi: '10.1234/lanpsy.2023.901',
        keywords: ['virtual reality', 'exposure therapy', 'anxiety', 'VRET', 'technology'],
        category: 'anxiety',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Interpersonal Psychotherapy for Depression: Mechanisms and Moderators',
        authors: ['Markowitz, J.C.', 'Weissman, M.M.'],
        journal: 'American Journal of Psychiatry',
        year: 2022,
        abstract: 'Review of interpersonal psychotherapy (IPT) mechanisms and moderators. IPT effective for depression through improving interpersonal functioning and social support.',
        doi: '10.1234/ajp.2022.012',
        keywords: ['IPT', 'interpersonal therapy', 'depression', 'mechanisms', 'social support'],
        category: 'depression',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      }
    ];
    saveArticles(sampleArticles);
    return sampleArticles;
  }
  try {
    const data = readFileSync(ARTICLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveArticles(articles: AcademicArticle[]) {
  ensureDataDir();
  writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

export function createArticle(article: Omit<AcademicArticle, 'id' | 'createdAt'>): AcademicArticle {
  const articles = getArticles();
  const newArticle: AcademicArticle = {
    ...article,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  articles.push(newArticle);
  saveArticles(articles);
  return newArticle;
}

export function getAllArticles(): AcademicArticle[] {
  return getArticles().sort((a, b) => b.year - a.year);
}

export function getArticlesByCategory(category: string): AcademicArticle[] {
  const articles = getArticles();
  if (category === 'all') return articles.sort((a, b) => b.year - a.year);
  return articles.filter(a => a.category === category).sort((a, b) => b.year - a.year);
}

export function searchArticles(query: string): AcademicArticle[] {
  const articles = getArticles();
  const lowerQuery = query.toLowerCase();
  return articles.filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.abstract.toLowerCase().includes(lowerQuery) ||
    article.authors.some(author => author.toLowerCase().includes(lowerQuery)) ||
    article.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  ).sort((a, b) => b.year - a.year);
}

export function saveArticleForPsychologist(articleId: string, psychologistId: string): boolean {
  const articles = getArticles();
  const article = articles.find(a => a.id === articleId);
  if (!article) return false;
  
  if (!article.savedBy) {
    article.savedBy = [];
  }
  
  if (!article.savedBy.includes(psychologistId)) {
    article.savedBy.push(psychologistId);
    saveArticles(articles);
  }
  
  return true;
}

export function unsaveArticleForPsychologist(articleId: string, psychologistId: string): boolean {
  const articles = getArticles();
  const article = articles.find(a => a.id === articleId);
  if (!article || !article.savedBy) return false;
  
  article.savedBy = article.savedBy.filter(id => id !== psychologistId);
  saveArticles(articles);
  return true;
}

export function getSavedArticles(psychologistId: string): AcademicArticle[] {
  const articles = getArticles();
  return articles.filter(a => a.savedBy?.includes(psychologistId)).sort((a, b) => b.year - a.year);
}

// Function to ensure minimum number of articles exist (for initial population)
export function ensureMinimumArticles(): void {
  const articles = getArticles();
  // If we have less than 5 articles, reinitialize with sample articles
  if (articles.length < 5) {
    const sampleArticles: AcademicArticle[] = [
      {
        id: uuidv4(),
        title: 'Effectiveness of Cognitive Behavioral Therapy for Anxiety Disorders: A Meta-Analysis',
        authors: ['Smith, J.', 'Doe, A.', 'Johnson, M.'],
        journal: 'Journal of Clinical Psychology',
        year: 2023,
        abstract: 'This meta-analysis examines the effectiveness of CBT in treating various anxiety disorders. Results show significant improvements in anxiety symptoms across multiple studies with effect sizes ranging from moderate to large.',
        doi: '10.1234/jcp.2023.001',
        keywords: ['CBT', 'anxiety', 'meta-analysis', 'treatment', 'therapy'],
        category: 'anxiety',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Mindfulness-Based Interventions for Depression: A Systematic Review',
        authors: ['Williams, K.', 'Brown, L.'],
        journal: 'Clinical Psychology Review',
        year: 2023,
        abstract: 'Systematic review of mindfulness interventions for depression. Findings suggest moderate to large effect sizes for mindfulness-based cognitive therapy (MBCT) in reducing depressive symptoms.',
        doi: '10.1234/cpr.2023.002',
        keywords: ['mindfulness', 'depression', 'MBCT', 'systematic review', 'intervention'],
        category: 'depression',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Efficacy of Exposure Therapy for Phobias and Panic Disorder: A Comprehensive Review',
        authors: ['Martinez, R.', 'Chen, L.', 'Anderson, P.'],
        journal: 'Behavior Therapy',
        year: 2023,
        abstract: 'This comprehensive review evaluates exposure therapy protocols for specific phobias and panic disorder. Results indicate high efficacy rates, with 70-90% of patients showing significant improvement.',
        doi: '10.1234/bt.2023.015',
        keywords: ['exposure therapy', 'phobias', 'panic disorder', 'CBT', 'anxiety'],
        category: 'anxiety',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Acceptance and Commitment Therapy for Chronic Stress: Randomized Controlled Trial',
        authors: ['Hayes, S.C.', 'Strosahl, K.D.', 'Wilson, K.G.'],
        journal: 'Journal of Consulting and Clinical Psychology',
        year: 2023,
        abstract: 'Randomized controlled trial examining ACT for chronic stress. Participants showed significant reductions in stress levels and improvements in psychological flexibility compared to control group.',
        doi: '10.1234/jccp.2023.042',
        keywords: ['ACT', 'stress', 'acceptance', 'commitment therapy', 'RCT'],
        category: 'stress',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Digital Mental Health Interventions: Efficacy and Implementation Challenges',
        authors: ['Taylor, M.', 'Roberts, S.', 'Davis, A.'],
        journal: 'Psychological Medicine',
        year: 2023,
        abstract: 'Review of digital mental health interventions including apps, online therapy, and teletherapy. Discusses efficacy, accessibility, and implementation challenges in mental health care delivery.',
        doi: '10.1234/pm.2023.088',
        keywords: ['digital health', 'teletherapy', 'mental health apps', 'e-health', 'technology'],
        category: 'general',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Trauma-Focused Cognitive Behavioral Therapy for PTSD: Meta-Analysis of Randomized Trials',
        authors: ['Cohen, J.A.', 'Mannarino, A.P.', 'Deblinger, E.'],
        journal: 'Journal of Traumatic Stress',
        year: 2022,
        abstract: 'Meta-analysis of randomized controlled trials examining TF-CBT for PTSD. Strong evidence for efficacy in reducing PTSD symptoms, depression, and anxiety in trauma survivors.',
        doi: '10.1234/jts.2022.156',
        keywords: ['TF-CBT', 'PTSD', 'trauma', 'meta-analysis', 'treatment'],
        category: 'trauma',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Dialectical Behavior Therapy for Borderline Personality Disorder: Long-term Outcomes',
        authors: ['Linehan, M.M.', 'Comtois, K.A.', 'Murray, A.M.'],
        journal: 'Archives of General Psychiatry',
        year: 2022,
        abstract: 'Long-term follow-up study of DBT for BPD. Results show sustained improvements in suicidal behaviors, self-harm, and overall functioning at 2-year follow-up.',
        doi: '10.1234/agp.2022.203',
        keywords: ['DBT', 'borderline personality', 'suicide prevention', 'long-term outcomes'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Sleep Interventions for Depression: A Systematic Review and Meta-Analysis',
        authors: ['Baglioni, C.', 'Battagliese, G.', 'Feige, B.'],
        journal: 'Sleep Medicine Reviews',
        year: 2023,
        abstract: 'Systematic review examining sleep-focused interventions for depression. Cognitive behavioral therapy for insomnia (CBT-I) shows promise in treating both sleep and depressive symptoms.',
        doi: '10.1234/smr.2023.091',
        keywords: ['sleep', 'depression', 'CBT-I', 'insomnia', 'intervention'],
        category: 'depression',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Role of Exercise in Mental Health: Evidence from Population Studies',
        authors: ['Schuch, F.B.', 'Vancampfort, D.', 'Firth, J.'],
        journal: 'World Psychiatry',
        year: 2023,
        abstract: 'Large-scale population studies examining the relationship between physical exercise and mental health. Regular exercise associated with reduced risk of depression and anxiety.',
        doi: '10.1234/wp.2023.124',
        keywords: ['exercise', 'mental health', 'depression', 'anxiety', 'prevention'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Internet-Based Cognitive Behavioral Therapy for Social Anxiety: Effectiveness and Predictors',
        authors: ['Andersson, G.', 'Cuijpers, P.', 'Carlbring, P.'],
        journal: 'Journal of Anxiety Disorders',
        year: 2023,
        abstract: 'Randomized controlled trial of internet-based CBT for social anxiety disorder. Significant improvements in social anxiety symptoms, with therapist support enhancing outcomes.',
        doi: '10.1234/jad.2023.067',
        keywords: ['iCBT', 'social anxiety', 'internet therapy', 'CBT', 'digital intervention'],
        category: 'anxiety',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Compassion-Focused Therapy for Shame and Self-Criticism: Clinical Applications',
        authors: ['Gilbert, P.', 'Procter, S.'],
        journal: 'Clinical Psychology & Psychotherapy',
        year: 2022,
        abstract: 'Review of compassion-focused therapy (CFT) for addressing shame and self-criticism. CFT shows effectiveness in reducing self-criticism and increasing self-compassion across various populations.',
        doi: '10.1234/cpp.2022.178',
        keywords: ['CFT', 'compassion', 'shame', 'self-criticism', 'therapy'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Group Therapy vs. Individual Therapy for Depression: Comparative Effectiveness',
        authors: ['McDermut, W.', 'Miller, I.W.', 'Brown, R.A.'],
        journal: 'Clinical Psychology Review',
        year: 2023,
        abstract: 'Meta-analysis comparing group and individual therapy for depression. Both formats show similar effectiveness, with group therapy offering cost-effectiveness advantages.',
        doi: '10.1234/cpr.2023.134',
        keywords: ['group therapy', 'individual therapy', 'depression', 'comparative effectiveness'],
        category: 'depression',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Mindfulness-Based Stress Reduction: Mechanisms of Change',
        authors: ['Hölzel, B.K.', 'Lazar, S.W.', 'Gard, T.'],
        journal: 'Perspectives on Psychological Science',
        year: 2022,
        abstract: 'Review of neurobiological and psychological mechanisms underlying MBSR effectiveness. Changes in attention regulation, body awareness, and emotion regulation identified as key mechanisms.',
        doi: '10.1234/pps.2022.245',
        keywords: ['MBSR', 'mindfulness', 'stress reduction', 'mechanisms', 'neurobiology'],
        category: 'stress',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Early Intervention for At-Risk Youth: Prevention of Mental Health Disorders',
        authors: ['Weisz, J.R.', 'Sandler, I.N.', 'Durlak, J.A.'],
        journal: 'American Psychologist',
        year: 2023,
        abstract: 'Review of early intervention programs for at-risk youth. School-based and community programs show promise in preventing depression, anxiety, and conduct disorders.',
        doi: '10.1234/ap.2023.312',
        keywords: ['prevention', 'youth', 'early intervention', 'mental health', 'school-based'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Schema Therapy for Personality Disorders: A Meta-Analytic Review',
        authors: ['Bamelis, L.L.M.', 'Evers, S.M.A.A.', 'Spinhoven, P.'],
        journal: 'Journal of Personality Disorders',
        year: 2022,
        abstract: 'Meta-analysis of schema therapy outcomes for personality disorders. Significant improvements in personality pathology, depression, and quality of life reported.',
        doi: '10.1234/jpd.2022.189',
        keywords: ['schema therapy', 'personality disorders', 'treatment', 'meta-analysis'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Effectiveness of Brief Interventions for Anxiety in Primary Care Settings',
        authors: ['Roy-Byrne, P.P.', 'Craske, M.G.', 'Sullivan, G.'],
        journal: 'JAMA Psychiatry',
        year: 2023,
        abstract: 'Randomized trial examining brief CBT interventions delivered in primary care for anxiety disorders. Significant improvements in anxiety symptoms with minimal therapist contact.',
        doi: '10.1234/jamapsychiatry.2023.456',
        keywords: ['brief intervention', 'primary care', 'anxiety', 'CBT', 'accessibility'],
        category: 'anxiety',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Neuroplasticity and Psychotherapy: Brain Changes Following Treatment',
        authors: ['Linden, D.E.J.', 'Linden, D.E.J.', 'Fallgatter, A.J.'],
        journal: 'Nature Reviews Neuroscience',
        year: 2022,
        abstract: 'Review of neuroimaging studies showing brain changes following psychotherapy. Structural and functional changes observed in regions associated with emotion regulation and cognitive control.',
        doi: '10.1234/nrn.2022.567',
        keywords: ['neuroplasticity', 'psychotherapy', 'neuroimaging', 'brain changes', 'neuroscience'],
        category: 'general',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Culturally Adapted Cognitive Behavioral Therapy: A Systematic Review',
        authors: ['Huey, S.J.', 'Tilley, J.L.', 'Jones, E.O.'],
        journal: 'Psychological Bulletin',
        year: 2023,
        abstract: 'Systematic review of culturally adapted CBT interventions. Culturally adapted versions show improved outcomes compared to standard CBT for ethnic minority populations.',
        doi: '10.1234/pb.2023.678',
        keywords: ['cultural adaptation', 'CBT', 'ethnic minorities', 'cultural competence', 'treatment'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Resilience Factors in Trauma Recovery: Longitudinal Study',
        authors: ['Bonanno, G.A.', 'Westphal, M.', 'Mancini, A.D.'],
        journal: 'Journal of Traumatic Stress',
        year: 2022,
        abstract: 'Longitudinal study identifying resilience factors in trauma recovery. Social support, positive coping strategies, and meaning-making associated with better outcomes.',
        doi: '10.1234/jts.2022.789',
        keywords: ['resilience', 'trauma', 'recovery', 'longitudinal', 'protective factors'],
        category: 'trauma',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'The Therapeutic Alliance in Psychotherapy: Meta-Analysis of Outcomes',
        authors: ['Horvath, A.O.', 'Del Re, A.C.', 'Flückiger, C.'],
        journal: 'Psychotherapy',
        year: 2023,
        abstract: 'Meta-analysis examining the relationship between therapeutic alliance and treatment outcomes. Strong therapeutic alliance consistently associated with better treatment outcomes across therapy types.',
        doi: '10.1234/psy.2023.890',
        keywords: ['therapeutic alliance', 'psychotherapy', 'outcomes', 'meta-analysis', 'relationship'],
        category: 'general',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Virtual Reality Exposure Therapy for Anxiety Disorders: Current Evidence',
        authors: ['Freeman, D.', 'Reeve, S.', 'Robinson, A.'],
        journal: 'The Lancet Psychiatry',
        year: 2023,
        abstract: 'Review of virtual reality exposure therapy (VRET) for anxiety disorders. VRET shows comparable effectiveness to in vivo exposure with advantages in accessibility and cost.',
        doi: '10.1234/lanpsy.2023.901',
        keywords: ['virtual reality', 'exposure therapy', 'anxiety', 'VRET', 'technology'],
        category: 'anxiety',
        source: 'scholar',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        title: 'Interpersonal Psychotherapy for Depression: Mechanisms and Moderators',
        authors: ['Markowitz, J.C.', 'Weissman, M.M.'],
        journal: 'American Journal of Psychiatry',
        year: 2022,
        abstract: 'Review of interpersonal psychotherapy (IPT) mechanisms and moderators. IPT effective for depression through improving interpersonal functioning and social support.',
        doi: '10.1234/ajp.2022.012',
        keywords: ['IPT', 'interpersonal therapy', 'depression', 'mechanisms', 'social support'],
        category: 'depression',
        source: 'pubmed',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Merge with existing articles, avoiding duplicates by title
    const existingTitles = new Set(articles.map(a => a.title.toLowerCase()));
    const newArticles = sampleArticles.filter(a => !existingTitles.has(a.title.toLowerCase()));
    
    if (newArticles.length > 0) {
      const mergedArticles = [...articles, ...newArticles];
      saveArticles(mergedArticles);
    }
  }
}
