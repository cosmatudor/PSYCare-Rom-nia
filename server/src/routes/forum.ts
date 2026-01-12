import express from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getUsers } from '../data/users.js';
import {
  getAllPosts,
  getPostsByCategory,
  getPostById,
  createPost,
  addReply,
  toggleLikePost,
  toggleLikeReply,
  updatePost,
  deletePost
} from '../data/forum.js';

const router = express.Router();

// Get all posts
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can access the forum' });
    }
    
    const { category } = req.query;
    const posts = category && typeof category === 'string' 
      ? getPostsByCategory(category)
      : getAllPosts();
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post by ID
router.get('/:postId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can access the forum' });
    }
    
    const { postId } = req.params;
    const post = getPostById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can create posts' });
    }
    
    const { title, content, category, tags } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const users = getUsers();
    const psychologist = users.find(u => u.id === req.userId);
    
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    
    const post = createPost({
      psychologistId: req.userId!,
      psychologistName: psychologist.name,
      title,
      content,
      category,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : []
    });
    
    res.status(201).json(post);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

// Update post
router.put('/:postId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can update posts' });
    }
    
    const { postId } = req.params;
    const updates = req.body;
    
    const updatedPost = updatePost(postId, req.userId!, updates);
    
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found or access denied' });
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:postId', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can delete posts' });
    }
    
    const { postId } = req.params;
    const deleted = deletePost(postId, req.userId!);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found or access denied' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Add reply
router.post('/:postId/replies', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can reply' });
    }
    
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const users = getUsers();
    const psychologist = users.find(u => u.id === req.userId);
    
    if (!psychologist) {
      return res.status(404).json({ error: 'Psychologist not found' });
    }
    
    const reply = addReply(postId, {
      psychologistId: req.userId!,
      psychologistName: psychologist.name,
      content
    });
    
    if (!reply) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.status(201).json(reply);
  } catch (error: any) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: error.message || 'Failed to add reply' });
  }
});

// Toggle like post
router.post('/:postId/like', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can like posts' });
    }
    
    const { postId } = req.params;
    const toggled = toggleLikePost(postId, req.userId!);
    
    if (!toggled) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = getPostById(postId);
    res.json({ liked: post?.likes.includes(req.userId!) || false, likesCount: post?.likes.length || 0 });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Toggle like reply
router.post('/:postId/replies/:replyId/like', async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'psychologist') {
      return res.status(403).json({ error: 'Only psychologists can like replies' });
    }
    
    const { postId, replyId } = req.params;
    const toggled = toggleLikeReply(postId, replyId, req.userId!);
    
    if (!toggled) {
      return res.status(404).json({ error: 'Post or reply not found' });
    }
    
    const post = getPostById(postId);
    const reply = post?.replies.find(r => r.id === replyId);
    res.json({ liked: reply?.likes.includes(req.userId!) || false, likesCount: reply?.likes.length || 0 });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
