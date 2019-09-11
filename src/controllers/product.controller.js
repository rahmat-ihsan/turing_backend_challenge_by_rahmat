/**
 * The Product controller contains all static methods that handles product request
 * Some methods work fine, some needs to be implemented from scratch while others may contain one or two bugs
 * The static methods and their function include:
 * 
 * - getAllProducts - Return a paginated list of products
 * - searchProducts - Returns a list of product that matches the search query string
 * - getProductsByCategory - Returns all products in a product category
 * - getProductsByDepartment - Returns a list of products in a particular department
 * - getProduct - Returns a single product with a matched id in the request params
 * - getAllDepartments - Returns a list of all product departments
 * - getDepartment - Returns a single department
 * - getAllCategories - Returns all categories
 * - getSingleCategory - Returns a single category
 * - getDepartmentCategories - Returns all categories in a department
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import {
  Product,
  Department,
  AttributeValue,
  Attribute,
  Category,
  Sequelize,
} from '../database/models';

const { Op } = Sequelize;

/**
 *
 *
 * @class ProductController
 */
class ProductController {

  /**
   * retrieve query String Parameter HTTP GET
   */
  static requestQuery(req) {
    var p = 1; //The starting page, default: 1
    var l = 20; //Limit per page, default: 20
    var dl = 200; //Limit of the description, default: 200

    //parameter page is provided
    if (req.query.page != undefined) {
      p = parseInt(req.query.page);
    }

    //parameter limit is provided
    if (req.query.limit != undefined) {
      l = parseInt(req.query.limit);
    }

    //parameter description_length is provided
    if (req.query.description_length != undefined) {
      dl = parseInt(req.query.description_length);
    }

    // count offset from page and limit
    var o = (p - 1) * l;

    var rq = {
      page: p,
      limit: l,
      description_length: dl,
      offset:o
    }
    return rq;
  }

