export interface Project {
  id: number;
  source: string;
  ownerOrNamespace: string;
  repoName: string;
  title: string;
  description: string;
  repoUrl: string;
  liveUrl: string;
  imageUrl: string;
  tags: string[];
  featured: boolean;
  displayOrder: number;
  category: string;
  status: string;
  year: number;
  platform: string;
  visibility: string;
}