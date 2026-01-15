import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import {
  getAllArticles,
  getArticlesByCategory,
  searchArticles,
  createArticle,
  saveArticleForPsychologist,
  unsaveArticleForPsychologist,
  getSavedArticles,
  ensureMinimumArticles
} from '../data/academicResources.js';
import { searchPubMed, searchPubMedByCategory, mapPubMedToAcademicArticle } from '../services/pubmedApi.js';

const router = express.Router();

// Get all articles
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Ensure minimum articles exist
    ensureMinimumArticles();
    
    const { category, search, source } = req.query;
    
    // If source is 'pubmed', search PubMed API directly
    if (source === 'pubmed' && search && typeof search === 'string') {
      try {
        const pubmedArticles = await searchPubMed(search, 20);
        const mappedArticles = pubmedArticles.map(article => 
          mapPubMedToAcademicArticle(article, category as any || 'general')
        );
        return res.json(mappedArticles);
      } catch (error: any) {
        console.error('Error searching PubMed:', error);
        return res.status(500).json({ error: 'Failed to search PubMed: ' + error.message });
      }
    }
    
    // If source is 'pubmed' and category is specified, search by category
    if (source === 'pubmed' && category && typeof category === 'string') {
      try {
        const pubmedArticles = await searchPubMedByCategory(category as any, 20);
        const mappedArticles = pubmedArticles.map(article => 
          mapPubMedToAcademicArticle(article, category as any)
        );
        return res.json(mappedArticles);
      } catch (error: any) {
        console.error('Error searching PubMed by category:', error);
        return res.status(500).json({ error: 'Failed to search PubMed: ' + error.message });
      }
    }
    
    // Otherwise, search local articles
    let articles;
    if (search && typeof search === 'string') {
      articles = searchArticles(search);
    } else if (category && typeof category === 'string') {
      articles = getArticlesByCategory(category);
    } else {
      articles = getAllArticles();
    }
    
    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get saved articles for psychologist
router.get('/saved', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can view saved articles' });
    }
    
    const articles = getSavedArticles(req.userId!);
    res.json(articles);
  } catch (error) {
    console.error('Error fetching saved articles:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
});

// Save article for psychologist
router.post('/:articleId/save', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can save articles' });
    }
    
    const { articleId } = req.params;
    const saved = saveArticleForPsychologist(articleId, req.userId!);
    
    if (!saved) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// Unsave article for psychologist
router.delete('/:articleId/save', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can unsave articles' });
    }
    
    const { articleId } = req.params;
    const unsaved = unsaveArticleForPsychologist(articleId, req.userId!);
    
    if (!unsaved) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error unsaving article:', error);
    res.status(500).json({ error: 'Failed to unsave article' });
  }
});

// Search PubMed API directly
router.get('/pubmed/search', async (req: AuthRequest, res) => {
  try {
    const { query, maxResults = 20 } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const pubmedArticles = await searchPubMed(query, Number(maxResults));
    const mappedArticles = pubmedArticles.map(article => 
      mapPubMedToAcademicArticle(article, 'general')
    );
    
    res.json(mappedArticles);
  } catch (error: any) {
    console.error('Error searching PubMed:', error);
    res.status(500).json({ error: 'Failed to search PubMed: ' + error.message });
  }
});

// Import article from PubMed to local database
router.post('/pubmed/import', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can import articles' });
    }
    
    const { pmid, category = 'general' } = req.body;
    
    if (!pmid) {
      return res.status(400).json({ error: 'PMID is required' });
    }
    
    // Search for the specific article by PMID
    const pubmedArticles = await searchPubMed(`pmid:${pmid}`, 1);
    
    if (pubmedArticles.length === 0) {
      return res.status(404).json({ error: 'Article not found in PubMed' });
    }
    
    const pubmedArticle = pubmedArticles[0];
    const articleData = mapPubMedToAcademicArticle(pubmedArticle, category as any);
    
    // Check if article already exists (by DOI or URL)
    const existingArticles = getAllArticles();
    const existing = existingArticles.find(a => 
      a.doi === articleData.doi || a.url === articleData.url
    );
    
    if (existing) {
      return res.json({ ...existing, message: 'Article already exists' });
    }
    
    // Create article in local database
    const article = createArticle(articleData);
    
    res.status(201).json(article);
  } catch (error: any) {
    console.error('Error importing article from PubMed:', error);
    res.status(500).json({ error: error.message || 'Failed to import article' });
  }
});

// Add manual article (for psychologists)
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can add articles' });
    }
    
    const { title, authors, journal, year, abstract, doi, url, keywords, category } = req.body;
    
    if (!title || !authors || !journal || !year || !abstract || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const article = createArticle({
      title,
      authors: Array.isArray(authors) ? authors : [authors],
      journal,
      year: Number(year),
      abstract,
      doi,
      url,
      keywords: Array.isArray(keywords) ? keywords : keywords ? [keywords] : [],
      category,
      source: 'manual'
    });
    
    res.status(201).json(article);
  } catch (error: any) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: error.message || 'Failed to create article' });
  }
});

export default router;
