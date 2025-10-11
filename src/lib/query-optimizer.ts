/**
 * Database query optimization utilities
 * Provides optimized queries with proper indexing and caching
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ContentType, UserRole } from '@prisma/client';
import {
  withCache,
  CacheKeys,
  pageCache,
  searchCache,
  userCache,
} from '@/lib/cache';
import { timedQuery } from '@/lib/performance-monitor';

/**
 * Optimized page queries with caching
 */
export class PageQueries {
  /**
   * Get page by ID with optimized relations
   */
  static async getById(id: string) {
    return withCache(
      CacheKeys.page(id),
      async () => {
        return timedQuery(
          'PageQueries.getById',
          () =>
            prisma.page.findUnique({
              where: { id },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
                files: {
                  select: {
                    id: true,
                    filename: true,
                    originalName: true,
                    mimeType: true,
                    fileSize: true,
                    createdAt: true,
                  },
                  orderBy: { createdAt: 'desc' },
                },
                comments: {
                  select: {
                    id: true,
                    comment: true,
                    createdAt: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 10, // Limit initial comments load
                },
                _count: {
                  select: {
                    comments: true,
                    files: true,
                  },
                },
              },
            }),
          { id }
        );
      },
      pageCache,
      10 * 60 * 1000 // 10 minutes
    );
  }

