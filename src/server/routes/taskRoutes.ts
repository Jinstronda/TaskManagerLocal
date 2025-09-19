    import { Router, Request, Response } from 'express';
import { TaskRepository } from '../database/repositories/TaskRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { ApiResponse, Task, CreateTaskForm } from '../../shared/types';
import { logger } from '../utils/logger';

function createTaskRoutes(): Router {
  const router = Router();
  const taskRepository = new TaskRepository();
  const categoryRepository = new CategoryRepository();

  // GET /api/tasks - Get all tasks with optional filtering
  router.get('/', async (req: Request, res: Response<ApiResponse<Task[]>>) => {
  try {
    const { categoryId, status, priority } = req.query;
    
    const filters: any = {};
    if (categoryId) filters.categoryId = parseInt(categoryId as string);
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    
    const tasks = await taskRepository.findByFilters(filters);
    
    return res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tasks',
        statusCode: 500
      }
    });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req: Request, res: Response<ApiResponse<Task>>) => {
  try {
    const taskId = parseInt(req.params.id || '');
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task ID',
          statusCode: 400
        }
      });
    }

    const task = await taskRepository.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          statusCode: 404
        }
      });
    }
    
    return res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('Error fetching task:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch task',
        statusCode: 500
      }
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', async (req: Request, res: Response<ApiResponse<Task>>) => {
  try {
    const taskData: CreateTaskForm = req.body;
    
    // Validate required fields
    if (!taskData.title || !taskData.categoryId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Title and category are required',
          statusCode: 400
        }
      });
    }
    
    // Verify category exists
    const category = await categoryRepository.findById(taskData.categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Category not found',
          statusCode: 400
        }
      });
    }
    
    const task = await taskRepository.create({
      title: taskData.title,
      description: taskData.description,
      categoryId: taskData.categoryId,
      estimatedDuration: taskData.estimatedDuration,
      actualDuration: 0,
      priority: taskData.priority || 'medium',
      status: 'active',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
    });
    
    logger.info(`Task created: ${task.title} (ID: ${task.id})`);
    
    return res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create task',
        statusCode: 500
      }
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req: Request, res: Response<ApiResponse<Task>>) => {
  try {
    const taskId = parseInt(req.params.id || '');
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task ID',
          statusCode: 400
        }
      });
    }

    const updateData = req.body;
    
    // Check if task exists
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          statusCode: 404
        }
      });
    }
    
    // If categoryId is being updated, verify it exists
    if (updateData.categoryId && updateData.categoryId !== existingTask.categoryId) {
      const category = await categoryRepository.findById(updateData.categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Category not found',
            statusCode: 400
          }
        });
      }
    }
    
    // Handle task completion
    if (updateData.status === 'completed' && existingTask.status !== 'completed') {
      updateData.completedAt = new Date();
    } else if (updateData.status !== 'completed' && existingTask.status === 'completed') {
      updateData.completedAt = null;
    }
    
    const updatedTask = await taskRepository.update(taskId, updateData);
    
    if (!updatedTask) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update task',
          statusCode: 500
        }
      });
    }
    
    logger.info(`Task updated: ${updatedTask.title} (ID: ${taskId})`);
    
    return res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update task',
        statusCode: 500
      }
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req: Request, res: Response<ApiResponse<void>>) => {
  try {
    const taskId = parseInt(req.params.id || '');
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task ID',
          statusCode: 400
        }
      });
    }
    
    // Check if task exists
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          statusCode: 404
        }
      });
    }
    
    const deleted = await taskRepository.deleteById(taskId);
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete task',
          statusCode: 500
        }
      });
    }
    
    logger.info(`Task deleted: ${existingTask.title} (ID: ${taskId})`);
    
    return res.json({
      success: true
    });
  } catch (error) {
    logger.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete task',
        statusCode: 500
      }
    });
  }
});

// PATCH /api/tasks/:id/complete - Mark task as completed
router.patch('/:id/complete', async (req: Request, res: Response<ApiResponse<Task>>) => {
  try {
    const taskId = parseInt(req.params.id || '');
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task ID',
          statusCode: 400
        }
      });
    }
    
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          statusCode: 404
        }
      });
    }
    
    const updatedTask = await taskRepository.update(taskId, {
      status: 'completed',
      completedAt: new Date()
    });
    
    if (!updatedTask) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to complete task',
          statusCode: 500
        }
      });
    }
    
    logger.info(`Task completed: ${updatedTask.title} (ID: ${taskId})`);
    
    return res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Error completing task:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to complete task',
        statusCode: 500
      }
    });
  }
});

// PATCH /api/tasks/:id/add-time - Add time to task's actual duration
router.patch('/:id/add-time', async (req: Request, res: Response<ApiResponse<Task>>) => {
  try {
    const taskId = parseInt(req.params.id || '');
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task ID',
          statusCode: 400
        }
      });
    }
    
    const { additionalMinutes } = req.body;
    if (typeof additionalMinutes !== 'number' || additionalMinutes < 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'additionalMinutes must be a positive number',
          statusCode: 400
        }
      });
    }
    
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          statusCode: 404
        }
      });
    }
    
    const newActualDuration = (existingTask.actualDuration || 0) + additionalMinutes;
    const updatedTask = await taskRepository.update(taskId, {
      actualDuration: newActualDuration
    });
    
    if (!updatedTask) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update task duration',
          statusCode: 500
        }
      });
    }
    
    logger.info(`Task duration updated: ${updatedTask.title} (ID: ${taskId}) +${additionalMinutes}m (total: ${newActualDuration}m)`);
    
    return res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Error updating task duration:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update task duration',
        statusCode: 500
      }
    });
  }
});

// PATCH /api/tasks/:id/add-time - Add time to task's actual duration
router.patch('/:id/add-time', async (req: Request, res: Response<ApiResponse<Task>>) => {
  try {
    const taskId = parseInt(req.params.id || '');
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid task ID',
          statusCode: 400
        }
      });
    }
    
    const { additionalMinutes } = req.body;
    if (typeof additionalMinutes !== 'number' || additionalMinutes < 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'additionalMinutes must be a positive number',
          statusCode: 400
        }
      });
    }
    
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Task not found',
          statusCode: 404
        }
      });
    }
    
    const newActualDuration = (existingTask.actualDuration || 0) + additionalMinutes;
    const updatedTask = await taskRepository.update(taskId, {
      actualDuration: newActualDuration
    });
    
    if (!updatedTask) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update task duration',
          statusCode: 500
        }
      });
    }
    
    logger.info(`Task duration updated: ${updatedTask.title} (ID: ${taskId}) +${additionalMinutes}m (total: ${newActualDuration}m)`);
    
    return res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Error updating task duration:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update task duration',
        statusCode: 500
      }
    });
  }
});

// GET /api/tasks/category/:categoryId - Get tasks by category
router.get('/category/:categoryId', async (req: Request, res: Response<ApiResponse<Task[]>>) => {
  try {
    const categoryId = parseInt(req.params.categoryId || '');
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid category ID',
          statusCode: 400
        }
      });
    }

    const { status } = req.query;
    
    const filters: any = { categoryId };
    if (status) filters.status = status as string;
    
    const tasks = await taskRepository.findByFilters(filters);
    
    return res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    logger.error('Error fetching tasks by category:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch tasks by category',
        statusCode: 500
      }
    });
  }
});

  return router;
}

export { createTaskRoutes };