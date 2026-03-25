import { PAGINATION } from '../constants/index.js';

export class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.totalDocs = 0;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'select', 'search', 'near', 'maxDistance'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Handle price range
    if (queryObj.minPrice || queryObj.maxPrice) {
      queryObj['pricing.basePrice'] = {};
      if (queryObj.minPrice) {
        queryObj['pricing.basePrice'].$gte = Number(queryObj.minPrice);
        delete queryObj.minPrice;
      }
      if (queryObj.maxPrice) {
        queryObj['pricing.basePrice'].$lte = Number(queryObj.maxPrice);
        delete queryObj.maxPrice;
      }
    }

    // Handle capacity range
    if (queryObj.minCapacity || queryObj.maxCapacity) {
      if (queryObj.minCapacity) {
        queryObj['capacity.max'] = { ...queryObj['capacity.max'], $gte: Number(queryObj.minCapacity) };
        delete queryObj.minCapacity;
      }
      if (queryObj.maxCapacity) {
        queryObj['capacity.max'] = { ...queryObj['capacity.max'], $lte: Number(queryObj.maxCapacity) };
        delete queryObj.maxCapacity;
      }
    }

    // Handle rating filter
    if (queryObj.rating) {
      queryObj.averageRating = { $gte: Number(queryObj.rating) };
      delete queryObj.rating;
    }

    // Handle comma-separated status filter
    if (queryObj.status && typeof queryObj.status === 'string' && queryObj.status.includes(',')) {
      queryObj.status = { $in: queryObj.status.split(',').map((s) => s.trim()) };
    }

    // Handle city filter
    if (queryObj.city) {
      queryObj['address.city'] = new RegExp(queryObj.city, 'i');
      delete queryObj.city;
    }

    this.query = this.query.find(queryObj);
    return this;
  }

  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  select() {
    if (this.queryString.select) {
      const fields = this.queryString.select.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      parseInt(this.queryString.limit, 10) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    this.page = page;
    this.limit = limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  near() {
    if (this.queryString.near) {
      const [lng, lat] = this.queryString.near.split(',').map(Number);
      const maxDistance = parseInt(this.queryString.maxDistance, 10) || 10000;
      this.query = this.query.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: maxDistance,
          },
        },
      });
    }
    return this;
  }

  async countDocuments() {
    this.totalDocs = await this.query.model.countDocuments(this.query.getFilter());
    return this;
  }

  getMeta() {
    const totalPages = Math.ceil(this.totalDocs / this.limit);
    return {
      page: this.page,
      limit: this.limit,
      total: this.totalDocs,
      totalPages,
      hasNextPage: this.page < totalPages,
      hasPrevPage: this.page > 1,
    };
  }
}