  /**
   * Get pages with optimized filtering and pagination
   */
  static async getList(params: {
    query?: string;
    pageType?: ContentType;
    tags?: string[];
    authorId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const cacheKey = CacheKeys.pageList(params);

    return withCache(
      cacheKey,
      async () => {
        const {
          query,
          pageType,
          tags,
          authorId,
          page = 1,
          limit = 10,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = params;

        // Build optimized where clause
        const where: Prisma.PageWhereInput = { published: true };

        if (query) {
          where.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ];
        }

        if (pageType) {
          where.pageType = pageType;
        }

        if (tags && tags.length > 0) {
          where.tags = { hasSome: tags };
        }

        if (authorId) {
          where.authorId = authorId;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Map sortBy values to actual database fields
        const sortByMapping: Record<string, string> = {
          date: 'createdAt',
          createdAt: 'createdAt',
          title: 'title',
          pageType: 'pageType',
          author: 'authorId',
        };

        const actualSortBy = sortByMapping[sortBy] || 'createdAt';

        // Use Promise.all for parallel queries
        const [pages, total] = await Promise.all([
          prisma.page.findMany({
            where,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                  files: true,
                },
              },
            },
            orderBy: { [actualSortBy]: sortOrder },
            skip,
            take: limit,
          }),
          prisma.page.count({ where }),
        ]);

        return {
          pages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      pageCache,
      5 * 60 * 1000 // 5 minutes
    );
  }

  /**
   * Get popular pages (most commented/viewed)
   */
  static async getPopular(limit = 10) {
    return withCache(
      'pages:popular',
      async () => {
        return prisma.page.findMany({
          where: { published: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            _count: {
              select: {
                comments: true,
                files: true,
              },
            },
          },
          orderBy: {
            comments: {
              _count: 'desc',
            },
          },
          take: limit,
        });
      },
      pageCache,
      15 * 60 * 1000 // 15 minutes
    );
  }

  /**
   * Get recent pages
   */
  static async getRecent(limit = 10) {
    return withCache(
      'pages:recent',
      async () => {
        return prisma.page.findMany({
          where: { published: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            _count: {
              select: {
                comments: true,
                files: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      },
      pageCache,
      5 * 60 * 1000 // 5 minutes
    );
  }
}

/**
 * Optimized search queries
 */
export class SearchQueries {
  /**
   * Enhanced search with relevance scoring
   */
  static async search(params: {
    query?: string;
    pageType?: ContentType;
    tags?: string[];
    authorId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const cacheKey = CacheKeys.search(params);

    return withCache(
      cacheKey,
      async () => {
        const {
          query,
          pageType,
          tags,
          authorId,
          page = 1,
          limit = 10,
          sortBy = 'relevance',
          sortOrder = 'desc',
        } = params;

        const where: Prisma.PageWhereInput = { published: true };

        // Enhanced search logic
        if (query) {
          const searchTerms = query.trim().split(' ').filter(Boolean);

          where.OR = [
            // Exact title match (highest priority)
            { title: { contains: query, mode: 'insensitive' as const } },
            // Content match
            { content: { contains: query, mode: 'insensitive' as const } },
            // Tag match
            { tags: { hasSome: [query] } },
            // Multiple term search
            ...searchTerms.map((term) => ({
              OR: [
                { title: { contains: term, mode: 'insensitive' as const } },
                { content: { contains: term, mode: 'insensitive' as const } },
                { tags: { hasSome: [term] } },
              ],
            })),
          ];
        }

        if (pageType) {
          where.pageType = pageType;
        }

        if (tags && tags.length > 0) {
          where.tags = { hasSome: tags };
        }

        if (authorId) {
          where.authorId = authorId;
        }

        const skip = (page - 1) * limit;

        // Determine sort order
        let orderBy: Prisma.PageOrderByWithRelationInput = {
          createdAt: 'desc',
        };

        switch (sortBy) {
          case 'date':
            orderBy = { createdAt: sortOrder };
            break;
          case 'title':
            orderBy = { title: sortOrder };
            break;
          case 'relevance':
          default:
            // For relevance, prioritize by creation date for now
            // In production, you might want to implement proper relevance scoring
            orderBy = { createdAt: 'desc' };
            break;
        }

        const [pages, total] = await Promise.all([
          prisma.page.findMany({
            where,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                  files: true,
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
          prisma.page.count({ where }),
        ]);

        return {
          pages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      searchCache,
      5 * 60 * 1000 // 5 minutes
    );
  }

  /**
   * Get all unique tags with usage count
   */
  static async getTags() {
    return withCache(
      CacheKeys.tagList(),
      async () => {
        const pages = await prisma.page.findMany({
          where: { published: true },
          select: { tags: true },
        });

        const tagCounts = new Map<string, number>();

        pages.forEach((page) => {
          page.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        return Array.from(tagCounts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);
      },
      searchCache,
      30 * 60 * 1000 // 30 minutes
    );
  }
}

/**
 * Optimized user queries
 */
export class UserQueries {
  /**
   * Get user with role information
   */
  static async getById(id: string) {
    return withCache(
      CacheKeys.user(id),
      async () => {
        return prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                pages: true,
                comments: true,
                files: true,
              },
            },
          },
        });
      },
      userCache,
      15 * 60 * 1000 // 15 minutes
    );
  }

  /**
   * Get user's pages
   */
  static async getUserPages(userId: string, limit = 10) {
    return withCache(
      CacheKeys.userPages(userId),
      async () => {
        return prisma.page.findMany({
          where: {
            authorId: userId,
            published: true,
          },
          include: {
            _count: {
              select: {
                comments: true,
                files: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      },
      userCache,
      10 * 60 * 1000 // 10 minutes
    );
  }
}

/**
 * Statistics queries with caching
 */
export class StatsQueries {
  /**
   * Get global statistics
   */
  static async getGlobalStats() {
    // Return default stats during build phase when database is not available
    if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
      return {
        totalPages: 0,
        totalUsers: 0,
        totalFiles: 0,
        totalComments: 0,
        pagesByType: {} as Record<ContentType, number>,
      };
    }

    return withCache(
      CacheKeys.globalStats(),
      async () => {
        try {
          const [totalPages, totalUsers, totalFiles, totalComments, pagesByType] =
            await Promise.all([
              prisma.page.count({ where: { published: true } }),
              prisma.user.count(),
              prisma.file.count(),
              prisma.comment.count(),
              prisma.page.groupBy({
                by: ['pageType'],
                where: { published: true },
                _count: { pageType: true },
              }),
            ]);

          return {
            totalPages,
            totalUsers,
            totalFiles,
            totalComments,
            pagesByType: pagesByType.reduce(
              (acc, item) => {
                acc[item.pageType] = item._count.pageType;
                return acc;
              },
              {} as Record<ContentType, number>
            ),
          };
        } catch (error) {
          // Return default stats if database query fails
          console.warn('Failed to fetch global stats, returning defaults:', error);
          return {
            totalPages: 0,
            totalUsers: 0,
            totalFiles: 0,
            totalComments: 0,
            pagesByType: {} as Record<ContentType, number>,
          };
        }
      },
      undefined,
      30 * 60 * 1000 // 30 minutes
    );
  }
}
