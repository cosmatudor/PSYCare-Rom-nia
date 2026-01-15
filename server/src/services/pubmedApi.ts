/**
 * PubMed API Integration Service
 * 
 * PubMed API Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25497/
 * E-utilities API: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  url: string;
  keywords: string[];
  publicationDate?: string;
}

/**
 * Search PubMed for articles
 * @param query Search query (e.g., "cognitive behavioral therapy anxiety")
 * @param maxResults Maximum number of results to return (default: 20)
 * @returns Array of PubMed articles
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 20
): Promise<PubMedArticle[]> {
  try {
    // PubMed E-utilities API endpoint
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
    
    // Step 1: Search and get PMIDs
    const searchUrl = `${baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const pmids = searchData.esearchresult?.idlist || [];
    
    if (pmids.length === 0) {
      return [];
    }

    // Step 2: Fetch article details using PMIDs
    const fetchUrl = `${baseUrl}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
    
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    
    // Parse XML response
    const articles = parsePubMedXML(xmlText);
    
    return articles;
  } catch (error: any) {
    console.error('Error searching PubMed:', error);
    throw new Error(`Failed to search PubMed: ${error.message}`);
  }
}

/**
 * Parse PubMed XML response
 */
function parsePubMedXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];
  
  // Simple XML parsing (for production, consider using a proper XML parser)
  const pubmedArticleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  const matches = xmlText.matchAll(pubmedArticleRegex);
  
  for (const match of matches) {
    const articleXml = match[1];
    
    try {
      const pmid = extractXMLValue(articleXml, 'PMID');
      const title = extractXMLValue(articleXml, 'ArticleTitle');
      const abstract = extractXMLValue(articleXml, 'AbstractText');
      const journal = extractXMLValue(articleXml, 'Title') || extractXMLValue(articleXml, 'MedlineTA');
      const year = extractYear(articleXml);
      const doi = extractDOI(articleXml);
      const authors = extractAuthors(articleXml);
      const keywords = extractKeywords(articleXml);
      const publicationDate = extractPublicationDate(articleXml);
      
      if (pmid && title) {
        articles.push({
          pmid,
          title: cleanText(title),
          authors,
          journal: cleanText(journal || 'Unknown Journal'),
          year: year || new Date().getFullYear(),
          abstract: cleanText(abstract || 'No abstract available'),
          doi,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          keywords,
          publicationDate,
        });
      }
    } catch (error) {
      console.warn('Error parsing article:', error);
      continue;
    }
  }
  
  return articles;
}

/**
 * Extract value from XML tag
 */
function extractXMLValue(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

/**
 * Extract year from publication date
 */
function extractYear(xml: string): number | undefined {
  const yearMatch = extractXMLValue(xml, 'Year');
  if (yearMatch) {
    const year = parseInt(yearMatch);
    if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear() + 1) {
      return year;
    }
  }
  return undefined;
}

/**
 * Extract DOI from article
 */
function extractDOI(xml: string): string | undefined {
  const doiMatch = extractXMLValue(xml, 'ELocationID');
  if (doiMatch && doiMatch.includes('doi')) {
    return doiMatch.replace(/.*doi[:\s]*/i, '').trim();
  }
  
  // Try alternative DOI location
  const articleIdRegex = /<ArticleId IdType="doi">([^<]+)<\/ArticleId>/i;
  const match = xml.match(articleIdRegex);
  return match ? match[1].trim() : undefined;
}

/**
 * Extract authors from article
 */
function extractAuthors(xml: string): string[] {
  const authors: string[] = [];
  
  const authorRegex = /<Author[^>]*>([\s\S]*?)<\/Author>/g;
  const matches = xml.matchAll(authorRegex);
  
  for (const match of matches) {
    const authorXml = match[1];
    const lastName = extractXMLValue(authorXml, 'LastName');
    const firstName = extractXMLValue(authorXml, 'ForeName') || extractXMLValue(authorXml, 'FirstName');
    
    if (lastName) {
      const authorName = firstName ? `${lastName}, ${firstName}` : lastName;
      authors.push(authorName);
    }
  }
  
  return authors.length > 0 ? authors : ['Unknown Author'];
}

/**
 * Extract keywords from article
 */
function extractKeywords(xml: string): string[] {
  const keywords: string[] = [];
  
  // Try KeywordList
  const keywordRegex = /<Keyword[^>]*>([^<]+)<\/Keyword>/gi;
  const matches = xml.matchAll(keywordRegex);
  
  for (const match of matches) {
    keywords.push(match[1].trim());
  }
  
  // If no keywords found, try MeshHeadingList
  if (keywords.length === 0) {
    const meshRegex = /<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/gi;
    const meshMatches = xml.matchAll(meshRegex);
    for (const match of meshMatches) {
      keywords.push(match[1].trim());
    }
  }
  
  return keywords;
}

/**
 * Extract publication date
 */
function extractPublicationDate(xml: string): string | undefined {
  const year = extractXMLValue(xml, 'Year');
  const month = extractXMLValue(xml, 'Month');
  const day = extractXMLValue(xml, 'Day');
  
  if (year) {
    const monthNum = month ? parseInt(month) : 1;
    const dayNum = day ? parseInt(day) : 1;
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  }
  
  return undefined;
}

/**
 * Clean text from XML entities and extra whitespace
 */
function cleanText(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map PubMed article to our AcademicArticle format
 */
export function mapPubMedToAcademicArticle(
  pubmedArticle: PubMedArticle,
  category: 'anxiety' | 'depression' | 'stress' | 'cbt' | 'mindfulness' | 'trauma' | 'general' = 'general'
): any {
  return {
    title: pubmedArticle.title,
    authors: pubmedArticle.authors,
    journal: pubmedArticle.journal,
    year: pubmedArticle.year,
    abstract: pubmedArticle.abstract,
    doi: pubmedArticle.doi,
    url: pubmedArticle.url,
    keywords: pubmedArticle.keywords,
    category,
    source: 'pubmed' as const,
  };
}

/**
 * Search PubMed with category-specific queries
 */
export async function searchPubMedByCategory(
  category: 'anxiety' | 'depression' | 'stress' | 'cbt' | 'mindfulness' | 'trauma' | 'general',
  maxResults: number = 10
): Promise<PubMedArticle[]> {
  const categoryQueries: Record<string, string> = {
    anxiety: 'anxiety disorders treatment therapy',
    depression: 'depression treatment therapy',
    stress: 'stress management intervention',
    cbt: 'cognitive behavioral therapy',
    mindfulness: 'mindfulness based intervention',
    trauma: 'trauma PTSD treatment',
    general: 'psychology mental health',
  };

  const query = categoryQueries[category] || categoryQueries.general;
  return searchPubMed(query, maxResults);
}
