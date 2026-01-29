/**
 * Order Service (backend reference implementation)
 * Used by both list-all and advanced search. Assumes DB layer (e.g. Prisma) is injected or required elsewhere.
 */

/**
 * Shared helper to format order items with categories. Used by both getAllOrders and searchOrders.
 * @param {Array} orders - Raw orders from DB (each with items and product.category or product.categories)
 * @returns {Array} Orders with items formatted (category/categories normalized for API response)
 */
function formatOrdersWithCategories(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.map((order) => {
    const items = (order.items || []).map((item) => {
      const product = item.product ? { ...item.product } : null;
      if (product && product.category) {
        product.category = product.category;
      }
      if (product && product.categories) {
        product.categories = product.categories;
      }
      return { ...item, product };
    });
    return { ...order, items };
  });
}

/**
 * Default sort: createdAt desc
 */
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const SORT_FIELDS = ['createdAt', 'updatedAt', 'totalAmount', 'status', 'paymentStatus', 'deliveryDate'];

/**
 * Advanced order search with filters, pagination, and sort.
 * @param {Object} filters - Query params: orderId, status, paymentStatus, dateFrom, dateTo, deliveryDateFrom, deliveryDateTo, phone, name, totalMin, totalMax, deliveryTimeSlot, page, limit, sortBy, sortOrder
 * @returns {Promise<{ orders: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
async function searchOrders(filters) {
  const page = Math.max(1, Number(filters.page) || DEFAULT_PAGE);
  let limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || DEFAULT_LIMIT));
  const sortBy = SORT_FIELDS.includes(filters.sortBy) ? filters.sortBy : DEFAULT_SORT_BY;
  const sortOrder = (filters.sortOrder === 'asc' || filters.sortOrder === 'desc') ? filters.sortOrder : DEFAULT_SORT_ORDER;

  // Build DB query from filters (implementation depends on your ORM)
  // Example shape for Prisma: { where: {...}, orderBy: {...}, skip, take }
  const where = {};
  if (filters.orderId) where.id = { contains: filters.orderId }; // or id equals if numeric
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  if (filters.dateTo) where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  if (filters.deliveryDateFrom) where.deliveryDate = { ...where.deliveryDate, gte: new Date(filters.deliveryDateFrom) };
  if (filters.deliveryDateTo) where.deliveryDate = { ...where.deliveryDate, lte: new Date(filters.deliveryDateTo) };
  if (filters.phone) {
    where.OR = [
      { user: { phoneNumber: { contains: filters.phone } } },
      { address: { phoneNumber: { contains: filters.phone } } },
    ];
  }
  if (filters.name) where.user = { name: { contains: filters.name } };
  if (filters.totalMin != null) where.totalAmount = { ...where.totalAmount, gte: Number(filters.totalMin) };
  if (filters.totalMax != null) where.totalAmount = { ...where.totalAmount, lte: Number(filters.totalMax) };
  if (filters.deliveryTimeSlot) where.deliveryTimeSlot = filters.deliveryTimeSlot;

  const orderBy = { [sortBy]: sortOrder };
  const skip = (page - 1) * limit;
  const take = limit;

  // Placeholder: replace with actual DB calls (e.g. prisma.order.findMany, prisma.order.count)
  const [ordersRaw, total] = await Promise.all([
    getOrdersFromDb({ where, orderBy, skip, take }),
    getOrdersCountFromDb({ where }),
  ]);

  const orders = formatOrdersWithCategories(ordersRaw);
  const totalPages = Math.ceil(total / limit) || 1;

  return { orders, total, page, limit, totalPages };
}

/**
 * Placeholder: replace with your DB layer (e.g. prisma.order.findMany with include: { user, address, items: { include: { product: { include: { category } } } } })
 */
async function getOrdersFromDb({ where, orderBy, skip, take }) {
  // return await prisma.order.findMany({ where, orderBy, skip, take, include: { ... } });
  return [];
}

/**
 * Placeholder: replace with prisma.order.count({ where })
 */
async function getOrdersCountFromDb({ where }) {
  // return await prisma.order.count({ where });
  return 0;
}

/**
 * Get all orders (no filters). Used when GET /admin/orders/all has no query params.
 * @returns {Promise<Array>} All orders formatted with formatOrdersWithCategories
 */
async function getAllOrders() {
  const ordersRaw = await getOrdersFromDb({ where: {}, orderBy: { createdAt: 'desc' }, skip: 0, take: undefined });
  return formatOrdersWithCategories(ordersRaw);
}

module.exports = {
  formatOrdersWithCategories,
  searchOrders,
  getAllOrders,
};
