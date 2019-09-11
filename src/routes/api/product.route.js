import { Router } from 'express';
import ProductController from '../../controllers/product.controller';

// These are valid routes but they may contain a bug, please try to define and fix them

const router = Router();
router.get('/products', ProductController.getAllProducts);
router.get('/products/:product_id', ProductController.getProduct);
router.get('/products/search', ProductController.searchProduct); //can't arrive to this route because overlap with above, but was handled in controller.
router.get('/products/inCategory/:category_id', ProductController.getProductsByCategory);
router.get('/products/inDepartment/:department_id', ProductController.getProductsByDepartment);
router.get('/departments', ProductController.getAllDepartments);
router.get('/departments/:department_id', ProductController.getDepartment);
router.get('/categories', ProductController.getAllCategories);
router.get('/categories/:category_id', ProductController.getSingleCategory);
router.get('/categories/inProduct/:product_id', ProductController.getCategoryByProduct); //new
router.get('/categories/inDepartment/:department_id', ProductController.getDepartmentCategories);

export default router;