  /**
   * get all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getAllProducts(req, res, next) {

    //get page, limit, description_length, and offset from request.query
    var rq = ProductController.requestQuery(req);

    //limit the description
    var substring_description = 'substring(description,1,' + rq.description_length.toString() + ')';

    const sqlQueryMap = {
      attributes:['product_id','name',[substring_description,'description'],'price','discounted_price','thumbnail'],
      limit:rq.limit,
      offset:rq.offset,
    };

    try {
      const products = await Product.findAndCountAll(sqlQueryMap);
      var paginationMeta = {
        currentPage: rq.page,                // Current page number
        currentPageSize: products.rows.length,        // The page limit
        totalPages: Math.ceil(products.count / rq.limit),                 // The total number of pages for all products
        totalRecords: products.count,               // The total number of product in the database
      }
      var rows = products.rows;
      return res.status(200).json({
        paginationMeta,
        rows,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * search all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async searchProduct(req, res, next) {
    const { query_string, all_words } = req.query;  // eslint-disable-line

    if (query_string == undefined) {
        var error = {status:400,code:"PRD_01",message:"parameter query_string not provided. Use ?query_string=...",field:"search"};
        return res.status(400).json({error});
    }

    if (all_words == undefined) {
        var error = {status:400,code:"PRD_02",message:"parameter all_words not provided. Use &all_words=on/off",field:"all_words"};
        return res.status(400).json({error});
    }

    if (all_words != "on" && all_words != "off") {
        var error = {status:400,code:"PRD_03",message:"parameter all_words should be on or off",field:"all_words"};
        return res.status(400).json({error});
    }

    //get page, limit, description_length, and offset from request.query
    var rq = ProductController.requestQuery(req);

    //limit the description
    var substring_description = 'substring(description,1,' + rq.description_length.toString() + ')';
    var condition = query_string;
    if (all_words.toLowerCase() == "off") {
      condition = '%' + condition + '%';
    }
    const sqlQueryMap = {
      attributes:['product_id','name',[substring_description,'description'],'price','discounted_price','thumbnail'],
      where: {
        name: {
          [Op.like]: condition
        }
      },
      limit:rq.limit,
      offset:rq.offset,
    };

    try {
      const products = await Product.findAndCountAll(sqlQueryMap);
      var rows = products.rows;
      return res.status(200).json({
        rows,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get all products by category
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getProductsByCategory(req, res, next) {
    try {
      const { category_id } = req.params; // eslint-disable-line
      
      if (category_id != parseInt(category_id, 10)) {
        return res.status(400).json({
          error: {
            status: 400, code:"CAT_02",
            message: `The ID is not a number`,  // eslint-disable-line
          }
        });
      }

      //get page, limit, description_length, and offset
      var rq = ProductController.requestQuery(req);
      
      var substring_description = 'substring(description,1,' + rq.description_length.toString() + ')';
      const sqlQueryMap = {
        attributes:['product_id','name', [Product.sequelize.literal(substring_description),'description'],'price','discounted_price','thumbnail'],
        include: [
          {
            model: Category,
            where: {
              category_id,
            },
            attributes:[]
          },
        ],
        limit:rq.limit,
        offset:rq.offset,
      };
      const products = await Product.findAndCountAll(sqlQueryMap);

      if (products.count>0) {
        var rows = products.rows;
        return res.status(200).json({
          rows
        });
      } else {
        var error = {status:400,code:"PRD_06",message:"Product with this Category doesn't exist",field:"category"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get all products by department
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getProductsByDepartment(req, res, next) {
    try {
      const { department_id } = req.params; // eslint-disable-line

      //get page, limit, description_length, and offset from request.query
      var rq = ProductController.requestQuery(req);

      //limit the description
      var substring_description = 'substring(Product.description,1,' + rq.description_length.toString() + ')';

      const sqlQueryMap = {
        attributes:['product_id','name', [Product.sequelize.literal(substring_description),'description'],'price','discounted_price','thumbnail'],
        include: [
          {
            model: Category,
            attributes: [],
            where: {
              department_id,
            },
          },
        ],
        limit:rq.limit,
        offset:rq.offset,
      };

      const products = await Product.findAndCountAll(sqlQueryMap);
      
      if (products.count>0) {
        var rows = products.rows;
        return res.status(200).json({
          rows
        });
      } else {
        var error = {status:400,code:"PRD_07",message:"Product with this Department doesn't exist",field:"department"};
        return res.status(400).json({error});
      }

      return next(products);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get single product details
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product details
   * @memberof ProductController
   */
  static async getProduct(req, res, next) {

    const { product_id } = req.params;  // eslint-disable-line
    if (product_id.toLowerCase() == "search") {
      return ProductController.searchProduct(req, res, next);
    }
    if (product_id != parseInt(product_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"PRD_04",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const product = await Product.findByPk(product_id, {
        attributes:['product_id','name', [Product.sequelize.literal(substring_description),'description'],
        'price','discounted_price','image', 'image_2','thumbnail','display'],
        raw: true
      });
      if (product != null) {
        return res.status(200).json(product);
      } else {
        var error = {status:400, code:"PRD_05", message: `Product with id ${product_id} does not exist`, field:"category"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get all departments
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and department list
   * @memberof ProductController
   */
  static async getAllDepartments(req, res, next) {
    try {
      const departments = await Department.findAll();
      return res.status(200).json(departments);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get a single department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartment(req, res, next) {
    const { department_id } = req.params; // eslint-disable-line
    if (department_id != parseInt(department_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"DEP_01",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const department = await Department.findByPk(department_id);
      if (department) {
        return res.status(200).json(department);
      }
      return res.status(400).json({
        error: {
          status: 400, code:"DEP_02",
          message: `Department with id ${department_id} does not exist`,  // eslint-disable-line
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method should get all categories
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllCategories(req, res, next) {
    try {
      const categories = await Category.findAll();
      return res.status(200).json(categories);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method should get a single category using the categoryId
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleCategory(req, res, next) {
    const { category_id } = req.params; // eslint-disable-line
    if (category_id != parseInt(category_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"CAT_02",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const category = await Category.findByPk(category_id);
      if (category) {
        return res.status(200).json(category);
      }
      return res.status(400).json({
        error: {
          status: 400, code:"CAT_01",
          message: `Category with id ${category_id} does not exist`,  // eslint-disable-line
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method should get list of categories in a department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartmentCategories(req, res, next) {
    try {
      const { department_id } = req.params; // eslint-disable-line

      //get page, limit, description_length, and offset
      var rq = ProductController.requestQuery(req);
      
      var substring_description = 'substring(description,1,' + rq.description_length.toString() + ')';
      const sqlQueryMap = {
        where: { department_id, }
      };
      const categories = await Category.findAndCountAll(sqlQueryMap);

      if (categories.count>0) {
        var rows = categories.rows;
        return res.status(200).json({
          rows
        });
      } else {
        var error = {status:400,code:"CAT_03",message:"Category with this Department doesn't exist",field:"department"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get category by product
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getCategoryByProduct(req, res, next) {
    try {
      const { product_id } = req.params; // eslint-disable-line
      if (product_id != parseInt(product_id, 10)) {
        return res.status(400).json({
          error: {
            status: 400, code:"PRD_04",
            message: `The ID is not a number`,  // eslint-disable-line
          }
        });
      }

      const sqlQueryMap = {
        attributes:['category_id','department_id','name'],
        include: [
          {
            model: Product,
            where: {
              product_id,
            },
            attributes:[]
          },
        ]
      };
      const categories = await Category.findAndCountAll(sqlQueryMap);

      if (categories.count>0) {
        var row = categories.rows[0];
        return res.status(200).json(row);
      } else {
        var error = {status:400,code:"CAT_04",message:"Product doesn't exist",field:"product"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }
}

export default ProductController;
