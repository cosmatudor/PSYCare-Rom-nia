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

const router = express.Router();

// Get all articles
router.get('/', async (req: AuthRequest, res) => {
  try {
    // Ensure minimum articles exist
    ensureMinimumArticles();
    
    const { category, search } = req.query;
    
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
