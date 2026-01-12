import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ForumPost {
  id: string;
  psychologistId: string;
  psychologistName: string;
  title: string;
  content: string;
  category: 'supervision' | 'case_discussion' | 'resources' | 'general' | 'techniques';
  tags: string[];
  likes: string[]; // IDs of psychologists who liked
  replies: ForumReply[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  psychologistId: string;
  psychologistName: string;
  content: string;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = join(process.cwd(), 'data');
const FORUM_FILE = join(DATA_DIR, 'forum.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getPosts(): ForumPost[] {
  ensureDataDir();
  if (!existsSync(FORUM_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(FORUM_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function savePosts(posts: ForumPost[]) {
  ensureDataDir();
  writeFileSync(FORUM_FILE, JSON.stringify(posts, null, 2));
}

export function createPost(post: Omit<ForumPost, 'id' | 'replies' | 'likes' | 'createdAt' | 'updatedAt'>): ForumPost {
  const posts = getPosts();
  const newPost: ForumPost = {
    ...post,
    id: uuidv4(),
    replies: [],
    likes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  posts.push(newPost);
  savePosts(posts);
  return newPost;
}

export function getAllPosts(): ForumPost[] {
  return getPosts().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPostsByCategory(category: string): ForumPost[] {
  const posts = getPosts();
  if (category === 'all') return posts.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return posts.filter(p => p.category === category).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPostById(postId: string): ForumPost | null {
  const posts = getPosts();
  return posts.find(p => p.id === postId) || null;
}

export function addReply(postId: string, reply: Omit<ForumReply, 'id' | 'likes' | 'createdAt' | 'updatedAt'>): ForumReply | null {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return null;
  
  const newReply: ForumReply = {
    ...reply,
    id: uuidv4(),
    likes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  post.replies.push(newReply);
  post.updatedAt = new Date().toISOString();
  savePosts(posts);
  return newReply;
}

export function toggleLikePost(postId: string, psychologistId: string): boolean {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return false;
  
  const index = post.likes.indexOf(psychologistId);
  if (index === -1) {
    post.likes.push(psychologistId);
  } else {
    post.likes.splice(index, 1);
  }
  
  post.updatedAt = new Date().toISOString();
  savePosts(posts);
  return true;
}

export function toggleLikeReply(postId: string, replyId: string, psychologistId: string): boolean {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return false;
  
  const reply = post.replies.find(r => r.id === replyId);
  if (!reply) return false;
  
  const index = reply.likes.indexOf(psychologistId);
  if (index === -1) {
    reply.likes.push(psychologistId);
  } else {
    reply.likes.splice(index, 1);
  }
  
  reply.updatedAt = new Date().toISOString();
  post.updatedAt = new Date().toISOString();
  savePosts(posts);
  return true;
}

export function updatePost(postId: string, psychologistId: string, updates: Partial<Pick<ForumPost, 'title' | 'content' | 'category' | 'tags'>>): ForumPost | null {
  const posts = getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post || post.psychologistId !== psychologistId) return null;
  
  Object.assign(post, updates);
  post.updatedAt = new Date().toISOString();
  savePosts(posts);
  return post;
}

export function deletePost(postId: string, psychologistId: string): boolean {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1 || posts[postIndex].psychologistId !== psychologistId) return false;
  
  posts.splice(postIndex, 1);
  savePosts(posts);
  return true;
}
