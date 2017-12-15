module.exports = {
    isTimeout: (error) => error.code === -7,
    isNavigationError: (error) => error.code === -3,
}