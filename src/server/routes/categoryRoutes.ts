import { Router, Request, Response } from 'express';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { TaskRepository } from '../database/repositories/TaskRepository';
import { ApiResponse, CreateCategoryForm } from '../../shared/types';
import { logger } from '../utils/logger';

export function createCategoryRoutes(): Router {
  const router = Router();
  const categoryRepository = new CategoryRepository();
  const taskRepository = new TaskRepository();

  // GET /api/categories - Get all categories
  router.get('/', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const categories = await categoryRepository.findAll();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch categories',
          statusCode: 500
        }
      });
    }
  });

  // GET /api/categories/with-counts - Get categories with task counts
  router.get('/with-counts', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const categories = await categoryRepository.findAllWithTaskCounts();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error fetching categories with counts:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch categories with task counts',
          statusCode: 500
        }
      });
    }
  });

  // GET /api/categories/with-progress - Get categories with weekly progress
  router.get('/with-progress', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const weekStart = req.query.weekStart 
        ? new Date(req.query.weekStart as string)
        : new Date();
      
      // Set to start of week (Monday)
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const categories = await categoryRepository.findAllWithWeeklyProgress(weekStart);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error fetching categories with progress:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch categories with weekly progress',
          statusCode: 500
        }
      });
    }
  });

  // GET /api/categories/:id - Get category by ID
  router.get('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid category ID',
            statusCode: 400
          }
        });
      }

      const category = await categoryRepository.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Category not found',
            statusCode: 404
          }
        });
      }

      return res.json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error('Error fetching category:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch category',
          statusCode: 500
        }
      });
    }
  });

  // POST /api/categories - Create new category
  router.post('/', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const categoryData: CreateCategoryForm = req.body;

      // Validate required fields
      if (!categoryData.name || !categoryData.color) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Name and color are required',
            statusCode: 400
          }
        });
      }

      // Check if name is unique
      const isUnique = await categoryRepository.isNameUnique(categoryData.name);
      if (!isUnique) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Category name already exists',
            statusCode: 409
          }
        });
      }

      // Validate color format (hex color)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(categoryData.color)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid color format. Use hex color (e.g., #FF0000)',
            statusCode: 400
          }
        });
      }

      const category = await categoryRepository.create({
        name: categoryData.name.trim(),
        color: categoryData.color,
        icon: categoryData.icon?.trim() || undefined,
        description: categoryData.description?.trim() || undefined,
        weeklyGoal: categoryData.weeklyGoal || 0
      });

      return res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create category',
          statusCode: 500
        }
      });
    }
  });

  // PUT /api/categories/:id - Update category
  router.put('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const id = parseInt(req.params.id || '');
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid category ID',
            statusCode: 400
          }
        });
      }

      const updates: Partial<CreateCategoryForm> = req.body;

      // Check if category exists
      const existingCategory = await categoryRepository.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Category not found',
            statusCode: 404
          }
        });
      }

      // Validate name uniqueness if name is being updated
      if (updates.name && updates.name !== existingCategory.name) {
        const isUnique = await categoryRepository.isNameUnique(updates.name, id);
        if (!isUnique) {
          return res.status(409).json({
            success: false,
            error: {
              message: 'Category name already exists',
              statusCode: 409
            }
          });
        }
      }

      // Validate color format if color is being updated
      if (updates.color) {
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(updates.color)) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Invalid color format. Use hex color (e.g., #FF0000)',
              statusCode: 400
            }
          });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name.trim();
      if (updates.color) updateData.color = updates.color;
      if (updates.icon !== undefined) updateData.icon = updates.icon?.trim() || undefined;
      if (updates.description !== undefined) updateData.description = updates.description?.trim() || undefined;
      if (updates.weeklyGoal !== undefined) updateData.weeklyGoal = updates.weeklyGoal;

      const updatedCategory = await categoryRepository.update(id, updateData);
      
      return res.json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update category',
          statusCode: 500
        }
      });
    }
  });

  // DELETE /api/categories/:id - Delete category with task reassignment
  router.delete('/:id', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const id = parseInt(req.params.id || '');
      const reassignToCategoryId = req.query.reassignTo ? parseInt(req.query.reassignTo as string) : null;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid category ID',
            statusCode: 400
          }
        });
      }

      // Check if category exists
      const existingCategory = await categoryRepository.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Category not found',
            statusCode: 404
          }
        });
      }

      // Check if there are tasks in this category
      const tasksInCategory = await taskRepository.findByCategory(id);
      
      if (tasksInCategory.length > 0) {
        if (!reassignToCategoryId || isNaN(reassignToCategoryId)) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Category has tasks. Provide reassignTo parameter to reassign tasks to another category.',
              statusCode: 400
            }
          });
        }

        // Check if reassign target category exists
        const targetCategory = await categoryRepository.findById(reassignToCategoryId);
        if (!targetCategory) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Target category for reassignment not found',
              statusCode: 400
            }
          });
        }

        // Delete category and reassign tasks
        const success = await categoryRepository.deleteAndReassignTasks(id, reassignToCategoryId);
        if (!success) {
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to delete category',
              statusCode: 500
            }
          });
        }
      } else {
        // No tasks, safe to delete
        const success = await categoryRepository.deleteById(id);
        if (!success) {
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to delete category',
              statusCode: 500
            }
          });
        }
      }

      return res.json({
        success: true,
        data: { message: 'Category deleted successfully' }
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete category',
          statusCode: 500
        }
      });
    }
  });

  // POST /api/categories/check-name - Check if category name is unique
  router.post('/check-name', async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { name, excludeId } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Name is required',
            statusCode: 400
          }
        });
      }

      const isUnique = await categoryRepository.isNameUnique(name, excludeId);
      
      return res.json({
        success: true,
        data: { isUnique }
      });
    } catch (error) {
      logger.error('Error checking category name:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to check category name',
          statusCode: 500
        }
      });
    }
  });

  return router;
}