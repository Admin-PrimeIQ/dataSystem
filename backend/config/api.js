module.exports = {
  rest: {
    defaultLimit: 25,
    maxLimit: parseInt(process.env.API_MAX_LIMIT ?? '-1', 10),
    withCount: true,
  },
};
